import { ethers } from 'ethers';

// Contract addresses - these will be populated after deployment
const CONTRACT_ADDRESSES = {
  ISSUER_REGISTRY: '',
  CREDENTIAL_REGISTRY: '',
  USER_REGISTRY: ''
};

// Contract ABIs - simplified for frontend use
const ISSUER_REGISTRY_ABI = [
  "function registerIssuer(string memory _name, string memory _organization, string memory _email) external",
  "function isRegisteredIssuer(address) external view returns (bool)",
  "function isAllowedAccount(address) external view returns (bool)",
  "function getIssuer(address) external view returns (tuple(address issuerAddress, string name, string organization, string email, bool isActive, uint256 registeredAt, uint256 credentialsIssued))",
  "function getAllIssuers() external view returns (tuple(address issuerAddress, string name, string organization, string email, bool isActive, uint256 registeredAt, uint256 credentialsIssued)[])",
  "event IssuerRegistered(address indexed issuer, string name, string organization)"
];

const CREDENTIAL_REGISTRY_ABI = [
  "function issueCredential(address _holder, string memory _credentialType, string memory _data, uint256 _expiresAt, string memory _ipfsHash) external returns (uint256)",
  "function revokeCredential(uint256 _credentialId) external",
  "function getCredential(uint256 _credentialId) external view returns (tuple(uint256 id, address issuer, address holder, string credentialType, string data, uint256 issuedAt, uint256 expiresAt, bool isActive, bool isRevoked, string ipfsHash))",
  "function getHolderCredentials(address _holder) external view returns (uint256[])",
  "function getIssuerCredentials(address _issuer) external view returns (uint256[])",
  "function requestVerification(address _holder, uint256 _credentialId, string memory _message) external returns (uint256)",
  "function processVerificationRequest(uint256 _requestId, bool _approve) external",
  "event CredentialIssued(uint256 indexed credentialId, address indexed issuer, address indexed holder, string credentialType)",
  "event CredentialRevoked(uint256 indexed credentialId, address indexed issuer)"
];

