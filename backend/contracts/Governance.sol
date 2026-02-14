// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Governance
 * @dev DAO governance for credential system upgrades
 */
contract Governance {
    // Proposal
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
        uint256 quorumRequired;
        uint256 executionDelay;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }
    
    // Vote
    struct Vote {
        address voter;
        bool support;
        uint256 weight;
        uint256 timestamp;
    }
    
    // Storage
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public proposalVotes;
    mapping(uint256 => address[]) public proposalVoters;
    mapping(address => uint256[]) public voterProposals;
    mapping(address => uint256) public votingPower;
    mapping(address => bool) public hasVoted;
    
    // Configuration
    address public owner;
    uint256 public proposalCount;
    uint256 public quorumPercent = 51;
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public proposalThreshold = 100 ether;
    uint256 public totalVotingPower;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event VotingPowerUpdated(address indexed account, uint256 newPower);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Governance: caller is not owner");
        }

    modifier proposalExists(uint256 _proposalId) {
        require(proposals[_proposalId].id == _proposalId, "Governance: proposal not found");
        _;
    }

    modifier hasNotVoted(uint256 _proposalId) {
        require(!proposalVotes[_proposalId][msg.sender].timestamp != 0, "Governance: already voted");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Create proposal
    function createProposal(
        string memory _title,
        string memory _description,
        address[] memory _targets,
        uint256[] memory _values,
        bytes[] memory _calldatas
    ) external returns (uint256) {
        require(votingPower[msg.sender] >= proposalThreshold, "Governance: insufficient voting power");
        require(_targets.length == _values.length, "Governance: targets/values mismatch");
        require(_values.length == _calldatas.length, "Governance: values/calldatas mismatch");
        
        uint256 proposalId = ++proposalCount;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: _title,
            description: _description,
            proposer: msg.sender,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executed: false,
            cancelled: false,
            quorumRequired: (totalVotingPower * quorumPercent) / 100,
            executionDelay: executionDelay,
            targets: _targets,
            values: _values,
            calldatas: _calldatas
        });
        
        voterProposals[msg.sender].push(proposalId);
        
        emit ProposalCreated(proposalId, msg.sender, _title, block.timestamp, block.timestamp + votingPeriod);
        
        return proposalId;
    }

    // Cast vote
    function castVote(uint256 _proposalId, bool _support) 
        external proposalExists(_proposalId) hasNotVoted(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp >= proposal.startTime, "Governance: voting not started");
        require(block.timestamp <= proposal.endTime, "Governance: voting ended");
        require(!proposal.executed, "Governance: proposal executed");
        require(!proposal.cancelled, "Governance: proposal cancelled");
        
        uint256 weight = votingPower[msg.sender];
        require(weight > 0, "Governance: no voting power");
        
        if (_support) {
            proposal.votesFor += weight;
        } else {
            proposal.votesAgainst += weight;
        }
        
        proposalVotes[_proposalId][msg.sender] = Vote({
            voter: msg.sender,
            support: _support,
            weight: weight,
            timestamp: block.timestamp
        });
        
        proposalVoters[_proposalId].push(msg.sender);
        
        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    // Execute proposal
    function executeProposal(uint256 _proposalId) 
        external proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(block.timestamp > proposal.endTime, "Governance: voting not ended");
        require(!proposal.executed, "Governance: already executed");
        require(!proposal.cancelled, "Governance: proposal cancelled");
        
        // Check quorum
        require(
            proposal.votesFor + proposal.votesAgainst >= proposal.quorumRequired,
            "Governance: quorum not reached"
        );
        
        // Check majority
        require(proposal.votesFor > proposal.votesAgainst, "Governance: proposal rejected");
        
        // Check timelock
        require(
            block.timestamp >= proposal.endTime + proposal.executionDelay,
            "Governance: timelock not expired"
        );
        
        proposal.executed = true;
        
        // Execute the proposal
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success, ) = proposal.targets[i].call{value: proposal.values[i]}(
                proposal.calldatas[i]
            );
            require(success, "Governance: execution failed");
        }
        
        emit ProposalExecuted(_proposalId);
    }

    // Cancel proposal
    function cancelProposal(uint256 _proposalId) 
        external proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.proposer == msg.sender || msg.sender == owner, 
            "Governance: not authorized");
        require(!proposal.executed, "Governance: already executed");
        
        proposal.cancelled = true;
        
        emit ProposalCancelled(_proposalId);
    }

    // Update voting power
    function updateVotingPower(address _account, uint256 _newPower) 
        external onlyOwner {
        uint256 oldPower = votingPower[_account];
        votingPower[_account] = _newPower;
        
        totalVotingPower = totalVotingPower - oldPower + _newPower;
        
        emit VotingPowerUpdated(_account,    }

    // Batch update _newPower);
 voting power
    function batchUpdateVotingPower(
        address[] calldata _accounts,
        uint256[] calldata _powers
    ) external onlyOwner {
        require(_accounts.length == _powers.length, "Governance: arrays mismatch");
        
        for (uint256 i = 0; i < _accounts.length; i++) {
            uint256 oldPower = votingPower[_accounts[i]];
            votingPower[_accounts[i]] = _powers[i];
            totalVotingPower = totalVotingPower - oldPower + _powers[i];
            
            emit VotingPowerUpdated(_accounts[i], _powers[i]);
        }
    }

    // Update quorum
    function updateQuorumPercent(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0 && _newQuorum <= 100, "Governance: invalid quorum");
        
        uint256 oldQuorum = quorumPercent;
        quorumPercent = _newQuorum;
        
        emit QuorumUpdated(oldQuorum, _newQuorum);
    }

    // Update voting period
    function updateVotingPeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod >= 1 days && _newPeriod <= 30 days, "Governance: invalid period");
        
        uint256 oldPeriod = votingPeriod;
        votingPeriod = _newPeriod;
        
        emit VotingPeriodUpdated(oldPeriod, _newPeriod);
    }

    // Get proposal
    function getProposal(uint256 _proposalId) 
        external view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    // Get proposal votes
    function getProposalVotes(uint256 _proposalId) 
        external view returns (address[] memory) {
        return proposalVoters[_proposalId];
    }

    // Get voter proposals
    function getVoterProposals(address _voter) 
        external view returns (uint256[] memory) {
        return voterProposals[_voter];
    }

    // Get voting power
    function getVotingPower(address _account) 
        external view returns (uint256) {
        return votingPower[_account];
    }

    // Get proposal status
    function getProposalStatus(uint256 _proposalId) 
        external view returns (
            bool active,
            bool executed,
            bool cancelled,
            bool passed,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 quorumRequired
        ) {
        Proposal storage p = proposals[_proposalId];
        
        return (
            block.timestamp >= p.startTime && block.timestamp <= p.endTime && !p.executed && !p.cancelled,
            p.executed,
            p.cancelled,
            p.votesFor > p.votesAgainst,
            p.votesFor,
            p.votesAgainst,
            p.quorumRequired
        );
    }

    // Check if voter voted
    function hasVotedOnProposal(uint256 _proposalId, address _voter) 
        external view returns (bool) {
        return proposalVotes[_proposalId][_voter].timestamp != 0;
    }

    // Get vote
    function getVote(uint256 _proposalId, address _voter) 
        external view returns (Vote memory) {
        return proposalVotes[_proposalId][_voter];
    }

    // Get voter vote count
    function getVoterVoteCount(address _voter) 
        external view returns (uint256) {
        return voterProposals[_voter].length;
    }

    // Get active proposals
    function getActiveProposals() 
        external view returns (uint256[] memory) {
        uint256[] memory active = new uint256[](proposalCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= proposalCount; i++) {
            Proposal storage p = proposals[i];
            if (block.timestamp >= p.startTime && 
                block.timestamp <= p.endTime && 
                !p.executed && 
                !p.cancelled) {
                active[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }
        
        return result;
    }

    // Get proposal count
    function getProposalCount() 
        external view returns (uint256) {
        return proposalCount;
    }

    // Get total voting power
    function getTotalVotingPower() 
        external view returns (uint256) {
        return totalVotingPower;
    }

    // Queue proposal for execution
    function queueProposal(uint256 _proposalId) 
        external proposalExists(_proposalId) {
        // In production, this would add to a timelock queue
    }

    // Receive ETH
    receive() external payable {}
}
