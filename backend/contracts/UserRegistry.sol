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
    
    // Define allowed user accounts (accounts 2-7 for Hardhat)
    mapping(address => bool) public allowedUserAccounts;
    
    uint256 public totalUsers = 0;
    
    event UserRegistered(
        address indexed userAddress,
        string name,
        string email
    );
    
    event UserDeactivated(address indexed userAddress);
    
    constructor() {
        // Initialize allowed user accounts (Hardhat accounts 2-7)
        allowedUserAccounts[0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC] = true; // Account 2
        allowedUserAccounts[0x90F79bf6EB2c4f870365E785982E1f101E93b906] = true; // Account 3
        allowedUserAccounts[0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65] = true; // Account 4
        allowedUserAccounts[0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc] = true; // Account 5
        allowedUserAccounts[0x976EA74026E726554dB657fA54763abd0C3a0aa9] = true; // Account 6
        allowedUserAccounts[0x14dC79964da2C08b23698B3D3cc7Ca32193d9955] = true; // Account 7
    }
    
    modifier onlyAllowedAccount() {
        require(allowedUserAccounts[msg.sender], "Only accounts 2-7 can register as users");
        _;
    }
    
    modifier notAlreadyRegistered() {
        require(!isRegisteredUser[msg.sender], "User is already registered");
        _;
    }
    
    function registerUser(
        string memory _name,
        string memory _email
    ) external onlyAllowedAccount notAlreadyRegistered {
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
    
    function isAllowedAccount(address _account) external view returns (bool) {
        return allowedUserAccounts[_account];
    }
    
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }
    
    function getUserAddresses() external view returns (address[] memory) {
        return userAddresses;
    }
}
