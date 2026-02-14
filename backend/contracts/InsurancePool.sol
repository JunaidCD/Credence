// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InsurancePool
 * @dev Insurance pool for credential system participants
 */
contract InsurancePool {
    // Pool member
    struct Member {
        address memberAddress;
        uint256 deposit;
        uint256 totalClaims;
        uint256 paidClaims;
        uint256 joinTime;
        uint256 lastClaimTime;
        bool isActive;
        uint256 trustScore;
    }
    
    // Claim
    struct Claim {
        uint256 id;
        address claimant;
        uint256 amount;
        string description;
        uint256 timestamp;
        bool approved;
        bool paid;
        bool rejected;
        uint256 approvedBy;
    }
    
    // Coverage
    struct Coverage {
        uint256 id;
        string coverageType;
        uint256 coverageLimit;
        uint256 premium;
        uint256 deductible;
        bool isActive;
    }
    
    // Storage
    mapping(address => Member) public members;
    mapping(address => bool) public memberAddresses;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public memberClaims;
    mapping(uint256 => Coverage) public coverages;
    mapping(address => uint256[]) public memberCoverages;
    
    // Configuration
    address public owner;
    uint256 public totalPool;
    uint256 public totalClaims;
    uint256 public claimCount;
    uint256 public coverageCount;
    uint256 public memberCount;
    uint256 public minDeposit = 0.1 ether;
    uint256 public maxCoverageMultiplier = 10;
    
    // Events
    event MemberJoined(address indexed member, uint256 deposit);
    event MemberLeft(address indexed member);
    event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimApproved(uint256 indexed claimId, uint256 approver);
    event ClaimPaid(uint256 indexed claimId, address indexed claimant, uint256 amount);
    event ClaimRejected(uint256 indexed claimId);
    event CoverageCreated(uint256 indexed coverageId, string coverageType, uint256 limit);
    event CoverageActivated(address indexed member, uint256 coverageId);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "InsurancePool: caller is not owner");
        _;
    }

    modifier onlyMember() {
        require(members[msg.sender].isActive, "InsurancePool: not a member");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Create default coverages
        _createCoverage("Basic", 1 ether, 0.01 ether, 0.1 ether);
        _createCoverage("Standard", 5 ether, 0.03 ether, 0.3 ether);
        _createCoverage("Premium", 20 ether, 0.1 ether, 1 ether);
        _createCoverage("Enterprise", 100 ether, 0.3 ether, 5 ether);
    }

    // Create coverage
    function _createCoverage(
        string memory _type,
        uint256 _limit,
        uint256 _premium,
        uint256 _deductible
    ) internal {
        uint256 coverageId = coverageCount++;
        
        coverages[coverageId] = Coverage({
            id: coverageId,
            coverageType: _type,
            coverageLimit: _limit,
            premium: _premium,
            deductible: _deductible,
            isActive: true
        });
        
        emit CoverageCreated(coverageId, _type, _limit);
    }

    // Join pool
    function joinPool() external payable {
        require(!members[msg.sender].isActive, "InsurancePool: already member");
        require(msg.value >= minDeposit, "InsurancePool: deposit too low");
        
        members[msg.sender] = Member({
            memberAddress: msg.sender,
            deposit: msg.value,
            totalClaims: 0,
            paidClaims: 0,
            joinTime: block.timestamp,
            lastClaimTime: 0,
            isActive: true,
            trustScore: 100
        });
        
        memberAddresses[msg.sender] = true;
        memberCount++;
        totalPool += msg.value;
        
        emit MemberJoined(msg.sender, msg.value);
    }

    // Leave pool
    function leavePool() external onlyMember {
        Member storage member = members[msg.sender];
        
        require(member.totalClaims == member.paidClaims, "InsurancePool: pending claims");
        
        uint256 refund = member.deposit;
        member.isActive = false;
        memberAddresses[msg.sender] = false;
        memberCount--;
        totalPool -= refund;
        
        payable(msg.sender).transfer(refund);
        
        emit MemberLeft(msg.sender);
    }

    // Submit claim
    function submitClaim(uint256 _amount, string memory _description) 
        external onlyMember returns (uint256) {
        require(_amount > 0, "InsurancePool: amount must be > 0");
        
        uint256 claimId = ++claimCount;
        
        claims[claimId] = Claim({
            id: claimId,
            claimant: msg.sender,
            amount: _amount,
            description: _description,
            timestamp: block.timestamp,
            approved: false,
            paid: false,
            rejected: false,
            approvedBy: 0
        });
        
        memberClaims[msg.sender].push(claimId);
        
        members[msg.sender].totalClaims++;
        
        emit ClaimSubmitted(claimId, msg.sender, _amount);
        
        return claimId;
    }

    // Approve claim
    function approveClaim(uint256 _claimId) 
        external onlyOwner {
        Claim storage claim = claims[_claimId];
        
        require(claim.amount > 0, "InsurancePool: claim not found");
        require(!claim.approved && !claim.rejected, "InsurancePool: already processed");
        
        claim.approved = true;
        claim.approvedBy = msg.sender;
        
        emit ClaimApproved(_claimId, msg.sender);
    }

    // Reject claim
    function rejectClaim(uint256 _claimId) 
        external onlyOwner {
        Claim storage claim = claims[_claimId];
        
        require(claim.amount > 0, "InsurancePool: claim not found");
        require(!claim.approved && !claim.rejected, "InsurancePool: already processed");
        
        claim.rejected = true;
        
        // Reduce trust score
        Member storage member = members[claim.claimant];
        if (member.trustScore > 10) {
            member.trustScore -= 10;
        }
        
        emit ClaimRejected(_claimId);
    }

    // Pay claim
    function payClaim(uint256 _claimId) 
        external onlyOwner {
        Claim storage claim = claims[_claimId];
        
        require(claim.approved, "InsurancePool: claim not approved");
        require(!claim.paid, "InsurancePool: already paid");
        
        Member storage member = members[claim.claimant];
        
        uint256 payout = claim.amount > member.deposit ? member.deposit : claim.amount;
        
        claim.paid = true;
        member.paidClaims++;
        member.deposit -= payout;
        totalPool -= payout;
        
        payable(member.memberAddress).transfer(payout);
        
        emit ClaimPaid(_claimId, claim.claimant, payout);
    }

    // Add deposit
    function addDeposit() external payable onlyMember {
        require(msg.value > 0, "InsurancePool: amount must be > 0");
        
        members[msg.sender].deposit += msg.value;
        totalPool += msg.value;
    }

    // Activate coverage
    function activateCoverage(uint256 _coverageId) 
        external onlyMember {
        Coverage storage coverage = coverages[_coverageId];
        
        require(coverage.isActive, "InsurancePool: coverage not available");
        
        Member storage member = members[msg.sender];
        require(member.deposit >= coverage.premium, "InsurancePool: insufficient deposit");
        
        member.deposit -= coverage.premium;
        memberCoverages[msg.sender].push(_coverageId);
        
        emit CoverageActivated(msg.sender, _coverageId);
    }

    // Get member
    function getMember(address _member) 
        external view returns (Member memory) {
        return members[_member];
    }

    // Get claim
    function getClaim(uint256 _claimId) 
        external view returns (Claim memory) {
        return claims[_claimId];
    }

    // Get coverage
    function getCoverage(uint256 _coverageId) 
        external view returns (Coverage memory) {
        return coverages[_coverageId];
    }

    // Get member claims
    function getMemberClaims(address _member) 
        external view returns (uint256[] memory) {
        return memberClaims[_member];
    }

    // Get member coverages
    function getMemberCoverages(address _member) 
        external view returns (uint256[] memory) {
        return memberCoverages[_member];
    }

    // Get pool statistics
    function getPoolStatistics() 
        external view returns (
            uint256 poolSize,
            uint256 membersCount,
            uint256 totalClaimsCount,
            uint256 coverageTypes
        ) {
        return (totalPool, memberCount, claimCount, coverageCount);
    }

    // Is member
    function isMember(address _address) 
        external view returns (bool) {
        return members[_address].isActive;
    }

    // Get trust score
    function getTrustScore(address _member) 
        external view returns (uint256) {
        return members[_member].trustScore;
    }

    // Get member deposit
    function getMemberDeposit(address _member) 
        external view returns (uint256) {
        return members[_member].deposit;
    }

    // Get pending claims
    function getPendingClaims() 
        external view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](claimCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= claimCount; i++) {
            if (!claims[i].approved && !claims[i].rejected && !claims[i].paid) {
                pending[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pending[i];
        }
        
        return result;
    }

    // Receive ETH
    receive() external payable {
        if (members[msg.sender].isActive) {
            members[msg.sender].deposit += msg.value;
            totalPool += msg.value;
        }
    }
}
