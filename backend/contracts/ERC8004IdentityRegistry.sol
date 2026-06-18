// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ERC8004IdentityRegistry is ERC721URIStorage {
    uint256 private _tokenIds;

    // Mapping from agentId (tokenId) to agent wallet address
    mapping(uint256 => address) public agentWallets;
    
    // Array of all registered agentIds
    uint256[] public registeredAgentIds;

    event AgentRegistered(uint256 indexed agentId, address indexed wallet, string uri);
    event AgentWalletUpdated(uint256 indexed agentId, address indexed wallet);

    constructor() ERC721("ERC8004 AI Agent Identity", "AGENT") {}

    function register(string memory agentURI) public returns (uint256) {
        _tokenIds++;
        uint256 newAgentId = _tokenIds;

        _mint(msg.sender, newAgentId);
        _setTokenURI(newAgentId, agentURI);
        agentWallets[newAgentId] = msg.sender;
        registeredAgentIds.push(newAgentId);

        emit AgentRegistered(newAgentId, msg.sender, agentURI);
        return newAgentId;
    }

    function setAgentWallet(uint256 agentId, address wallet) public {
        require(ownerOf(agentId) == msg.sender, "Only agent owner can set wallet");
        agentWallets[agentId] = wallet;
        emit AgentWalletUpdated(agentId, wallet);
    }

    function getAgentWallet(uint256 agentId) public view returns (address) {
        return agentWallets[agentId];
    }

    function getRegisteredAgentIds() public view returns (uint256[] memory) {
        return registeredAgentIds;
    }
}
