// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract IssuerRegistry {
    struct Issuer {
        address issuerAddress;
        string name;
        string organization;
        string email;
        bool isActive;
        uint256 registeredAt;
        uint256 credentialsIssued;
    }

    mapping(address => Issuer) public issuers;
    mapping(address => bool) public isRegisteredIssuer;
    address[] public issuerAddresses;
    
    // Only allow accounts 0 and 1 from Hardhat localhost
    address public constant ALLOWED_ISSUER_1 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address public constant ALLOWED_ISSUER_2 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    
    event IssuerRegistered(address indexed issuer, string name, string organization);
    event IssuerDeactivated(address indexed issuer);
    event IssuerReactivated(address indexed issuer);

    modifier onlyAllowedAccounts() {
        require(
            msg.sender == ALLOWED_ISSUER_1 || msg.sender == ALLOWED_ISSUER_2,
            "Only hardhat accounts 0 and 1 can register as issuers"
        );
        _;
    }

    modifier onlyRegisteredIssuer() {
        require(isRegisteredIssuer[msg.sender], "Not a registered issuer");
        _;
    }

    function registerIssuer(
        string memory _name,
        string memory _organization,
        string memory _email
    ) external onlyAllowedAccounts {
        require(!isRegisteredIssuer[msg.sender], "Already registered as issuer");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_organization).length > 0, "Organization cannot be empty");

        Issuer memory newIssuer = Issuer({
            issuerAddress: msg.sender,
            name: _name,
            organization: _organization,
            email: _email,
            isActive: true,
            registeredAt: block.timestamp,
            credentialsIssued: 0
        });

        issuers[msg.sender] = newIssuer;
        isRegisteredIssuer[msg.sender] = true;
        issuerAddresses.push(msg.sender);

        emit IssuerRegistered(msg.sender, _name, _organization);
    }

    function updateIssuerInfo(
        string memory _name,
        string memory _organization,
        string memory _email
    ) external onlyRegisteredIssuer {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_organization).length > 0, "Organization cannot be empty");

        Issuer storage issuer = issuers[msg.sender];
        issuer.name = _name;
        issuer.organization = _organization;
        issuer.email = _email;
    }

    function deactivateIssuer() external onlyRegisteredIssuer {
        issuers[msg.sender].isActive = false;
        emit IssuerDeactivated(msg.sender);
    }

    function reactivateIssuer() external onlyRegisteredIssuer {
        issuers[msg.sender].isActive = true;
        emit IssuerReactivated(msg.sender);
    }

    function incrementCredentialsIssued(address _issuer) external {
        require(isRegisteredIssuer[_issuer], "Not a registered issuer");
        issuers[_issuer].credentialsIssued++;
    }

    function getIssuer(address _issuer) external view returns (Issuer memory) {
        require(isRegisteredIssuer[_issuer], "Issuer not found");
        return issuers[_issuer];
    }

    function getAllIssuers() external view returns (Issuer[] memory) {
        Issuer[] memory allIssuers = new Issuer[](issuerAddresses.length);
        for (uint i = 0; i < issuerAddresses.length; i++) {
            allIssuers[i] = issuers[issuerAddresses[i]];
        }
        return allIssuers;
    }

    function getActiveIssuersCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < issuerAddresses.length; i++) {
            if (issuers[issuerAddresses[i]].isActive) {
                count++;
            }
        }
        return count;
    }

    function isAllowedAccount(address _account) external pure returns (bool) {
        return _account == ALLOWED_ISSUER_1 || _account == ALLOWED_ISSUER_2;
    }
}
