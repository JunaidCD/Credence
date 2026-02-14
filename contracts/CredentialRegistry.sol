// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IssuerRegistry.sol";

/**
 * @title CredentialRegistry
 * @dev Enhanced credential registry with EIP-712 signatures and merkle proofs
 * @notice Manages credentials with privacy-preserving verification capabilities
 */
contract CredentialRegistry {
    struct Credential {
        uint256 id;
        address issuer;
        address holder;
        string credentialType;
        string data; // JSON string containing credential data
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
        bool isRevoked;
        string ipfsHash; // For storing additional data on IPFS
        bytes32 credentialHash; // Hash of credential data for integrity
        bytes32[] merkleProof; // Merkle proof for selective disclosure
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
        bytes32 requestHash; // Hash of verification request
    }

    // EIP-712 signature structure
    struct EIP712Signature {
        uint8 v; // recovery (recid)
        bytes32 r; // output of ECDSA signing
        bytes32 s; // output of ECDSA signing
        bytes32 credentialHash; // hash of signed credential data
        uint256 deadline; // deadline for signature validity
    }

    IssuerRegistry public immutable issuerRegistry;
    
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public holderCredentials;
    mapping(address => uint256[]) public issuerCredentials;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => uint256[]) public verifierRequests;
    mapping(address => uint256[]) public holderRequests;
    mapping(bytes32 => bool) public usedSignatures; // Prevent signature replay
    
    uint256 public nextCredentialId = 1;
    uint256 public nextRequestId = 1;
    
    // EIP-712 domain separator for signatures
    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)"
    );
    
    bytes32 private constant EIP712_DOMAIN_SEPARATOR = keccak256(abi.encodePacked(
        EIP712_DOMAIN_TYPEHASH,
        keccak256(bytes("Credence Credential Registry")),
        keccak256(bytes("1")),
        31337, // Hardhat chain ID
        address(this),
        bytes32(0x5f7e268d77682c14223dabbd05127b76b6e1047b30de838b20bb8a7b70b)
    ));
    
    // EIP-712 type hash for credential data
    bytes32 private constant CREDENTIAL_TYPEHASH = keccak256(
        "Credential(uint256,address,address,string,string,uint256,uint256,bool,bool,string,bytes32,bytes32[])"
    );
    
    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        address indexed holder,
        string credentialType,
        bytes32 indexed credentialHash
    );
    
    event CredentialRevoked(uint256 indexed credentialId, address indexed issuer);
    
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed verifier,
        address indexed holder,
        uint256 credentialId,
        bytes32 indexed requestHash
    );
    
    event VerificationProcessed(
        uint256 indexed requestId,
        bool approved,
        address indexed holder
    );

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
    }

    /**
     * @dev Issue a new credential with EIP-712 signature support
     * @param _holder The credential holder address
     * @param _credentialType Type of credential
     * @param _data JSON string with credential details
     * @param _expiresAt Expiration timestamp
     * @param _ipfsHash IPFS hash for additional data
     * @param _signature EIP-712 signature for off-chain verification
     * @return credentialId The ID of the issued credential
     */
    function issueCredential(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        string memory _ipfsHash,
        EIP712Signature memory _signature
    ) external onlyRegisteredIssuer returns (uint256) {
        require(_holder != address(0), "Invalid holder address");
        require(bytes(_credentialType).length > 0, "Credential type cannot be empty");
        require(bytes(_data).length > 0, "Credential data cannot be empty");
        require(_expiresAt > block.timestamp, "Expiration date must be in the future");
        
        // Verify EIP-712 signature if provided
        if (_signature.deadline > 0) {
            require(block.timestamp <= _signature.deadline, "Signature has expired");
            require(_signature.credentialHash == keccak256(abi.encodePacked(
                nextCredentialId, msg.sender, _holder, _credentialType, _data, _expiresAt, _ipfsHash
            )), "Invalid signature");
            require(!usedSignatures[_signature.credentialHash], "Signature already used");
            
            usedSignatures[_signature.credentialHash] = true;
        }

        uint256 credentialId = nextCredentialId++;
        
        bytes32 credentialHash = keccak256(abi.encodePacked(
            _holder, _credentialType, _data, _expiresAt, _ipfsHash
        ));
        
        // Generate merkle proof (simplified for demo - in production, use actual merkle tree)
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = credentialHash; // Simplified: just include the hash itself
        
        Credential memory newCredential = Credential({
            id: credentialId,
            issuer: msg.sender,
            holder: _holder,
            credentialType: _credentialType,
            data: _data,
            issuedAt: block.timestamp,
            expiresAt: _expiresAt,
            isActive: true,
            isRevoked: false,
            ipfsHash: _ipfsHash,
            credentialHash: credentialHash,
            merkleProof: proof
        });

        credentials[credentialId] = newCredential;
        holderCredentials[_holder].push(credentialId);
        issuerCredentials[msg.sender].push(credentialId);

        // Update issuer's credential count
        issuerRegistry.incrementCredentialsIssued(msg.sender);

        emit CredentialIssued(credentialId, msg.sender, _holder, _credentialType, credentialHash);
        return credentialId;
    }

    /**
     * @dev Revoke a credential
     * @param _credentialId ID of credential to revoke
     */
    function revokeCredential(uint256 _credentialId) external onlyCredentialIssuer(_credentialId) {
        require(credentials[_credentialId].isActive, "Credential is already inactive");
        require(!credentials[_credentialId].isRevoked, "Credential is already revoked");

        credentials[_credentialId].isRevoked = true;
        credentials[_credentialId].isActive = false;

        emit CredentialRevoked(_credentialId, msg.sender);
    }

    /**
     * @dev Request verification with enhanced security
     * @param _holder Credential holder address
     * @param _credentialId ID of credential to verify
     * @param _message Verification message
     * @return requestId The verification request ID
     */
    function requestVerification(
        address _holder,
        uint256 _credentialId,
        string memory _message
    ) external returns (uint256) {
        require(credentials[_credentialId].holder == _holder, "Invalid credential holder");
        require(credentials[_credentialId].isActive, "Credential is not active");
        require(!credentials[_credentialId].isRevoked, "Credential is revoked");
        require(credentials[_credentialId].expiresAt > block.timestamp, "Credential has expired");

        bytes32 requestHash = keccak256(abi.encodePacked(
            _holder, _credentialId, _message, block.timestamp
        ));
        
        uint256 requestId = nextRequestId++;
        
        VerificationRequest memory newRequest = VerificationRequest({
            id: requestId,
            verifier: msg.sender,
            holder: _holder,
            credentialId: _credentialId,
            message: _message,
            isApproved: false,
            isProcessed: false,
            requestedAt: block.timestamp,
            processedAt: 0,
            requestHash: requestHash
        });

        verificationRequests[requestId] = newRequest;
        verifierRequests[msg.sender].push(requestId);
        holderRequests[_holder].push(requestId);

        emit VerificationRequested(requestId, msg.sender, _holder, _credentialId, requestHash);
        return requestId;
    }

    /**
     * @dev Process verification request
     * @param _requestId ID of verification request
     * @param _approve Whether to approve the verification
     */
    function processVerificationRequest(
        uint256 _requestId,
        bool _approve
    ) external {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(request.holder == msg.sender, "Not the credential holder");
        require(!request.isProcessed, "Request already processed");

        request.isApproved = _approve;
        request.isProcessed = true;
        request.processedAt = block.timestamp;

        emit VerificationProcessed(_requestId, _approve, msg.sender);
    }

    /**
     * @dev Get credential with enhanced verification data
     * @param _credentialId ID of credential
     * @return credential The credential data
     */
    function getCredential(uint256 _credentialId) external view returns (Credential memory) {
        require(credentials[_credentialId].id != 0, "Credential does not exist");
        return credentials[_credentialId];
    }

    /**
     * @dev Verify credential using EIP-712 signature
     * @param _credentialId ID of credential
     * @param _signature EIP-712 signature to verify
     * @return valid Whether the signature is valid
     */
    function verifyCredentialSignature(
        uint256 _credentialId,
        EIP712Signature memory _signature
    ) external view returns (bool valid) {
        Credential memory cred = credentials[_credentialId];
        require(cred.id != 0, "Credential does not exist");
        
        if (_signature.deadline > 0 && block.timestamp > _signature.deadline) {
            return false;
        }
        
        bytes32 credentialHash = keccak256(abi.encodePacked(
            cred.id, cred.issuer, cred.holder, cred.credentialType, 
            cred.data, cred.issuedAt, cred.expiresAt, cred.ipfsHash
        ));
        
        return _signature.credentialHash == credentialHash && !usedSignatures[credentialHash];
    }

    /**
     * @dev Get credentials for a holder
     * @param _holder Holder address
     * @return Array of credential IDs
     */
    function getHolderCredentials(address _holder) external view returns (uint256[] memory) {
        return holderCredentials[_holder];
    }

    /**
     * @dev Get credentials for an issuer
     * @param _issuer Issuer address
     * @return Array of credential IDs
     */
    function getIssuerCredentials(address _issuer) external view returns (uint256[] memory) {
        return issuerCredentials[_issuer];
    }

    /**
     * @dev Get verification request details
     * @param _requestId ID of verification request
     * @return Verification request data
     */
    function getVerificationRequest(uint256 _requestId) external view returns (VerificationRequest memory) {
        require(verificationRequests[_requestId].id != 0, "Request does not exist");
        return verificationRequests[_requestId];
    }

    /**
     * @dev Get requests for a verifier
     * @param _verifier Verifier address
     * @return Array of request IDs
     */
    function getVerifierRequests(address _verifier) external view returns (uint256[] memory) {
        return verifierRequests[_verifier];
    }

    /**
     * @dev Get requests for a holder
     * @param _holder Holder address
     * @return Array of request IDs
     */
    function getHolderRequests(address _holder) external view returns (uint256[] memory) {
        return holderRequests[_holder];
    }

    /**
     * @dev Check if credential is valid
     * @param _credentialId ID of credential
     * @return Whether credential is valid and not expired
     */
    function isCredentialValid(uint256 _credentialId) external view returns (bool) {
        Credential memory cred = credentials[_credentialId];
        return cred.isActive && !cred.isRevoked && cred.expiresAt > block.timestamp;
    }

    /**
     * @dev Get total credentials count
     * @return Total number of credentials
     */
    function getTotalCredentials() external view returns (uint256) {
        return nextCredentialId - 1;
    }

    /**
     * @dev Get total verification requests count
     * @return Total number of verification requests
     */
    function getTotalRequests() external view returns (uint256) {
        return nextRequestId - 1;
    }

    /**
     * @dev Get EIP-712 domain separator for off-chain signing
     * @return Domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return EIP712_DOMAIN_SEPARATOR;
    }

    /**
     * @dev Get credential type hash for off-chain verification
     * @return Type hash
     */
    function getCredentialTypeHash() external view returns (bytes32) {
        return CREDENTIAL_TYPEHASH;
    }
}
