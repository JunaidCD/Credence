// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TimelockController
 * @dev Contract module which acts as a timelock controller. It can be used to
 * delay execution of sensitive operations like upgrades or critical changes.
 *
 * The timelock can be bypassed in case of emergency by the admin.
 */
contract TimelockController {
    event CallScheduled(
        bytes32 indexed id,
        uint256 indexed index,
        address target,
        uint256 value,
        bytes data,
        bytes32 predecessor,
        uint256 delay
    );
    event CallExecuted(
        bytes32 indexed id,
        uint256 indexed index,
        address target,
        uint256 value,
        bytes data
    );
    event CallCancelled(bytes32 indexed id);
    event AdminChanged(address oldAdmin, address newAdmin);
    event PendingAdminChanged(address oldPendingAdmin, address newPendingAdmin);

    uint256 public constant MIN_DELAY = 2 days;
    uint256 public constant MAX_DELAY = 30 days;

    // Preset delay for upgrades (can be changed by admin)
    uint256 public upgradeDelay;

    address public admin;
    address public pendingAdminAddress;

    // Mapping of call IDs to execution status
    mapping(bytes32 => bool) public executed;
    mapping(bytes32 => bool) public cancelled;

    // Mapping of call IDs to timestamp
    mapping(bytes32 => uint256) public queuedTransactions;

    /**
     * @dev Initializes the contract with an admin and upgrade delay.
     */
    constructor(address _admin, uint256 _upgradeDelay) {
        require(_admin != address(0), "TimelockController: admin is zero address");
        require(
            _upgradeDelay >= MIN_DELAY && _upgradeDelay <= MAX_DELAY,
            "TimelockController: invalid delay"
        );

        admin = _admin;
        upgradeDelay = _upgradeDelay;
    }

    /**
     * @dev Modifier to make a function callable only by the admin.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "TimelockController: caller is not the admin");
        _;
    }

    /**
     * @dev Returns the address of the pending admin.
     */
    function getPendingAdmin() public view returns (address) {
        return pendingAdminAddress;
    }

    /**
     * @dev Returns the delay for a given call.
     */
    function getDelay(bytes32 /*id*/ ) public pure returns (uint256) {
        return MIN_DELAY;
    }

    /**
     * @dev Returns true if the call is queued.
     */
    function isOperationQueued(bytes32 id) public view returns (bool) {
        return queuedTransactions[id] != 0;
    }

    /**
     * @dev Returns true if the call is done.
     */
    function isOperationDone(bytes32 id) public view returns (bool) {
        return executed[id];
    }

    /**
     * @dev Schedule an operation that must be executed after the delay.
     */
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyAdmin {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        require(!isOperationQueued(id), "TimelockController: operation already queued");
        require(!isOperationDone(id), "TimelockController: operation already executed");

        uint256 delay = upgradeDelay;
        queuedTransactions[id] = block.timestamp + delay;

        emit CallScheduled(id, 0, target, value, data, predecessor, delay);
    }

    /**
     * @dev Execute a queued operation after the delay.
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyAdmin {
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        _beforeCall(id, predecessor);

        // Execute the call
        (bool success, ) = target.call{value: value}(data);
        require(success, "TimelockController: underlying transaction reverted");

        executed[id] = true;

        emit CallExecuted(id, 0, target, value, data);
    }

    /**
     * @dev Cancel a queued operation.
     */
    function cancel(bytes32 id) external onlyAdmin {
        require(isOperationQueued(id), "TimelockController: operation not queued");
        require(!isOperationDone(id), "TimelockController: operation already executed");

        cancelled[id] = true;
        delete queuedTransactions[id];

        emit CallCancelled(id);
    }

    /**
     * @dev Set a new pending admin.
     */
    function setPendingAdmin(address newPendingAdmin) external onlyAdmin {
        emit PendingAdminChanged(pendingAdminAddress, newPendingAdmin);
        pendingAdminAddress = newPendingAdmin;
    }

    /**
     * @dev Accept admin role.
     */
    function acceptAdmin() external {
        require(msg.sender == pendingAdminAddress, "TimelockController: caller is not pending admin");

        emit AdminChanged(admin, pendingAdminAddress);
        admin = pendingAdminAddress;
        pendingAdminAddress = address(0);
    }

    /**
     * @dev Update the upgrade delay.
     */
    function setUpgradeDelay(uint256 newDelay) external onlyAdmin {
        require(
            newDelay >= MIN_DELAY && newDelay <= MAX_DELAY,
            "TimelockController: invalid delay"
        );
        upgradeDelay = newDelay;
    }

    /**
     * @dev Helper to compute the hash of an operation.
     */
    function hashOperation(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(target, value, data, predecessor, salt));
    }

    /**
     * @dev Check if the operation is ready to execute.
     */
    function _beforeCall(bytes32 id, bytes32 predecessor) internal view {
        require(!isOperationDone(id), "TimelockController: operation already executed");
        require(isOperationQueued(id), "TimelockController: operation not queued");
        require(
            queuedTransactions[id] <= block.timestamp,
            "TimelockController: operation not ready"
        );
        require(
            predecessor == bytes32(0) || isOperationDone(predecessor),
            "TimelockController: predecessor not executed"
        );
    }

    /**
     * @dev Emergency execute without delay (bypasses timelock).
     */
    function emergencyExecute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyAdmin {
        (bool success, ) = target.call{value: value}(data);
        require(success, "TimelockController: emergency execution failed");
    }

    /**
     * @dev Receive ether.
     */
    receive() external payable {}
}
