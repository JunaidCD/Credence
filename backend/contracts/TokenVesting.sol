// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TokenVesting
 * @dev Token vesting schedule for team members and advisors
 */
contract TokenVesting {
    // Vesting schedule
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 duration;
        bool revocable;
        bool revoked;
        uint256 releasedAmount;
    }
    
    // Storage
    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => bytes32[]) public beneficiarySchedules;
    
    // Token
    address public token;
    address public owner;
    uint256 public totalVested;
    uint256 public totalReleased;
    
    // Events
    event VestingScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 duration
    );
    event TokensReleased(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event VestingRevoked(bytes32 indexed scheduleId);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "TokenVesting: caller is not owner");
        _;
    }

    modifier onlyBeneficiary(bytes32 _scheduleId) {
        require(vestingSchedules[_scheduleId].beneficiary == msg.sender, "TokenVesting: not beneficiary");
        _;
    }

    constructor(address _token) {
        require(_token != address(0), "TokenVesting: invalid token address");
        token = _token;
        owner = msg.sender;
    }

    // Create vesting schedule
    function createVestingSchedule(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner returns (bytes32) {
        require(_beneficiary != address(0), "TokenVesting: invalid beneficiary");
        require(_totalAmount > 0, "TokenVesting: amount must be > 0");
        require(_duration > 0, "TokenVesting: duration must be > 0");
        require(_cliffDuration <= _duration, "TokenVesting: cliff > duration");
        
        bytes32 scheduleId = keccak256(abi.encodePacked(
            _beneficiary,
            _totalAmount,
            _startTime,
            block.timestamp
        ));
        
        require(vestingSchedules[scheduleId].totalAmount == 0, "TokenVesting: schedule exists");
        
        uint256 actualStartTime = _startTime == 0 ? block.timestamp : _startTime;
        
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _totalAmount,
            startTime: actualStartTime,
            cliffDuration: _cliffDuration,
            duration: _duration,
            revocable: _revocable,
            revoked: false,
            releasedAmount: 0
        });
        
        beneficiarySchedules[_beneficiary].push(scheduleId);
        totalVested += _totalAmount;
        
        emit VestingScheduleCreated(
            scheduleId,
            _beneficiary,
            _totalAmount,
            actualStartTime,
            _cliffDuration,
            _duration
        );
        
        return scheduleId;
    }

    // Release vested tokens
    function release(bytes32 _scheduleId) external onlyBeneficiary(_scheduleId) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        
        require(!schedule.revoked, "TokenVesting: schedule revoked");
        
        uint256 releasable = computeReleasableAmount(_scheduleId);
        require(releasable > 0, "TokenVesting: no tokens to release");
        
        schedule.releasedAmount += releasable;
        totalReleased += releasable;
        
        emit TokensReleased(_scheduleId, schedule.beneficiary, releasable);
    }

    // Release all vested tokens
    function releaseAll() external {
        bytes32[] storage schedules = beneficiarySchedules[msg.sender];
        
        for (uint256 i = 0; i < schedules.length; i++) {
            VestingSchedule storage schedule = vestingSchedules[schedules[i]];
            
            if (!schedule.revoked && computeReleasableAmount(schedules[i]) > 0) {
                uint256 releasable = computeReleasableAmount(schedules[i]);
                schedule.releasedAmount += releasable;
                totalReleased += releasable;
                
                emit TokensReleased(schedules[i], schedule.beneficiary, releasable);
            }
        }
    }

    // Revoke vesting schedule
    function revokeVesting(bytes32 _scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        
        require(schedule.revocable, "TokenVesting: not revocable");
        require(!schedule.revoked, "TokenVesting: already revoked");
        
        uint256 releasable = computeReleasableAmount(_scheduleId);
        
        if (releasable > 0) {
            schedule.releasedAmount += releasable;
            totalReleased += releasable;
        }
        
        uint256 vestedAmount = computeVestedAmount(_scheduleId);
        uint256 unreleased = vestedAmount - schedule.releasedAmount;
        
        schedule.revoked = true;
        totalVested -= unreleased;
        
        emit VestingRevoked(_scheduleId);
    }

    // Compute vested amount
    function computeVestedAmount(bytes32 _scheduleId) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        
        if (block.timestamp < schedule.startTime) {
            return 0;
        }
        
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        
        uint256 timeFromStart = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeFromStart) / schedule.duration;
    }

    // Compute releasable amount
    function computeReleasableAmount(bytes32 _scheduleId) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        
        if (schedule.revoked) {
            return 0;
        }
        
        uint256 vested = computeVestedAmount(_scheduleId);
        return vested - schedule.releasedAmount;
    }

    // Get beneficiary schedule count
    function getBeneficiaryScheduleCount(address _beneficiary) external view returns (uint256) {
        return beneficiarySchedules[_beneficiary].length;
    }

    // Get beneficiary schedules
    function getBeneficiarySchedules(address _beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[_beneficiary];
    }

    // Get vesting schedule details
    function getVestingSchedule(bytes32 _scheduleId) external view returns (
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable,
        bool revoked,
        uint256 releasedAmount,
        uint256 releasableAmount
    ) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        return (
            schedule.beneficiary,
            schedule.totalAmount,
            schedule.startTime,
            schedule.cliffDuration,
            schedule.duration,
            schedule.revocable,
            schedule.revoked,
            schedule.releasedAmount,
            computeReleasableAmount(_scheduleId)
        );
    }

    // Get releasable amount for beneficiary
    function getReleasableAmount(address _beneficiary) external view returns (uint256) {
        bytes32[] storage schedules = beneficiarySchedules[_beneficiary];
        uint256 totalReleasable = 0;
        
        for (uint256 i = 0; i < schedules.length; i++) {
            if (!vestingSchedules[schedules[i]].revoked) {
                totalReleasable += computeReleasableAmount(schedules[i]);
            }
        }
        
        return totalReleasable;
    }

    // Get total vested for beneficiary
    function getTotalVested(address _beneficiary) external view returns (uint256) {
        bytes32[] storage schedules = beneficiarySchedules[_beneficiary];
        uint256 totalV = 0;
        
        for (uint256 i = 0; i < schedules.length; i++) {
            totalV += computeVestedAmount(schedules[i]);
        }
        
        return totalV;
    }

    // Get vesting schedule count
    function getScheduleCount() external view returns (uint256) {
        return totalVested;
    }

    // Check if schedule exists
    function scheduleExists(bytes32 _scheduleId) external view returns (bool) {
        return vestingSchedules[_scheduleId].totalAmount > 0;
    }

    // Get vesting status
    function getVestingStatus(bytes32 _scheduleId) external view returns (
        uint256 vested,
        uint256 released,
        uint256 releasable,
        bool revoked,
        bool fullyReleased
    ) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        uint256 v = computeVestedAmount(_scheduleId);
        uint256 r = computeReleasableAmount(_scheduleId);
        
        return (
            v,
            schedule.releasedAmount,
            r,
            schedule.revoked,
            schedule.releasedAmount >= schedule.totalAmount
        );
    }

    // Update owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TokenVesting: invalid owner");
        owner = newOwner;
    }

    // Get released amount
    function getReleasedAmount(bytes32 _scheduleId) external view returns (uint256) {
        return vestingSchedules[_scheduleId].releasedAmount;
    }
}
