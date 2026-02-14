// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedIdentity
 * @dev Self-sovereign identity management contract
 */
contract DecentralizedIdentity {
    // Identity struct
    struct Identity {
        address owner;
        string did;
        string name;
        string email;
        string phone;
        string profileHash;
        uint256 createdAt;
        uint256 updatedAt;
        bool isVerified;
        uint256 verificationLevel;
    }
    
    // Credential claim
    struct Claim {
        bytes32 claimId;
        address issuer;
        address subject;
        string claimType;
        string claimData;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        bytes signature;
    }
    
    // Identity attribute
    struct Attribute {
        string key;
        string value;
        uint256 timestamp;
        bool isPrivate;
    }
    
    // Storage
    mapping(address => Identity) public identities;
    mapping(address => bytes32[]) public identityClaims;
    mapping(bytes32 => Claim) public claims;
    mapping(address => mapping(string => Attribute[])) public attributes;
    mapping(address => mapping(address => bool)) public authorizedReaders;
    mapping(address => address[]) public authorizedReaderList;
    mapping(bytes32 => mapping(address => bool)) public claimVerifiers;
    
    // DID prefix
    string public constant DID_PREFIX = "did:cred:";
    uint256 public constant DID_LENGTH = 27;
    
    // Events
    event IdentityCreated(address indexed owner, string did);
    event IdentityUpdated(address indexed owner);
    event IdentityVerified(address indexed owner, uint256 level);
    event ClaimIssued(bytes32 indexed claimId, address indexed issuer, address indexed subject);
    event ClaimRevoked(bytes32 indexed claimId);
    event AttributeAdded(address indexed owner, string key, string value);
    event AttributeRemoved(address indexed owner, string key);
    event ReaderAuthorized(address indexed owner, address indexed reader);
    event ReaderRevoked(address indexed owner, address indexed reader);

    // Modifier
    modifier onlyIdentityOwner() {
        require(identities[msg.sender].owner == msg.sender, "DID: not identity owner");
        _;
    }

    modifier identityExists(address _owner) {
        require(identities[_owner].createdAt != 0, "DID: identity does not exist");
        _;
    }

    // Create identity
    function createIdentity(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _profileHash
    ) external returns (string memory) {
        require(identities[msg.sender].createdAt == 0, "DID: identity already exists");
        require(bytes(_name).length > 0, "DID: name required");
        
        string memory did = _generateDID(msg.sender);
        
        identities[msg.sender] = Identity({
            owner: msg.sender,
            did: did,
            name: _name,
            email: _email,
            phone: _phone,
            profileHash: _profileHash,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isVerified: false,
            verificationLevel: 0
        });
        
        emit IdentityCreated(msg.sender, did);
        
        return did;
    }

    // Update identity
    function updateIdentity(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _profileHash
    ) external onlyIdentityOwner {
        Identity storage identity = identities[msg.sender];
        
        if (bytes(_name).length > 0) identity.name = _name;
        if (bytes(_email).length > 0) identity.email = _email;
        if (bytes(_phone).length > 0) identity.phone = _phone;
        if (bytes(_profileHash).length > 0) identity.profileHash = _profileHash;
        
        identity.updatedAt = block.timestamp;
        
        emit IdentityUpdated(msg.sender);
    }

    // Verify identity
    function verifyIdentity(address _owner, uint256 _level) external {
        Identity storage identity = identities[_owner];
        
        require(identity.createdAt != 0, "DID: identity does not exist");
        
        identity.isVerified = true;
        identity.verificationLevel = _level;
        
        emit IdentityVerified(_owner, _level);
    }

    // Issue claim
    function issueClaim(
        address _subject,
        string memory _claimType,
        string memory _claimData,
        uint256 _expirationDays,
        bytes memory _signature
    ) external returns (bytes32) {
        require(identities[msg.sender].createdAt != 0, "DID: issuer has no identity");
        require(identities[_subject].createdAt != 0, "DID: subject has no identity");
        
        bytes32 claimId = keccak256(abi.encodePacked(
            msg.sender,
            _subject,
            _claimType,
            block.timestamp
        ));
        
        claims[claimId] = Claim({
            claimId: claimId,
            issuer: msg.sender,
            subject: _subject,
            claimType: _claimType,
            claimData: _claimData,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + (_expirationDays * 1 days),
            isRevoked: false,
            signature: _signature
        });
        
        identityClaims[_subject].push(claimId);
        
        emit ClaimIssued(claimId, msg.sender, _subject);
        
        return claimId;
    }

    // Revoke claim
    function revokeClaim(bytes32 _claimId) external {
        Claim storage claim = claims[_claimId];
        
        require(claim.issuer == msg.sender, "DID: not claim issuer");
        require(!claim.isRevoked, "DID: already revoked");
        
        claim.isRevoked = true;
        
        emit ClaimRevoked(_claimId);
    }

    // Add attribute
    function addAttribute(
        string memory _key,
        string memory _value,
        bool _isPrivate
    ) external onlyIdentityOwner {
        attributes[msg.sender][_key].push(Attribute({
            key: _key,
            value: _value,
            timestamp: block.timestamp,
            isPrivate: _isPrivate
        }));
        
        emit AttributeAdded(msg.sender, _key, _value);
    }

    // Remove attribute
    function removeAttribute(string memory _key) external onlyIdentityOwner {
        delete attributes[msg.sender][_key];
        
        emit AttributeRemoved(msg.sender, _key);
    }

    // Authorize reader
    function authorizeReader(address _reader) external onlyIdentityOwner {
        require(_reader != address(0), "DID: invalid reader");
        
        authorizedReaders[msg.sender][_reader] = true;
        authorizedReaderList[msg.sender].push(_reader);
        
        emit ReaderAuthorized(msg.sender, _reader);
    }

    // Revoke reader
    function revokeReader(address _reader) external onlyIdentityOwner {
        authorizedReaders[msg.sender][_reader] = false;
        
        emit ReaderRevoked(msg.sender, _reader);
    }

    // Generate DID
    function _generateDID(address _owner) internal pure returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(_owner, block.timestamp));
        bytes memory didBytes = bytes(DID_PREFIX);
        
        for (uint256 i = 0; i < 20; i++) {
            didBytes = abi.encodePacked(didBytes, bytes1(uint8(uint256(hash) % 62 + (hash % 62 < 10 ? 48 : (hash % 62 < 36 ? 55 : 61)))));
            hash = keccak256(abi.encodePacked(hash));
        }
        
        return string(didBytes);
    }

    // Get identity
    function getIdentity(address _owner) external view returns (Identity memory) {
        return identities[_owner];
    }

    // Get claims
    function getClaims(address _subject) external view returns (Claim[] memory) {
        bytes32[] storage claimIds = identityClaims[_subject];
        Claim[] memory result = new Claim[](claimIds.length);
        
        for (uint256 i = 0; i < claimIds.length; i++) {
            result[i] = claims[claimIds[i]];
        }
        
        return result;
    }

    // Get claim
    function getClaim(bytes32 _claimId) external view returns (Claim memory) {
        return claims[_claimId];
    }

    // Get attributes
    function getAttributes(address _owner, string memory _key) 
        external view returns (Attribute[] memory) {
        return attributes[_owner][_key];
    }

    // Get authorized readers
    function getAuthorizedReaders(address _owner) external view returns (address[] memory) {
        return authorizedReaderList[_owner];
    }

    // Check if reader authorized
    function isReaderAuthorized(address _owner, address _reader) 
        external view returns (bool) {
        return authorizedReaders[_owner][_reader];
    }

    // Check if identity exists
    function identityExists(address _owner) external view returns (bool) {
        return identities[_owner].createdAt != 0;
    }

    // Verify claim
    function verifyClaim(bytes32 _claimId) external view returns (
        bool isValid,
        string memory claimType,
        address issuer,
        uint256 expiresAt
    ) {
        Claim storage claim = claims[_claimId];
        
        return (
            !claim.isRevoked && claim.expiresAt > block.timestamp,
            claim.claimType,
            claim.issuer,
            claim.expiresAt
        );
    }

    // Get claim count
    function getClaimCount(address _subject) external view returns (uint256) {
        return identityClaims[_subject].length;
    }

    // Get attribute count
    function getAttributeCount(address _owner, string memory _key) 
        external view returns (uint256) {
        return attributes[_owner][_key].length;
    }

    // Check verification level
    function getVerificationLevel(address _owner) external view returns (uint256) {
        return identities[_owner].verificationLevel;
    }

    // Is verified
    function isVerified(address _owner) external view returns (bool) {
        return identities[_owner].isVerified;
    }

    // Get DID
    function getDID(address _owner) external view returns (string memory) {
        return identities[_owner].did;
    }

    // Add claim verifier
    function addClaimVerifier(bytes32 _claimId, address _verifier) external {
        Claim storage claim = claims[_claimId];
        
        require(claim.subject == msg.sender, "DID: not claim subject");
        
        claimVerifiers[_claimId][_verifier] = true;
    }

    // Check claim verifier
    function isClaimVerifier(bytes32 _claimId, address _verifier) 
        external view returns (bool) {
        return claimVerifiers[_claimId][_verifier];
    }

    // Batch issue claims
    function batchIssueClaims(
        address[] calldata _subjects,
        string[] calldata _claimTypes,
        string[] calldata _claimData,
        uint256[] calldata _expirationDays
    ) external returns (bytes32[] memory) {
        require(
            _subjects.length == _claimTypes.length &&
            _claimTypes.length == _claimData.length &&
            _claimData.length == _expirationDays.length,
            "DID: arrays mismatch"
        );
        
        bytes32[] memory claimIds = new bytes32[](_subjects.length);
        
        for (uint256 i = 0; i < _subjects.length; i++) {
            claimIds[i] = issueClaim(
                _subjects[i],
                _claimTypes[i],
                _claimData[i],
                _expirationDays[i],
                ""
            );
        }
        
        return claimIds;
    }

    // Delete identity
    function deleteIdentity() external onlyIdentityOwner {
        delete identities[msg.sender];
    }
}
