// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Escrow {
    IERC20 public immutable usdcToken;
    address public immutable managerAgent;

    struct Task {
        string taskId;
        uint256 budget;
        uint256 balance;
        bool completed;
    }

    // Mapping from taskId to Task details
    mapping(string => Task) public tasks;

    event TaskCreated(string indexed taskId, uint256 budget);
    event PaymentReleased(string indexed taskId, address indexed agent, uint256 amount);

    modifier onlyManager() {
        require(msg.sender == managerAgent, "Only Manager Agent can call");
        _;
    }

    constructor(address _usdcToken, address _managerAgent) {
        usdcToken = IERC20(_usdcToken);
        managerAgent = _managerAgent;
    }

    function createTask(string calldata taskId, uint256 budget) external {
        require(tasks[taskId].budget == 0, "Task already exists");
        require(budget > 0, "Budget must be greater than zero");

        // Transfer USDC from Manager to Escrow
        require(
            usdcToken.transferFrom(msg.sender, address(this), budget),
            "USDC deposit failed"
        );

        tasks[taskId] = Task({
            taskId: taskId,
            budget: budget,
            balance: budget,
            completed: false
        });

        emit TaskCreated(taskId, budget);
    }

    function releasePayment(
        string calldata taskId,
        address agent,
        uint256 amount
    ) external onlyManager {
        Task storage task = tasks[taskId];
        require(task.budget > 0, "Task does not exist");
        require(!task.completed, "Task is already completed");
        require(task.balance >= amount, "Insufficient task balance");

        task.balance -= amount;
        if (task.balance == 0) {
            task.completed = true;
        }

        // Transfer USDC from Escrow to Agent
        require(usdcToken.transfer(agent, amount), "USDC transfer to agent failed");

        emit PaymentReleased(taskId, agent, amount);
    }
}
