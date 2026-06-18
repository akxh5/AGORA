import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  DEPLOYER_PRIVATE_KEY,
  ERC8004_IDENTITY_REGISTRY,
  AGENT_REGISTRY_ADDRESS,
  RESEARCH_AGENT_ADDRESS,
  RISK_AGENT_ADDRESS,
  YIELD_AGENT_ADDRESS
} = process.env;

const identityRegistryArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ERC8004IdentityRegistry.sol/ERC8004IdentityRegistry.json'), 'utf8')
);
const agentRegistryArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json'), 'utf8')
);

const agentsData = [
  {
    name: "DeFi Research Agent",
    capabilities: ["defi_research", "protocol_discovery", "avalanche"],
    endpoint: "http://localhost:3001/agents/research",
    trustModel: "x402",
    wallet: RESEARCH_AGENT_ADDRESS,
    initialScore: 88,
    skills: ["defi_research", "protocol_discovery", "avalanche"]
  },
  {
    name: "DeFi Risk Agent",
    capabilities: ["defi_risk", "risk_assessment", "avalanche"],
    endpoint: "http://localhost:3001/agents/risk",
    trustModel: "x402",
    wallet: RISK_AGENT_ADDRESS,
    initialScore: 92,
    skills: ["defi_risk", "risk_assessment", "avalanche"]
  },
  {
    name: "DeFi Yield Agent",
    capabilities: ["defi_yield", "yield_optimization", "avalanche"],
    endpoint: "http://localhost:3001/agents/yield",
    trustModel: "x402",
    wallet: YIELD_AGENT_ADDRESS,
    initialScore: 95,
    skills: ["defi_yield", "yield_optimization", "avalanche"]
  }
];

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
  const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  console.log("Registering agents with deployer wallet:", deployerWallet.address);

  const identityContract = new ethers.Contract(ERC8004_IDENTITY_REGISTRY, identityRegistryArtifact.abi, deployerWallet);
  const agentRegistryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, agentRegistryArtifact.abi, deployerWallet);

  // Get initial nonce once
  let nonce = await provider.getTransactionCount(deployerWallet.address);
  console.log(`Initial nonce: ${nonce}`);

  for (const agent of agentsData) {
    console.log(`\n--- Registering ${agent.name} ---`);

    const agentCard = {
      name: agent.name,
      capabilities: agent.capabilities,
      endpoint: agent.endpoint,
      trustModel: agent.trustModel
    };
    const agentURI = `data:application/json,${JSON.stringify(agentCard)}`;

    // 1. Register agent on ERC-8004 Identity Registry
    console.log(`Calling IdentityRegistry.register with nonce ${nonce}...`);
    const regTx = await identityContract.register(agentURI, { nonce: nonce++ });
    console.log(`Tx hash: ${regTx.hash}`);
    const receipt = await regTx.wait();

    // Get minted agentId from event
    const event = receipt.logs
      .map(log => {
        try {
          return identityContract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find(e => e && e.name === 'AgentRegistered');

    if (!event) {
      throw new Error("Failed to find AgentRegistered event");
    }

    const agentId = event.args.agentId;
    console.log(`Registered on ERC-8004 with Agent ID: ${agentId}`);

    // 2. Set agent wallet in ERC-8004 registry
    console.log(`Setting Agent Wallet in ERC-8004 to: ${agent.wallet} with nonce ${nonce}...`);
    const walletTx = await identityContract.setAgentWallet(agentId, agent.wallet, { nonce: nonce++ });
    console.log(`Tx hash: ${walletTx.hash}`);
    await walletTx.wait();

    // 3. Register in custom AgentRegistry.sol
    console.log(`Registering in custom AgentRegistry with initial reputation: ${agent.initialScore} with nonce ${nonce}...`);
    const regCustomTx = await agentRegistryContract.registerAgent(
      agentId,
      agent.name,
      agent.skills,
      agent.initialScore,
      agent.wallet,
      { nonce: nonce++ }
    );
    console.log(`Tx hash: ${regCustomTx.hash}`);
    await regCustomTx.wait();

    console.log(`Successfully completed registration for ${agent.name}.`);
  }

  console.log("\nAll agents successfully registered!");
}

main().catch(console.error);
