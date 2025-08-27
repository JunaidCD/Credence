// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IssuerRegistry.sol";

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

    IssuerRegistry public immutable issuerRegistry;
    
    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public holderCredentials;
    mapping(address => uint256[]) public issuerCredentials;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    mapping(address => uint256[]) public verifierRequests;
    mapping(address => uint256[]) public holderRequests;
    
    uint256 public nextCredentialId = 1;
    uint256 public nextRequestId = 1;
    
    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed issuer,
        address indexed holder,
        string credentialType
    );
    
    event CredentialRevoked(uint256 indexed credentialId, address indexed issuer);
    
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed verifier,
        address indexed holder,
        uint256 credentialId
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
            ipfsHash: _ipfsHash
        });

        credentials[credentialId] = newCredential;
        holderCredentials[_holder].push(credentialId);
        issuerCredentials[msg.sender].push(credentialId);

        // Update issuer's credential count
        issuerRegistry.incrementCredentialsIssued(msg.sender);

        emit CredentialIssued(credentialId, msg.sender, _holder, _credentialType);
        return credentialId;
    }

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
        
        VerificationRequest memory newRequest = VerificationRequest({
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

        verificationRequests[requestId] = newRequest;
        verifierRequests[msg.sender].push(requestId);
        holderRequests[_holder].push(requestId);

        emit VerificationRequested(requestId, msg.sender, _holder, _credentialId);
        return requestId;
    }

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
}
