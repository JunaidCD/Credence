// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PaymentProcessor
 * @dev Advanced payment processing for credential services
 */
contract PaymentProcessor {
    // Payment struct
    struct Payment {
        uint256 id;
        address sender;
        address recipient;
        uint256 amount;
        uint256 fee;
        uint256 timestamp;
        bool isProcessed;
        bool isRefunded;
        string paymentReference;
        bytes32 paymentType;
    }
    
    // Subscription
    struct Subscription {
        address subscriber;
        uint256 planId;
        uint256 startTime;
        uint256 nextPaymentTime;
        uint256 totalPaid;
        bool isActive;
        bool isCancelled;
    }
    
    // Plan
    struct Plan {
        uint256 id;
        string name;
        uint256 price;
        uint256 duration;
        uint256 maxTransactions;
        uint256 features;
        bool isActive;
    }
    
    // Storage
    mapping(uint256 => Payment) public payments;
    mapping(address => uint256[]) public userPayments;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(address => bool)) public allowedTokens;
    mapping(address => uint256) public tokenPrices;
    
    // State
    address public owner;
    uint256 public paymentCount;
    uint256 public planCount;
    uint256 public platformFeePercent = 25;
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public totalVolume;
    uint256 public totalFees;
    
    // Events
    event PaymentProcessed(uint256 indexed paymentId, address indexed sender, address indexed recipient, uint256 amount);
    event PaymentRefunded(uint256 indexed paymentId);
    event SubscriptionCreated(address indexed subscriber, uint256 planId, uint256 startTime);
    event SubscriptionCancelled(address indexed subscriber, uint256 planId);
    event SubscriptionRenewed(address indexed subscriber, uint256 planId);
    event PlanCreated(uint256 indexed planId, string name, uint256 price);
    event PlanUpdated(uint256 indexed planId, bool isActive);
    event TokenAllowed(address indexed token, uint256 price);
    event TokenDisallowed(address indexed token);
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "PaymentProcessor: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Create default plans
        _createPlan("Basic", 0.01 ether, 30 days, 100, 1);
        _createPlan("Professional", 0.05 ether, 30 days, 1000, 3);
        _createPlan("Enterprise", 0.1 ether, 30 days, 10000, 7);
    }

    // Create payment
    function createPayment(
        address _recipient,
        string memory _reference
    ) external payable returns (uint256) {
        require(msg.value > 0, "PaymentProcessor: invalid amount");
        require(_recipient != address(0), "PaymentProcessor: invalid recipient");
        
        uint256 paymentId = ++paymentCount;
        
        uint256 fee = (msg.value * platformFeePercent) / FEE_DENOMINATOR;
        uint256 netAmount = msg.value - fee;
        
        payments[paymentId] = Payment({
            id: paymentId,
            sender: msg.sender,
            recipient: _recipient,
            amount: netAmount,
            fee: fee,
            timestamp: block.timestamp,
            isProcessed: false,
            isRefunded: false,
            paymentReference: _reference,
            paymentType: keccak256(abi.encodePacked(_reference))
        });
        
        userPayments[msg.sender].push(paymentId);
        userPayments[_recipient].push(paymentId);
        
        totalVolume += msg.value;
        totalFees += fee;
        
        // Transfer to recipient
        payable(_recipient).transfer(netAmount);
        
        emit PaymentProcessed(paymentId, msg.sender, _recipient, netAmount);
        
        return paymentId;
    }

    // Process payment
    function processPayment(uint256 _paymentId) external {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id == _paymentId, "PaymentProcessor: payment not found");
        require(!payment.isProcessed, "PaymentProcessor: already processed");
        
        payment.isProcessed = true;
        
        emit PaymentProcessed(_paymentId, payment.sender, payment.recipient, payment.amount);
    }

    // Refund payment
    function refundPayment(uint256 _paymentId) external {
        Payment storage payment = payments[_paymentId];
        
        require(payment.id == _paymentId, "PaymentProcessor: payment not found");
        require(!payment.isRefunded, "PaymentProcessor: already refunded");
        require(payment.sender == msg.sender || msg.sender == owner, 
            "PaymentProcessor: not authorized");
        
        payment.isRefunded = true;
        
        payable(payment.sender).transfer(payment.amount);
        
        emit PaymentRefunded(_paymentId);
    }

    // Create subscription
    function createSubscription(uint256 _planId) external payable returns (uint256) {
        Plan storage plan = plans[_planId];
        
        require(plan.isActive, "PaymentProcessor: plan not active");
        require(msg.value >= plan.price, "PaymentProcessor: insufficient payment");
        
        uint256 subscriptionId = uint256(
            keccak256(abi.encodePacked(msg.sender, _planId, block.timestamp))
        );
        
        subscriptions[msg.sender][subscriptionId] = Subscription({
            subscriber: msg.sender,
            planId: _planId,
            startTime: block.timestamp,
            nextPaymentTime: block.timestamp + plan.duration,
            totalPaid: msg.value,
            isActive: true,
            isCancelled: false
        });
        
        userSubscriptions[msg.sender].push(subscriptionId);
        
        emit SubscriptionCreated(msg.sender, _planId, block.timestamp);
        
        return subscriptionId;
    }

    // Cancel subscription
    function cancelSubscription(uint256 _subscriptionId) external {
        Subscription storage sub = subscriptions[msg.sender][_subscriptionId];
        
        require(sub.subscriber == msg.sender, "PaymentProcessor: not subscriber");
        require(!sub.isCancelled, "PaymentProcessor: already cancelled");
        
        sub.isCancelled = true;
        sub.isActive = false;
        
        emit SubscriptionCancelled(msg.sender, sub.planId);
    }

    // Renew subscription
    function renewSubscription(uint256 _subscriptionId) external payable {
        Subscription storage sub = subscriptions[msg.sender][_subscriptionId];
        
        require(sub.subscriber == msg.sender, "PaymentProcessor: not subscriber");
        require(!sub.isCancelled, "PaymentProcessor: subscription cancelled");
        
        Plan storage plan = plans[sub.planId];
        require(msg.value >= plan.price, "PaymentProcessor: insufficient payment");
        
        sub.nextPaymentTime = block.timestamp + plan.duration;
        sub.totalPaid += msg.value;
        sub.isActive = true;
        
        emit SubscriptionRenewed(msg.sender, sub.planId);
    }

    // Create plan
    function _createPlan(
        string memory _name,
        uint256 _price,
        uint256 _duration,
        uint256 _maxTransactions,
        uint256 _features
    ) internal {
        uint256 planId = planCount++;
        
        plans[planId] = Plan({
            id: planId,
            name: _name,
            price: _price,
            duration: _duration,
            maxTransactions: _maxTransactions,
            features: _features,
            isActive: true
        });
        
        emit PlanCreated(planId, _name, _price);
    }

    // Create plan (public)
    function createPlan(
        string memory _name,
        uint256 _price,
        uint256 _duration,
        uint256 _maxTransactions,
        uint256 _features
    ) external onlyOwner {
        _createPlan(_name, _price, _duration, _maxTransactions, _features);
    }

    // Update plan
    function updatePlan(uint256 _planId, bool _isActive) external onlyOwner {
        require(plans[_planId].id == _planId, "PaymentProcessor: plan not found");
        
        plans[_planId].isActive = _isActive;
        
        emit PlanUpdated(_planId, _isActive);
    }

    // Allow token
    function allowToken(address _token, uint256 _price) external onlyOwner {
        require(_token != address(0), "PaymentProcessor: invalid token");
        
        allowedTokens[_token][address(this)] = true;
        tokenPrices[_token] = _price;
        
        emit TokenAllowed(_token, _price);
    }

    // Disallow token
    function disallowToken(address _token) external onlyOwner {
        allowedTokens[_token][address(this)] = false;
        
        emit TokenDisallowed(_token);
    }

    // Update fee
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 100, "PaymentProcessor: fee too high");
        
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFee;
        
        emit FeeUpdated(oldFee, _newFee);
    }

    // Get payment
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    // Get plan
    function getPlan(uint256 _planId) external view returns (Plan memory) {
        return plans[_planId];
    }

    // Get subscription
    function getSubscription(address _user, uint256 _subscriptionId) 
        external view returns (Subscription memory) {
        return subscriptions[_user][_subscriptionId];
    }

    // Get user payments
    function getUserPayments(address _user) external view returns (Payment[] memory) {
        uint256[] storage paymentIds = userPayments[_user];
        Payment[] memory result = new Payment[](paymentIds.length);
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            result[i] = payments[paymentIds[i]];
        }
        
        return result;
    }

    // Get user subscriptions
    function getUserSubscriptions(address _user) 
        external view returns (Subscription[] memory) {
        uint256[] storage subIds = userSubscriptions[_user];
        Subscription[] memory result = new Subscription[](subIds.length);
        
        for (uint256 i = 0; i < subIds.length; i++) {
            result[i] = subscriptions[_user][subIds[i]];
        }
        
        return result;
    }

    // Get statistics
    function getStatistics() external view returns (
        uint256 totalPay,
        uint256 totalVol,
        uint256 totalFee,
        uint256 planCnt
    ) {
        return (paymentCount, totalVolume, totalFees, planCount);
    }

    // Calculate subscription cost
    function calculateSubscriptionCost(uint256 _planId, uint256 _months) 
        external view returns (uint256) {
        Plan storage plan = plans[_planId];
        return plan.price * _months;
    }

    // Check if subscription active
    function isSubscriptionActive(address _user, uint256 _subscriptionId) 
        external view returns (bool) {
        Subscription storage sub = subscriptions[_user][_subscriptionId];
        return sub.isActive && !sub.isCancelled && sub.nextPaymentTime > block.timestamp;
    }

    // Get payment count
    function getPaymentCount() external view returns (uint256) {
        return paymentCount;
    }

    // Get plan count
    function getPlanCount() external view returns (uint256) {
        return planCount;
    }

    // Receive payments
    receive() external payable {}
}
