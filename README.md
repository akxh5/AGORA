# AGORA — Autonomous Agent Economy

AGORA is an autonomous multi-agent economy where a Manager AI Agent decomposes tasks, discovers specialist agents via ERC-8004 identity registry, hires them via x402 HTTP payments, and settles reputation on-chain — all without human intervention.

Deployed live on the **Avalanche Fuji Testnet C-Chain** (chain ID `43113`).

---

## 🏗️ Architecture

```
                    +--------------------------------------------+
                    |                 Next.js UI                 |
                    |            (Dashboard & Polling)           |
                    +----------------------+---------------------+
                                           |
                                  POST /task (prompt)
                                           v
+------------------------------------------+------------------------------------------+
|                               MANAGER AI AGENT (Express)                           |
|                                                                                     |
|   1. Decompose Task       2. Discover Agents       3. Filter by Reputation          |
|      (Subtasks)             (ERC-8004 Registry)       (AgentRegistry: Score >= 85)  |
|          |                       ^                        ^                         |
|          v                       |                        |                         |
|   4. Challenge/Payment    5. Verify & Settle       6. Validate Output               |
|      (x402 Signatures)       (On-chain Escrow)        (Zod Schema Validation)       |
|          |                       |                        |                         |
|          v                       v                        v                         |
|   7. Update Reputation    8. Deliver Report                                         |
|      (giveFeedback/update)   (Compiled Yield Strategy)                              |
+------------------------------------------+------------------------------------------+
                                           |
                              HTTP /agents/research (USDC Paywall)
                                           v
                       +-------------------+-------------------+
                       |              SPECIALIST AGENTS        |
                       |       Research / Risk / Yield         |
                       +---------------------------------------+
```

---

## 📝 Smart Contract Deployments (Avalanche Fuji Testnet)

All smart contracts are compiled with Solidity `0.8.24` targeting EVM `Cancun` and deployed to the Fuji public testnet C-Chain:

| Contract | Address / Snowtrace Explorer Link | Description |
| :--- | :--- | :--- |
| **MockUSDC** | [`0xEcfbE7c72Ba17168209aDDc8B86DB5f9Af1ccdcb`](https://testnet.snowtrace.io/address/0xEcfbE7c72Ba17168209aDDc8B86DB5f9Af1ccdcb) | Mock ERC-20 token (6 decimals) mimicking USDC |
| **ERC8004IdentityRegistry** | [`0x7307EEB2F4d903eF9bab3Ec1c6ff2CB798e7C361`](https://testnet.snowtrace.io/address/0x7307EEB2F4d903eF9bab3Ec1c6ff2CB798e7C361) | Standard ERC-8004 ERC-721 Agent Identity passport registry |
| **ERC8004ReputationRegistry** | [`0x1b83e954DC908ED4C74ECe99D29cF7ffC3A0297F`](https://testnet.snowtrace.io/address/0x1b83e954DC908ED4C74ECe99D29cF7ffC3A0297F) | Standard ERC-8004 agent performance feedback/rating registry |
| **AgentRegistry** | [`0x8Ac396E032ECd2f1F8BAf9E88e3Fb76Befd2A0CB`](https://testnet.snowtrace.io/address/0x8Ac396E032ECd2f1F8BAf9E88e3Fb76Befd2A0CB) | Custom agent registry holding profiles, jobs completed, and earnings |
| **Escrow** | [`0x6f9028E92EF4e50Cea71524A40F88Ea02126E660`](https://testnet.snowtrace.io/address/0x6f9028E92EF4e50Cea71524A40F88Ea02126E660) | Lightweight escrow contract managing task funding and payment releases |

---

## 🔑 Generated Wallets

Saved to `.env`:
- **DEPLOYER_WALLET:** `0x53712408b8887b24D349Ba61E218514AdBF19159` (deploys contracts, registers agents)
- **MANAGER_WALLET:** `0xCd0F10d5B739b561E39937D71F4c1a01a465D358` (manages task budget, signs payments, releases escrow)
- **RESEARCH_AGENT_WALLET:** `0x1e97C361DCa61A66B7a67f28F476708DaCd5a44a` (receives payment for research output)
- **RISK_AGENT_WALLET:** `0x46ED6736aCa227C639692235408A2D00073DBff8` (receives payment for risk analysis)
- **YIELD_AGENT_WALLET:** `0x565773D30Ef2bb1C865ac0f791d4bF5f57C10D2f` (receives payment for yield optimization)

---

## 🚀 Setup & Run Instructions

To run this project:

### 1. (Optional) Compile & Deploy Smart Contracts
The contracts are already compiled and deployed live on the Avalanche Fuji Testnet. If you wish to redeploy them from a clean state:
```bash
cd backend
npx hardhat run scripts/deploy.js --network fuji
```
This deploys all 5 contracts, pre-funds all agent wallets with gas, and funds the Manager wallet with mock USDC.

### 2. Register Specialist Agents
Run the registration script using the C-chain C-Chain owner/deployer wallet:
```bash
node scripts/register-agents.js
```
This registers the Research, Risk, and Yield agents in the ERC-8004 identity registry (mints agent NFTs with capabilities and endpoints) and sets their initial reputations (88, 92, 95).

### 3. Run the Backend Server
Start the Express server:
```bash
node server.js
```
This runs the backend server on `http://localhost:3001` protecting the specialist routes with x402 payment middleware.

### 4. Run the Next.js Frontend Dashboard
In a separate terminal, start the Next.js development server:
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser to view the interface.

---

## 🎯 Step-by-Step Demo Flow

1. Open `http://localhost:3000`. You will see all 3 registered agents in the **ERC-8004 Agent Registry** cards with their initial reputation scores.
2. Enter the prompt or use the default: *"Analyze Avalanche DeFi yield opportunities and generate a risk-adjusted report."*
3. Click **Generate Yield Report**.
4. Watch the **Autonomous Execution Flow** live status update:
   - **[ Decompose Task ]**: Decomposes request into Research, Risk, and Yield specialist requirements.
   - **[ Discover Agents ]**: Manager reads the ERC-8004 Identity Registry to find registered agents.
   - **[ Filter by Reputation ]**: Manager reads their reputation scores and filters for scores &ge; 85.
   - **[ Send x402 Payment ]**: Hits the 402 challenge on specialist routes. Manager signs the EIP-712 payment payload, retries with the signature header, and settlements are confirmed. (Watch the **x402 Payment Feed** update in real-time with the challenges and tx links).
   - **[ Receive Output ]**: Gathers async outputs from all three specialists.
   - **[ Validate Schema ]**: Automatically validates output structures against Zod schemas.
   - **[ Update Reputation ]**: Updates the agents' scores on the ERC-8004 Reputation Registry and AgentRegistry.sol. (Watch the reputation updates feed animates their score increase).
   - **[ Final Report ]**: Renders the merged, compiled risk-adjusted yield report.
