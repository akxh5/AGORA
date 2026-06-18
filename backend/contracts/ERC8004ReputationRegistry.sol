// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ERC8004ReputationRegistry {
    // Mapping from agentId to its latest reputation score (scaled by decimals)
    mapping(uint256 => int128) public latestReputationScore;
    
    // Mapping from agentId to its value decimals
    mapping(uint256 => uint8) public reputationDecimals;

    // Track total feedback count per agent
    mapping(uint256 => uint256) public feedbackCount;

    event FeedbackGiven(
        uint256 indexed agentId,
        int128 value,
        uint8 valueDecimals,
        string tag1,
        string tag2,
        string feedbackURI,
        address indexed sender
    );

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata feedbackURI
    ) external {
        latestReputationScore[agentId] = value;
        reputationDecimals[agentId] = valueDecimals;
        feedbackCount[agentId]++;

        emit FeedbackGiven(
            agentId,
            value,
            valueDecimals,
            tag1,
            tag2,
            feedbackURI,
            msg.sender
        );
    }

    function getLatestReputation(uint256 agentId) external view returns (int128, uint8) {
        return (latestReputationScore[agentId], reputationDecimals[agentId]);
    }
}
