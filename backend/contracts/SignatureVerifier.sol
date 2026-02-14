// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SignatureVerifier
 * @dev Utility contract for verifying cryptographic signatures
 */
contract SignatureVerifier {
    // Mapping of verified signers
    mapping(address => bool) public verifiedSigners;
    mapping(address => uint256) public signerPermissions;
    mapping(bytes32 => bool) public usedSignatures;

    // Events
    event SignerAdded(address indexed signer, uint256 permissionLevel);
    event SignerRemoved(address indexed signer);
    event SignatureVerified(bytes32 indexed messageHash, address indexed signer);
    event PermissionUpdated(address indexed signer, uint256 newLevel);

    // Constants for permission levels
    uint256 public constant PERMISSION_NONE = 0;
    uint256 public constant PERMISSION_SIGN = 1;
    uint256 public constant PERMISSION_VERIFY = 2;
    uint256 public constant PERMISSION_ADMIN = 3;

    // Modifier
    modifier onlyVerifiedSigner() {
        require(verifiedSigners[msg.sender], "SignatureVerifier: caller is not a verified signer");
        _;
    }

    modifier onlyAdmin() {
        require(verifiedSigners[msg.sender] && signerPermissions[msg.sender] == PERMISSION_ADMIN, 
            "SignatureVerifier: caller does not have admin permission");
        _;
    }

    // Add a new signer
    function addSigner(address _signer, uint256 _permissionLevel) external onlyAdmin {
        require(_signer != address(0), "SignatureVerifier: cannot add zero address");
        require(!verifiedSigners[_signer], "SignatureVerifier: signer already exists");
        require(_permissionLevel <= PERMISSION_ADMIN, "SignatureVerifier: invalid permission level");

        verifiedSigners[_signer] = true;
        signerPermissions[_signer] = _permissionLevel;
        emit SignerAdded(_signer, _permissionLevel);
    }

    // Remove a signer
    function removeSigner(address _signer) external onlyAdmin {
        require(verifiedSigners[_signer], "SignatureVerifier: signer does not exist");
        
        verifiedSigners[_signer] = false;
        signerPermissions[_signer] = PERMISSION_NONE;
        emit SignerRemoved(_signer);
    }

    // Update signer permission
    function updatePermission(address _signer, uint256 _newLevel) external onlyAdmin {
        require(verifiedSigners[_signer], "SignatureVerifier: signer does not exist");
        require(_newLevel <= PERMISSION_ADMIN, "SignatureVerifier: invalid permission level");

        signerPermissions[_signer] = _newLevel;
        emit PermissionUpdated(_signer, _newLevel);
    }

    // Internal function to verify signature
    function _verifySignatureInternal(
        bytes32 _messageHash,
        bytes calldata _signature,
        address _signer
    ) internal view returns (bool) {
        require(verifiedSigners[_signer], "SignatureVerifier: signer is not verified");
        require(signerPermissions[_signer] >= PERMISSION_SIGN, "SignatureVerifier: signer cannot sign");
        require(!usedSignatures[keccak256(abi.encodePacked(_messageHash, _signature))], 
            "SignatureVerifier: signature already used");

        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
        
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        
        address recoveredSigner = ecrecover(prefixedHash, v, r, s);
        return recoveredSigner == _signer;
    }

    // Verify a signature
    function verifySignature(
        bytes32 _messageHash,
        bytes calldata _signature,
        address _signer
    ) external view returns (bool) {
        return _verifySignatureInternal(_messageHash, _signature, _signer);
    }

    // Verify with ecrecover directly
    function verifySignatureDirect(
        bytes32 _messageHash,
        bytes calldata _signature
    ) external pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        bytes32 prefixedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
        return ecrecover(prefixedHash, v, r, s);
    }

    // Mark signature as used
    function markSignatureUsed(bytes32 _messageHash, bytes calldata _signature) external {
        bytes32 signatureHash = keccak256(abi.encodePacked(_messageHash, _signature));
        usedSignatures[signatureHash] = true;
    }

    // Check if signature was used
    function isSignatureUsed(bytes32 _messageHash, bytes calldata _signature) external view returns (bool) {
        bytes32 signatureHash = keccak256(abi.encodePacked(_messageHash, _signature));
        return usedSignatures[signatureHash];
    }

    // Batch verify multiple signatures
    function batchVerify(
        bytes32[] calldata _messageHashes,
        bytes[] calldata _signatures,
        address[] calldata _signers
    ) external view returns (bool[] memory) {
        require(_messageHashes.length == _signatures.length, "SignatureVerifier: arrays length mismatch");
        require(_signatures.length == _signers.length, "SignatureVerifier: arrays length mismatch");

        bool[] memory results = new bool[](_messageHashes.length);
        
        for (uint256 i = 0; i < _messageHashes.length; i++) {
            results[i] = _verifySignatureInternal(_messageHashes[i], _signatures[i], _signers[i]);
        }
        
        return results;
    }

    // Get signer permission level
    function getSignerPermission(address _signer) external view returns (uint256) {
        return signerPermissions[_signer];
    }

    // Check if address is verified signer
    function isVerified(address _signer) external view returns (bool) {
        return verifiedSigners[_signer];
    }

    // Internal function to split signature
    function _splitSignature(bytes calldata _signature) internal pure returns (
        bytes32 r,
        bytes32 s,
        uint8 v
    ) {
        require(_signature.length == 65, "SignatureVerifier: invalid signature length");
        
        assembly {
            r := calldataload(_signature.offset)
            s := calldataload(add(_signature.offset, 32))
            v := byte(0, calldataload(add(_signature.offset, 64)))
        }
    }

    // Domain separator for EIP-712
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("SignatureVerifier"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    // Hash typed data (EIP-712)
    function hashTypedData(bytes32 _structHash) external view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), _structHash));
    }
}
