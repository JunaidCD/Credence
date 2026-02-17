// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserRegistry {
    struct User {
        address userAddress;
        string name;
        string email;
        bool isActive;
        uint256 registeredAt;
        uint256 credentialsReceived;
    }

    mapping(address => User) public users;
    mapping(address => bool) public isRegisteredUser;
    address[] public userAddresses;
    
    // Define allowed user accounts - now open to any address
    // mapping(address => bool) public allowedUserAccounts;
    
    uint256 public totalUsers = 0;
    
    event UserRegistered(
        address indexed userAddress,
        string name,
        string email
    );
    
    event UserDeactivated(address indexed userAddress);
    
    constructor() {
        // Anyone can now register as a user - no restrictions
    }
    
    modifier onlyAllowedAccount() {
        // Removed restriction - anyone can register as a user
        _;
    }
    
    modifier notAlreadyRegistered() {
        require(!isRegisteredUser[msg.sender], "User is already registered");
        _;
    }
    
    function registerUser(
        string memory _name,
        string memory _email
    ) external notAlreadyRegistered {
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        User memory newUser = User({
            userAddress: msg.sender,
            name: _name,
            email: _email,
            isActive: true,
            registeredAt: block.timestamp,
            credentialsReceived: 0
        });
        
        users[msg.sender] = newUser;
        isRegisteredUser[msg.sender] = true;
        userAddresses.push(msg.sender);
        totalUsers++;
        
        emit UserRegistered(msg.sender, _name, _email);
    }
    
    function deactivateUser() external {
        require(isRegisteredUser[msg.sender], "User is not registered");
        require(users[msg.sender].isActive, "User is already inactive");
        
        users[msg.sender].isActive = false;
        
        emit UserDeactivated(msg.sender);
    }
    
    function getUser(address _userAddress) external view returns (User memory) {
        require(isRegisteredUser[_userAddress], "User is not registered");
        return users[_userAddress];
    }
    
    function getAllUsers() external view returns (User[] memory) {
        User[] memory allUsers = new User[](totalUsers);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < userAddresses.length; i++) {
            if (users[userAddresses[i]].isActive) {
                allUsers[activeCount] = users[userAddresses[i]];
                activeCount++;
            }
        }
        
        // Resize array to actual active users count
        User[] memory activeUsers = new User[](activeCount);
        for (uint256 i = 0; i < activeCount; i++) {
            activeUsers[i] = allUsers[i];
        }
        
        return activeUsers;
    }
    
    function incrementCredentialsReceived(address _userAddress) external {
        require(isRegisteredUser[_userAddress], "User is not registered");
        users[_userAddress].credentialsReceived++;
    }
    
    function isAllowedAccount(address _account) external pure returns (bool) {
        // Always returns true - any account can register
        return true;
    }
    
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }
    
    function getUserAddresses() external view returns (address[] memory) {
        return userAddresses;
    }
}
