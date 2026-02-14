// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title RateLimiter
 * @dev Rate limiting for contract operations
 */
contract RateLimiter {
    // Rate limit configuration
    struct RateLimitConfig {
        uint256 maxRequests;
        uint256 timeWindow;
        uint256 currentRequests;
        uint256 windowStart;
        bool isActive;
    }
    
    // Storage
    mapping(address => RateLimitConfig) public userLimits;
    mapping(address => mapping(uint256 => uint256)) public userRequestTimestamps;
    mapping(address => uint256) public userRequestCounts;
    
    // Global config
    address public admin;
    uint256 public globalMaxRequests;
    uint256 public globalTimeWindow;
    uint256 public globalCurrentRequests;
    uint256 public globalWindowStart;
    
    // Events
    event RateLimitSet(address indexed user, uint256 maxRequests, uint256 timeWindow);
    event RequestAllowed(address indexed user, uint256 currentCount);
    event RequestBlocked(address indexed user, uint256 currentCount, string reason);
    event GlobalLimitUpdated(uint256 maxRequests, uint256 timeWindow);
    event UserWhitelisted(address indexed user);
    event UserBlacklisted(address indexed user);

    // Modifier
    modifier onlyAdmin() {
        require(msg.sender == admin, "RateLimiter: caller is not admin");
        _;
    }

    constructor(uint256 _globalMaxRequests, uint256 _globalTimeWindow) {
        require(_globalMaxRequests > 0, "RateLimiter: invalid max requests");
        require(_globalTimeWindow > 0, "RateLimiter: invalid time window");
        
        admin = msg.sender;
        globalMaxRequests = _globalMaxRequests;
        globalTimeWindow = _globalTimeWindow;
        globalWindowStart = block.timestamp;
    }

    // Set user rate limit
    function setUserRateLimit(address _user, uint256 _maxRequests, uint256 _timeWindow) 
        external onlyAdmin {
        require(_user != address(0), "RateLimiter: invalid user");
        require(_maxRequests > 0, "RateLimiter: invalid max requests");
        require(_timeWindow > 0, "RateLimiter: invalid time window");
        
        userLimits[_user] = RateLimitConfig({
            maxRequests: _maxRequests,
            timeWindow: _timeWindow,
            currentRequests: 0,
            windowStart: block.timestamp,
            isActive: true
        });
        
        emit RateLimitSet(_user, _maxRequests, _timeWindow);
    }

    // Check and record request
    function checkAndRecordRequest(address _user) external returns (bool) {
        // Check global limit
        _checkGlobalLimit();
        
        // Check user-specific limit if set
        if (userLimits[_user].isActive) {
            _checkUserLimit(_user);
        }
        
        // Record the request
        _recordRequest(_user);
        _recordGlobalRequest();
        
        emit RequestAllowed(_user, userRequestCounts[_user]);
        
        return true;
    }

    // Check global limit
    function _checkGlobalLimit() internal {
        if (block.timestamp - globalWindowStart >= globalTimeWindow) {
            globalCurrentRequests = 0;
            globalWindowStart = block.timestamp;
        }
        
        require(globalCurrentRequests < globalMaxRequests, "RateLimiter: global limit exceeded");
    }

    // Check user limit
    function _checkUserLimit(address _user) internal view {
        RateLimitConfig storage config = userLimits[_user];
        
        if (block.timestamp - config.windowStart >= config.timeWindow) {
            return;
        }
        
        require(config.currentRequests < config.maxRequests, 
            "RateLimiter: user limit exceeded");
    }

    // Record request
    function _recordRequest(address _user) internal {
        RateLimitConfig storage config = userLimits[_user];
        
        if (block.timestamp - config.windowStart >= config.timeWindow) {
            config.currentRequests = 1;
            config.windowStart = block.timestamp;
        } else {
            config.currentRequests++;
        }
        
        userRequestCounts[_user]++;
        userRequestTimestamps[_user][userRequestCounts[_user]] = block.timestamp;
    }

    // Record global request
    function _recordGlobalRequest() internal {
        if (block.timestamp - globalWindowStart >= globalTimeWindow) {
            globalCurrentRequests = 1;
            globalWindowStart = block.timestamp;
        } else {
            globalCurrentRequests++;
        }
    }

    // Update global limit
    function updateGlobalLimit(uint256 _maxRequests, uint256 _timeWindow) 
        external onlyAdmin {
        require(_maxRequests > 0, "RateLimiter: invalid max requests");
        require(_timeWindow > 0, "RateLimiter: invalid time window");
        
        globalMaxRequests = _maxRequests;
        globalTimeWindow = _timeWindow;
        
        emit GlobalLimitUpdated(_maxRequests, _timeWindow);
    }

    // Get user request count
    function getUserRequestCount(address _user) external view returns (uint256) {
        return userRequestCounts[_user];
    }

    // Get user limit status
    function getUserLimitStatus(address _user) external view returns (
        uint256 currentRequests,
        uint256 maxRequests,
        uint256 timeRemaining,
        bool isActive
    ) {
        RateLimitConfig storage config = userLimits[_user];
        
        uint256 timeRemainingVal = 0;
        if (block.timestamp - config.windowStart < config.timeWindow) {
            timeRemainingVal = config.timeWindow - (block.timestamp - config.windowStart);
        }
        
        return (
            config.currentRequests,
            config.maxRequests,
            timeRemainingVal,
            config.isActive
        );
    }

    // Get global limit status
    function getGlobalLimitStatus() external view returns (
        uint256 currentRequests,
        uint256 maxRequests,
        uint256 timeRemaining
    ) {
        uint256 timeRemainingVal = 0;
        if (block.timestamp - globalWindowStart < globalTimeWindow) {
            timeRemainingVal = globalTimeWindow - (block.timestamp - globalWindowStart);
        }
        
        return (
            globalCurrentRequests,
            globalMaxRequests,
            timeRemainingVal
        );
    }

    // Check if user is rate limited
    function isRateLimited(address _user) external view returns (bool) {
        RateLimitConfig storage config = userLimits[_user];
        
        if (!config.isActive) {
            return false;
        }
        
        if (block.timestamp - config.windowStart >= config.timeWindow) {
            return false;
        }
        
        return config.currentRequests >= config.maxRequests;
    }

    // Reset user limit
    function resetUserLimit(address _user) external onlyAdmin {
        userLimits[_user].currentRequests = 0;
        userLimits[_user].windowStart = block.timestamp;
    }

    // Deactivate user limit
    function deactivateUserLimit(address _user) external onlyAdmin {
        userLimits[_user].isActive = false;
    }

    // Activate user limit
    function activateUserLimit(address _user) external onlyAdmin {
        userLimits[_user].isActive = true;
    }

    // Batch check and record
    function batchCheck(address[] calldata _users) external returns (bool[] memory) {
        bool[] memory results = new bool[](_users.length);
        
        for (uint256 i = 0; i < _users.length; i++) {
            try this.checkAndRecordRequest(_users[i]) returns (bool success) {
                results[i] = success;
            } catch {
                results[i] = false;
            }
        }
        
        return results;
    }

    // Get user timestamps
    function getUserTimestamps(address _user, uint256 _count) 
        external view returns (uint256[] memory) {
        uint256[] memory timestamps = new uint256[](_count);
        
        for (uint256 i = 1; i <= _count; i++) {
            timestamps[i - 1] = userRequestTimestamps[_user][i];
        }
        
        return timestamps;
    }

    // Get recent request count
    function getRecentRequestCount(address _user, uint256 _since) 
        external view returns (uint256) {
        uint256 count = 0;
        
        for (uint256 i = 1; i <= userRequestCounts[_user]; i++) {
            if (userRequestTimestamps[_user][i] >= _since) {
                count++;
            }
        }
        
        return count;
    }

    // Transfer admin
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "RateLimiter: invalid admin");
        admin = newAdmin;
    }
}
