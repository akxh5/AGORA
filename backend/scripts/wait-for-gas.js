import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const address = "0x53712408b8887b24D349Ba61E218514AdBF19159";
const rpc = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

async function main() {
  const provider = new ethers.JsonRpcProvider(rpc);
  console.log(`\n=============================================================`);
  console.log(`⚠️  ACTION REQUIRED: Manually fund the DEPLOYER WALLET with AVAX!`);
  console.log(`Wallet Address: ${address}`);
  console.log(`Please visit one of these faucets:`);
  console.log(`1. https://core.app/tools/testnet-faucet/ (select C-Chain, input address)`);
  console.log(`2. https://faucet.avax.network/`);
  console.log(`3. https://faucets.chain.link/fuji`);
  console.log(`=============================================================\n`);

  console.log(`Polling balance for ${address}...`);
  while (true) {
    try {
      const balance = await provider.getBalance(address);
      const avax = ethers.formatEther(balance);
      console.log(`[${new Date().toLocaleTimeString()}] Current Balance: ${avax} AVAX`);
      if (balance > 0n) {
        console.log(`✅ Funded! Exiting wait loop...`);
        break;
      }
    } catch (e) {
      console.error("Error fetching balance:", e.message);
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

main().catch(console.error);
