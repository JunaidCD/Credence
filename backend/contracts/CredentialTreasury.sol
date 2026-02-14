// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialTreasury
 * @dev Treasury contract for handling credential-related payments
 */
contract CredentialTreasury {
    // Treasury state
    mapping(address => uint256) public balances;
    mapping(address => mapping(uint256 => uint256)) public credentialPayments;
    mapping(address => uint256[]) public paymentIds;
    mapping(uint256 => Payment) public payments;
    
    // Rate management
    mapping(address => uint256) public issuerRates;
    mapping(address => bool) public registeredIssuers;
    
    // Treasury configuration
    address public admin;
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public platformFeePercent = 25; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Payment struct
    struct Payment {
        uint256 id;
        address payer;
        address receiver;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        bool isProcessed;
        string paymentType;
        uint256 credentialId;
    }
    
    // Events
    event Deposit(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed user, uint256 amount, uint256 timestamp);
    event PaymentProcessed(uint256 indexed paymentId, address indexed from, address indexed to, uint256 amount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event IssuerRegistered(address indexed issuer, uint256 rate);
    event IssuerRateUpdated(address indexed issuer, uint256 newRate);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    event TreasuryBalanceUpdated(uint256 newBalance);

    // Modifier
    modifier onlyAdmin() {
        require(msg.sender == admin, "CredentialTreasury: caller is not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Deposit funds
    function deposit() external payable {
        require(msg.value > 0, "CredentialTreasury: cannot deposit zero");
        
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
        emit TreasuryBalanceUpdated(address(this).balance);
    }

    // Withdraw funds
    function withdraw(uint256 amount) external {
        require(amount > 0, "CredentialTreasury: cannot withdraw zero");
        require(balances[msg.sender] >= amount, "CredentialTreasury: insufficient balance");
        
        balances[msg.sender] -= amount;
        totalWithdrawals += amount;
        
        payable(msg.sender).transfer(amount);
        
        emit Withdrawal(msg.sender, amount, block.timestamp);
        emit TreasuryBalanceUpdated(address(this).balance);
    }

    // Process payment with fee
    function processPayment(address _to, uint256 _amount, string memory _paymentType, uint256 _credentialId) 
        external returns (uint256) {
        require(balances[msg.sender] >= _amount, "CredentialTreasury: insufficient balance");
        require(_to != address(0), "CredentialTreasury: cannot send to zero address");
        
        uint256 fee = (_amount * platformFeePercent) / FEE_DENOMINATOR;
        uint256 netAmount = _amount - fee;
        
        balances[msg.sender] -= _amount;
        balances[_to] += netAmount;
        balances[admin] += fee;
        
        uint256 paymentId = _recordPayment(msg.sender, _to, _amount, fee, _paymentType, _credentialId);
        
        emit PaymentProcessed(paymentId, msg.sender, _to, netAmount);
        emit TreasuryBalanceUpdated(address(this).balance);
        
        return paymentId;
    }

    // Record payment
    function _recordPayment(
        address _payer,
        address _receiver,
        uint256 _amount,
        uint256 _fee,
        string memory _paymentType,
        uint256 _credentialId
    ) internal returns (uint256) {
        uint256 paymentId = uint256(keccak256(abi.encodePacked(
            _payer,
            _receiver,
            _amount,
            block.timestamp,
            _credentialId
        )));
        
        payments[paymentId] = Payment({
            id: paymentId,
            payer: _payer,
            receiver: _receiver,
            amount: _amount,
            fee: _fee,
            timestamp: block.timestamp,
            isProcessed: true,
            paymentType: _paymentType,
            credentialId: _credentialId
        });
        
        paymentIds[_payer].push(paymentId);
        
        return paymentId;
    }

    // Register issuer with custom rate
    function registerIssuer(address _issuer, uint256 _rate) external onlyAdmin {
        require(_issuer != address(0), "CredentialTreasury: invalid issuer address");
        require(!registeredIssuers[_issuer], "CredentialTreasury: issuer already registered");
        
        registeredIssuers[_issuer] = true;
        issuerRates[_issuer] = _rate;
        
        emit IssuerRegistered(_issuer, _rate);
    }

    // Update issuer rate
    function updateIssuerRate(address _issuer, uint256 _newRate) external onlyAdmin {
        require(registeredIssuers[_issuer], "CredentialTreasury: issuer not registered");
        
        issuerRates[_issuer] = _newRate;
        
        emit IssuerRateUpdated(_issuer, _newRate);
    }

    // Update platform fee
    function updatePlatformFee(uint256 _newFee) external onlyAdmin {
        require(_newFee <= 100, "CredentialTreasury: fee cannot exceed 10%");
        
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFee;
        
        emit FeeUpdated(oldFee, _newFee);
    }

    // Get payment details
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    // Get user payment count
    function getUserPaymentCount(address _user) external view returns (uint256) {
        return paymentIds[_user].length;
    }

    // Get user payments
    function getUserPayments(address _user) external view returns (Payment[] memory) {
        uint256[] memory ids = paymentIds[_user];
        Payment[] memory userPayments = new Payment[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            userPayments[i] = payments[ids[i]];
        }
        
        return userPayments;
    }

    // Get balance
    function getBalance(address _user) external view returns (uint256) {
        return balances[_user];
    }

    // Get treasury balance
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Get issuer rate
    function getIssuerRate(address _issuer) external view returns (uint256) {
        return issuerRates[_issuer];
    }

    // Check if issuer is registered
    function isIssuerRegistered(address _issuer) external view returns (bool) {
        return registeredIssuers[_issuer];
    }

    // Emergency withdraw
    function emergencyWithdraw() external onlyAdmin {
        uint256 amount = address(this).balance;
        require(amount > 0, "CredentialTreasury: no funds to withdraw");
        
        payable(admin).transfer(amount);
        
        emit EmergencyWithdraw(admin, amount);
    }

    // Receive function for direct deposits
    receive() external payable {
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value, block.timestamp);
        emit TreasuryBalanceUpdated(address(this).balance);
    }

    // Batch transfer
    function batchTransfer(address[] calldata _recipients, uint256[] calldata _amounts) external {
        require(_recipients.length == _amounts.length, "CredentialTreasury: arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }
        
        require(balances[msg.sender] >= totalAmount, "CredentialTreasury: insufficient balance");
        
        balances[msg.sender] -= totalAmount;
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "CredentialTreasury: cannot transfer to zero address");
            balances[_recipients[i]] += _amounts[i];
        }
    }

    // Get total statistics
    function getStatistics() external view returns (
        uint256 _totalDeposits,
        uint256 _totalWithdrawals,
        uint256 _currentBalance,
        uint256 _feePercent
    ) {
        return (
            totalDeposits,
            totalWithdrawals,
            address(this).balance,
            platformFeePercent
        );
    }

    // Calculate fee
    function calculateFee(uint256 _amount) external view returns (uint256) {
        return (_amount * platformFeePercent) / FEE_DENOMINATOR;
    }

    // Calculate net amount after fee
    function calculateNetAmount(uint256 _amount) external view returns (uint256) {
        uint256 fee = (_amount * platformFeePercent) / FEE_DENOMINATOR;
        return _amount - fee;
    }
}
