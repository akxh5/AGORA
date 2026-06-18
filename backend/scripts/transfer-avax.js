import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  DEPLOYER_PRIVATE_KEY,
  MANAGER_ADDRESS,
  FUJI_RPC_URL
} = process.env;

async function main() {
  const provider = new ethers.JsonRpcProvider(FUJI_RPC_URL);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  console.log(`Sending 0.1 AVAX from Deployer (${deployer.address}) to Manager (${MANAGER_ADDRESS})...`);
  
  const tx = await deployer.sendTransaction({
    to: MANAGER_ADDRESS,
    value: ethers.parseEther("0.1")
  });
  
  console.log(`Tx submitted: ${tx.hash}`);
  await tx.wait();
  console.log("Tx confirmed! Manager now has gas.");
}

main().catch(console.error);
