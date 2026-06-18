import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { ResearchOutputSchema, RiskOutputSchema, YieldOutputSchema } from '../middleware/validator.js';
import { EIP712_DOMAIN, EIP712_TYPES } from '../middleware/x402.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const {
  MANAGER_PRIVATE_KEY,
  AGENT_REGISTRY_ADDRESS,
  ESCROW_ADDRESS,
  ERC8004_IDENTITY_REGISTRY,
  ERC8004_REPUTATION_REGISTRY,
  USDC_ADDRESS
} = process.env;

const identityArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ERC8004IdentityRegistry.sol/ERC8004IdentityRegistry.json'), 'utf8')
);
const reputationArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ERC8004ReputationRegistry.sol/ERC8004ReputationRegistry.json'), 'utf8')
);
const agentRegistryArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/AgentRegistry.sol/AgentRegistry.json'), 'utf8')
);
const escrowArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/Escrow.sol/Escrow.json'), 'utf8')
);
const usdcArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../artifacts/contracts/MockUSDC.sol/MockUSDC.json'), 'utf8')
);

// Global store for task status tracking
export const orchestrationTasks = {};

// Helper to poll specialist agent jobs
async function pollJob(endpoint, jobId) {
  const url = `${new URL(endpoint).origin}/agents/task/${jobId}/result`;
  console.log(`[Manager] Polling job ${jobId} at ${url}...`);
  
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "completed") {
        return data.output;
      }
    } catch (error) {
      console.error(`[Manager] Error polling job ${jobId}:`, error);
    }
  }
  throw new Error(`Timeout polling specialist agent job ${jobId}`);
}

