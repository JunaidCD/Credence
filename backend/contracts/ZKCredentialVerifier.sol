// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ZKCredentialVerifier
 * @dev Zero-Knowledge Proof verifier for credentials
 * This contract demonstrates ZK proof verification for credentials
 * without revealing the actual credential data
 */
contract ZKCredentialVerifier {
    // Verification state
    mapping(bytes32 => ZKProof) public proofs;
    mapping(address => bytes32[]) public holderProofs;
    mapping(address => uint256) public verificationCounts;
    
    // Circuit verification keys (mock addresses for demonstration)
    address public verifierKey;
    uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    // Struct for ZK Proof
    struct ZKProof {
        bytes32 proofId;
        address holder;
        bytes32 credentialHash;
        uint256[2] a;
        uint256[2] b;
        uint256[2] c;
        uint256 timestamp;
        bool isValid;
        bytes publicSignals;
    }
    
    // Events
    event ZKProofSubmitted(
        bytes32 indexed proofId,
        address indexed holder,
        bytes32 credentialHash
    );
    event ZKProofVerified(
        bytes32 indexed proofId,
        address indexed verifier,
        bool isValid
    );
    event VerifierKeyUpdated(
        address indexed oldKey,
        address indexed newKey
    );

    // Constructor
    constructor() {
        verifierKey = msg.sender;
    }

    /**
     * @dev Submit a zero-knowledge proof for a credential
     */
    function submitProof(
        address _holder,
        bytes32 _credentialHash,
        uint256[2] memory _a,
        uint256[2] memory _b,
        uint256[2] memory _c,
        bytes memory _publicSignals
    ) external returns (bytes32) {
        require(_holder != address(0), "ZK: invalid holder address");
        require(_credentialHash != bytes32(0), "ZK: invalid credential hash");
        
        bytes32 proofId = keccak256(abi.encodePacked(
            _holder,
            _credentialHash,
            block.timestamp,
            _a[0],
            _b[0],
            _c[0]
        ));
        
        proofs[proofId] = ZKProof({
            proofId: proofId,
            holder: _holder,
            credentialHash: _credentialHash,
            a: _a,
            b: _b,
            c: _c,
            timestamp: block.timestamp,
            isValid: false,
            publicSignals: _publicSignals
        });
        
        holderProofs[_holder].push(proofId);
        
        emit ZKProofSubmitted(proofId, _holder, _credentialHash);
        
        return proofId;
    }

    /**
     * @dev Verify a zero-knowledge proof and update count
     */
    function verifyProofAndCount(bytes32 _proofId) public returns (bool) {
        ZKProof storage proof = proofs[_proofId];
        
        // Check if proof exists by verifying holder is not zero address
        require(proof.holder != address(0), "ZK: proof does not exist");
        
        bool isValid = _verifyZKProof(proof);
        
        proof.isValid = isValid;
        
        if (isValid) {
            verificationCounts[proof.holder]++;
        }
        
        emit ZKProofVerified(_proofId, msg.sender, isValid);
        
        return isValid;
    }

    /**
     * @dev Verify a zero-knowledge proof (view function for reading)
     */
    function verifyProof(bytes32 _proofId) public view returns (bool) {
        ZKProof storage proof = proofs[_proofId];
        
        // Check if proof exists by verifying holder is not zero address
        require(proof.holder != address(0), "ZK: proof does not exist");
        
        bool isValid = _verifyZKProof(proof);
        
        return isValid;
    }

    /**
     * @dev Internal ZK proof verification
     */
    function _verifyZKProof(ZKProof memory _proof) internal view returns (bool) {
        // Basic sanity checks - verify field elements are valid
        if (_proof.a[0] >= FIELD_SIZE || _proof.a[1] >= FIELD_SIZE) {
            return false;
        }
        
        if (_proof.b[0] >= FIELD_SIZE || _proof.b[1] >= FIELD_SIZE) {
            return false;
        }
        
        if (_proof.c[0] >= FIELD_SIZE || _proof.c[1] >= FIELD_SIZE) {
            return false;
        }
        
        // Proof is valid (mock for demo)
        return true;
    }

    /**
     * @dev Verify credential ownership without revealing data
     */
    function verifyCredentialOwnership(
        address _holder,
        bytes32 _proofId
    ) external view returns (bool) {
        ZKProof memory proof = proofs[_proofId];
        
        // Check if proof exists and belongs to the holder
        // Since verifyProof is view-only, we verify the proof on-chain here
        if (proof.holder != _holder || proof.holder == address(0)) {
            return false;
        }
        
        // Verify the proof directly
        return _verifyZKProof(proof);
    }

    /**
     * @dev Verify criteria for a proof
     */
    function verifyCriteria(
        bytes32 _proofId,
        bytes32 _credentialHash
    ) external view returns (bool) {
        ZKProof memory proof = proofs[_proofId];
        
        if (proof.credentialHash != _credentialHash) {
            return false;
        }
        
        // Verify the proof directly
        return _verifyZKProof(proof);
    }

    /**
     * @dev Get proof details
     */
    function getProof(bytes32 _proofId) external view returns (ZKProof memory) {
        return proofs[_proofId];
    }

    /**
     * @dev Get holder's proofs
     */
    function getHolderProofs(address _holder) external view returns (bytes32[] memory) {
        return holderProofs[_holder];
    }

    /**
     * @dev Get verification count for holder
     */
    function getVerificationCount(address _holder) external view returns (uint256) {
        return verificationCounts[_holder];
    }

    /**
     * @dev Update verifier key
     */
    function updateVerifierKey(address _newKey) external {
        require(msg.sender == verifierKey, "ZK: only verifier can update");
        require(_newKey != address(0), "ZK: invalid key");
        
        address oldKey = verifierKey;
        verifierKey = _newKey;
        
        emit VerifierKeyUpdated(oldKey, _newKey);
    }

    /**
     * @dev Batch verify multiple proofs
     */
    function batchVerify(bytes32[] calldata _proofIds) external returns (bool[] memory) {
        bool[] memory results = new bool[](_proofIds.length);
        
        for (uint256 i = 0; i < _proofIds.length; i++) {
            ZKProof storage proof = proofs[_proofIds[i]];
            
            // Check if proof exists by verifying holder is not zero
            if (proof.holder != address(0)) {
                bool isValid = _verifyZKProof(proof);
                proof.isValid = isValid;
                
                if (isValid) {
                    verificationCounts[proof.holder]++;
                }
                
                emit ZKProofVerified(_proofIds[i], msg.sender, isValid);
                results[i] = isValid;
            } else {
                results[i] = false;
            }
        }
        
        return results;
    }

    /**
     * @dev Create a credential commitment
     */
    function createCommitment(bytes32 _dataHash, bytes32 _secret) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_dataHash, _secret));
    }
}
