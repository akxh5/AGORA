import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  FUJI_RPC_URL,
  USDC_ADDRESS,
  DEPLOYER_ADDRESS,
  MANAGER_ADDRESS,
  RESEARCH_AGENT_ADDRESS,
  RISK_AGENT_ADDRESS,
  YIELD_AGENT_ADDRESS
} = process.env;

const usdcArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/MockUSDC.sol/MockUSDC.json'), 'utf8')
);

async function main() {
  const provider = new ethers.JsonRpcProvider(FUJI_RPC_URL);
  
  const wallets = {
    DEPLOYER: DEPLOYER_ADDRESS,
    MANAGER: MANAGER_ADDRESS,
    RESEARCH_AGENT: RESEARCH_AGENT_ADDRESS,
    RISK_AGENT: RISK_AGENT_ADDRESS,
    YIELD_AGENT: YIELD_AGENT_ADDRESS
  };

  const usdc = new ethers.Contract(USDC_ADDRESS, usdcArtifact.abi, provider);

  console.log(`\n--- BALANCES ON AVALANCHE FUJI ---`);
  for (const [name, addr] of Object.entries(wallets)) {
    const avaxBalance = await provider.getBalance(addr);
    const usdcBalance = await usdc.balanceOf(addr).catch(() => 0n);

    console.log(`${name} (${addr}):`);
    console.log(`  AVAX: ${ethers.formatEther(avaxBalance)} AVAX`);
    console.log(`  USDC: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
  }
}

main().catch(console.error);
