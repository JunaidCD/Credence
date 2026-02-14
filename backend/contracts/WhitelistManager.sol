// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title WhitelistManager
 * @dev Whitelist management for ICOs and airdrops
 */
contract WhitelistManager {
    // Whitelist entry
    struct WhitelistEntry {
        address user;
        uint256 allocatedAmount;
        uint256 purchasedAmount;
        uint256 registrationTime;
        uint256 tierLevel;
        bool isWhitelisted;
        bool isVerified;
        string kycHash;
    }
    
    // Tier configuration
    struct TierConfig {
        uint256 minAllocation;
        uint256 maxAllocation;
        uint256 discountPercent;
        uint256 maxUsers;
        uint256 currentUsers;
        bool isActive;
    }
    
    // Storage
    mapping(address => WhitelistEntry) public whitelist;
    mapping(address => bool) public verifiedAddresses;
    mapping(address => mapping(address => bool)) public referrers;
    mapping(address => uint256[]) public userReferrals;
    mapping(uint256 => TierConfig) public tiers;
    mapping(address => uint256) public userTier;
    address[] public whitelistedAddresses;
    address[] public verifiedAddressesList;
    
    // Contract state
    address public owner;
    uint256 public totalAllocated;
    uint256 public totalPurchased;
    uint256 public totalReferrals;
    uint256 public currentTierCount;
    
    // Events
    event UserWhitelisted(address indexed user, uint256 allocatedAmount, uint256 tier);
    event UserRemovedFromWhitelist(address indexed user);
    event UserVerified(address indexed user, string kycHash);
    event PurchaseMade(address indexed user, uint256 amount, uint256 discount);
    event ReferralMade(address indexed referrer, address indexed referee, uint256 reward);
    event TierCreated(uint256 indexed tierId, uint256 minAllocation, uint256 maxAllocation);
    event TierUpdated(uint256 indexed tierId, uint256 maxUsers);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "WhitelistManager: caller is not owner");
        _;
    }

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender].isWhitelisted, "WhitelistManager: not whitelisted");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Create default tiers
        _createTier(0.1 ether, 1 ether, 5, 100);    // Bronze
        _createTier(1 ether, 5 ether, 10, 50);     // Silver
        _createTier(5 ether, 20 ether, 15, 25);     // Gold
        _createTier(20 ether, 100 ether, 25, 10);  // Platinum
    }

    // Add user to whitelist
    function addToWhitelist(
        address _user,
        uint256 _allocatedAmount,
        uint256 _tier
    ) external onlyOwner {
        require(_user != address(0), "WhitelistManager: invalid user");
        require(!whitelist[_user].isWhitelisted, "WhitelistManager: already whitelisted");
        require(tiers[_tier].isActive, "WhitelistManager: invalid tier");
        require(tiers[_tier].currentUsers < tiers[_tier].maxUsers, "WhitelistManager: tier full");
        
        whitelist[_user] = WhitelistEntry({
            user: _user,
            allocatedAmount: _allocatedAmount,
            purchasedAmount: 0,
            registrationTime: block.timestamp,
            tierLevel: _tier,
            isWhitelisted: true,
            isVerified: false,
            kycHash: ""
        });
        
        userTier[_user] = _tier;
        whitelistedAddresses.push(_user);
        tiers[_tier].currentUsers++;
        totalAllocated += _allocatedAmount;
        
        emit UserWhitelisted(_user, _allocatedAmount, _tier);
    }

    // Remove user from whitelist
    function removeFromWhitelist(address _user) external onlyOwner {
        require(whitelist[_user].isWhitelisted, "WhitelistManager: not whitelisted");
        
        uint256 tier = whitelist[_user].tierLevel;
        tiers[tier].currentUsers--;
        totalAllocated -= whitelist[_user].allocatedAmount;
        
        whitelist[_user].isWhitelisted = false;
        
        emit UserRemovedFromWhitelist(_user);
    }

    // Verify user KYC
    function verifyUser(address _user, string memory _kycHash) external onlyOwner {
        require(whitelist[_user].isWhitelisted, "WhitelistManager: not whitelisted");
        require(bytes(_kycHash).length > 0, "WhitelistManager: invalid KYC hash");
        
        whitelist[_user].isVerified = true;
        whitelist[_user].kycHash = _kycHash;
        verifiedAddresses[_user] = true;
        verifiedAddressesList.push(_user);
        
        emit UserVerified(_user, _kycHash);
    }

    // Purchase tokens
    function purchaseTokens(uint256 _amount) external onlyWhitelisted {
        WhitelistEntry storage entry = whitelist[msg.sender];
        
        require(entry.isVerified, "WhitelistManager: KYC not verified");
        require(entry.purchasedAmount + _amount <= entry.allocatedAmount, 
            "WhitelistManager: exceeds allocation");
        
        TierConfig storage tier = tiers[entry.tierLevel];
        uint256 discount = (_amount * tier.discountPercent) / 100;
        uint256 finalAmount = _amount - discount;
        
        entry.purchasedAmount += _amount;
        totalPurchased += finalAmount;
        
        emit PurchaseMade(msg.sender, _amount, discount);
    }

    // Add referral
    function addReferral(address _referrer, address _referee) external onlyOwner {
        require(_referrer != address(0) && _referee != address(0), "WhitelistManager: invalid addresses");
        require(!referrers[_referee][_referrer], "WhitelistManager: referral exists");
        
        referrers[_referee][_referrer] = true;
        userReferrals[_referrer].push(_referee);
        totalReferrals++;
        
        emit ReferralMade(_referrer, _referee, 0);
    }

    // Create tier
    function _createTier(
        uint256 _minAllocation,
        uint256 _maxAllocation,
        uint256 _discountPercent,
        uint256 _maxUsers
    ) internal {
        uint256 tierId = currentTierCount++;
        
        tiers[tierId] = TierConfig({
            minAllocation: _minAllocation,
            maxAllocation: _maxAllocation,
            discountPercent: _discountPercent,
            maxUsers: _maxUsers,
            currentUsers: 0,
            isActive: true
        });
        
        emit TierCreated(tierId, _minAllocation, _maxAllocation);
    }

    // Create new tier (public)
    function createTier(
        uint256 _minAllocation,
        uint256 _maxAllocation,
        uint256 _discountPercent,
        uint256 _maxUsers
    ) external onlyOwner {
        require(_maxAllocation > _minAllocation, "WhitelistManager: invalid allocation range");
        require(_discountPercent <= 50, "WhitelistManager: discount too high");
        
        _createTier(_minAllocation, _maxAllocation, _discountPercent, _maxUsers);
    }

    // Update tier
    function updateTier(uint256 _tierId, uint256 _maxUsers) external onlyOwner {
        require(tiers[_tierId].isActive, "WhitelistManager: tier not found");
        
        tiers[_tierId].maxUsers = _maxUsers;
        
        emit TierUpdated(_tierId, _maxUsers);
    }

    // Get whitelist entry
    function getWhitelistEntry(address _user) external view returns (WhitelistEntry memory) {
        return whitelist[_user];
    }

    // Get tier config
    function getTierConfig(uint256 _tierId) external view returns (TierConfig memory) {
        return tiers[_tierId];
    }

    // Get user tier
    function getUserTier(address _user) external view returns (uint256) {
        return userTier[_user];
    }

    // Get whitelisted count
    function getWhitelistedCount() external view returns (uint256) {
        return whitelistedAddresses.length;
    }

    // Get verified count
    function getVerifiedCount() external view returns (uint256) {
        return verifiedAddressesList.length;
    }

    // Get user referrals
    function getUserReferrals(address _user) external view returns (address[] memory) {
        return userReferrals[_user];
    }

    // Get referral count
    function getReferralCount(address _user) external view returns (uint256) {
        return userReferrals[_user].length;
    }

    // Check if user is whitelisted
    function isWhitelisted(address _user) external view returns (bool) {
        return whitelist[_user].isWhitelisted;
    }

    // Check if user is verified
    function isVerified(address _user) external view returns (bool) {
        return whitelist[_user].isVerified;
    }

    // Get remaining allocation
    function getRemainingAllocation(address _user) external view returns (uint256) {
        WhitelistEntry storage entry = whitelist[_user];
        return entry.allocatedAmount - entry.purchasedAmount;
    }

    // Get discount for tier
    function getDiscountForTier(uint256 _tierId) external view returns (uint256) {
        return tiers[_tierId].discountPercent;
    }

    // Calculate purchase with discount
    function calculatePurchaseWithDiscount(uint256 _amount, address _user) 
        external view returns (uint256 finalAmount, uint256 discount) {
        WhitelistEntry storage entry = whitelist[_user];
        TierConfig storage tier = tiers[entry.tierLevel];
        
        discount = (_amount * tier.discountPercent) / 100;
        finalAmount = _amount - discount;
        
        return (finalAmount, discount);
    }

    // Batch add to whitelist
    function batchAddToWhitelist(
        address[] calldata _users,
        uint256[] calldata _amounts,
        uint256 _tier
    ) external onlyOwner {
        require(_users.length == _amounts.length, "WhitelistManager: arrays length mismatch");
        
        for (uint256 i = 0; i < _users.length; i++) {
            if (!whitelist[_users[i]].isWhitelisted) {
                addToWhitelist(_users[i], _amounts[i], _tier);
            }
        }
    }

    // Get all whitelisted addresses
    function getAllWhitelistedAddresses() external view returns (address[] memory) {
        return whitelistedAddresses;
    }

    // Get statistics
    function getStatistics() external view returns (
        uint256 whitelistedCount,
        uint256 verifiedCount,
        uint256 totalAlloc,
        uint256 totalPurch,
        uint256 totalRefs
    ) {
        return (
            whitelistedAddresses.length,
            verifiedAddressesList.length,
            totalAllocated,
            totalPurchased,
            totalReferrals
        );
    }
}
