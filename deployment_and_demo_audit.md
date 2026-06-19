# AGORA — Audit & Demo-Readiness Guide

This document outlines the detailed audit of the **AGORA** codebase (currently residing on the Mac Mini) and provides step-by-step guides, checklists, and script flows to migrate, verify, and demo the project on a new MacBook.

---

## Codebase Audit: What is Real, Mocked & Finished

AGORA is an autonomous multi-agent DeFi strategy system built on the **Avalanche Fuji Testnet**. The orchestration relies on a combination of real on-chain transaction states and high-fidelity deterministic simulations.

```
                  ┌──────────────────────────────────────────────┐
                  │            Next.js Frontend (3000)           │
                  └──────────────┬────────────────┬──────────────┘
                                 │                ▲
                      Submit Task│                │Poll Progress & Cards
                                 ▼                │
                  ┌───────────────────────────────┴──────────────┐
                  │          Express Backend Server (3001)       │
                  └──────────────┬────────────────┬──────────────┘
                                 │                │
                  x402 Challenge │                │On-Chain Release, Escrow, 
                  & EIP-712 Sign │                │Reputation & Registry updates
                                 ▼                ▼
                  ┌───────────────────────────────┐
                  │    Avalanche Fuji Testnet     │
                  └───────────────────────────────┘
```

