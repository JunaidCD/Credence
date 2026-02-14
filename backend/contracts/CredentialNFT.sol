// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialNFT
 * @dev NFT-based credential representation
 */
contract CredentialNFT {
    // Token information
    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256[]) private _holderTokens;
    mapping(uint256 => address) private _tokenOwners;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    
    // Token counters
    uint256 private _totalSupply;
    uint256 private _nextTokenId = 1;
    
    // Token data
    mapping(uint256 => uint256) public credentialIds;
    mapping(uint256 => uint256) public issuedAt;
    mapping(uint256 => uint256) public expiresAt;
    mapping(uint256 => bool) public isRevoked;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event TokenURIUpdated(uint256 indexed tokenId, string newTokenURI);
    event CredentialNFTMinted(address indexed to, uint256 indexed tokenId, uint256 credentialId);
    event CredentialNFTBurned(uint256 indexed tokenId);

    // Constants
    uint256 public constant MAX_SUPPLY = 100000;
    
    // Modifier
    modifier exists(uint256 tokenId) {
        require(_tokenOwners[tokenId] != address(0), "CredentialNFT: token does not exist");
        _;
    }

    // Mint new credential NFT
    function mint(address _to, uint256 _credentialId, string memory _tokenURI, uint256 _expirationDays) 
        external returns (uint256) {
        require(_to != address(0), "CredentialNFT: cannot mint to zero address");
        require(_nextTokenId <= MAX_SUPPLY, "CredentialNFT: max supply exceeded");
        
        uint256 tokenId = _nextTokenId++;
        
        _tokenOwners[tokenId] = _to;
        credentialIds[tokenId] = _credentialId;
        issuedAt[tokenId] = block.timestamp;
        expiresAt[tokenId] = block.timestamp + (_expirationDays * 1 days);
        _tokenURIs[tokenId] = _tokenURI;
        
        _holderTokens[_to].push(tokenId);
        _totalSupply++;
        
        emit Transfer(address(0), _to, tokenId);
        emit CredentialNFTMinted(_to, tokenId, _credentialId);
        
        return tokenId;
    }

    // Burn credential NFT
    function burn(uint256 tokenId) external exists(tokenId) {
        address owner = _tokenOwners[tokenId];
        require(owner == msg.sender || _tokenApprovals[tokenId] == msg.sender, 
            "CredentialNFT: caller is not owner nor approved");
        
        _tokenOwners[tokenId] = address(0);
        delete credentialIds[tokenId];
        delete issuedAt[tokenId];
        delete expiresAt[tokenId];
        delete _tokenURIs[tokenId];
        isRevoked[tokenId] = true;
        
        _totalSupply--;
        
        emit CredentialNFTBurned(tokenId);
        emit Transfer(owner, address(0), tokenId);
    }

    // Transfer NFT
    function transferFrom(address from, address to, uint256 tokenId) external exists(tokenId) {
        require(from == _tokenOwners[tokenId], "CredentialNFT: transfer from incorrect owner");
        require(to != address(0), "CredentialNFT: transfer to zero address");
        
        _transfer(from, to, tokenId);
    }

    // Safe transfer
    function safeTransferFrom(address from, address to, uint256 tokenId) external exists(tokenId) {
        require(from == _tokenOwners[tokenId], "CredentialNFT: transfer from incorrect owner");
        require(to != address(0), "CredentialNFT: transfer to zero address");
        
        _transfer(from, to, tokenId);
    }

    // Approve token
    function approve(address to, uint256 tokenId) external exists(tokenId) {
        require(_tokenOwners[tokenId] == msg.sender, "CredentialNFT: approve caller is not owner");
        
        _tokenApprovals[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    // Set approval for all
    function setApprovalForAll(address operator, bool approved) external {
        require(msg.sender != operator, "CredentialNFT: approve to caller");
        
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // Get token owner
    function ownerOf(uint256 tokenId) external view returns (address) {
        return _tokenOwners[tokenId];
    }

    // Get token URI
    function tokenURI(uint256 tokenId) external view exists(tokenId) returns (string memory) {
        return _tokenURIs[tokenId];
    }

    // Get approved address
    function getApproved(uint256 tokenId) external view exists(tokenId) returns (address) {
        return _tokenApprovals[tokenId];
    }

    // Check if operator is approved
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // Get holder tokens
    function getHolderTokens(address holder) external view returns (uint256[] memory) {
        return _holderTokens[holder];
    }

    // Get holder token count
    function getHolderTokenCount(address holder) external view returns (uint256) {
        return _holderTokens[holder].length;
    }

    // Get total supply
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    // Check if token is valid
    function isTokenValid(uint256 tokenId) external view returns (bool) {
        return _tokenOwners[tokenId] != address(0) && 
               !isRevoked[tokenId] && 
               (expiresAt[tokenId] == 0 || expiresAt[tokenId] > block.timestamp);
    }

    // Update token URI
    function updateTokenURI(uint256 tokenId, string memory newTokenURI) external exists(tokenId) {
        require(_tokenOwners[tokenId] == msg.sender, "CredentialNFT: caller is not owner");
        _tokenURIs[tokenId] = newTokenURI;
        emit TokenURIUpdated(tokenId, newTokenURI);
    }

    // Revoke credential
    function revokeCredentialNFT(uint256 tokenId) external exists(tokenId) {
        require(_tokenOwners[tokenId] == msg.sender, "CredentialNFT: caller is not owner");
        isRevoked[tokenId] = true;
    }

    // Internal transfer function
    function _transfer(address from, address to, uint256 tokenId) internal {
        delete _tokenApprovals[tokenId];
        _tokenOwners[tokenId] = to;
        
        _removeTokenFromHolderEnumeration(from, tokenId);
        _addTokenToHolderEnumeration(to, tokenId);
        
        emit Transfer(from, to, tokenId);
    }

    // Add token to holder enumeration
    function _addTokenToHolderEnumeration(address to, uint256 tokenId) internal {
        _holderTokens[to].push(tokenId);
    }

    // Remove token from holder enumeration
    function _removeTokenFromHolderEnumeration(address from, uint256 tokenId) internal {
        uint256[] storage holderTokens = _holderTokens[from];
        for (uint256 i = 0; i < holderTokens.length; i++) {
            if (holderTokens[i] == tokenId) {
                holderTokens[i] = holderTokens[holderTokens.length - 1];
                holderTokens.pop();
                break;
            }
        }
    }

    // Get token expiration
    function getExpiration(uint256 tokenId) external view returns (uint256) {
        return expiresAt[tokenId];
    }

    // Get issuance time
    function getIssuanceTime(uint256 tokenId) external view returns (uint256) {
        return issuedAt[tokenId];
    }

    // Check if revoked
    function checkRevoked(uint256 tokenId) external view returns (bool) {
        return isRevoked[tokenId];
    }
}
