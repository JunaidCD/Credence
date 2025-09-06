// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VerifierRegistry {
    struct Verifier {
        address verifierAddress;
        string name;
        string organization;
        string email;
        bool isActive;
        uint256 registeredAt;
        uint256 verificationsCount;
    }

    mapping(address => Verifier) public verifiers;
    mapping(address => bool) public isRegisteredVerifier;
    address[] public verifierAddresses;
    
    uint256 public totalVerifiers;
    
    event VerifierRegistered(
        address indexed verifierAddress,
        string name,
        string organization
    );
    
    event VerifierDeactivated(address indexed verifierAddress);
    event VerifierReactivated(address indexed verifierAddress);
    
    modifier onlyRegisteredVerifier() {
        require(isRegisteredVerifier[msg.sender], "Not a registered verifier");
        require(verifiers[msg.sender].isActive, "Verifier is not active");
        _;
    }

    function registerVerifier(
        string memory _name,
        string memory _organization,
        string memory _email
    ) external {
        require(!isRegisteredVerifier[msg.sender], "Already registered as verifier");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_organization).length > 0, "Organization cannot be empty");

        Verifier memory newVerifier = Verifier({
            verifierAddress: msg.sender,
            name: _name,
            organization: _organization,
            email: _email,
            isActive: true,
            registeredAt: block.timestamp,
            verificationsCount: 0
        });

        verifiers[msg.sender] = newVerifier;
        isRegisteredVerifier[msg.sender] = true;
        verifierAddresses.push(msg.sender);
        totalVerifiers++;

        emit VerifierRegistered(msg.sender, _name, _organization);
    }

    function deactivateVerifier(address _verifier) external {
        require(msg.sender == _verifier, "Can only deactivate own account");
        require(isRegisteredVerifier[_verifier], "Not a registered verifier");
        require(verifiers[_verifier].isActive, "Already deactivated");

        verifiers[_verifier].isActive = false;
        emit VerifierDeactivated(_verifier);
    }

    function reactivateVerifier(address _verifier) external {
        require(msg.sender == _verifier, "Can only reactivate own account");
        require(isRegisteredVerifier[_verifier], "Not a registered verifier");
        require(!verifiers[_verifier].isActive, "Already active");

        verifiers[_verifier].isActive = true;
        emit VerifierReactivated(_verifier);
    }

    function incrementVerificationsCount(address _verifier) external {
        require(isRegisteredVerifier[_verifier], "Not a registered verifier");
        verifiers[_verifier].verificationsCount++;
    }

    function getVerifier(address _verifier) external view returns (Verifier memory) {
        require(isRegisteredVerifier[_verifier], "Verifier not found");
        return verifiers[_verifier];
    }

    function getAllVerifiers() external view returns (address[] memory) {
        return verifierAddresses;
    }

    function getActiveVerifiers() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active verifiers
        for (uint256 i = 0; i < verifierAddresses.length; i++) {
            if (verifiers[verifierAddresses[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active verifiers
        address[] memory activeVerifiers = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < verifierAddresses.length; i++) {
            if (verifiers[verifierAddresses[i]].isActive) {
                activeVerifiers[currentIndex] = verifierAddresses[i];
                currentIndex++;
            }
        }
        
        return activeVerifiers;
    }

    function getTotalVerifiers() external view returns (uint256) {
        return totalVerifiers;
    }

    function getActiveVerifierCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < verifierAddresses.length; i++) {
            if (verifiers[verifierAddresses[i]].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }
}
