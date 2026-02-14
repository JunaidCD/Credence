// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IssuerRegistry.sol";

/**
 * @title CredentialRegistry
 * @dev Enhanced credential registry with EIP-712 signatures and Merkle proofs
 */
contract CredentialRegistry {
    struct Credential {
        uint256 id;
        address issuer;
        address holder;
        string credentialType;
        string data;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
        bool isRevoked;
        string ipfsHash;
    }

    struct VerificationRequest {
        uint256 id;
        address verifier;
        address holder;
        uint256 credentialId;
        string message;
        bool isApproved;
        bool isProcessed;
        uint256 requestedAt;
        uint256 processedAt;
    }

    struct MerkleCredential {
        uint256 id;
        bytes32 merkleRoot;
        address issuer;
        address holder;
        string credentialType;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
    }

    bytes32 public DOMAIN_SEPARATOR;
    IssuerRegistry public immutable issuerRegistry;
    
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public holderCredentials;
    mapping(address => uint256[]) public issuerCredentials;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => uint256[]) public verifierRequests;
    mapping(address => uint256[]) public holderRequests;
    mapping(uint256 => MerkleCredential) public merkleCredentials;
    mapping(bytes32 => bool) public usedMerkleroots;
    mapping(address => mapping(uint256 => bytes32)) public credentialMerkleRoots;
    mapping(address => uint256[]) public holderMerkleCredentials;
    mapping(address => uint256) public offChainNonces;
    mapping(bytes32 => bool) public usedSignatures;
    
    uint256 public nextCredentialId = 1;
    uint256 public nextMerkleCredentialId = 1;
    uint256 public nextRequestId = 1;
    
    event CredentialIssued(uint256 indexed credentialId, address indexed issuer, address indexed holder, string credentialType);
    event CredentialRevoked(uint256 indexed credentialId, address indexed issuer);
    event VerificationRequested(uint256 indexed requestId, address indexed verifier, address indexed holder, uint256 credentialId);
    event VerificationProcessed(uint256 indexed requestId, bool approved, address indexed holder);
    event OffChainCredentialIssued(bytes32 indexed digest, address indexed issuer, address indexed holder, string credentialType);
    event MerkleCredentialCreated(uint256 indexed credentialId, address indexed issuer, address indexed holder, bytes32 merkleRoot);

    string private constant DOMAIN_NAME = "CredenceCredentialRegistry";
    string private constant DOMAIN_VERSION = "1";

    modifier onlyRegisteredIssuer() {
        require(issuerRegistry.isRegisteredIssuer(msg.sender), "Not a registered issuer");
        IssuerRegistry.Issuer memory issuer = issuerRegistry.getIssuer(msg.sender);
        require(issuer.isActive, "Issuer is not active");
        _;
    }

    modifier onlyCredentialHolder(uint256 _credentialId) {
        require(credentials[_credentialId].holder == msg.sender, "Not the credential holder");
        _;
    }

    modifier onlyCredentialIssuer(uint256 _credentialId) {
        require(credentials[_credentialId].issuer == msg.sender, "Not the credential issuer");
        _;
    }

    constructor(address _issuerRegistry) {
        issuerRegistry = IssuerRegistry(_issuerRegistry);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(abi.encodePacked("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
                keccak256(abi.encodePacked(DOMAIN_NAME)),
                keccak256(abi.encodePacked(DOMAIN_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    // ON-CHAIN CREDENTIAL ISSUANCE
    function issueCredential(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        string memory _ipfsHash
    ) external onlyRegisteredIssuer returns (uint256) {
        require(_holder != address(0), "Invalid holder address");
        require(bytes(_credentialType).length > 0, "Credential type cannot be empty");
        require(bytes(_data).length > 0, "Credential data cannot be empty");
        require(_expiresAt > block.timestamp, "Expiration date must be in the future");

        uint256 credentialId = nextCredentialId++;
        
        credentials[credentialId] = Credential({
            id: credentialId,
            issuer: msg.sender,
            holder: _holder,
            credentialType: _credentialType,
            data: _data,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true,
            isRevoked: false,
            ipfsHash: _ipfsHash
        });

        holderCredentials[_holder].push(credentialId);
        issuerCredentials[msg.sender].push(credentialId);
        issuerRegistry.incrementCredentialsIssued(msg.sender);

        emit CredentialIssued(credentialId, msg.sender, _holder, _credentialType);
        return credentialId;
    }

    // EIP-712 OFF-CHAIN CREDENTIAL ISSUANCE
    function issueCredentialWithSignature(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        uint256 _nonce,
        bytes calldata _signature
    ) external returns (bytes32) {
        require(_holder != address(0), "Invalid holder address");
        require(bytes(_credentialType).length > 0, "Credential type cannot be empty");
        require(_expiresAt > block.timestamp, "Expiration must be in future");
        
        require(_nonce >= offChainNonces[_holder], "Nonce already used");
        
        bytes32 digest = _buildCredentialDigest(_holder, _credentialType, _data, _expiresAt, _nonce);
        require(!usedSignatures[digest], "Signature already used");
        
        address signer = _recoverSigner(digest, _signature);
        require(issuerRegistry.isRegisteredIssuer(signer), "Signer is not a registered issuer");
        IssuerRegistry.Issuer memory issuer = issuerRegistry.getIssuer(signer);
        require(issuer.isActive, "Issuer is not active");
        
        usedSignatures[digest] = true;
        offChainNonces[_holder] = _nonce + 1;
        
        emit OffChainCredentialIssued(digest, signer, _holder, _credentialType);
        
        return digest;
    }

    function _buildCredentialDigest(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        uint256 _nonce
    ) internal view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("OffChainCredential(address holder,string credentialType,string data,uint256 expiresAt,uint256 nonce)"),
                _holder,
                keccak256(bytes(_credentialType)),
                keccak256(bytes(_data)),
                _expiresAt,
                _nonce
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _recoverSigner(bytes32 _digest, bytes calldata _signature) internal pure returns (address) {
        require(_signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(_signature.offset)
            s := calldataload(add(_signature.offset, 32))
            v := byte(0, calldataload(add(_signature.offset, 64)))
        }
        
        return ecrecover(_digest, v, r, s);
    }

    function verifyOffChainCredential(
        address _issuer,
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        uint256 _nonce,
        bytes calldata _signature
    ) external view returns (bool) {
        bytes32 digest = _buildCredentialDigest(_holder, _credentialType, _data, _expiresAt, _nonce);
        address signer = _recoverSigner(digest, _signature);
        return signer == _issuer && issuerRegistry.isRegisteredIssuer(_issuer) && !usedSignatures[digest];
    }

    // MERKLE PROOF SELECTIVE DISCLOSURE
    function createMerkleCredential(
        address _holder,
        string memory _credentialType,
        bytes32 _merkleRoot,
        uint256 _expiresAt
    ) external onlyRegisteredIssuer returns (uint256) {
        require(_holder != address(0), "Invalid holder address");
        require(_merkleRoot != bytes32(0), "Invalid merkle root");
        require(!usedMerkleroots[_merkleRoot], "Merkle root already used");
        
        uint256 credentialId = nextMerkleCredentialId++;
        
        merkleCredentials[credentialId] = MerkleCredential({
            id: credentialId,
            merkleRoot: _merkleRoot,
            issuer: msg.sender,
            holder: _holder,
            credentialType: _credentialType,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true
        });
        
        credentialMerkleRoots[_holder][credentialId] = _merkleRoot;
        holderMerkleCredentials[_holder].push(credentialId);
        usedMerkleroots[_merkleRoot] = true;
        
        emit MerkleCredentialCreated(credentialId, msg.sender, _holder, _merkleRoot);
        
        return credentialId;
    }

    function verifyMerkleProof(
        uint256 _credentialId,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external view returns (bool) {
        MerkleCredential storage cred = merkleCredentials[_credentialId];
        
        require(cred.id == _credentialId, "Credential does not exist");
        require(cred.isActive, "Credential is not active");
        require(cred.expiresAt > block.timestamp, "Credential has expired");
        
        bytes32 computedHash = _leaf;
        
        for (uint256 i = 0; i < _proof.length; i++) {
            if (computedHash < _proof[i]) {
                computedHash = keccak256(abi.encodePacked(computedHash, _proof[i]));
            } else {
                computedHash = keccak256(abi.encodePacked(_proof[i], computedHash));
            }
        }
        
        return computedHash == cred.merkleRoot;
    }

    function getMerkleRoot(uint256 _credentialId, address _holder) external view returns (bytes32) {
        return credentialMerkleRoots[_holder][_credentialId];
    }

    function verifySelectiveDisclosure(
        uint256 _credentialId,
        bytes32 _attributeHash,
        uint256 _index,
        bytes32[] calldata _proof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_attributeHash, _index));
        
        MerkleCredential storage cred = merkleCredentials[_credentialId];
        require(cred.id == _credentialId, "Credential does not exist");
        require(cred.isActive, "Credential is not active");
        
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < _proof.length; i++) {
            if (computedHash < _proof[i]) {
                computedHash = keccak256(abi.encodePacked(computedHash, _proof[i]));
            } else {
                computedHash = keccak256(abi.encodePacked(_proof[i], computedHash));
            }
        }
        
        return computedHash == cred.merkleRoot;
    }

    // BASIC OPERATIONS
    function revokeCredential(uint256 _credentialId) external onlyCredentialIssuer(_credentialId) {
        require(credentials[_credentialId].isActive, "Credential is already inactive");
        require(!credentials[_credentialId].isRevoked, "Credential is already revoked");

        credentials[_credentialId].isRevoked = true;
        credentials[_credentialId].isActive = false;

        emit CredentialRevoked(_credentialId, msg.sender);
    }

    function requestVerification(
        address _holder,
        uint256 _credentialId,
        string memory _message
    ) external returns (uint256) {
        require(credentials[_credentialId].holder == _holder, "Invalid credential holder");
        require(credentials[_credentialId].isActive, "Credential is not active");
        require(!credentials[_credentialId].isRevoked, "Credential is revoked");
        require(credentials[_credentialId].expiresAt > block.timestamp, "Credential has expired");

        uint256 requestId = nextRequestId++;
        
        verificationRequests[requestId] = VerificationRequest({
            id: requestId,
            verifier: msg.sender,
            holder: _holder,
            credentialId: _credentialId,
            message: _message,
            isApproved: false,
            isProcessed: false,
            requestedAt: block.timestamp,
            processedAt: 0
        });

        verifierRequests[msg.sender].push(requestId);
        holderRequests[_holder].push(requestId);

        emit VerificationRequested(requestId, msg.sender, _holder, _credentialId);
        return requestId;
    }

    function processVerificationRequest(uint256 _requestId, bool _approve) external {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(request.holder == msg.sender, "Not the credential holder");
        require(!request.isProcessed, "Request already processed");

        request.isApproved = _approve;
        request.isProcessed = true;
        request.processedAt = block.timestamp;

        emit VerificationProcessed(_requestId, _approve, msg.sender);
    }

    // VIEW FUNCTIONS
    function getCredential(uint256 _credentialId) external view returns (Credential memory) {
        require(credentials[_credentialId].id != 0, "Credential does not exist");
        return credentials[_credentialId];
    }

    function getHolderCredentials(address _holder) external view returns (uint256[] memory) {
        return holderCredentials[_holder];
    }

    function getIssuerCredentials(address _issuer) external view returns (uint256[] memory) {
        return issuerCredentials[_issuer];
    }

    function getVerificationRequest(uint256 _requestId) external view returns (VerificationRequest memory) {
        require(verificationRequests[_requestId].id != 0, "Request does not exist");
        return verificationRequests[_requestId];
    }

    function getVerifierRequests(address _verifier) external view returns (uint256[] memory) {
        return verifierRequests[_verifier];
    }

    function getHolderRequests(address _holder) external view returns (uint256[] memory) {
        return holderRequests[_holder];
    }

    function isCredentialValid(uint256 _credentialId) external view returns (bool) {
        Credential memory cred = credentials[_credentialId];
        return cred.isActive && !cred.isRevoked && cred.expiresAt > block.timestamp;
    }

    function getTotalCredentials() external view returns (uint256) {
        return nextCredentialId - 1;
    }

    function getTotalRequests() external view returns (uint256) {
        return nextRequestId - 1;
    }

    function getOffChainNonce(address _holder) external view returns (uint256) {
        return offChainNonces[_holder];
    }

    function isSignatureUsed(bytes32 _digest) external view returns (bool) {
        return usedSignatures[_digest];
    }

    function getMerkleCredential(uint256 _credentialId) external view returns (MerkleCredential memory) {
        return merkleCredentials[_credentialId];
    }

    function getHolderMerkleCredentials(address _holder) external view returns (uint256[] memory) {
        return holderMerkleCredentials[_holder];
    }

    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    function getCredentialTypeHash() external pure returns (bytes32) {
        return keccak256(abi.encodePacked("OffChainCredential(address holder,string credentialType,string data,uint256 expiresAt,uint256 nonce)"));
    }
}