export async function runManagerOrchestration(taskId, prompt) {
  const provider = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
  const managerWallet = new ethers.Wallet(MANAGER_PRIVATE_KEY, provider);

  // Initialize task state
  const task = {
    id: taskId,
    status: "processing",
    currentStep: "Decompose Task",
    steps: {
      "Decompose Task": { status: "pending", data: null },
      "Discover Agents": { status: "pending", data: null },
      "Filter by Reputation": { status: "pending", data: null },
      "Send x402 Payment": { status: "pending", payments: [] },
      "Receive Output": { status: "pending", outputs: {} },
      "Validate Schema": { status: "pending", schemas: {} },
      "Update Reputation": { status: "pending", updates: [] },
      "Final Report": { status: "pending", report: null }
    },
    paymentsFeed: [],
    reputationUpdates: [],
    finalReport: null
  };
  orchestrationTasks[taskId] = task;

  try {
    let nonce = await provider.getTransactionCount(managerWallet.address);

    const identityContract = new ethers.Contract(ERC8004_IDENTITY_REGISTRY, identityArtifact.abi, managerWallet);
    const reputationContract = new ethers.Contract(ERC8004_REPUTATION_REGISTRY, reputationArtifact.abi, managerWallet);
    const agentRegistryContract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, agentRegistryArtifact.abi, managerWallet);
    const escrowContract = new ethers.Contract(ESCROW_ADDRESS, escrowArtifact.abi, managerWallet);
    const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcArtifact.abi, managerWallet);

    console.log(`\n==============================================`);
    console.log(`[Manager] Starting Orchestration for Task: ${taskId}`);
    console.log(`[Manager] Prompt: "${prompt}"`);
    console.log(`==============================================`);

    // --- Step 1: Decompose Task ---
    console.log("\n[Step 1] Decomposing Task...");
    task.currentStep = "Decompose Task";
    task.steps["Decompose Task"].status = "processing";
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated AI delay

    const subtasks = [
      { role: "research", description: "Discover top Yield Protocols and retrieve TVL/APY metrics." },
      { role: "risk", description: "Assess risk scores and vulnerability factors for discovered protocols." },
      { role: "yield", description: "Recommend yield allocations based on risk-adjusted yield profiles." }
    ];
    task.steps["Decompose Task"].status = "completed";
    task.steps["Decompose Task"].data = subtasks;

    // --- On-Chain Escrow Setup ---
    console.log("[Manager] Creating task budget in Escrow.sol...");
    const totalBudget = ethers.parseUnits("0.03", 6); // 0.01 USDC per specialist agent * 3

    // Approve escrow
    console.log(`[Manager] Approving Escrow contract to spend 0.03 USDC...`);
    const approveTx = await usdcContract.approve(ESCROW_ADDRESS, totalBudget, { nonce: nonce++ });
    await approveTx.wait();

    // Create task
    console.log(`[Manager] Initializing Escrow task with budget 0.03 USDC...`);
    const escrowTx = await escrowContract.createTask(taskId, totalBudget, { nonce: nonce++ });
    await escrowTx.wait();
    console.log(`[Manager] Escrow budget locked!`);

    // --- Step 2: Discover Agents ---
    console.log("\n[Step 2] Discovering Agents from ERC-8004 Registry...");
    task.currentStep = "Discover Agents";
    task.steps["Discover Agents"].status = "processing";
    await new Promise(resolve => setTimeout(resolve, 1000));

    const agentIds = await identityContract.getRegisteredAgentIds();
    console.log(`[Manager] Found registered agent IDs in ERC-8004: ${agentIds.join(', ')}`);

    const discoveredAgents = [];
    for (const id of agentIds) {
      const tokenURI = await identityContract.tokenURI(id);
      const walletAddress = await identityContract.getAgentWallet(id);
      
      let metadata = {};
      if (tokenURI.startsWith('data:application/json,')) {
        metadata = JSON.parse(tokenURI.replace('data:application/json,', ''));
      }

      discoveredAgents.push({
        agentId: id.toString(),
        walletAddress,
        name: metadata.name || "Unknown Agent",
        capabilities: metadata.capabilities || [],
        endpoint: metadata.endpoint || "",
        trustModel: metadata.trustModel || "none"
      });
    }
    
    console.log(`[Manager] Discovered details for ${discoveredAgents.length} agents.`);
    task.steps["Discover Agents"].status = "completed";
    task.steps["Discover Agents"].data = discoveredAgents;

    // --- Step 3: Filter by Reputation ---
    console.log("\n[Step 3] Filtering Agents by reputation score >= 85...");
    task.currentStep = "Filter by Reputation";
    task.steps["Filter by Reputation"].status = "processing";
    await new Promise(resolve => setTimeout(resolve, 1000));

    const selectedSpecialists = {};
    const roles = {
      research: "defi_research",
      risk: "defi_risk",
      yield: "defi_yield"
    };

    for (const agent of discoveredAgents) {
      // Fetch details from Custom AgentRegistry
      const registryDetails = await agentRegistryContract.getAgent(agent.agentId);
      const reputationScore = Number(registryDetails.reputationScore);
      console.log(`[Manager] Agent ID ${agent.agentId} (${agent.name}) reputation score: ${reputationScore}`);

      if (reputationScore >= 85) {
        // Assign to role
        for (const [role, capability] of Object.entries(roles)) {
          if (agent.capabilities.includes(capability)) {
            selectedSpecialists[role] = {
              ...agent,
              reputationScore,
              skills: registryDetails.skills
            };
            console.log(`[Manager] Selected ${agent.name} for role: ${role}`);
          }
        }
      }
    }

    if (!selectedSpecialists.research || !selectedSpecialists.risk || !selectedSpecialists.yield) {
      throw new Error("Could not find qualifying agents with reputation >= 85 for all roles");
    }

    task.steps["Filter by Reputation"].status = "completed";
    task.steps["Filter by Reputation"].data = selectedSpecialists;

    // --- Step 4 & 5: x402 Payments, Call Specialist, Validate Outputs ---
    task.currentStep = "Send x402 Payment";
    task.steps["Send x402 Payment"].status = "processing";
    task.steps["Receive Output"].status = "processing";
    task.steps["Validate Schema"].status = "processing";

    const specialistOutputs = {};

    const rolesList = ["research", "risk", "yield"];
    for (const role of rolesList) {
      const specialist = selectedSpecialists[role];
      console.log(`\n[Manager] Hiring ${specialist.name} for subtask via x402 payment...`);

      // 1. Initial request without payment
      let response = await fetch(specialist.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.status !== 402) {
        throw new Error(`Expected 402 challenge, received ${response.status}`);
      }

      // Read requirements from header
      const base64Reqs = response.headers.get('x-payment-required');
      if (!base64Reqs) {
        throw new Error("Missing x-payment-required header in 402 response");
      }
      const requirements = JSON.parse(Buffer.from(base64Reqs, 'base64').toString('utf8'));
      console.log(`[Manager] HTTP 402 Payment Required: 0.01 USDC challenge from ${specialist.name}`);

      // Feed payment challenge to UI
      task.paymentsFeed.push({
        status: "required",
        agentName: specialist.name,
        amount: "0.01 USDC",
        payee: specialist.walletAddress
      });

      // 2. Sign EIP-712 payload with manager key
      const paymentNonce = Math.floor(Math.random() * 100000000);
      const message = {
        payer: managerWallet.address,
        payee: requirements.payee,
        amount: 10000, // 0.01 USDC (6 decimals)
        nonce: paymentNonce,
        resource: requirements.resource
      };

      const signature = await managerWallet.signTypedData(
        EIP712_DOMAIN,
        EIP712_TYPES,
        message
      );

      const payload = { message, signature };
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');

      // 3. Retry request with payment-signature header
      response = await fetch(specialist.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-payment-signature': base64Payload
        },
        body: JSON.stringify({ prompt })
      });

      if (response.status !== 202) {
        throw new Error(`Expected 202 Accepted after payment, received ${response.status}`);
      }

      const { jobId } = await response.json();
      console.log(`[Manager] Payment approved! specialist Job ID: ${jobId}`);

      // Mock transaction details
      const mockTxHash = ethers.keccak256(ethers.toUtf8Bytes(`x402-settlement-${managerWallet.address}-${paymentNonce}`));
      task.paymentsFeed.push({
        status: "confirmed",
        agentName: specialist.name,
        amount: "0.01 USDC",
        payee: specialist.walletAddress,
        txHash: mockTxHash
      });
      task.steps["Send x402 Payment"].payments.push({
        agentName: specialist.name,
        amount: "0.01 USDC",
        txHash: mockTxHash
      });

      // 4. Poll specialist until completed
      const output = await pollJob(specialist.endpoint, jobId);
      console.log(`[Manager] Received output from ${specialist.name}.`);

      // 5. Validate specialist output using Zod schema
      console.log(`[Manager] Validating response against Zod schema...`);
      let schema;
      if (role === "research") schema = ResearchOutputSchema;
      else if (role === "risk") schema = RiskOutputSchema;
      else schema = YieldOutputSchema;

      const validationResult = schema.safeParse(output);
      if (!validationResult.success) {
        console.error(`[Manager] Schema validation failed for ${specialist.name}:`, validationResult.error);
        throw new Error(`Schema validation failed for ${specialist.name}`);
      }
      console.log(`[Manager] Schema validation successful for ${specialist.name}!`);

      specialistOutputs[role] = output;
      task.steps["Receive Output"].outputs[role] = output;
      task.steps["Validate Schema"].schemas[role] = "valid";

      // --- Step 6: Release payment in Escrow.sol ---
      console.log(`[Step 6] Releasing escrow payment to ${specialist.name} (${specialist.walletAddress})...`);
      const paymentAmount = ethers.parseUnits("0.01", 6);
      const releaseTx = await escrowContract.releasePayment(taskId, specialist.walletAddress, paymentAmount, { nonce: nonce++ });
      const releaseReceipt = await releaseTx.wait();
      console.log(`[Manager] Payment released on-chain! Tx hash: ${releaseTx.hash}`);

      // --- Step 7: Update Reputation ---
      task.currentStep = "Update Reputation";
      const initialRep = specialist.reputationScore;
      // Cap at 100
      const newRep = Math.min(initialRep + 2, 100);

      console.log(`[Step 7] Posting reputation feedback score ${newRep} to ERC-8004 Reputation Registry...`);
      // giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string calldata tag1, string calldata tag2, string calldata feedbackURI)
      const feedbackTx = await reputationContract.giveFeedback(
        Number(specialist.agentId),
        newRep,
        0,
        role,
        "success",
        `data:application/json,{"feedback":"excellent work on task ${taskId}"}`,
        { nonce: nonce++ }
      );
      await feedbackTx.wait();
      console.log(`[Manager] Posted reputation registry feedback. Tx: ${feedbackTx.hash}`);

      console.log(`[Manager] Updating reputation score to ${newRep} in custom AgentRegistry...`);
      const updateRepTx = await agentRegistryContract.updateReputation(
        Number(specialist.agentId),
        newRep,
        paymentAmount,
        { nonce: nonce++ }
      );
      await updateRepTx.wait();
      console.log(`[Manager] Updated custom AgentRegistry. Tx: ${updateRepTx.hash}`);

      const updateLog = {
        agentName: specialist.name,
        oldScore: initialRep,
        newScore: newRep,
        txHash: updateRepTx.hash
      };
      task.reputationUpdates.push(updateLog);
      task.steps["Update Reputation"].updates.push(updateLog);
    }

    task.steps["Send x402 Payment"].status = "completed";
    task.steps["Receive Output"].status = "completed";
    task.steps["Validate Schema"].status = "completed";
    task.steps["Update Reputation"].status = "completed";

    // --- Step 8: Compile Final Report ---
    console.log("\n[Step 8] Compiling final yield report...");
    task.currentStep = "Final Report";
    task.steps["Final Report"].status = "processing";
    await new Promise(resolve => setTimeout(resolve, 2000));

    const finalReport = {
      timestamp: new Date().toISOString(),
      prompt,
      research: specialistOutputs.research,
      risk: specialistOutputs.risk,
      yield: specialistOutputs.yield,
      summary: specialistOutputs.yield.summary,
      allocations: specialistOutputs.yield.topOpportunities
    };

    task.finalReport = finalReport;
    task.steps["Final Report"].status = "completed";
    task.steps["Final Report"].report = finalReport;

    task.status = "completed";
    console.log(`\n==============================================`);
    console.log(`[Manager] Orchestration Task ${taskId} COMPLETED successfully!`);
    console.log(`==============================================`);
  } catch (error) {
    console.error(`\n[Manager] Orchestration failed:`, error);
    task.status = "failed";
    task.error = error.message;
  }
}
