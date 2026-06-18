import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hre from 'hardhat';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  DEPLOYER_PRIVATE_KEY,
  MANAGER_ADDRESS,
  RESEARCH_AGENT_ADDRESS,
  RISK_AGENT_ADDRESS,
  YIELD_AGENT_ADDRESS
} = process.env;

async function main() {
  const provider = hre.ethers.provider;
  const deployer = new hre.ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log("Deploying contracts with deployer:", deployer.address);

  // Fund the deployer wallet on local network first if needed, so it can pay for deployments
  const networkName = hre.network.name;
  if (networkName === "hardhat" || networkName === "localhost") {
    // Fund deployer with 100 AVAX gas
    await provider.send("hardhat_setBalance", [
      deployer.address,
      "0x56bc75e2d63100000"
    ]);
    console.log("Funded deployer with gas.");
  }

  // Get initial nonce
  let nonce = await provider.getTransactionCount(deployer.address);
  console.log(`Starting deployment with nonce: ${nonce}`);

  // Deploy Mock USDC
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC", deployer);
  const usdc = await MockUSDC.deploy({ nonce: nonce++ });
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("Mock USDC deployed to:", usdcAddress);

  // Deploy ERC8004 Identity Registry
  const ERC8004IdentityRegistry = await hre.ethers.getContractFactory("ERC8004IdentityRegistry", deployer);
  const identityRegistry = await ERC8004IdentityRegistry.deploy({ nonce: nonce++ });
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("ERC8004IdentityRegistry deployed to:", identityAddress);

  // Deploy ERC8004 Reputation Registry
  const ERC8004ReputationRegistry = await hre.ethers.getContractFactory("ERC8004ReputationRegistry", deployer);
  const reputationRegistry = await ERC8004ReputationRegistry.deploy({ nonce: nonce++ });
  await reputationRegistry.waitForDeployment();
  const reputationAddress = await reputationRegistry.getAddress();
  console.log("ERC8004ReputationRegistry deployed to:", reputationAddress);

  // Deploy Custom AgentRegistry
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry", deployer);
  const agentRegistry = await AgentRegistry.deploy({ nonce: nonce++ });
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("AgentRegistry deployed to:", agentRegistryAddress);

  // Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory("Escrow", deployer);
  const escrow = await Escrow.deploy(usdcAddress, MANAGER_ADDRESS, { nonce: nonce++ });
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("Escrow deployed to:", escrowAddress);

  // Set Manager wallet as orchestrator in AgentRegistry
  const setOrchTx = await agentRegistry.setOrchestrator(MANAGER_ADDRESS, { nonce: nonce++ });
  await setOrchTx.wait();
  console.log(`AgentRegistry orchestrator set to Manager: ${MANAGER_ADDRESS}`);

  // Fund Manager wallet with 10,000 mock USDC
  const mintAmount = hre.ethers.parseUnits("10000", 6);
  const mintTx = await usdc.mint(MANAGER_ADDRESS, mintAmount, { nonce: nonce++ });
  await mintTx.wait();
  console.log(`Funded Manager with ${hre.ethers.formatUnits(mintAmount, 6)} USDC`);

  // Fund other wallets with AVAX gas
  if (networkName === "hardhat" || networkName === "localhost") {
    const addressesToFund = [
      process.env.MANAGER_ADDRESS,
      process.env.RESEARCH_AGENT_ADDRESS,
      process.env.RISK_AGENT_ADDRESS,
      process.env.YIELD_AGENT_ADDRESS
    ];

    for (const addr of addressesToFund) {
      if (addr) {
        await provider.send("hardhat_setBalance", [
          addr,
          "0x56bc75e2d63100000" // 100 AVAX
        ]);
        console.log(`Funded ${addr} with 100 AVAX gas`);
      }
    }
  }

  // Update .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  envContent = envContent.replace(/USDC_ADDRESS=.*/, `USDC_ADDRESS=${usdcAddress}`);
  envContent = envContent.replace(/AGENT_REGISTRY_ADDRESS=.*/, `AGENT_REGISTRY_ADDRESS=${agentRegistryAddress}`);
  envContent = envContent.replace(/ESCROW_ADDRESS=.*/, `ESCROW_ADDRESS=${escrowAddress}`);
  envContent = envContent.replace(/ERC8004_IDENTITY_REGISTRY=.*/, `ERC8004_IDENTITY_REGISTRY=${identityAddress}`);
  envContent = envContent.replace(/ERC8004_REPUTATION_REGISTRY=.*/, `ERC8004_REPUTATION_REGISTRY=${reputationAddress}`);

  fs.writeFileSync(envPath, envContent);
  console.log("\nUpdated .env with contract addresses.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
