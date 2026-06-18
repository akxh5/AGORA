import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  MANAGER_ADDRESS,
  USDC_ADDRESS
} = process.env;

// EIP-712 Types for x402 Direct Payments
export const EIP712_DOMAIN = {
  name: "x402-direct-facilitator",
  version: "1.0.0",
  chainId: 43113,
  verifyingContract: USDC_ADDRESS
};

export const EIP712_TYPES = {
  Payment: [
    { name: "payer", type: "address" },
    { name: "payee", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "resource", type: "string" }
  ]
};

// Map of nonces used by the Manager to prevent replay attacks
const usedNonces = new Set();

/**
 * Creates an x402 payment middleware for a specific specialist agent
 * @param {string} agentWalletAddress - The recipient agent's wallet address
 * @param {string} resourceName - The protected resource path (e.g. "/agents/research")
 */
export const createX402Middleware = (agentWalletAddress, resourceName) => {
  return async (req, res, next) => {
    const paymentSignatureHeader = req.headers['x-payment-signature'] || req.headers['payment-signature'];

    if (!paymentSignatureHeader) {
      // Step 1: No payment signature -> challenge with HTTP 402
      console.log(`[x402 Middleware] No signature for ${resourceName}. Challenging with HTTP 402...`);

      const requirements = {
        price: "0.01",
        token: "USDC",
        tokenAddress: USDC_ADDRESS,
        payee: agentWalletAddress,
        network: "eip155:43113",
        resource: resourceName
      };

      const base64Requirements = Buffer.from(JSON.stringify(requirements)).toString('base64');

      res.setHeader('x-payment-required', base64Requirements);
      return res.status(402).json({
        error: "HTTP 402 Payment Required",
        requirements
      });
    }

    try {
      // Step 2: Signature found -> verify it
      const decodedPayload = JSON.parse(Buffer.from(paymentSignatureHeader, 'base64').toString('utf8'));
      const { message, signature } = decodedPayload;

      console.log(`[x402 Middleware] Received payment signature. Verifying EIP-712 payload...`);

      // Recover signer from EIP-712 typed data
      const recoveredSigner = ethers.verifyTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        message,
        signature
      );

      // Verify rules:
      // 1. Signer must be the Manager wallet
      if (recoveredSigner.toLowerCase() !== MANAGER_ADDRESS.toLowerCase()) {
        return res.status(401).json({
          error: "Unauthorized payment signature",
          message: `Expected signer ${MANAGER_ADDRESS}, got ${recoveredSigner}`
        });
      }

      // 2. Payee must be this specialist agent's wallet
      if (message.payee.toLowerCase() !== agentWalletAddress.toLowerCase()) {
        return res.status(400).json({
          error: "Invalid payee in payment signature",
          message: `Expected payee ${agentWalletAddress}, got ${message.payee}`
        });
      }

      // 3. Amount must be 10000 (0.01 USDC)
      const expectedAmount = 10000; // 0.01 USDC * 10^6
      if (Number(message.amount) !== expectedAmount) {
        return res.status(400).json({
          error: "Invalid payment amount",
          message: `Expected ${expectedAmount} (0.01 USDC), got ${message.amount}`
        });
      }

      // 4. Resource must match
      if (message.resource !== resourceName) {
        return res.status(400).json({
          error: "Invalid resource path in signature",
          message: `Expected ${resourceName}, got ${message.resource}`
        });
      }

      // 5. Nonce replay check
      const nonceKey = `${recoveredSigner}-${message.nonce}`;
      if (usedNonces.has(nonceKey)) {
        return res.status(400).json({
          error: "Replayed payment nonce",
          message: `Nonce ${message.nonce} has already been verified`
        });
      }

      usedNonces.add(nonceKey);

      // Signature verified successfully!
      console.log(`[x402 Middleware] Signature verified! Signer: ${recoveredSigner}. Payment accepted.`);
      req.paymentVerified = true;
      req.payerAddress = recoveredSigner;
      req.payeeAddress = message.payee;
      req.nonce = message.nonce;

      // Mock an on-chain transaction hash for this settlement event
      req.txHash = ethers.keccak256(ethers.toUtf8Bytes(`x402-settlement-${nonceKey}-${Date.now()}`));

      next();
    } catch (error) {
      console.error(`[x402 Middleware] Error verifying signature:`, error);
      return res.status(400).json({
        error: "Failed to parse or verify payment signature",
        details: error.message
      });
    }
  };
};
