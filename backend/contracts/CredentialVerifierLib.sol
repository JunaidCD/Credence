// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialVerifier
 * @dev Advanced credential verification with zk-proofs simulation
 */
contract CredentialVerifier {
    // Verification storage
    mapping(bytes32 => VerificationProof) public verificationProofs;
    mapping(address => bytes32[]) public holderProofs;
    mapping(address => bytes32[]) public verifierProofs;
    
    // Credential verification status
    mapping(uint256 => mapping(address => bool)) public credentialVerified;
    mapping(uint256 => mapping(address => uint256)) public verificationTimestamps;
    
    // Verification requests
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(address => bytes32[]) public verificationRequestIds;
    
    // Structs
    struct VerificationProof {
        bytes32 proofHash;
        address verifier;
        uint256 credentialId;
        uint256 timestamp;
        bool isValid;
        bytes publicSignals;
        string verificationType;
    }
    
    struct VerificationRequest {
        bytes32 requestId;
        address requester;
        address holder;
        uint256 credentialId;
        string metadata;
        uint256 timestamp;
        bool isProcessed;
        bool isApproved;
    }
    
    // Events
    event ProofGenerated(
        bytes32 indexed proofHash,
        address indexed verifier,
        uint256 indexed credentialId,
        string verificationType
    );
    event ProofVerified(
        bytes32 indexed proofHash,
        address indexed holder,
        bool isValid
    );
    event VerificationRequested(
        bytes32 indexed requestId,
        address indexed requester,
        address indexed holder,
        uint256 credentialId
    );
    event VerificationProcessed(
        bytes32 indexed requestId,
        bool approved,
        address indexed processor
    );
    event CredentialStatusChanged(
        uint256 indexed credentialId,
        address indexed holder,
        bool isVerified
    );

    // Constants
    uint256 public constant PROOF_VALIDITY_PERIOD = 365 days;
    uint256 public constant MAX_PUBLIC_SIGNALS_SIZE = 1024;
    
    // Generate verification proof
    function generateProof(
        uint256 _credentialId,
        string memory _verificationType,
        bytes memory _publicSignals
    ) external returns (bytes32) {
        require(bytes(_verificationType).length > 0, "CredentialVerifier: verification type required");
        require(_publicSignals.length <= MAX_PUBLIC_SIGNALS_SIZE, "CredentialVerifier: signals too large");
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            _credentialId,
            msg.sender,
            block.timestamp,
            _verificationType,
            _publicSignals
        ));
        
        verificationProofs[proofHash] = VerificationProof({
            proofHash: proofHash,
            verifier: msg.sender,
            credentialId: _credentialId,
            timestamp: block.timestamp,
            isValid: true,
            publicSignals: _publicSignals,
            verificationType: _verificationType
        });
        
        holderProofs[msg.sender].push(proofHash);
        
        emit ProofGenerated(proofHash, msg.sender, _credentialId, _verificationType);
        
        return proofHash;
    }

    // Verify proof
    function verifyProof(bytes32 _proofHash) external returns (bool) {
        VerificationProof storage proof = verificationProofs[_proofHash];
        
        require(proof.proofHash == _proofHash, "CredentialVerifier: proof does not exist");
        require(proof.isValid, "CredentialVerifier: proof is invalid");
        require(
            block.timestamp - proof.timestamp <= PROOF_VALIDITY_PERIOD,
            "CredentialVerifier: proof expired"
        );
        
        credentialVerified[proof.credentialId][msg.sender] = true;
        verificationTimestamps[proof.credentialId][msg.sender] = block.timestamp;
        
        emit ProofVerified(_proofHash, msg.sender, true);
        emit CredentialStatusChanged(proof.credentialId, msg.sender, true);
        
        return true;
    }

    // Invalidate proof
    function invalidateProof(bytes32 _proofHash) external {
        VerificationProof storage proof = verificationProofs[_proofHash];
        
        require(proof.verifier == msg.sender, "CredentialVerifier: only proof creator can invalidate");
        
        proof.isValid = false;
        
        emit ProofVerified(_proofHash, msg.sender, false);
    }

    // Request verification
    function requestVerification(
        address _holder,
        uint256 _credentialId,
        string memory _metadata
    ) external returns (bytes32) {
        require(_holder != address(0), "CredentialVerifier: invalid holder address");
        
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            _holder,
            _credentialId,
            block.timestamp,
            _metadata
        ));
        
        verificationRequests[requestId] = VerificationRequest({
            requestId: requestId,
            requester: msg.sender,
            holder: _holder,
            credentialId: _credentialId,
            metadata: _metadata,
            timestamp: block.timestamp,
            isProcessed: false,
            isApproved: false
        });
        
        verificationRequestIds[_holder].push(requestId);
        
        emit VerificationRequested(requestId, msg.sender, _holder, _credentialId);
        
        return requestId;
    }

    // Process verification request
    function processVerificationRequest(bytes32 _requestId, bool _approve) external {
        VerificationRequest storage request = verificationRequests[_requestId];
        
        require(request.holder == msg.sender, "CredentialVerifier: only holder can process");
        require(!request.isProcessed, "CredentialVerifier: request already processed");
        
        request.isProcessed = true;
        request.isApproved = _approve;
        
        if (_approve) {
            credentialVerified[request.credentialId][request.requester] = true;
            verificationTimestamps[request.credentialId][request.requester] = block.timestamp;
        }
        
        emit VerificationProcessed(_requestId, _approve, msg.sender);
        emit CredentialStatusChanged(request.credentialId, request.requester, _approve);
    }

    // Get proof details
    function getProof(bytes32 _proofHash) external view returns (VerificationProof memory) {
        return verificationProofs[_proofHash];
    }

    // Get holder proofs
    function getHolderProofs(address _holder) external view returns (bytes32[] memory) {
        return holderProofs[_holder];
    }

    // Get verifier proofs
    function getVerifierProofs(address _verifier) external view returns (bytes32[] memory) {
        return verifierProofs[_verifier];
    }

    // Get verification request
    function getVerificationRequest(bytes32 _requestId) external view returns (VerificationRequest memory) {
        return verificationRequests[_requestId];
    }

    // Check if credential is verified for holder
    function isCredentialVerified(uint256 _credentialId, address _verifier) 
        external view returns (bool) {
        return credentialVerified[_credentialId][_verifier];
    }

    // Get verification timestamp
    function getVerificationTimestamp(uint256 _credentialId, address _verifier) 
        external view returns (uint256) {
        return verificationTimestamps[_credentialId][_verifier];
    }

    // Batch verify
    function batchVerify(bytes32[] calldata _proofHashes) external returns (bool[] memory) {
        bool[] memory results = new bool[](_proofHashes.length);
        
        for (uint256 i = 0; i < _proofHashes.length; i++) {
            VerificationProof storage proof = verificationProofs[_proofHashes[i]];
            
            if (proof.proofHash == _proofHashes[i] && 
                proof.isValid && 
                (block.timestamp - proof.timestamp <= PROOF_VALIDITY_PERIOD)) {
                results[i] = true;
                credentialVerified[proof.credentialId][msg.sender] = true;
                verificationTimestamps[proof.credentialId][msg.sender] = block.timestamp;
            } else {
                results[i] = false;
            }
        }
        
        return results;
    }

    // Get proof count for holder
    function getHolderProofCount(address _holder) external view returns (uint256) {
        return holderProofs[_holder].length;
    }

    // Get request count for holder
    function getHolderRequestCount(address _holder) external view returns (uint256) {
        return verificationRequestIds[_holder].length;
    }

    // Check proof validity
    function isProofValid(bytes32 _proofHash) external view returns (bool) {
        VerificationProof memory proof = verificationProofs[_proofHash];
        return proof.isValid && (block.timestamp - proof.timestamp <= PROOF_VALIDITY_PERIOD);
    }

    // Get proof age
    function getProofAge(bytes32 _proofHash) external view returns (uint256) {
        VerificationProof memory proof = verificationProofs[_proofHash];
        require(proof.proofHash == _proofHash, "CredentialVerifier: proof does not exist");
        return block.timestamp - proof.timestamp;
    }

    // Revoke all verifications for credential
    function revokeVerifications(uint256 _credentialId, address[] calldata _verifiers) external {
        for (uint256 i = 0; i < _verifiers.length; i++) {
            credentialVerified[_credentialId][_verifiers[i]] = false;
            emit CredentialStatusChanged(_credentialId, _verifiers[i], false);
        }
    }

    // Clean up expired proofs
    function cleanupExpiredProofs(address _holder) external returns (uint256 cleaned) {
        bytes32[] storage proofs = holderProofs[_holder];
        uint256 count = proofs.length;
        
        for (uint256 i = 0; i < count; i++) {
            bytes32 proofHash = proofs[i];
            VerificationProof storage proof = verificationProofs[proofHash];
            
            if (block.timestamp - proof.timestamp > PROOF_VALIDITY_PERIOD) {
                proof.isValid = false;
                cleaned++;
            }
        }
    }
}
