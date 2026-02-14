// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ReputationSystem
 * @dev Reputation tracking for credential system participants
 */
contract ReputationSystem {
    // Reputation score
    struct Reputation {
        uint256 totalScore;
        uint256 positiveReviews;
        uint256 negativeReviews;
        uint256 neutralReviews;
        uint256 totalTransactions;
        uint256 lastUpdateTime;
        uint256 credScore;
        uint256 activityScore;
        uint256 trustScore;
    }
    
    // Review
    struct Review {
        address reviewer;
        address subject;
        int8 rating;
        string comment;
        uint256 timestamp;
        bool isPositive;
        bool exists;
    }
    
    // Badge
    struct Badge {
        string name;
        string description;
        string imageURI;
        uint256 requiredScore;
        uint256 badgeType;
    }
    
    // Storage
    mapping(address => Reputation) public reputations;
    mapping(address => mapping(address => Review)) public reviews;
    mapping(address => bytes32[]) public userReviews;
    mapping(address => bytes32[]) public userBadges;
    mapping(bytes32 => Badge) public badges;
    mapping(address => mapping(bytes32 => bool)) public userHasBadge;
    
    // Configuration
    address public owner;
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant REVIEW_COOLDOWN = 7 days;
    uint256 public badgeCount;
    
    // Events
    event ReviewSubmitted(address indexed reviewer, address indexed subject, int8 rating);
    event ReputationUpdated(address indexed user, uint256 newScore);
    event BadgeEarned(address indexed user, bytes32 indexed badgeId);
    event BadgeCreated(bytes32 indexed badgeId, string name, uint256 requiredScore);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "ReputationSystem: caller is not owner");
        _;
    }

    modifier canReview(address _subject) {
        require(msg.sender != _subject, "ReputationSystem: cannot review self");
        require(!reviews[msg.sender][_subject].exists, "ReputationSystem: already reviewed");
        require(block.timestamp - reputations[msg.sender].lastUpdateTime >= REVIEW_COOLDOWN, 
            "ReputationSystem: cooldown period");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Create default badges
        _createBadge("Early Adopter", "Joined during early phase", "", 100, 1);
        _createBadge("Verified Issuer", "Completed issuer verification", "", 250, 2);
        _createBadge("Trusted Verifier", "100+ successful verifications", "", 300, 3);
        _createBadge("Gold Member", "High reputation score", "", 500, 4);
        _createBadge("Platinum Member", "Elite reputation status", "", 750, 5);
    }

    // Submit review
    function submitReview(
        address _subject,
        int8 _rating,
        string memory _comment
    ) external canReview(_subject) {
        require(_rating >= -5 && _rating <= 5, "ReputationSystem: invalid rating");
        require(_subject != address(0), "ReputationSystem: invalid subject");
        
        bytes32 reviewId = keccak256(abi.encodePacked(
            msg.sender,
            _subject,
            block.timestamp
        ));
        
        bool isPositive = _rating > 0;
        
        reviews[msg.sender][_subject] = Review({
            reviewer: msg.sender,
            subject: _subject,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            isPositive: isPositive,
            exists: true
        });
        
        userReviews[_subject].push(reviewId);
        
        // Update subject reputation
        _updateReputation(_subject, _rating, isPositive);
        
        emit ReviewSubmitted(msg.sender, _subject, _rating);
    }

    // Update reputation
    function _updateReputation(address _subject, int8 _rating, bool _isPositive) internal {
        Reputation storage rep = reputations[_subject];
        
        if (_isPositive) {
            rep.positiveReviews++;
            rep.totalScore += uint256(int256(_rating) * 10);
        } else if (_rating < 0) {
            rep.negativeReviews++;
            if (rep.totalScore > 0) {
                rep.totalScore -= uint256(int256(_rating) * 5);
            }
        } else {
            rep.neutralReviews++;
        }
        
        rep.totalTransactions++;
        rep.lastUpdateTime = block.timestamp;
        
        // Calculate scores
        rep.credScore = _calculateCredScore(rep);
        rep.activityScore = _calculateActivityScore(rep);
        rep.trustScore = _calculateTrustScore(rep);
        
        // Cap total score
        if (rep.totalScore > MAX_SCORE) {
            rep.totalScore = MAX_SCORE;
        }
        
        // Check for badges
        _checkAndAwardBadges(_subject);
        
        emit ReputationUpdated(_subject, rep.totalScore);
    }

    // Calculate credibility score
    function _calculateCredScore(Reputation storage _rep) internal view returns (uint256) {
        if (_rep.totalTransactions == 0) return 0;
        
        uint256 positiveRatio = (_rep.positiveReviews * 100) / _rep.totalTransactions;
        return (positiveRatio * _rep.totalScore) / 100;
    }

    // Calculate activity score
    function _calculateActivityScore(Reputation storage _rep) internal view returns (uint256) {
        if (_rep.lastUpdateTime == 0) return 0;
        
        uint256 daysSinceLastUpdate = (block.timestamp - _rep.lastUpdateTime) / 1 days;
        if (daysSinceLastUpdate > 30) return 0;
        
        return _rep.totalTransactions * (31 - daysSinceLastUpdate);
    }

    // Calculate trust score
    function _calculateTrustScore(Reputation storage _rep) internal view returns (uint256) {
        if (_rep.totalTransactions == 0) return 50; // Default neutral
        
        uint256 netReviews = _rep.positiveReviews + _rep.negativeReviews;
        if (netReviews == 0) return 50;
        
        uint256 trustRatio = (_rep.positiveReviews * 100) / netReviews;
        return trustRatio;
    }

    // Create badge
    function _createBadge(
        string memory _name,
        string memory _description,
        string memory _imageURI,
        uint256 _requiredScore,
        uint256 _badgeType
    ) internal {
        bytes32 badgeId = keccak256(abi.encodePacked(_name, badgeCount));
        
        badges[badgeId] = Badge({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            requiredScore: _requiredScore,
            badgeType: _badgeType
        });
        
        badgeCount++;
        
        emit BadgeCreated(badgeId, _name, _requiredScore);
    }

    // Check and award badges
    function _checkAndAwardBadges(address _user) internal {
        Reputation storage rep = reputations[_user];
        
        for (uint256 i = 0; i < badgeCount; i++) {
            bytes32 badgeId = keccak256(abi.encodePacked(badges[bytes32(i)].name, i));
            Badge storage badge = badges[badgeId];
            
            if (!userHasBadge[_user][badgeId] && rep.totalScore >= badge.requiredScore) {
                userHasBadge[_user][badgeId] = true;
                userBadges[_user].push(badgeId);
                
                emit BadgeEarned(_user, badgeId);
            }
        }
    }

    // Get reputation
    function getReputation(address _user) external view returns (Reputation memory) {
        return reputations[_user];
    }

    // Get user score
    function getUserScore(address _user) external view returns (uint256) {
        return reputations[_user].totalScore;
    }

    // Get user reviews
    function getUserReviews(address _user) external view returns (Review[] memory) {
        bytes32[] storage reviewIds = userReviews[_user];
        Review[] memory result = new Review[](reviewIds.length);
        
        for (uint256 i = 0; i < reviewIds.length; i++) {
            result[i] = reviews[reviewIds[i]][_user];
        }
        
        return result;
    }

    // Get user badges
    function getUserBadges(address _user) external view returns (bytes32[] memory) {
        return userBadges[_user];
    }

    // Get badge details
    function getBadge(bytes32 _badgeId) external view returns (Badge memory) {
        return badges[_badgeId];
    }

    // Check if user has badge
    function hasBadge(address _user, bytes32 _badgeId) external view returns (bool) {
        return userHasBadge[_user][_badgeId];
    }

    // Get review count for user
    function getReviewCount(address _user) external view returns (uint256) {
        return userReviews[_user].length;
    }

    // Get credibility score
    function getCredScore(address _user) external view returns (uint256) {
        return reputations[_user].credScore;
    }

    // Get activity score
    function getActivityScore(address _user) external view returns (uint256) {
        return reputations[_user].activityScore;
    }

    // Get trust score
    function getTrustScore(address _user) external view returns (uint256) {
        return reputations[_user].trustScore;
    }

    // Get rating average
    function getRatingAverage(address _user) external view returns (int256) {
        Reputation storage rep = reputations[_user];
        
        if (rep.totalTransactions == 0) return 0;
        
        int256 totalRating = int256(rep.positiveReviews * 5) + 
                           int256(rep.negativeReviews * -5);
        
        return totalRating / int256(int256(rep.totalTransactions));
    }

    // Get all scores
    function getAllScores(address _user) external view returns (
        uint256 totalScore,
        uint256 credScore,
        uint256 activityScore,
        uint256 trustScore
    ) {
        Reputation storage rep = reputations[_user];
        return (rep.totalScore, rep.credScore, rep.activityScore, rep.trustScore);
    }

    // Check if can review
    function canReviewUser(address _subject) external view returns (bool) {
        if (msg.sender == _subject) return false;
        if (reviews[msg.sender][_subject].exists) return false;
        if (block.timestamp - reputations[msg.sender].lastUpdateTime < REVIEW_COOLDOWN) return false;
        return true;
    }

    // Get top users by score
    function getTopUsers(uint256 _count) external view returns (address[] memory) {
        // This is a simplified version - production would use a sorted data structure
        address[] memory result = new address[](_count);
        
        // Would need iteration over all users in production
        return result;
    }

    // Create custom badge
    function createBadge(
        string memory _name,
        string memory _description,
        string memory _imageURI,
        uint256 _requiredScore,
        uint256 _badgeType
    ) external onlyOwner {
        _createBadge(_name, _description, _imageURI, _requiredScore, _badgeType);
    }

    // Manual reputation update
    function updateReputationManually(address _user, int256 _adjustment) external onlyOwner {
        Reputation storage rep = reputations[_user];
        
        if (_adjustment > 0) {
            rep.totalScore += uint256(_adjustment);
        } else {
            if (rep.totalScore > uint256(-_adjustment)) {
                rep.totalScore -= uint256(-_adjustment);
            } else {
                rep.totalScore = 0;
            }
        }
        
        if (rep.totalScore > MAX_SCORE) {
            rep.totalScore = MAX_SCORE;
        }
        
        rep.lastUpdateTime = block.timestamp;
        
        _checkAndAwardBadges(_user);
        
        emit ReputationUpdated(_user, rep.totalScore);
    }
}