### 1. What is Real
*   **On-Chain Escrow & Settlement ([Escrow.sol](file:///Users/aksh/speedrun/backend/contracts/Escrow.sol)):** Every task run locks `0.03 USDC` of real testnet USDC. Upon completion of each specialist's work, the Manager releases `0.01 USDC` directly to the specialist agent's wallet address.
*   **ERC-8004 Identity Registry ([ERC8004IdentityRegistry.sol](file:///Users/aksh/speedrun/backend/contracts/ERC8004IdentityRegistry.sol)):** Discovers registered agent passports, metadata, capabilities, endpoints, and wallet mappings directly on-chain on Avalanche Fuji.
*   **ERC-8004 Reputation Registry ([ERC8004ReputationRegistry.sol](file:///Users/aksh/speedrun/backend/contracts/ERC8004ReputationRegistry.sol)):** Commits feedback and reputation score ratings (e.g. 88% -> 90%) using real blockchain transactions on Fuji.
*   **Custom Agent Registry ([AgentRegistry.sol](file:///Users/aksh/speedrun/backend/contracts/AgentRegistry.sol)):** Manages jobs completed, total USDC earnings, and current scores. The frontend cards read directly from this registry on-chain via the backend `/agents` endpoint.
*   **Wallet Transactions:** Signing, approving, task initialization, payment release, and reputation tracking execute live via Ethers.js with transaction receipts verified on-chain.

### 2. What is Mocked
*   **Task Decomposition ([manager.js](file:///Users/aksh/speedrun/backend/agents/manager.js)):** The subtask decomposition step is a simulated delay that always splits the job into:
    1.  `Research`: Discover protocols and APYs.
    2.  `Risk`: Assess risk factors.
    3.  `Yield`: Optimize blended portfolio allocation.
*   **Specialist Agents ([server.js](file:///Users/aksh/speedrun/backend/server.js)):** The endpoints for the specialists (`/agents/research`, `/agents/risk`, `/agents/yield`) simulate a 2.5s execution delay and return structured, deterministic yield data. This guarantees high-fidelity, error-free strategy data for the presentation.
*   **x402 Off-Chain Validation:** The EIP-712 signature validation occurs off-chain in the Express middleware, acting as a payment token/receipt before on-chain funds are unlocked.

### 3. What is Finished
*   **No Code Required:** The application is fully complete. The Neo-Brutalist frontend UI connects natively to the backend, contract addresses are synchronized, and Fuji on-chain transactions are live and working.

---

## Part 1: Migration Strategy (Mac Mini to MacBook)

### How to Move the Code
Use **GitHub Clone** as the primary method. This preserves Git histories, avoids compression corruptions, and is standard practice.
*   **Primary:** Git clone from repository.
*   **Backup:** ZIP export of `/Users/aksh/speedrun` to a USB drive or AirDrop.
    > [!IMPORTANT]
    > Do NOT copy the `node_modules` folders or the `.next` compilation folders. Delete or exclude them before ZIP export to save space and avoid file-lock errors.

### Dependency Audit
Ensure the new MacBook has these tools installed before setting up the project:
1.  **Node.js (v18.x or v20.x LTS):** Required for both Next.js and Express backend.
2.  **npm (v9.x or v10.x):** Package manager.
3.  **Git:** For repository cloning.
4.  **Browser:** Chrome, Brave, or Safari (for presenting the UI). No Metamask extension is strictly required to run the demo since wallet operations are handled by the backend server.

---

## Part 2: Configuration & Credentials Transfer

Two configuration files contain private keys and Fuji contract addresses. They must be transferred to the MacBook:

### 1. Backend Environment File: `backend/.env`
Create this file inside the `backend/` directory on the MacBook:
```env
# Deployed Wallets on Fuji
DEPLOYER_PRIVATE_KEY=0xafbb71b34eb927e99540a384f52c18f3bca1dd0a2c98863f7b2ac860924f88b0
MANAGER_PRIVATE_KEY=0x6f97482c3cc2477025f42d733f2c3da14f16ba367680b198f2ef71334e085ac2
RESEARCH_AGENT_PRIVATE_KEY=0xd3ed76df732c496883b990f4e39f9bff934bfcd5d0a7ec770d79b4476fde368a
RISK_AGENT_PRIVATE_KEY=0xe7eaa72a49b58389a5a95355f0198388cff8c56fd970c1800df3267b0825db21
YIELD_AGENT_PRIVATE_KEY=0x6d3fcaf8a40856fc15596d859467b8f4dcc482a947650db278961a5a2ac2caeb

DEPLOYER_ADDRESS=0x53712408b8887b24D349Ba61E218514AdBF19159
MANAGER_ADDRESS=0xCd0F10d5B739b561E39937D71F4c1a01a465D358
RESEARCH_AGENT_ADDRESS=0x1e97C361DCa61A66B7a67f28F476708DaCd5a44a
RISK_AGENT_ADDRESS=0x46ED6736aCa227C639692235408A2D00073DBff8
YIELD_AGENT_ADDRESS=0x565773D30Ef2bb1C865ac0f791d4bF5f57C10D2f

# Fuji Network Details
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
FUJI_RPC_BACKUP=https://avalanche-fuji.drpc.org
CHAIN_ID=43113

# Contracts deployed on Fuji
USDC_ADDRESS=0xEcfbE7c72Ba17168209aDDc8B86DB5f9Af1ccdcb
AGENT_REGISTRY_ADDRESS=0x8Ac396E032ECd2f1F8BAf9E88e3Fb76Befd2A0CB
ESCROW_ADDRESS=0x6f9028E92EF4e50Cea71524A40F88Ea02126E660
ERC8004_IDENTITY_REGISTRY=0x7307EEB2F4d903eF9bab3Ec1c6ff2CB798e7C361
ERC8004_REPUTATION_REGISTRY=0x1b83e954DC908ED4C74ECe99D29cF7ffC3A0297F

PORT=3001
```

### 2. Frontend Environment File: `frontend/.env.local`
Create this file inside the `frontend/` directory on the MacBook:
```env
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x8Ac396E032ECd2f1F8BAf9E88e3Fb76Befd2A0CB
NEXT_PUBLIC_ESCROW_ADDRESS=0x6f9028E92EF4e50Cea71524A40F88Ea02126E660
NEXT_PUBLIC_ERC8004_IDENTITY_REGISTRY=0x7307EEB2F4d903eF9bab3Ec1c6ff2CB798e7C361
NEXT_PUBLIC_ERC8004_REPUTATION_REGISTRY=0x1b83e954DC908ED4C74ECe99D29cF7ffC3A0297F
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_EXPLORER_URL=https://testnet.snowtrace.io
```

---

## Part 3: Audit of Balances on Fuji Testnet

Verify that the keys deployed to Fuji are funded. The current balance status as of June 19, 2026:
*   **DEPLOYER:** `0.3999` AVAX | `1,000,000` USDC (Provides backup gas and funds manager)
*   **MANAGER:** `0.0836` AVAX | `9,999.88` USDC (Main operational wallet; pays gas for task runs)
*   **RESEARCH_AGENT:** `0.0` AVAX | `0.04` USDC (Receives payments; needs no gas)
*   **RISK_AGENT:** `0.0` AVAX | `0.04` USDC (Receives payments; needs no gas)
*   **YIELD_AGENT:** `0.0` AVAX | `0.04` USDC (Receives payments; needs no gas)

> [!NOTE]
> Only the **DEPLOYER** and **MANAGER** require AVAX gas. Specialist agents only receive tokens and execute off-chain logic, so they need 0 gas.

---

## Part 4: Potential Risks & Backup Plans

| Component | Potential Issue | Impact | Backup Plan |
| :--- | :--- | :--- | :--- |
| **Fuji RPC Endpoint** | Timeout or 429 rate limit during demo run | Task halts, spinner loops indefinitely | Switch backend `FUJI_RPC_URL` to `FUJI_RPC_BACKUP` (e.g. dRPC/Ankr) in `backend/.env`. |
| **Avalanche Faucets** | Faucet depleted or rate-limited for new wallets | Cannot fund wallets | Reuse existing pre-funded Deployer/Manager wallets. They hold enough balance for >2,000 demo tasks. |
| **Port Conflicts** | Port 3000 or 3001 already in use on MacBook | App fails to launch | Run `kill -9 $(lsof -t -i:3000 -i:3001)` to clear ports before running start commands. |
| **Internet Connection** | Weak connection at venue | On-chain txs fail/hang | Use phone mobile hotspot. Set up a local Hardhat node fallback (requires deploying contracts locally). |

---

# Section A: MacBook Setup Checklist

Follow these steps sequentially to setup the project on the MacBook.

### Step A1: Clone the Code
```bash
git clone <your-repository-url> speedrun
cd speedrun
```

### Step A2: Configure Environment Files
1.  Create `backend/.env` with the exact keys/endpoints from [Part 2: Configuration & Credentials Transfer](#1-backend-environment-file-backendenv).
2.  Create `frontend/.env.local` using the keys from [Part 2: Configuration & Credentials Transfer](#2-frontend-environment-file-frontendenvlocal).

### Step A3: Install Dependencies
*   **Backend Installation:**
    ```bash
    cd backend
    npm install
    ```
*   **Frontend Installation:**
    ```bash
    cd ../frontend
    npm install
    ```

### Step A4: Verify Deployed Contract States
Run the balance checker script inside the `backend` folder to ensure wallets are active and readable on Fuji:
```bash
cd ../backend
node scripts/check-balances.js
```
*Expected output: List of wallets showing AVAX and USDC balances (Deployer should have >0.1 AVAX, Manager should have >0.05 AVAX).*

---

# Section B: Demo Day Checklist

Follow this checklist on the morning of the demo.

- [ ] **Network Check:** Connect the MacBook to a stable Wi-Fi network or mobile hotspot.
- [ ] **RPC Endpoint Test:** Run `curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' https://api.avax-test.network/ext/bc/C/rpc` to confirm the Fuji gateway is responsive.
- [ ] **Clear Port Blockages:** Run the terminal cleaner command:
    ```bash
    kill -9 $(lsof -t -i:3000 -i:3001) 2>/dev/null || true
    ```
- [ ] **Start Backend Server:**
    ```bash
    cd backend
    node server.js
    ```
    *Confirm output shows: `[Server] Agent Payment Backend listening on port 3001`.*
- [ ] **Start Frontend Server:** (Open a new terminal tab/window)
    ```bash
    cd frontend
    npm run dev
    ```
    *Confirm output shows: `ready - started server on 0.0.0.0:3000`.*
- [ ] **Launch Browser:** Open `http://localhost:3000` in Google Chrome/Brave. Turn on full-screen mode.
- [ ] **Verify On-Chain Cards Load:** Check that the 3 registry cards under the "ERC-8004 AGENT REGISTRY" header render correctly with current statistics (jobs completed, earnings, reputation score).

---

# Section C: Recording Script Checklist

Follow this timeline flow when recording the video demo.

### 1. The Hook (0:00 - 0:45)
*   **Action:** Show the landing dashboard at `http://localhost:3000`. Show off the Neo-Brutalist warm design grid, bold borders, and highlight the header subtitle: `"Autonomous Agent Economy · ERC-8004 · x402 · Avalanche Fuji"`.
*   **Voiceover:** *"Welcome to AGORA. We are showcasing an autonomous multi-agent marketplace where a manager agent decomposes complex tasks, hires specialist agents, validates their work schemas, handles trustless payments via EIP-712 x402 signatures, and settles payouts and feedback on-chain on Avalanche Fuji."*
*   **Visual Focus:** Point cursor at the three cards under the **ERC-8004 AGENT REGISTRY**. Point out their wallet addresses, current reputation scores, and jobs completed.

### 2. Submitting the Task (0:45 - 1:15)
*   **Action:** Enter the text: `"Analyze Avalanche DeFi yield opportunities and generate a risk-adjusted report."` in the main text box. Click the red button: **EXECUTE TASK →**.
*   **Voiceover:** *"We submit a prompt to compile a risk-adjusted yield report. This kicks off the manager agent's background orchestration."*

### 3. The Execution Flow (1:15 - 2:15)
*   **Action:** Scroll down so the **AUTONOMOUS EXECUTION FLOW** and **x402 PAYMENT STREAM** panels are visible side-by-side. Watch the steps transition:
    *   `Step 1: Decompose Task` completes.
    *   `Step 2: Discover Agents` reads the registry on-chain.
    *   `Step 3: Filter by Reputation` selects qualified agents (reputation >= 85).
    *   `Step 4: Send x402 Payment` challenges the manager. Point out the yellow `HTTP 402 PAYMENT REQUIRED` flash on the left stream, followed instantly by the green `✓ PAYMENT SETTLED` check.
*   **Voiceover:** *"Here we see the orchestration in real time. The manager decomposes the task, queries the ERC-8004 Identity Registry to discover agents, and filters them based on their reputation. When requesting data from the Research, Risk, and Yield agents, each endpoint challenges the manager with HTTP 402. The manager signs EIP-712 direct payment tokens, which bypasses the specialist paywall."*

### 4. Settlement and Feedback (2:15 - 3:00)
*   **Action:** Watch the final steps complete:
    *   `Step 6: Release payment in Escrow.sol` (Escrow transfers USDC to specialists).
    *   `Step 7: Update Reputation` (Triggers transactions to update ERC-8004 Reputation Registry and custom Agent Registry).
    *   Point out the reputation updates in the execution panel (e.g. 88% -> 90%).
*   **Voiceover:** *"Once the work is validated, the manager settles funds on-chain using Escrow.sol, transferring USDC to the specialist. It then commits feedback directly to the ERC-8004 Reputation Registry, increasing the agents' score for successful execution."*

### 5. Strategy Compilation (3:00 - 3:45)
*   **Action:** Scroll down to display the **COMPILED RISK-ADJUSTED YIELD REPORT**. Highlight the allocation breakdown for Trader Joe, Benqi, and Aave V3. Show the Snowtrace explorer link at the bottom of the settled payment logs.
*   **Voiceover:** *"Here is the generated output: a unified portfolio allocation compiled autonomously by AGORA, with every step backed by verifiable transactions on the Avalanche Fuji network. If we scroll up to the registry cards, we can see that their jobs completed count has increased and their USDC earnings have risen on the blockchain."*
*   **Action:** Hover cursor over the updated counts on the Registry cards. Show the jobs count incremented by 1.

---
