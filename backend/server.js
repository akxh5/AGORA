import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
import fs from 'fs';

import { createX402Middleware } from './middleware/x402.js';
import { runManagerOrchestration, orchestrationTasks } from './agents/manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const {
  RESEARCH_AGENT_ADDRESS,
  RISK_AGENT_ADDRESS,
  YIELD_AGENT_ADDRESS,
  AGENT_REGISTRY_ADDRESS,
  PORT = 3001
} = process.env;

const agentRegistryArtifact = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artifacts/contracts/AgentRegistry.sol/AgentRegistry.json'), 'utf8')
);

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for async specialist jobs
const agentJobs = {};

// --- Specialist Agent Endpoints protected by x402 payment middleware ---

// 1. Research Agent Endpoint
app.post(
  '/agents/research',
  createX402Middleware(RESEARCH_AGENT_ADDRESS, '/agents/research'),
  (req, res) => {
    const jobId = `job-research-${Math.floor(Math.random() * 1000000)}`;
    console.log(`[Specialist Endpoint] Research Agent received task. Job ID: ${jobId}`);

    agentJobs[jobId] = { status: "processing", output: null };

    // Simulate 2.5 second delay for research analysis
    setTimeout(() => {
      const output = {
        protocols: [
          { name: "Benqi", tvl: "$280M", apy: "5.4%", chain: "Avalanche" },
          { name: "Trader Joe", tvl: "$140M", apy: "12.8%", chain: "Avalanche" },
          { name: "Aave V3", tvl: "$420M", apy: "3.2%", chain: "Avalanche" }
        ],
        timestamp: new Date().toISOString(),
        agentId: "research-agent-001"
      };
      agentJobs[jobId] = { status: "completed", output };
      console.log(`[Specialist Endpoint] Research Agent job ${jobId} completed.`);
    }, 2500);

    return res.status(202).json({ jobId, status: "processing" });
  }
);

// 2. Risk Agent Endpoint
app.post(
  '/agents/risk',
  createX402Middleware(RISK_AGENT_ADDRESS, '/agents/risk'),
  (req, res) => {
    const jobId = `job-risk-${Math.floor(Math.random() * 1000000)}`;
    console.log(`[Specialist Endpoint] Risk Agent received task. Job ID: ${jobId}`);

    agentJobs[jobId] = { status: "processing", output: null };

    // Simulate 2.5 second delay for risk assessments
    setTimeout(() => {
      const output = {
        riskAssessments: [
          { protocol: "Benqi", riskScore: 25, factors: ["Oracle dependence", "Liquidity concentration"] },
          { protocol: "Trader Joe", riskScore: 45, factors: ["Impermanent loss risk", "Smart contract complexity"] },
          { protocol: "Aave V3", riskScore: 15, factors: ["Long track record", "Conservative parameters"] }
        ],
        overallRisk: "MEDIUM",
        agentId: "risk-agent-001"
      };
      agentJobs[jobId] = { status: "completed", output };
      console.log(`[Specialist Endpoint] Risk Agent job ${jobId} completed.`);
    }, 2500);

    return res.status(202).json({ jobId, status: "processing" });
  }
);

// 3. Yield Agent Endpoint
app.post(
  '/agents/yield',
  createX402Middleware(YIELD_AGENT_ADDRESS, '/agents/yield'),
  (req, res) => {
    const jobId = `job-yield-${Math.floor(Math.random() * 1000000)}`;
    console.log(`[Specialist Endpoint] Yield Agent received task. Job ID: ${jobId}`);

    agentJobs[jobId] = { status: "processing", output: null };

    // Simulate 2.5 second delay for yield strategy compilation
    setTimeout(() => {
      const output = {
        topOpportunities: [
          { protocol: "Trader Joe", netAPY: "12.8%", recommendation: "Allocate 30% of portfolio. Good risk-reward profile for active yield searchers." },
          { protocol: "Benqi", netAPY: "5.4%", recommendation: "Allocate 40% of portfolio. Safe, stable lending opportunity with Avalanche C-chain native support." },
          { protocol: "Aave V3", netAPY: "3.2%", recommendation: "Allocate 30% of portfolio. High security, low volatility option for capital preservation." }
        ],
        summary: "The optimal risk-adjusted strategy yields a blended APY of 6.94% by distributing capital across Trader Joe, Benqi, and Aave V3.",
        agentId: "yield-agent-001"
      };
      agentJobs[jobId] = { status: "completed", output };
      console.log(`[Specialist Endpoint] Yield Agent job ${jobId} completed.`);
    }, 2500);

    return res.status(202).json({ jobId, status: "processing" });
  }
);

// Poll specialist job status
app.get('/agents/task/:jobId/result', (req, res) => {
  const job = agentJobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  return res.json(job);
});

// --- Manager Orchestration Endpoints ---

// Submit a task to the Manager AI Agent
app.post('/task', (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const taskId = `task-${Math.floor(Math.random() * 1000000)}`;
  console.log(`[Server] Received user task prompt. Generated Task ID: ${taskId}`);

  // Kick off orchestration in the background
  runManagerOrchestration(taskId, prompt);

  return res.status(202).json({ taskId, status: "processing" });
});

// Poll the status of the Manager orchestration
app.get('/task/:id/result', (req, res) => {
  const task = orchestrationTasks[req.params.id];
  if (!task) {
    return res.status(404).json({ error: "Orchestration task not found" });
  }
  return res.json(task);
});

// Get registered agents from custom AgentRegistry contract
app.get('/agents', async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
    const contract = new ethers.Contract(AGENT_REGISTRY_ADDRESS, agentRegistryArtifact.abi, provider);
    const agents = await contract.getTopAgents();

    const formatted = agents.map(a => ({
      agentId: a.agentId.toString(),
      name: a.name,
      skills: a.skills,
      reputationScore: Number(a.reputationScore),
      jobsCompleted: Number(a.jobsCompleted),
      totalEarned: ethers.formatUnits(a.totalEarned, 6) + " USDC",
      walletAddress: a.walletAddress
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("[Server] Error getting top agents:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`[Server] Agent Payment Backend listening on port ${PORT}`);
  console.log(`==============================================\n`);
});