const USER_REGISTRY_ABI = [
  "function registerUser(string memory _name, string memory _email) external",
  "function isRegisteredUser(address) external view returns (bool)",
  "function isAllowedAccount(address) external view returns (bool)",
  "function getUser(address) external view returns (tuple(address userAddress, string name, string email, bool isActive, uint256 registeredAt, uint256 credentialsReceived))",
  "function getAllUsers() external view returns (tuple(address userAddress, string name, string email, bool isActive, uint256 registeredAt, uint256 credentialsReceived)[])",
  "function getTotalUsers() external view returns (uint256)",
  "event UserRegistered(address indexed userAddress, string name, string email)"
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.issuerRegistry = null;
    this.credentialRegistry = null;
    this.userRegistry = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        await this.loadContractAddresses();
        this.isInitialized = true;
        return true;
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Web3 initialization failed:', error);
      return false;
    }
  }


  async loadContractAddresses() {
    try {
      // Load contract addresses from public folder (deployed by backend script)
      const response = await fetch('/deployment-info.json');
      const deploymentInfo = await response.json();
      
      CONTRACT_ADDRESSES.ISSUER_REGISTRY = deploymentInfo.contracts.IssuerRegistry;
      CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY = deploymentInfo.contracts.CredentialRegistry;
      CONTRACT_ADDRESSES.USER_REGISTRY = deploymentInfo.contracts.UserRegistry;
      
      this.issuerRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.ISSUER_REGISTRY,
        ISSUER_REGISTRY_ABI,
        this.provider
      );
      
      this.credentialRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY,
        CREDENTIAL_REGISTRY_ABI,
        this.provider
      );
      
      this.userRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.USER_REGISTRY,
        USER_REGISTRY_ABI,
        this.provider
      );
    } catch (error) {
      console.error('Failed to load contract addresses from public folder:', error);
      throw new Error('Contract deployment info not found. Please deploy contracts first.');
    }
  }

  async connectWallet() {
    try {
      if (!this.provider) {
        await this.init();
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.account = accounts[0];
      this.signer = await this.provider.getSigner();
      
      // Check network
      const network = await this.provider.getNetwork();
      if (network.chainId !== 31337n) {
        throw new Error('Please connect to Hardhat localhost network (Chain ID: 31337)');
      }


      return {
        account: this.account,
        chainId: Number(network.chainId)
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async checkIssuerEligibility(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress || !this.issuerRegistry) {
        throw new Error('No address provided or contracts not loaded');
      }

      // Define allowed Hardhat accounts (accounts 0-1 for issuers)
      const ALLOWED_ISSUER_ACCOUNTS = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'  // Account 1
      ];

      const isAllowed = ALLOWED_ISSUER_ACCOUNTS.some(addr => 
        addr.toLowerCase() === targetAddress.toLowerCase()
      );
      const isRegistered = isAllowed ? await this.issuerRegistry.isRegisteredIssuer(targetAddress) : false;
      
      return {
        success: true,
        address: targetAddress,
        isAllowed,
        isRegistered,
        canRegister: isAllowed && !isRegistered,
        did: `did:ethr:${targetAddress}`
      };
    } catch (error) {
      console.error('Failed to check issuer eligibility:', error);
      throw error;
    }
  }

  async registerAsIssuer(name, organization, email = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.issuerRegistry) {
        throw new Error('Issuer Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Execute blockchain transaction directly
      const contract = this.issuerRegistry.connect(this.signer);
      const tx = await contract.registerIssuer(name, organization, email);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Issuer registration failed:', error);
      throw error;
    }
  }

  async getIssuerInfo(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress || !this.issuerRegistry) {
        return null;
      }

      const isRegistered = await this.issuerRegistry.isRegisteredIssuer(targetAddress);
      if (!isRegistered) {
        return null;
      }

      const issuer = await this.issuerRegistry.getIssuer(targetAddress);
      return {
        address: issuer.issuerAddress,
        name: issuer.name,
        organization: issuer.organization,
        email: issuer.email,
        isActive: issuer.isActive,
        registeredAt: Number(issuer.registeredAt),
        credentialsIssued: Number(issuer.credentialsIssued)
      };
    } catch (error) {
      console.error('Failed to get issuer info:', error);
      return null;
    }
  }

  async issueCredential(holderAddress, credentialType, data, expiresAt, ipfsHash = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.credentialRegistry) {
        throw new Error('Credential Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Validate recipient address restrictions
      await this.validateCredentialRecipient(holderAddress);

      // Execute blockchain transaction directly
      const contract = this.credentialRegistry.connect(this.signer);
      const tx = await contract.issueCredential(
        holderAddress,
        credentialType,
        JSON.stringify(data),
        expiresAt,
        ipfsHash
      );
      
      const receipt = await tx.wait();
      
      // Extract credential ID from event logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'CredentialIssued';
        } catch {
          return false;
        }
      });

      let credentialId = null;
      if (event) {
        const parsed = contract.interface.parseLog(event);
        credentialId = Number(parsed.args.credentialId);
      }
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        credentialId
      };
    } catch (error) {
      console.error('Credential issuance failed:', error);
      throw error;
    }
  }

  async validateCredentialRecipient(recipientAddress) {
    // Define allowed Hardhat accounts (accounts 2-7)
    const allowedRecipients = [
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account 3
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account 5
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9', // Account 6
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'  // Account 7
    ];

    // Get current wallet address
    const currentWallet = this.getAccount();
    
    // Check if current wallet is authorized issuer (accounts 0 or 1)
    const authorizedIssuers = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'  // Account 1
    ];

    if (!authorizedIssuers.some(addr => addr.toLowerCase() === currentWallet.toLowerCase())) {
      throw new Error('Only authorized issuer accounts (0-1) can issue credentials');
    }

    // Check if trying to send to self
    if (currentWallet.toLowerCase() === recipientAddress.toLowerCase()) {
      throw new Error('Cannot issue credentials to your own wallet address');
    }

    // Check if recipient is in allowed accounts (2-7)
    if (!allowedRecipients.some(addr => addr.toLowerCase() === recipientAddress.toLowerCase())) {
      throw new Error('Credentials can only be issued to accounts 2-7. Please use a valid recipient address.');
    }

    return true;
  }

  async validateUserRegistration(address = null) {
    // Define allowed user accounts (accounts 2-7)
    const allowedUserAccounts = [
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account 3
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account 5
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9', // Account 6
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'  // Account 7
    ];

    const targetAddress = address || this.account;
    
    // Return boolean instead of throwing error for UI validation
    return allowedUserAccounts.some(addr => addr.toLowerCase() === targetAddress.toLowerCase());
  }

  async registerUser(name, email = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }

      // Validate user account eligibility
      const isEligible = await this.validateUserRegistration();
      if (!isEligible) {
        throw new Error('Only Hardhat accounts 2-7 can register as users. Please use a valid user account.');
      }

      // Create a message to sign for user registration
      const message = `Register as user on Credence platform\nName: ${name}\nEmail: ${email}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await this.signer.signMessage(message);
      
      return {
        success: true,
        signature,
        message,
        address: this.account
      };
    } catch (error) {
      console.error('User registration failed:', error);
      throw error;
    }
  }

  async registerUserOnBlockchain(name, email = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.userRegistry) {
        throw new Error('User Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Validate user account eligibility
      const isEligible = await this.validateUserRegistration();
      if (!isEligible) {
        throw new Error('Only Hardhat accounts 2-7 can register as users. Please use a valid user account.');
      }

      // Execute blockchain transaction directly
      const contract = this.userRegistry.connect(this.signer);
      const tx = await contract.registerUser(name, email);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        address: this.account
      };
    } catch (error) {
      console.error('Blockchain user registration failed:', error);
      throw error;
    }
  }

  async checkUserRegistrationStatus(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress || !this.userRegistry) {
        return {
          isEligible: false,
          isRegistered: false,
          canRegister: false
        };
      }

      const isAllowed = await this.userRegistry.isAllowedAccount(targetAddress);
      const isRegistered = await this.userRegistry.isRegisteredUser(targetAddress);
      
      return {
        success: true,
        address: targetAddress,
        isEligible: isAllowed,
        isRegistered,
        canRegister: isAllowed && !isRegistered
      };
    } catch (error) {
      console.error('Failed to check user registration status:', error);
      return {
        isEligible: false,
        isRegistered: false,
        canRegister: false
      };
    }
  }

  async getUserInfo(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress || !this.userRegistry) {
        return null;
      }

      const isRegistered = await this.userRegistry.isRegisteredUser(targetAddress);
      if (!isRegistered) {
        return null;
      }

      const user = await this.userRegistry.getUser(targetAddress);
      return {
        address: user.userAddress,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        registeredAt: Number(user.registeredAt),
        credentialsReceived: Number(user.credentialsReceived)
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  async getHolderCredentials(holderAddress = null) {
    try {
      const targetAddress = holderAddress || this.account;
      if (!targetAddress || !this.credentialRegistry) {
        return [];
      }

      const credentialIds = await this.credentialRegistry.getHolderCredentials(targetAddress);
      const credentials = [];
      
      for (const id of credentialIds) {
        try {
          const credential = await this.credentialRegistry.getCredential(Number(id));
          credentials.push({
            id: Number(credential.id),
            issuer: credential.issuer,
            holder: credential.holder,
            credentialType: credential.credentialType,
            data: credential.data,
            issuedAt: Number(credential.issuedAt),
            expiresAt: Number(credential.expiresAt),
            isActive: credential.isActive,
            isRevoked: credential.isRevoked,
            ipfsHash: credential.ipfsHash
          });
        } catch (error) {
          console.error(`Failed to get credential ${id}:`, error);
        }
      }
      
      return credentials;
    } catch (error) {
      console.error('Failed to get holder credentials:', error);
      return [];
    }
  }

  async getIssuerCredentials(issuerAddress = null) {
    try {
      const targetAddress = issuerAddress || this.account;
      if (!targetAddress || !this.credentialRegistry) {
        return [];
      }

      const credentialIds = await this.credentialRegistry.getIssuerCredentials(targetAddress);
      const credentials = [];
      
      for (const id of credentialIds) {
        try {
          const credential = await this.credentialRegistry.getCredential(Number(id));
          credentials.push({
            id: Number(credential.id),
            issuer: credential.issuer,
            holder: credential.holder,
            credentialType: credential.credentialType,
            data: credential.data,
            issuedAt: Number(credential.issuedAt),
            expiresAt: Number(credential.expiresAt),
            isActive: credential.isActive,
            isRevoked: credential.isRevoked,
            ipfsHash: credential.ipfsHash
          });
        } catch (error) {
          console.error(`Failed to get credential ${id}:`, error);
        }
      }
      
      return credentials;
    } catch (error) {
      console.error('Failed to get issuer credentials:', error);
      return [];
    }
  }

  async revokeCredential(credentialId) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.credentialRegistry) {
        throw new Error('Credential Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Execute blockchain transaction
      const contract = this.credentialRegistry.connect(this.signer);
      const tx = await contract.revokeCredential(credentialId);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Credential revocation failed:', error);
      throw error;
    }
  }

  isConnected() {
    return !!this.account && !!this.signer;
  }

  getAccount() {
    return this.account;
  }

  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // Debug function to identify current account
  debugAccountInfo() {
    const currentAccount = this.getAccount();
    const hardhatAccounts = {
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': 'Account 0 (Issuer)',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': 'Account 1 (Issuer)',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': 'Account 2 (User)',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906': 'Account 3 (User)',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': 'Account 4 (User)',
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc': 'Account 5 (User)',
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9': 'Account 6 (User)',
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955': 'Account 7 (User)'
    };

    const accountInfo = hardhatAccounts[currentAccount] || 'Unknown Account';
    
    console.log('=== ACCOUNT DEBUG INFO ===');
    console.log('Current Account:', currentAccount);
    console.log('Account Type:', accountInfo);
    console.log('Is Issuer Account:', ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'].includes(currentAccount));
    console.log('========================');
    
    return {
      address: currentAccount,
      type: accountInfo,
      isIssuerAccount: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'].includes(currentAccount)
    };
  }
}

export default new Web3Service();
