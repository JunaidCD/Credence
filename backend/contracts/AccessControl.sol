// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AccessControl
 * @dev Role-based access control for the credential system
 */
contract AccessControl {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Role membership
    mapping(address => mapping(bytes32 => bool)) public roles;
    mapping(bytes32 => address[]) public roleMembers;
    mapping(address => bytes32[]) public userRoles;

    // Contract state
    bool public paused = false;
    address public owner;
    uint256 public roleRevokeCount = 0;
    uint256 public roleGrantCount = 0;

    // Events
    event RoleGranted(address indexed account, bytes32 indexed role, address indexed grantor);
    event RoleRevoked(address indexed account, bytes32 indexed role, address indexed revoker);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    // Modifiers
    modifier onlyOwner() {
        require(owner == msg.sender, "AccessControl: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "AccessControl: contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "AccessControl: contract is not paused");
        _;
    }

    modifier hasRole(bytes32 role) {
        require(hasRoleInternal(msg.sender, role), "AccessControl: caller does not have required role");
        _;
    }

    constructor() {
        owner = msg.sender;
        _grantRole(msg.sender, ADMIN_ROLE);
    }

    // Role management functions
    function grantRole(address _account, bytes32 _role) external onlyOwner {
        _grantRole(_account, _role);
    }

    function revokeRole(address _account, bytes32 _role) external onlyOwner {
        _revokeRole(_account, _role);
    }

    function renounceRole(bytes32 _role) external {
        _revokeRole(msg.sender, _role);
    }

    function _grantRole(address _account, bytes32 _role) internal {
        if (!roles[_account][_role]) {
            roles[_account][_role] = true;
            roleMembers[_role].push(_account);
            userRoles[_account].push(_role);
            roleGrantCount++;
            emit RoleGranted(_account, _role, msg.sender);
        }
    }

    function _revokeRole(address _account, bytes32 _role) internal {
        if (roles[_account][_role]) {
            roles[_account][_role] = false;
            roleRevokeCount++;
            emit RoleRevoked(_account, _role, msg.sender);
        }
    }

    function checkRole(address _account, bytes32 _role) external view returns (bool) {
        return hasRoleInternal(_account, _role);
    }

    function hasRoleInternal(address _account, bytes32 _role) internal view returns (bool) {
        return roles[_account][_role] || (_role == ADMIN_ROLE && _account == owner);
    }

    function getRoleMemberCount(bytes32 _role) external view returns (uint256) {
        return roleMembers[_role].length;
    }

    function getRoleMember(bytes32 _role, uint256 _index) external view returns (address) {
        require(_index < roleMembers[_role].length, "AccessControl: invalid role member index");
        return roleMembers[_role][_index];
    }

    function getUserRoles(address _account) external view returns (bytes32[] memory) {
        return userRoles[_account];
    }

    function getRoleListLength(bytes32 _role) external view returns (uint256) {
        return roleMembers[_role].length;
    }

    function getUserRoleCount(address _account) external view returns (uint256) {
        return userRoles[_account].length;
    }

    // Pause functionality
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // Ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AccessControl: new owner is the zero address");
        address previousOwner = owner;
        owner = newOwner;
        _revokeRole(previousOwner, ADMIN_ROLE);
        _grantRole(newOwner, ADMIN_ROLE);
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    // Batch operations for role management
    function grantRoles(address[] calldata _accounts, bytes32[] calldata _roles) external onlyOwner {
        require(_accounts.length == _roles.length, "AccessControl: arrays length mismatch");
        for (uint256 i = 0; i < _accounts.length; i++) {
            _grantRole(_accounts[i], _roles[i]);
        }
    }

    function revokeRoles(address[] calldata _accounts, bytes32[] calldata _roles) external onlyOwner {
        require(_accounts.length == _roles.length, "AccessControl: arrays length mismatch");
        for (uint256 i = 0; i < _accounts.length; i++) {
            _revokeRole(_accounts[i], _roles[i]);
        }
    }

    // Emergency functions
    function emergencyPause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function emergencyUnpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // View functions
    function isPaused() external view returns (bool) {
        return paused;
    }

    function getOwner() external view returns (address) {
        return owner;
    }

    function getRoleGrantCount() external view returns (uint256) {
        return roleGrantCount;
    }

    function getRoleRevokeCount() external view returns (uint256) {
        return roleRevokeCount;
    }
}
