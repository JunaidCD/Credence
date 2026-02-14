// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MultiSigWallet
 * @dev Multi-signature wallet for credential system treasury
 */
contract MultiSigWallet {
    // Owners
    mapping(address => bool) public isOwner;
    address[] public owners;
    
    // Transaction tracking
    struct Transaction {
        uint256 id;
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
        uint256 timestamp;
        string description;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => uint256[]) public ownerTransactionIds;
    
    // Configuration
    uint256 public required;
    uint256 public transactionCount;
    uint256 public constant MAX_OWNERS = 50;
    uint256 public constant MAX_TRANSACTIONS = 1000;
    
    // Events
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event TransactionSubmitted(uint256 indexed transactionId, address indexed submitter, address indexed to, uint256 value);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed confirmer);
    event TransactionExecuted(uint256 indexed transactionId, address indexed executor);
    event TransactionRevoked(uint256 indexed transactionId, address indexed revoker);
    event RequirementChanged(uint256 oldRequired, uint256 newRequired);

    // Modifier
    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultiSigWallet: not an owner");
        _;
    }

    modifier transactionExists(uint256 _transactionId) {
        require(transactions[_transactionId].id != 0 || _transactionId <= transactionCount, 
            "MultiSigWallet: transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _transactionId) {
        require(!transactions[_transactionId].executed, "MultiSigWallet: already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "MultiSigWallet: owners required");
        require(_required > 0, "MultiSigWallet: required confirmations required");
        require(_owners.length >= _required, "MultiSigWallet: owners less than required");
        require(_owners.length <= MAX_OWNERS, "MultiSigWallet: max owners exceeded");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "MultiSigWallet: invalid owner");
            require(!isOwner[owner], "MultiSigWallet: duplicate owner");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        required = _required;
    }

    // Submit transaction
    function submitTransaction(address _to, uint256 _value, bytes memory _data, string memory _description) 
        external onlyOwner returns (uint256) {
        require(transactionCount < MAX_TRANSACTIONS, "MultiSigWallet: max transactions reached");
        require(_to != address(0), "MultiSigWallet: invalid destination");
        
        uint256 transactionId = transactionCount + 1;
        
        transactions[transactionId] = Transaction({
            id: transactionId,
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmations: 0,
            timestamp: block.timestamp,
            description: _description
        });
        
        ownerTransactionIds[msg.sender].push(transactionId);
        transactionCount++;
        
        emit TransactionSubmitted(transactionId, msg.sender, _to, _value);
        
        return transactionId;
    }

    // Confirm transaction
    function confirmTransaction(uint256 _transactionId) 
        external onlyOwner transactionExists(_transactionId) notExecuted(_transactionId) {
        require(!confirmations[_transactionId][msg.sender], "MultiSigWallet: already confirmed");
        
        confirmations[_transactionId][msg.sender] = true;
        transactions[_transactionId].confirmations++;
        
        emit TransactionConfirmed(_transactionId, msg.sender);
        
        if (transactions[_transactionId].confirmations >= required) {
            executeTransaction(_transactionId);
        }
    }

    // Revoke confirmation
    function revokeConfirmation(uint256 _transactionId) 
        external onlyOwner transactionExists(_transactionId) notExecuted(_transactionId) {
        require(confirmations[_transactionId][msg.sender], "MultiSigWallet: not confirmed");
        
        confirmations[_transactionId][msg.sender] = false;
        transactions[_transactionId].confirmations--;
        
        emit TransactionRevoked(_transactionId, msg.sender);
    }

    // Execute transaction
    function executeTransaction(uint256 _transactionId) 
        public onlyOwner transactionExists(_transactionId) notExecuted(_transactionId) {
        Transaction storage transaction = transactions[_transactionId];
        
        require(transaction.confirmations >= required, "MultiSigWallet: not enough confirmations");
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "MultiSigWallet: execution failed");
        
        emit TransactionExecuted(_transactionId, msg.sender);
    }

    // Get transaction details
    function getTransaction(uint256 _transactionId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmations,
        uint256 timestamp,
        string memory description
    ) {
        Transaction storage transaction = transactions[_transactionId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.confirmations,
            transaction.timestamp,
            transaction.description
        );
    }

    // Get transaction confirmations
    function getTransactionConfirmations(uint256 _transactionId) external view returns (address[] memory) {
        address[] memory confirmers = new address[](owners.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[_transactionId][owners[i]]) {
                confirmers[count] = owners[i];
                count++;
            }
        }
        
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = confirmers[i];
        }
        
        return result;
    }

    // Get owner count
    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }

    // Get owner transactions
    function getOwnerTransactions(address _owner) external view returns (uint256[] memory) {
        return ownerTransactionIds[_owner];
    }

    // Get pending transactions
    function getPendingTransactions() external view returns (uint256[] memory) {
        uint256[] memory pending = new uint256[](transactionCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= transactionCount; i++) {
            if (!transactions[i].executed) {
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

    // Get executed transactions
    function getExecutedTransactions() external view returns (uint256[] memory) {
        uint256[] memory executed = new uint256[](transactionCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= transactionCount; i++) {
            if (transactions[i].executed) {
                executed[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = executed[i];
        }
        
        return result;
    }

    // Add owner
    function addOwner(address _owner) external {
        require(msg.sender == address(this), "MultiSigWallet: must be called via transaction");
        require(_owner != address(0), "MultiSigWallet: invalid owner");
        require(!isOwner[_owner], "MultiSigWallet: already owner");
        require(owners.length < MAX_OWNERS, "MultiSigWallet: max owners reached");
        
        isOwner[_owner] = true;
        owners.push(_owner);
        
        emit OwnerAdded(_owner);
    }

    // Remove owner
    function removeOwner(address _owner) external {
        require(msg.sender == address(this), "MultiSigWallet: must be called via transaction");
        require(isOwner[_owner], "MultiSigWallet: not an owner");
        require(owners.length - 1 >= required, "MultiSigWallet: cannot remove owner");
        
        isOwner[_owner] = false;
        
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        
        emit OwnerRemoved(_owner);
    }

    // Change requirement
    function changeRequirement(uint256 _required) external {
        require(msg.sender == address(this), "MultiSigWallet: must be called via transaction");
        require(_required > 0, "MultiSigWallet: required must be > 0");
        require(_required <= owners.length, "MultiSigWallet: required > owners");
        
        uint256 oldRequired = required;
        required = _required;
        
        emit RequirementChanged(oldRequired, _required);
    }

    // Check if confirmed
    function isConfirmed(uint256 _transactionId, address _owner) external view returns (bool) {
        return confirmations[_transactionId][_owner];
    }

    // Get transaction count
    function getTransactionCount() external view returns (uint256) {
        return transactionCount;
    }

    // Receive ETH
    receive() external payable {}
}
