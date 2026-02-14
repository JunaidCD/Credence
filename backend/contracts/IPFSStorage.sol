// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPFSStorage
 * @dev IPFS hash storage and retrieval for credential metadata
 */
contract IPFSStorage {
    // IPFS data storage
    struct IPFSData {
        string ipfsHash;
        string metadata;
        address uploader;
        uint256 timestamp;
        uint256 fileSize;
        bool isPinned;
        string contentType;
    }
    
    // Storage mappings
    mapping(bytes32 => IPFSData) public ipfsData;
    mapping(address => bytes32[]) public userUploads;
    mapping(string => bool) public hashExists;
    mapping(bytes32 => string[]) public dataTags;
    mapping(bytes32 => uint256) public accessCount;
    
    // Events
    event DataStored(bytes32 indexed dataId, string ipfsHash, address indexed uploader);
    event DataUpdated(bytes32 indexed dataId, string newIpfsHash);
    event DataDeleted(bytes32 indexed dataId);
    event DataPinned(bytes32 indexed dataId, bool isPinned);
    event TagAdded(bytes32 indexed dataId, string tag);
    event AccessRecorded(bytes32 indexed dataId, address indexed accessor);
    
    // Modifier
    modifier onlyValidHash(string memory _ipfsHash) {
        require(bytes(_ipfsHash).length >= 46, "IPFSStorage: invalid IPFS hash length");
        require(_ipfsHash[0] == 'Q' || _ipfsHash[0] == 'b', "IPFSStorage: invalid IPFS hash prefix");
        _;
    }
    
    // Store IPFS data
    function storeData(
        string memory _ipfsHash,
        string memory _metadata,
        string memory _contentType,
        uint256 _fileSize
    ) external onlyValidHash(_ipfsHash) returns (bytes32) {
        require(!hashExists[_ipfsHash], "IPFSStorage: hash already exists");
        
        bytes32 dataId = keccak256(abi.encodePacked(_ipfsHash, msg.sender, block.timestamp));
        
        ipfsData[dataId] = IPFSData({
            ipfsHash: _ipfsHash,
            metadata: _metadata,
            uploader: msg.sender,
            timestamp: block.timestamp,
            fileSize: _fileSize,
            isPinned: true,
            contentType: _contentType
        });
        
        hashExists[_ipfsHash] = true;
        userUploads[msg.sender].push(dataId);
        
        emit DataStored(dataId, _ipfsHash, msg.sender);
        
        return dataId;
    }
    
    // Update IPFS data
    function updateData(bytes32 _dataId, string memory _newIpfsHash) 
        external onlyValidHash(_newIpfsHash) {
        IPFSData storage data = ipfsData[_dataId];
        
        require(data.uploader == msg.sender, "IPFSStorage: only uploader can update");
        
        hashExists[data.ipfsHash] = false;
        hashExists[_newIpfsHash] = true;
        
        data.ipfsHash = _newIpfsHash;
        
        emit DataUpdated(_dataId, _newIpfsHash);
    }
    
    // Delete IPFS data
    function deleteData(bytes32 _dataId) external {
        IPFSData storage data = ipfsData[_dataId];
        
        require(data.uploader == msg.sender, "IPFSStorage: only uploader can delete");
        
        hashExists[data.ipfsHash] = false;
        delete ipfsData[_dataId];
        
        emit DataDeleted(_dataId);
    }
    
    // Pin/Unpin data
    function setPinStatus(bytes32 _dataId, bool _isPinned) external {
        IPFSData storage data = ipfsData[_dataId];
        
        require(data.uploader == msg.sender, "IPFSStorage: only uploader can change pin status");
        
        data.isPinned = _isPinned;
        
        emit DataPinned(_dataId, _isPinned);
    }
    
    // Add tag to data
    function addTag(bytes32 _dataId, string memory _tag) external {
        IPFSData storage data = ipfsData[_dataId];
        
        require(data.uploader == msg.sender, "IPFSStorage: only uploader can add tags");
        require(bytes(_tag).length > 0, "IPFSStorage: tag cannot be empty");
        
        dataTags[_dataId].push(_tag);
        
        emit TagAdded(_dataId, _tag);
    }
    
    // Record access
    function recordAccess(bytes32 _dataId) external {
        require(ipfsData[_dataId].timestamp != 0, "IPFSStorage: data does not exist");
        
        accessCount[_dataId]++;
        
        emit AccessRecorded(_dataId, msg.sender);
    }
    
    // Get IPFS data
    function getData(bytes32 _dataId) external view returns (IPFSData memory) {
        return ipfsData[_dataId];
    }
    
    // Get user upload count
    function getUserUploadCount(address _user) external view returns (uint256) {
        return userUploads[_user].length;
    }
    
    // Get user uploads
    function getUserUploads(address _user) external view returns (bytes32[] memory) {
        return userUploads[_user];
    }
    
    // Get data tags
    function getDataTags(bytes32 _dataId) external view returns (string[] memory) {
        return dataTags[_dataId];
    }
    
    // Get access count
    function getAccessCount(bytes32 _dataId) external view returns (uint256) {
        return accessCount[_dataId];
    }
    
    // Check if hash exists
    function checkHashExists(string memory _ipfsHash) external view returns (bool) {
        return hashExists[_ipfsHash];
    }
    
    // Batch store
    function batchStore(
        string[] memory _ipfsHashes,
        string[] memory _metadata,
        string[] memory _contentTypes,
        uint256[] memory _fileSizes
    ) external returns (bytes32[] memory) {
        require(
            _ipfsHashes.length == _metadata.length &&
            _metadata.length == _contentTypes.length &&
            _contentTypes.length == _fileSizes.length,
            "IPFSStorage: arrays length mismatch"
        );
        
        bytes32[] memory dataIds = new bytes32[](_ipfsHashes.length);
        
        for (uint256 i = 0; i < _ipfsHashes.length; i++) {
            dataIds[i] = storeData(_ipfsHashes[i], _metadata[i], _contentTypes[i], _fileSizes[i]);
        }
        
        return dataIds;
    }
    
    // Get data by hash
    function getDataByHash(string memory _ipfsHash) external view returns (bytes32) {
        require(hashExists[_ipfsHash], "IPFSStorage: hash not found");
        
        bytes32 dataId = keccak256(abi.encodePacked(_ipfsHash, msg.sender, block.timestamp));
        return dataId;
    }
    
    // Search by content type
    function searchByContentType(string memory _contentType) external view returns (bytes32[] memory) {
        bytes32[] memory results = new bytes32[](userUploads[msg.sender].length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < userUploads[msg.sender].length; i++) {
            bytes32 dataId = userUploads[msg.sender][i];
            if (keccak256(abi.encodePacked(ipfsData[dataId].contentType)) == 
                keccak256(abi.encodePacked(_contentType))) {
                results[count] = dataId;
                count++;
            }
        }
        
        bytes32[] memory filtered = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            filtered[i] = results[i];
        }
        
        return filtered;
    }
    
    // Get total storage size for user
    function getUserTotalStorage(address _user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < userUploads[_user].length; i++) {
            total += ipfsData[userUploads[_user][i]].fileSize;
        }
        return total;
    }
}
