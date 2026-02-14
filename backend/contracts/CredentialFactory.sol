// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialFactory
 * @dev Factory contract for creating credential contracts
 */
contract CredentialFactory {
    // Factory configuration
    struct CredentialType {
        string name;
        string description;
        string schema;
        address templateAddress;
        bool isActive;
        uint256 creationFee;
        uint256 totalCreated;
        bytes32 category;
    }
    
    // Credential instance
    struct CredentialInstance {
        address instanceAddress;
        address creator;
        uint256 credentialTypeId;
        uint256 creationTime;
        bool isActive;
        string metadata;
    }
    
    // Storage
    mapping(uint256 => CredentialType) public credentialTypes;
    mapping(address => CredentialInstance[]) public userCredentials;
    mapping(address => mapping(uint256 => bool)) public userHasCredentialType;
    mapping(uint256 => address[]) public credentialTypeCreators;
    
    // Configuration
    address public owner;
    uint256 public credentialTypeCount;
    uint256 public totalCredentialsCreated;
    uint256 public platformFee = 25; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Events
    event CredentialTypeCreated(
        uint256 indexed typeId,
        string name,
        address templateAddress,
        uint256 creationFee
    );
    event CredentialTypeUpdated(uint256 indexed typeId, bool isActive);
    event CredentialInstanceCreated(
        uint256 indexed typeId,
        address indexed instance,
        address indexed creator
    );
    event CredentialInstanceDeprecated(
        address indexed instance,
        address indexed deprecator
    );
    event FeeUpdated(uint256 oldFee, uint256 newFee);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "CredentialFactory: caller is not owner");
        _;
    }

    modifier onlyValidType(uint256 _typeId) {
        require(credentialTypes[_typeId].creationFee > 0 || _typeId == 0, 
            "CredentialFactory: invalid type");
        require(credentialTypes[_typeId].isActive, "CredentialFactory: type not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Create default credential types
        _createCredentialType(
            "BasicCredential",
            "Basic identity credential",
            "{}", // empty schema for default
            address(0),
            0
        );
        
        _createCredentialType(
            "EducationCredential",
            "Educational achievements",
            "{}",
            address(0),
            0.01 ether
        );
        
        _createCredentialType(
            "EmploymentCredential",
            "Employment history",
            "{}",
            address(0),
            0.01 ether
        );
        
        _createCredentialType(
            "FinancialCredential",
            "Financial information",
            "{}",
            address(0),
            0.02 ether
        );
        
        _createCredentialType(
            "MedicalCredential",
            "Medical records",
            "{}",
            address(0),
            0.03 ether
        );
    }

    // Create credential type
    function _createCredentialType(
        string memory _name,
        string memory _description,
        string memory _schema,
        address _templateAddress,
        uint256 _creationFee
    ) internal {
        uint256 typeId = credentialTypeCount++;
        
        credentialTypes[typeId] = CredentialType({
            name: _name,
            description: _description,
            schema: _schema,
            templateAddress: _templateAddress,
            isActive: true,
            creationFee: _creationFee,
            totalCreated: 0,
            category: keccak256(abi.encodePacked(_name))
        });
        
        emit CredentialTypeCreated(typeId, _name, _templateAddress, _creationFee);
    }

    // Create new credential type
    function createCredentialType(
        string memory _name,
        string memory _description,
        string memory _schema,
        address _templateAddress,
        uint256 _creationFee
    ) external onlyOwner returns (uint256) {
        require(bytes(_name).length > 0, "CredentialFactory: name required");
        
        _createCredentialType(_name, _description, _schema, _templateAddress, _creationFee);
        
        return credentialTypeCount - 1;
    }

    // Create credential instance
    function createCredentialInstance(
        uint256 _typeId,
        string memory _metadata
    ) external payable onlyValidType(_typeId) returns (address) {
        CredentialType storage ct = credentialTypes[_typeId];
        
        if (ct.creationFee > 0) {
            require(msg.value >= ct.creationFee, "CredentialFactory: insufficient fee");
            
            uint256 fee = (msg.value * platformFee) / FEE_DENOMINATOR;
            payable(owner).transfer(fee);
        }
        
        // In production, this would deploy a new contract
        // For now, we simulate with address generation
        address instanceAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            msg.sender,
                            _typeId,
                            block.timestamp,
                            totalCredentialsCreated
                        )
                    )
                )
            )
        );
        
        userCredentials[msg.sender].push(CredentialInstance({
            instanceAddress: instanceAddress,
            creator: msg.sender,
            credentialTypeId: _typeId,
            creationTime: block.timestamp,
            isActive: true,
            metadata: _metadata
        }));
        
        userHasCredentialType[msg.sender][_typeId] = true;
        credentialTypeCreators[_typeId].push(msg.sender);
        
        ct.totalCreated++;
        totalCredentialsCreated++;
        
        emit CredentialInstanceCreated(_typeId, instanceAddress, msg.sender);
        
        return instanceAddress;
    }

    // Create multiple credential instances
    function batchCreateCredentialInstance(
        uint256[] calldata _typeIds,
        string[] calldata _metadata
    ) external payable returns (address[] memory) {
        require(_typeIds.length == _metadata.length, "CredentialFactory: arrays mismatch");
        
        address[] memory instances = new address[](_typeIds.length);
        
        for (uint256 i = 0; i < _typeIds.length; i++) {
            instances[i] = createCredentialInstance(_typeIds[i], _metadata[i]);
        }
        
        return instances;
    }

    // Deprecate credential instance
    function deprecateCredentialInstance(address _instance) external {
        CredentialInstance[] storage instances = userCredentials[msg.sender];
        
        for (uint256 i = 0; i < instances.length; i++) {
            if (instances[i].instanceAddress == _instance) {
                instances[i].isActive = false;
                emit CredentialInstanceDeprecated(_instance, msg.sender);
                return;
            }
        }
        
        revert("CredentialFactory: instance not found");
    }

    // Update credential type
    function updateCredentialType(uint256 _typeId, bool _isActive) 
        external onlyOwner {
        require(credentialTypes[_typeId].creationFee > 0 || _typeId == 0, 
            "CredentialFactory: type not found");
        
        credentialTypes[_typeId].isActive = _isActive;
        
        emit CredentialTypeUpdated(_typeId, _isActive);
    }

    // Update platform fee
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 100, "CredentialFactory: fee too high");
        
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        
        emit FeeUpdated(oldFee, _newFee);
    }

    // Get credential type
    function getCredentialType(uint256 _typeId) 
        external view returns (CredentialType memory) {
        return credentialTypes[_typeId];
    }

    // Get user credentials
    function getUserCredentials(address _user) 
        external view returns (CredentialInstance[] memory) {
        return userCredentials[_user];
    }

    // Get user credential count
    function getUserCredentialCount(address _user) 
        external view returns (uint256) {
        return userCredentials[_user].length;
    }

    // Get active credentials
    function getUserActiveCredentials(address _user) 
        external view returns (CredentialInstance[] memory) {
        CredentialInstance[] storage all = userCredentials[_user];
        
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) count++;
        }
        
        CredentialInstance[] memory active = new CredentialInstance[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].isActive) {
                active[index] = all[i];
                index++;
            }
        }
        
        return active;
    }

    // Get credentials by type
    function getCredentialsByType(address _user, uint256 _typeId) 
        external view returns (CredentialInstance[] memory) {
        CredentialInstance[] storage all = userCredentials[_user];
        
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].credentialTypeId == _typeId) count++;
        }
        
        CredentialInstance[] memory filtered = new CredentialInstance[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (all[i].credentialTypeId == _typeId) {
                filtered[index] = all[i];
                index++;
            }
        }
        
        return filtered;
    }

    // Get credential type creators
    function getCredentialTypeCreators(uint256 _typeId) 
        external view returns (address[] memory) {
        return credentialTypeCreators[_typeId];
    }

    // Get total credentials created
    function getTotalCredentialsCreated() 
        external view returns (uint256) {
        return totalCredentialsCreated;
    }

    // Get credential type count
    function getCredentialTypeCount() 
        external view returns (uint256) {
        return credentialTypeCount;
    }

    // Check if user has credential type
    function hasCredentialType(address _user, uint256 _typeId) 
        external view returns (bool) {
        return userHasCredentialType[_user][_typeId];
    }

    // Get credentials by category
    function getCredentialsByCategory(bytes32 _category) 
        external view returns (uint256[] memory typeIds) {
        uint256 count = 0;
        for (uint256 i = 0; i < credentialTypeCount; i++) {
            if (credentialTypes[i].category == _category) count++;
        }
        
        typeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < credentialTypeCount; i++) {
            if (credentialTypes[i].category == _category) {
                typeIds[index] = i;
                index++;
            }
        }
    }

    // Get popular credential types
    function getPopularCredentialTypes(uint256 _count) 
        external view returns (uint256[] memory typeIds, uint256[] memory counts) {
        uint256 limit = _count > credentialTypeCount ? credentialTypeCount : _count;
        
        typeIds = new uint256[](limit);
        counts = new uint256[](limit);
        
        // Simple bubble sort for top types
        for (uint256 i = 0; i < limit; i++) {
            typeIds[i] = i;
            counts[i] = credentialTypes[i].totalCreated;
        }
        
        for (uint256 i = 0; i < limit; i++) {
            for (uint256 j = i + 1; j < limit; j++) {
                if (counts[j] > counts[i]) {
                    uint256 tempCount = counts[i];
                    counts[i] = counts[j];
                    counts[j] = tempCount;
                    
                    uint256 tempId = typeIds[i];
                    typeIds[i] = typeIds[j];
                    typeIds[j] = tempId;
                }
            }
        }
    }

    // Calculate creation fee
    function calculateCreationFee(uint256 _typeId) 
        external view returns (uint256) {
        return credentialTypes[_typeId].creationFee;
    }

    // Get platform fee
    function getPlatformFee() 
        external view returns (uint256) {
        return platformFee;
    }

    // Search credential types by name
    function searchCredentialTypes(string memory _searchTerm) 
        external view returns (uint256[] memory) {
        bytes32 searchHash = keccak256(abi.encodePacked(_searchTerm));
        
        uint256 count = 0;
        for (uint256 i = 0; i < credentialTypeCount; i++) {
            if (keccak256(abi.encodePacked(credentialTypes[i].name)) == searchHash) {
                count++;
            }
        }
        
        uint256[] memory results = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < credentialTypeCount; i++) {
            if (keccak256(abi.encodePacked(credentialTypes[i].name)) == searchHash) {
                results[index] = i;
                index++;
            }
        }
        
        return results;
    }

    // Receive function
    receive() external payable {}
}
