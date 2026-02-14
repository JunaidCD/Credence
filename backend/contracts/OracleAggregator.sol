// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OracleAggregator
 * @dev Aggregates data from multiple oracle sources
 */
contract OracleAggregator {
    // Oracle data
    struct OracleData {
        address oracleAddress;
        string dataSource;
        uint256 timestamp;
        uint256 value;
        bool isActive;
        uint256 reliabilityScore;
    }
    
    // Data request
    struct DataRequest {
        bytes32 requestId;
        address requester;
        string dataType;
        uint256 timestamp;
        bool isFulfilled;
        uint256 aggregatedValue;
        uint256[] individualValues;
        address[] participatingOracles;
    }
    
    // Storage
    mapping(address => OracleData) public oracles;
    mapping(bytes32 => DataRequest) public dataRequests;
    mapping(address => bytes32[]) public oracleRequests;
    mapping(bytes32 => mapping(address => uint256)) public oracleResponses;
    mapping(string => address[]) public dataTypeOracles;
    
    // Configuration
    address public owner;
    uint256 public minOracleResponses = 3;
    uint256 public oracleCount;
    uint256 public requestCount;
    uint256 public constant MAX_ORACLES = 100;
    
    // Events
    event OracleRegistered(address indexed oracle, string dataSource);
    event OracleUpdated(address indexed oracle, string newDataSource);
    event OracleRemoved(address indexed oracle);
    event DataRequested(bytes32 indexed requestId, address indexed requester, string dataType);
    event DataFulfilled(bytes32 indexed requestId, uint256 aggregatedValue);
    event OracleResponseRecorded(bytes32 indexed requestId, address indexed oracle, uint256 value);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "OracleAggregator: caller is not owner");
        _;
    }

    modifier onlyRegisteredOracle() {
        require(oracles[msg.sender].isActive, "OracleAggregator: not a registered oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Register oracle
    function registerOracle(address _oracle, string memory _dataSource) 
        external onlyOwner {
        require(_oracle != address(0), "OracleAggregator: invalid oracle address");
        require(!oracles[_oracle].isActive, "OracleAggregator: oracle already registered");
        require(oracleCount < MAX_ORACLES, "OracleAggregator: max oracles reached");
        
        oracles[_oracle] = OracleData({
            oracleAddress: _oracle,
            dataSource: _dataSource,
            timestamp: block.timestamp,
            value: 0,
            isActive: true,
            reliabilityScore: 100
        });
        
        oracleCount++;
        
        emit OracleRegistered(_oracle, _dataSource);
    }

    // Update oracle
    function updateOracle(address _oracle, string memory _newDataSource) 
        external onlyOwner {
        require(oracles[_oracle].isActive, "OracleAggregator: oracle not registered");
        
        oracles[_oracle].dataSource = _newDataSource;
        oracles[_oracle].timestamp = block.timestamp;
        
        emit OracleUpdated(_oracle, _newDataSource);
    }

    // Remove oracle
    function removeOracle(address _oracle) external onlyOwner {
        require(oracles[_oracle].isActive, "OracleAggregator: oracle not registered");
        
        oracles[_oracle].isActive = false;
        oracleCount--;
        
        emit OracleRemoved(_oracle);
    }

    // Request data
    function requestData(string memory _dataType) external returns (bytes32) {
        require(oracleCount >= minOracleResponses, "OracleAggregator: not enough oracles");
        
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            _dataType,
            block.timestamp
        ));
        
        dataRequests[requestId] = DataRequest({
            requestId: requestId,
            requester: msg.sender,
            dataType: _dataType,
            timestamp: block.timestamp,
            isFulfilled: false,
            aggregatedValue: 0,
            individualValues: new uint256[](0),
            participatingOracles: new address[](0)
        });
        
        requestCount++;
        
        emit DataRequested(requestId, msg.sender, _dataType);
        
        return requestId;
    }

    // Submit oracle response
    function submitResponse(bytes32 _requestId, uint256 _value) 
        external onlyRegisteredOracle {
        require(dataRequests[_requestId].timestamp != 0, "OracleAggregator: request not found");
        require(!dataRequests[_requestId].isFulfilled, "OracleAggregator: already fulfilled");
        
        oracleResponses[_requestId][msg.sender] = _value;
        
        address[] storage participating = dataRequests[_requestId].participatingOracles;
        participating.push(msg.sender);
        
        uint256[] storage values = dataRequests[_requestId].individualValues;
        values.push(_value);
        
        // Update oracle reliability
        _updateOracleReliability(msg.sender, true);
        
        emit OracleResponseRecorded(_requestId, msg.sender, _value);
        
        // Check if we have enough responses
        if (participating.length >= minOracleResponses) {
            _fulfillRequest(_requestId);
        }
    }

    // Fulfill request
    function _fulfillRequest(bytes32 _requestId) internal {
        DataRequest storage request = dataRequests[_requestId];
        
        uint256[] storage values = request.individualValues;
        uint256 result = _aggregateValues(values);
        
        request.aggregatedValue = result;
        request.isFulfilled = true;
        
        emit DataFulfilled(_requestId, result);
    }

    // Aggregate values using median
    function _aggregateValues(uint256[] memory _values) internal pure returns (uint256) {
        if (_values.length == 0) return 0;
        if (_values.length == 1) return _values[0];
        
        // Sort values
        uint256[] memory sorted = _sortValues(_values);
        
        // Return median
        if (sorted.length % 2 == 0) {
            return (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
        } else {
            return sorted[sorted.length / 2];
        }
    }

    // Sort values
    function _sortValues(uint256[] memory _values) internal pure returns (uint256[] memory) {
        for (uint256 i = 0; i < _values.length; i++) {
            for (uint256 j = i + 1; j < _values.length; j++) {
                if (_values[i] > _values[j]) {
                    uint256 temp = _values[i];
                    _values[i] = _values[j];
                    _values[j] = temp;
                }
            }
        }
        return _values;
    }

    // Update oracle reliability
    function _updateOracleReliability(address _oracle, bool _success) internal {
        if (_success) {
            if (oracles[_oracle].reliabilityScore < 100) {
                oracles[_oracle].reliabilityScore += 1;
            }
        } else {
            if (oracles[_oracle].reliabilityScore > 0) {
                oracles[_oracle].reliabilityScore -= 5;
            }
        }
        oracles[_oracle].timestamp = block.timestamp;
    }

    // Get oracle data
    function getOracle(address _oracle) external view returns (OracleData memory) {
        return oracles[_oracle];
    }

    // Get request details
    function getRequest(bytes32 _requestId) external view returns (DataRequest memory) {
        return dataRequests[_requestId];
    }

    // Get aggregated value
    function getAggregatedValue(bytes32 _requestId) external view returns (uint256) {
        require(dataRequests[_requestId].isFulfilled, "OracleAggregator: not fulfilled");
        return dataRequests[_requestId].aggregatedValue;
    }

    // Get oracle response
    function getOracleResponse(bytes32 _requestId, address _oracle) 
        external view returns (uint256) {
        return oracleResponses[_requestId][_oracle];
    }

    // Get oracle count
    function getOracleCount() external view returns (uint256) {
        return oracleCount;
    }

    // Get request count
    function getRequestCount() external view returns (uint256) {
        return requestCount;
    }

    // Set minimum responses required
    function setMinOracleResponses(uint256 _minResponses) external onlyOwner {
        require(_minResponses > 0, "OracleAggregator: invalid min responses");
        require(_minResponses <= oracleCount, "OracleAggregator: exceeds oracle count");
        
        minOracleResponses = _minResponses;
    }

    // Get average value
    function getAverageValue(bytes32 _requestId) external view returns (uint256) {
        DataRequest storage request = dataRequests[_requestId];
        
        if (request.individualValues.length == 0) return 0;
        
        uint256 sum = 0;
        for (uint256 i = 0; i < request.individualValues.length; i++) {
            sum += request.individualValues[i];
        }
        
        return sum / request.individualValues.length;
    }

    // Get max value
    function getMaxValue(bytes32 _requestId) external view returns (uint256) {
        uint256[] memory values = dataRequests[_requestId].individualValues;
        
        if (values.length == 0) return 0;
        
        uint256 maxVal = values[0];
        for (uint256 i = 1; i < values.length; i++) {
            if (values[i] > maxVal) {
                maxVal = values[i];
            }
        }
        
        return maxVal;
    }

    // Get min value
    function getMinValue(bytes32 _requestId) external view returns (uint256) {
        uint256[] memory values = dataRequests[_requestId].individualValues;
        
        if (values.length == 0) return 0;
        
        uint256 minVal = values[0];
        for (uint256 i = 1; i < values.length; i++) {
            if (values[i] < minVal) {
                minVal = values[i];
            }
        }
        
        return minVal;
    }

    // Check if request is fulfilled
    function isRequestFulfilled(bytes32 _requestId) external view returns (bool) {
        return dataRequests[_requestId].isFulfilled;
    }

    // Get response count
    function getResponseCount(bytes32 _requestId) external view returns (uint256) {
        return dataRequests[_requestId].individualValues.length;
    }

    // Manual fulfill (emergency)
    function manualFulfill(bytes32 _requestId, uint256 _value) external onlyOwner {
        DataRequest storage request = dataRequests[_requestId];
        
        require(!request.isFulfilled, "OracleAggregator: already fulfilled");
        
        request.aggregatedValue = _value;
        request.isFulfilled = true;
        
        emit DataFulfilled(_requestId, _value);
    }

    // Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OracleAggregator: invalid owner");
        owner = newOwner;
    }
}
