// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentRegistry {
    struct Agent {
        uint256 agentId;
        string name;
        string[] skills;
        uint256 reputationScore; // 0-100
        uint256 jobsCompleted;
        uint256 totalEarned;
        address walletAddress;
    }

    address public owner;
    address public orchestrator;

    // Mapping from agentId to Agent details
    mapping(uint256 => Agent) private _agents;
    
    // Array of all registered agentIds
    uint256[] public agentIds;

    event AgentRegistered(
        uint256 indexed agentId,
        string name,
        string[] skills,
        uint256 reputationScore,
        address walletAddress
    );
    event ReputationUpdated(
        uint256 indexed agentId,
        uint256 newScore,
        uint256 jobsCompleted,
        uint256 totalEarned
    );
    event OrchestratorUpdated(address indexed previousOrchestrator, address indexed newOrchestrator);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyOrchestrator() {
        require(msg.sender == orchestrator || msg.sender == owner, "Only orchestrator or owner can call");
        _;
    }

    constructor() {
        owner = msg.sender;
        orchestrator = msg.sender;
    }

    function setOrchestrator(address _orchestrator) external onlyOwner {
        emit OrchestratorUpdated(orchestrator, _orchestrator);
        orchestrator = _orchestrator;
    }

    function registerAgent(
        uint256 agentId,
        string calldata name,
        string[] calldata skills,
        uint256 reputationScore,
        address walletAddress
    ) external onlyOrchestrator {
        require(_agents[agentId].agentId == 0, "Agent already registered");
        
        _agents[agentId] = Agent({
            agentId: agentId,
            name: name,
            skills: skills,
            reputationScore: reputationScore,
            jobsCompleted: 0,
            totalEarned: 0,
            walletAddress: walletAddress
        });

        agentIds.push(agentId);

        emit AgentRegistered(agentId, name, skills, reputationScore, walletAddress);
    }

    function updateReputation(
        uint256 agentId,
        uint256 newScore,
        uint256 earnings
    ) external onlyOrchestrator {
        require(_agents[agentId].agentId != 0, "Agent not registered");
        require(newScore <= 100, "Reputation score must be 0-100");

        Agent storage agent = _agents[agentId];
        agent.reputationScore = newScore;
        agent.jobsCompleted += 1;
        agent.totalEarned += earnings;

        emit ReputationUpdated(agentId, newScore, agent.jobsCompleted, agent.totalEarned);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(_agents[agentId].agentId != 0, "Agent not registered");
        return _agents[agentId];
    }

    function getTopAgents() external view returns (Agent[] memory) {
        uint256 total = agentIds.length;
        Agent[] memory list = new Agent[](total);
        for (uint256 i = 0; i < total; i++) {
            list[i] = _agents[agentIds[i]];
        }
        return list;
    }

    function getAgentIds() external view returns (uint256[] memory) {
        return agentIds;
    }
}
