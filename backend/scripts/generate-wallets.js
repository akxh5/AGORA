const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  console.log("Generating 5 wallets...");
  
  const wallets = {
    DEPLOYER: ethers.Wallet.createRandom(),
    MANAGER: ethers.Wallet.createRandom(),
    RESEARCH_AGENT: ethers.Wallet.createRandom(),
    RISK_AGENT: ethers.Wallet.createRandom(),
    YIELD_AGENT: ethers.Wallet.createRandom()
  };

  console.log("\nGenerated Wallets:");
  for (const [name, wallet] of Object.entries(wallets)) {
    console.log(`${name}_ADDRESS=${wallet.address}`);
  }

  const envContent = `
# Wallets
DEPLOYER_PRIVATE_KEY=${wallets.DEPLOYER.privateKey}
MANAGER_PRIVATE_KEY=${wallets.MANAGER.privateKey}
RESEARCH_AGENT_PRIVATE_KEY=${wallets.RESEARCH_AGENT.privateKey}
RISK_AGENT_PRIVATE_KEY=${wallets.RISK_AGENT.privateKey}
YIELD_AGENT_PRIVATE_KEY=${wallets.YIELD_AGENT.privateKey}

DEPLOYER_ADDRESS=${wallets.DEPLOYER.address}
MANAGER_ADDRESS=${wallets.MANAGER.address}
RESEARCH_AGENT_ADDRESS=${wallets.RESEARCH_AGENT.address}
RISK_AGENT_ADDRESS=${wallets.RISK_AGENT.address}
YIELD_AGENT_ADDRESS=${wallets.YIELD_AGENT.address}

# Network
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
FUJI_RPC_BACKUP=https://avalanche-fuji.drpc.org
CHAIN_ID=43113

# Tokens & Contracts
USDC_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65
AGENT_REGISTRY_ADDRESS=
ESCROW_ADDRESS=
ERC8004_IDENTITY_REGISTRY=
ERC8004_REPUTATION_REGISTRY=

PORT=3001
`;

  const envPath = path.join(__dirname, '..', '.env');
  fs.writeFileSync(envPath, envContent.trim());
  console.log(`\nSaved env to ${envPath}`);
}

main().catch(console.error);
