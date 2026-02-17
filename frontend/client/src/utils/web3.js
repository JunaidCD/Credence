import { ethers } from 'ethers';

// Contract addresses - these will be populated after deployment
const CONTRACT_ADDRESSES = {
  ISSUER_REGISTRY: '',
  CREDENTIAL_REGISTRY: '',
  USER_REGISTRY: '',
  VERIFIER_REGISTRY: ''
};

// Network Configuration - Arbitrum Sepolia
const NETWORK_CONFIG = {
  // Arbitrum Sepolia (L2 Testnet) - with multiple RPC endpoints for reliability
  arbitrumSepolia: {
    chainId: '0x' + BigInt(421614).toString(16), // 421614 in hex
    chainName: 'Arbitrum Sepolia',
    rpcUrls: [
      'https://sepolia-rollup.arbitrum.io/rpc',
      'https://arbitrum-sepolia.rpc.thirdweb.com',
      'https://arb-sepolia.g.alchemy.com/v2/demo'
    ],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
    iconUrls: ['https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg']
  },
  // Arbitrum One (L1 Mainnet)
  arbitrum: {
    chainId: '0x' + BigInt(42161).toString(16), // 42161 in hex
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  // Localhost (for development)
  localhost: {
    chainId: '0x' + BigInt(31337).toString(16),
    chainName: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: []
  }
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

const VERIFIER_REGISTRY_ABI = [
  "function registerVerifier(string memory _name, string memory _organization, string memory _email) external",
  "function isRegisteredVerifier(address) external view returns (bool)",
  "function getVerifier(address) external view returns (tuple(address verifierAddress, string name, string organization, string email, bool isActive, uint256 registeredAt, uint256 verificationsCount))",
  "function getAllVerifiers() external view returns (address[])",
  "function getActiveVerifiers() external view returns (address[])",
  "function getTotalVerifiers() external view returns (uint256)",
  "function getActiveVerifierCount() external view returns (uint256)",
  "event VerifierRegistered(address indexed verifierAddress, string name, string organization)"
];

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.issuerRegistry = null;
    this.credentialRegistry = null;
    this.userRegistry = null;
    this.verifierRegistry = null;
    this.isInitialized = false;
    this.eventListeners = new Map(); // Store active event listeners
  }

  async init() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Use a custom RPC provider with fallback for better reliability
        const rpcUrls = [
          'https://sepolia-rollup.arbitrum.io/rpc',
          'https://arbitrum-sepolia.rpc.thirdweb.com'
        ];
        
        // Use the first RPC that works
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrls[0]);
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

  // Switch to Arbitrum Sepolia network
  async switchToArbitrumSepolia() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }
    
    const chainId = NETWORK_CONFIG.arbitrumSepolia.chainId;
    
    try {
      // Try to switch network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
    } catch (switchError) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG.arbitrumSepolia]
          });
        } catch (addError) {
          throw new Error('Failed to add Arbitrum Sepolia network');
        }
      } else {
        throw switchError;
      }
    }
  }

  // Check current network
  async getNetwork() {
    if (!this.provider) return null;
    const network = await this.provider.getNetwork();
    return {
      chainId: network.chainId.toString(),
      name: network.name
    };
  }


  async loadContractAddresses() {
    try {
      // Load contract addresses from public folder (deployed by backend script)
      const response = await fetch('/deployment-info.json');
      const deploymentInfo = await response.json();
      
      CONTRACT_ADDRESSES.ISSUER_REGISTRY = deploymentInfo.contracts.IssuerRegistry;
      CONTRACT_ADDRESSES.CREDENTIAL_REGISTRY = deploymentInfo.contracts.CredentialRegistry;
      CONTRACT_ADDRESSES.USER_REGISTRY = deploymentInfo.contracts.UserRegistry;
      CONTRACT_ADDRESSES.VERIFIER_REGISTRY = deploymentInfo.contracts.VerifierRegistry;
      
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
      
      this.verifierRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.VERIFIER_REGISTRY,
        VERIFIER_REGISTRY_ABI,
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

      // Switch to Arbitrum Sepolia network
      await this.switchToArbitrumSepolia();

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.account = accounts[0];
      this.signer = await this.provider.getSigner();
      
      // Verify network after switching
      const network = await this.provider.getNetwork();
      const expectedChainId = 421614; // Arbitrum Sepolia
      if (Number(network.chainId) !== expectedChainId) {
        throw new Error('Please connect to Arbitrum Sepolia network (Chain ID: 421614)');
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

      // Anyone can now register as an issuer - no restrictions
      const isRegistered = await this.issuerRegistry.isRegisteredIssuer(targetAddress);
      
      return {
        success: true,
        address: targetAddress,
        isAllowed: true,
        isRegistered,
        canRegister: !isRegistered,
        did: `did:ethr:${targetAddress}`
      };
    } catch (error) {
      console.error('Failed to check issuer eligibility:', error);
      throw error;
    }
  }

  // Validate verifier registration eligibility - anyone can register
  async checkVerifierEligibility(address = null) {
    try {
      const targetAddress = (address || this.account)?.toLowerCase();
      console.log('Account changed:', targetAddress);
      
      if (!targetAddress) {
        return {
          isAllowed: false,
          isRegistered: false,
          canRegister: false
        };
      }

      // Anyone can register as a verifier - no restrictions
      const isAllowed = true;
      
      // Check on-chain registration status
      let isRegistered = false;
      if (this.verifierRegistry) {
        try {
          isRegistered = await this.verifierRegistry.isRegisteredVerifier(targetAddress);
          console.log('isVerifier:', isRegistered);
        } catch (error) {
          console.log('Could not check verifier registration status from blockchain:', error);
          isRegistered = false;
        }
      }
      
      return {
        isAllowed,
        isRegistered,
        canRegister: !isRegistered
      };
    } catch (error) {
      console.error('Failed to check verifier eligibility:', error);
      return {
        isAllowed: false,
        isRegistered: false,
        canRegister: false
      };
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

      // Get current gas price from network - handle different network types
      let feeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (e) {
        // Fallback values for networks that don't support getFeeData
        feeData = {
          maxFeePerGas: BigInt(50000000000), // 50 gwei
          maxPriorityFeePerGas: BigInt(2000000000), // 2 gwei
          gasPrice: BigInt(2000000000)
        };
      }
      
      // Ensure maxPriorityFeePerGas is not greater than maxFeePerGas
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(2000000000);
      let maxFeePerGas = feeData.maxFeePerGas || (feeData.gasPrice || BigInt(30000000000));
      
      // maxPriorityFeePerGas cannot exceed maxFeePerGas
      if (maxPriorityFeePerGas > maxFeePerGas) {
        maxPriorityFeePerGas = maxFeePerGas;
      }
      
      // Execute blockchain transaction with proper gas settings
      const contract = this.issuerRegistry.connect(this.signer);
      const tx = await contract.registerIssuer(name, organization, email, {
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      });
      
      // Wait for transaction receipt with retry logic for rate limiting
      let receipt = null;
      for (let i = 0; i < 5; i++) {
        try {
          receipt = await tx.wait();
          break;
        } catch (receiptError) {
          if (receiptError.message.includes('rate limited') || receiptError.code === -32005) {
            await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
            continue;
          }
          throw receiptError;
        }
      }
      
      if (!receipt) {
        throw new Error('Transaction submitted but could not confirm. Check your wallet for the transaction.');
      }
      
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
    // Anyone can receive credentials - no restrictions
    return true;
  }

  async validateUserRegistration(address = null) {
    // Anyone can now register as a user - no restrictions
    const targetAddress = address || this.account;
    
    if (!targetAddress) {
      console.log('No target address provided for validation');
      return false;
    }
    
    console.log('Validating user registration for address:', targetAddress);
    
    // Anyone can register - return true
    return true;
  }

  async registerUser(name, email = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }

      // Validate name parameter
      if (!name || name.trim() === '') {
        throw new Error('Name cannot be empty. Please provide a valid name for registration.');
      }

      // Validate user account eligibility
      const isEligible = await this.validateUserRegistration();
      if (!isEligible) {
        throw new Error('Registration not allowed. Please try again.');
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

      // Validate name parameter
      if (!name || name.trim() === '') {
        throw new Error('Name cannot be empty. Please provide a valid name for registration.');
      }

      // Validate user account eligibility
      const isEligible = await this.validateUserRegistration();
      if (!isEligible) {
        throw new Error('Registration not allowed. Please try again.');
      }

      // Execute blockchain transaction with proper gas settings
      const contract = this.userRegistry.connect(this.signer);
      let feeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (e) {
        feeData = { maxFeePerGas: BigInt(50000000000), maxPriorityFeePerGas: BigInt(2000000000), gasPrice: BigInt(2000000000) };
      }
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(2000000000);
      let maxFeePerGas = feeData.maxFeePerGas || (feeData.gasPrice || BigInt(30000000000));
      if (maxPriorityFeePerGas > maxFeePerGas) maxPriorityFeePerGas = maxFeePerGas;
      const tx = await contract.registerUser(name, email, {
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Fetch existing credentials from blockchain after successful registration
      const blockchainCredentials = await this.getHolderCredentials(this.account);
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        address: this.account,
        credentials: blockchainCredentials
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

      // Use local validation instead of contract call for better reliability
      const isEligible = await this.validateUserRegistration(targetAddress);
      const isRegistered = await this.userRegistry.isRegisteredUser(targetAddress);
      
      return {
        success: true,
        address: targetAddress,
        isEligible,
        isRegistered,
        canRegister: isEligible && !isRegistered
      };
    } catch (error) {
      console.error('Failed to check user registration status:', error);
      // Fallback to local validation
      const isEligible = await this.validateUserRegistration(targetAddress);
      return {
        isEligible,
        isRegistered: false,
        canRegister: isEligible
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
      if (!targetAddress) {
        console.log('No target address provided for credential fetch');
        return [];
      }
      
      if (!this.credentialRegistry) {
        console.log('Credential registry not loaded, attempting to initialize...');
        await this.init();
        if (!this.credentialRegistry) {
          console.log('Failed to initialize credential registry');
          return [];
        }
      }

      console.log(`Fetching credentials for address: ${targetAddress}`);
      
      try {
        const credentialIds = await this.credentialRegistry.getHolderCredentials(targetAddress);
        console.log(`Found ${credentialIds.length} credential IDs for ${targetAddress}:`, credentialIds.map(id => Number(id)));
        
        const credentials = [];
        
        for (const id of credentialIds) {
          try {
            const credential = await this.credentialRegistry.getCredential(Number(id));
            
            // Parse credential data if it's JSON
            let parsedData = {};
            try {
              parsedData = JSON.parse(credential.data);
            } catch {
              parsedData = { raw: credential.data };
            }
            
            // Generate unique credential ID for blockchain credentials
            const generateBlockchainCredentialId = (credentialType, blockchainId) => {
              let prefix = 'CRD';
              
              switch (credentialType.toLowerCase()) {
                case 'degree':
                case 'university degree':
                case 'academic credential':
                  prefix = 'DEG';
                  break;
                case 'certificate':
                case 'professional certificate':
                  prefix = 'CERT';
                  break;
                case 'license':
                case 'driving license':
                  prefix = 'LIC';
                  break;
                case 'pan':
                case 'pan card':
                  prefix = 'PAN';
                  break;
                default:
                  prefix = 'CRD';
              }
              
              // Use blockchain ID as part of unique identifier to ensure consistency
              const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              let randomStr = '';
              for (let i = 0; i < 4; i++) {
                randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
              }
              
              return `${prefix}-${blockchainId}${randomStr}`;
            };

            const uniqueId = generateBlockchainCredentialId(credential.credentialType, Number(credential.id));

            credentials.push({
              id: Number(credential.id),
              uniqueId: uniqueId,
              issuer: credential.issuer,
              holder: credential.holder,
              credentialType: credential.credentialType,
              data: parsedData,
              issuedAt: Number(credential.issuedAt),
              expiresAt: Number(credential.expiresAt),
              isActive: credential.isActive,
              isRevoked: credential.isRevoked,
              ipfsHash: credential.ipfsHash,
              status: credential.isRevoked ? 'Revoked' : (Number(credential.expiresAt) * 1000 < Date.now()) ? 'Expired' : 'Active',
              issueDate: new Date(Number(credential.issuedAt) * 1000).toISOString().split('T')[0],
              expiryDate: new Date(Number(credential.expiresAt) * 1000).toISOString().split('T')[0]
            });
          } catch (credError) {
            console.error(`Failed to get credential ${id}:`, credError);
          }
        }
        
        console.log(`Successfully fetched ${credentials.length} credentials for ${targetAddress}`);
        return credentials;
      } catch (contractError) {
        console.error('Contract call failed:', contractError);
        return [];
      }
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

  // Get current connected account from MetaMask directly
  async getCurrentAccount() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        return accounts.length > 0 ? accounts[0] : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // Debug function to identify current account
  // Event listener methods for real-time notifications
  async startListeningForCredentialEvents(userAddress, onCredentialIssued) {
    try {
      if (!this.credentialRegistry) {
        console.log('Credential registry not loaded, cannot start event listening');
        return false;
      }

      const listenerKey = `credential-issued-${userAddress}`;
      
      // Remove existing listener if any
      if (this.eventListeners.has(listenerKey)) {
        this.stopListeningForCredentialEvents(userAddress);
      }

      console.log(`🎧 Starting to listen for CredentialIssued events for user: ${userAddress}`);

      // Create event filter for CredentialIssued events where the user is the holder
      const filter = this.credentialRegistry.filters.CredentialIssued(null, null, userAddress);
      
      // Event handler function
      const eventHandler = async (...args) => {
        // Extract parameters safely - ethers.js v6 might pass them differently
        let credentialId, issuer, holder, credentialType, event = null;
        
        if (args.length >= 4) {
          [credentialId, issuer, holder, credentialType] = args;
          event = args[4] || null;
        } else if (args.length === 1 && args[0].args) {
          // If event object is passed directly
          const eventObj = args[0];
          credentialId = eventObj.args?.credentialId;
          issuer = eventObj.args?.issuer;
          holder = eventObj.args?.holder;
          credentialType = eventObj.args?.credentialType;
          event = eventObj;
        }
        
        console.log('🔔 CredentialIssued event detected!', {
          credentialId: Number(credentialId),
          issuer,
          holder,
          credentialType,
          blockNumber: event?.blockNumber || null,
          transactionHash: event?.transactionHash || null
        });

        try {
        // Validate required parameters
        if (!credentialId || !issuer || !holder || !credentialType) {
          console.error('❌ Missing required event parameters:', { credentialId, issuer, holder, credentialType });
          return;
        }

        // Get full credential details from blockchain
          const credential = await this.credentialRegistry.getCredential(Number(credentialId));
          
          // Parse credential data
          let parsedData = {};
          try {
            parsedData = JSON.parse(credential.data);
          } catch {
            parsedData = { raw: credential.data };
          }

          // Create notification data with all required fields
          const notificationData = {
            credentialId: Number(credentialId),
            issuer: issuer,
            holder: holder,
            credentialType: credentialType,
            issuerDID: `did:ethr:${issuer}`,
            credentialTitle: parsedData.title || `${credentialType} Credential`,
            issueDate: new Date(Number(credential.issuedAt) * 1000).toISOString(),
            expiryDate: new Date(Number(credential.expiresAt) * 1000).toISOString(),
            data: parsedData,
            blockNumber: event?.blockNumber || null,
            transactionHash: event?.transactionHash || null,
            timestamp: new Date().toISOString()
          };

          console.log('📋 Processed credential event data:', notificationData);

          // Call the callback function with notification data
          if (onCredentialIssued && typeof onCredentialIssued === 'function') {
            await onCredentialIssued(notificationData);
          }
        } catch (error) {
          console.error('❌ Error processing CredentialIssued event:', error);
        }
      };

      // Start listening for events
      this.credentialRegistry.on(filter, eventHandler);
      
      // Store the listener for cleanup
      this.eventListeners.set(listenerKey, {
        filter,
        handler: eventHandler,
        userAddress
      });

      console.log(`✅ Successfully started listening for CredentialIssued events for ${userAddress}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start listening for credential events:', error);
      return false;
    }
  }

  stopListeningForCredentialEvents(userAddress) {
    try {
      const listenerKey = `credential-issued-${userAddress}`;
      const listener = this.eventListeners.get(listenerKey);
      
      if (listener) {
        console.log(`🔇 Stopping CredentialIssued event listener for ${userAddress}`);
        this.credentialRegistry.off(listener.filter, listener.handler);
        this.eventListeners.delete(listenerKey);
        console.log(`✅ Successfully stopped listening for events for ${userAddress}`);
        return true;
      } else {
        console.log(`⚠️ No active listener found for ${userAddress}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error stopping credential event listener:', error);
      return false;
    }
  }

  // Stop all active event listeners
  stopAllEventListeners() {
    try {
      console.log(`🔇 Stopping all ${this.eventListeners.size} active event listeners`);
      
      for (const [key, listener] of this.eventListeners.entries()) {
        try {
          this.credentialRegistry.off(listener.filter, listener.handler);
          console.log(`✅ Stopped listener: ${key}`);
        } catch (error) {
          console.error(`❌ Error stopping listener ${key}:`, error);
        }
      }
      
      this.eventListeners.clear();
      console.log('✅ All event listeners stopped');
      return true;
    } catch (error) {
      console.error('❌ Error stopping all event listeners:', error);
      return false;
    }
  }

  async validateVerifierRegistration(address = null) {
    // Get the standard Hardhat accounts (these are deterministic)
    const standardHardhatAccounts = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Account 0
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account 1
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account 3
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
      '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account 5
      '0x976EA74026E726554dB657fA54763abd0C3a0aa9', // Account 6
      '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', // Account 7
      '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // Account 8
      '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'  // Account 9
    ];

    // Define allowed verifier accounts (accounts 8-9) - use real addresses
    const allowedVerifierAccounts = [
      '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // Account 8
      '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'  // Account 9
    ];

    const targetAddress = address || this.account;
    
    if (!targetAddress) {
      console.log('No target address provided for verifier validation');
      return false;
    }
    
    // Debug logging to help troubleshoot
    console.log('🔍 Validating verifier registration for address:', targetAddress);
    console.log('📋 Allowed verifier accounts (8-9):', allowedVerifierAccounts);
    console.log('📝 All Hardhat accounts:', standardHardhatAccounts);
    
    // Return boolean for UI validation
    const isValid = allowedVerifierAccounts.some(addr => 
      addr.toLowerCase() === targetAddress.toLowerCase()
    );
    console.log('✅ Is address valid for verifier registration:', isValid);
    
    // Additional debugging - show which account index this is
    const accountIndex = standardHardhatAccounts.findIndex(addr => 
      addr.toLowerCase() === targetAddress.toLowerCase()
    );
    console.log('🔢 Account index:', accountIndex >= 0 ? accountIndex : 'Not a standard Hardhat account');
    
    return isValid;
  }

  async registerVerifierOnChain(name, organization, email = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.verifierRegistry) {
        throw new Error('Verifier Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Validate verifier account eligibility
      const eligibility = await this.checkVerifierEligibility();
      if (!eligibility.isAllowed) {
        throw new Error('Registration not allowed. Please try again.');
      }
      if (eligibility.isRegistered) {
        throw new Error('This account is already registered as a verifier.');
      }

      console.log('Register clicked');
      console.log('🔐 Executing on-chain verifier registration...');
      
      // Execute blockchain transaction with proper gas settings
      const contract = this.verifierRegistry.connect(this.signer);
      let feeData;
      try {
        feeData = await this.provider.getFeeData();
      } catch (e) {
        feeData = { maxFeePerGas: BigInt(50000000000), maxPriorityFeePerGas: BigInt(2000000000), gasPrice: BigInt(2000000000) };
      }
      let maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(2000000000);
      let maxFeePerGas = feeData.maxFeePerGas || (feeData.gasPrice || BigInt(30000000000));
      if (maxPriorityFeePerGas > maxFeePerGas) maxPriorityFeePerGas = maxFeePerGas;
      const tx = await contract.registerVerifier(name, organization, email, {
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      });
      
      console.log('Tx sent:', tx.hash);
      console.log('⏳ Transaction submitted, waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('Tx confirmed:', tx.hash);
      console.log('✅ Verifier registration confirmed on blockchain');
      console.log('📋 Block number:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        address: this.account,
        name,
        organization,
        email
      };
    } catch (error) {
      console.error('❌ Verifier registration failed:', error);
      throw error;
    }
  }

  // Blockchain-based verification request functions
  async sendVerificationRequest(holderDID, credentialType, message = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }
      if (!this.credentialRegistry) {
        throw new Error('Credential Registry contract not loaded. Please ensure contracts are deployed.');
      }

      // Validate verifier eligibility
      const eligibility = await this.checkVerifierEligibility();
      if (!eligibility.isAllowed || !eligibility.isRegistered) {
        throw new Error('Only registered verifiers (accounts 8-9) can send verification requests.');
      }

      // Extract address from DID
      const holderAddress = holderDID.replace('did:ethr:', '');
      
      // Validate holder address format
      if (!ethers.isAddress(holderAddress)) {
        throw new Error('Invalid holder DID format. Please provide a valid Ethereum DID.');
      }

      // Check if holder is a valid user account (2-7)
      const allowedUserAccounts = [
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account 2
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Account 3
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Account 4
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', // Account 5
        '0x976EA74026E726554dB657fA54763abd0C3a0aa9', // Account 6
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'  // Account 7
      ];

      const isValidHolder = allowedUserAccounts.some(addr => 
        addr.toLowerCase() === holderAddress.toLowerCase()
      );

      if (!isValidHolder) {
        throw new Error('Verification requests can only be sent to user accounts (2-7).');
      }

      console.log('🔐 Sending verification request on blockchain...');
      console.log('📋 Request details:', {
        verifier: this.account,
        holder: holderAddress,
        credentialType,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
      });

      // Create verification request data
      const requestData = {
        verifierAddress: this.account,
        holderAddress: holderAddress,
        credentialType: credentialType,
        message: message,
        timestamp: Date.now(),
        status: 'pending'
      };

      // Sign the verification request with MetaMask
      const messageToSign = `Verification Request\n\nFrom: ${this.account}\nTo: ${holderAddress}\nCredential Type: ${credentialType}\nMessage: ${message}\nTimestamp: ${requestData.timestamp}`;
      
      console.log('📝 Signing verification request message...');
      const signature = await this.signer.signMessage(messageToSign);
      
      console.log('✅ Verification request signed successfully');
      console.log('🔑 Signature:', signature.substring(0, 20) + '...');

      return {
        success: true,
        signature,
        messageToSign,
        requestData: {
          ...requestData,
          signature,
          verifierDID: `did:ethr:${this.account}`,
          holderDID: holderDID
        },
        transactionHash: signature, // Use signature as transaction identifier
        blockNumber: null // No actual blockchain transaction for now
      };
    } catch (error) {
      console.error('❌ Verification request failed:', error);
      throw error;
    }
  }

  // Get verification requests for a verifier
  async getVerifierRequests(verifierAddress = null) {
    try {
      const targetAddress = verifierAddress || this.account;
      if (!targetAddress) {
        return [];
      }

      // For now, return empty array as we'll handle this through backend
      // In future, this could query blockchain events
      console.log('📋 Getting verification requests for verifier:', targetAddress);
      return [];
    } catch (error) {
      console.error('Failed to get verifier requests:', error);
      return [];
    }
  }

  // Get verification requests for a user (holder)
  async getUserVerificationRequests(userAddress = null) {
    try {
      const targetAddress = userAddress || this.account;
      if (!targetAddress) {
        return [];
      }

      // For now, return empty array as we'll handle this through backend
      // In future, this could query blockchain events
      console.log('📋 Getting verification requests for user:', targetAddress);
      return [];
    } catch (error) {
      console.error('Failed to get user verification requests:', error);
      return [];
    }
  }

  async checkVerifierRegistrationStatus(address = null) {
    try {
      const targetAddress = address || this.account;
      if (!targetAddress) {
        return {
          isEligible: false,
          isRegistered: false,
          canRegister: false
        };
      }

      // Use local validation for account eligibility
      const isEligible = await this.validateVerifierRegistration(targetAddress);
      
      // Check registration status directly from blockchain
      let isRegistered = false;
      try {
        if (this.verifierRegistry && isEligible) {
          isRegistered = await this.verifierRegistry.isRegisteredVerifier(targetAddress);
        }
      } catch (error) {
        console.log('Could not check verifier registration status from blockchain:', error);
      }
      
      return {
        success: true,
        address: targetAddress,
        isEligible,
        isRegistered,
        canRegister: isEligible && !isRegistered
      };
    } catch (error) {
      console.error('Failed to check verifier registration status:', error);
      // Fallback to local validation
      const isEligible = await this.validateVerifierRegistration(targetAddress);
      return {
        isEligible,
        isRegistered: false,
        canRegister: isEligible
      };
    }
  }

  // Get active listeners info
  getActiveListeners() {
    const listeners = [];
    for (const [key, listener] of this.eventListeners.entries()) {
      listeners.push({
        key,
        userAddress: listener.userAddress,
        type: 'CredentialIssued'
      });
    }
    return listeners;
  }

  // Fetch all past CredentialIssued events for a specific user
  async getPastCredentialEvents(userAddress, fromBlock = 0) {
    try {
      if (!this.credentialRegistry) {
        console.log('Credential registry not loaded, cannot fetch past events');
        return [];
      }

      console.log(`📜 Fetching past CredentialIssued events for ${userAddress} from block ${fromBlock}`);

      // Create event filter for CredentialIssued events where the user is the holder
      const filter = this.credentialRegistry.filters.CredentialIssued(null, null, userAddress);
      
      // Query past events
      const events = await this.credentialRegistry.queryFilter(filter, fromBlock, 'latest');
      
      console.log(`📜 Found ${events.length} past CredentialIssued events for ${userAddress}`);

      const processedEvents = [];
      
      for (const event of events) {
        try {
          // Extract event data
          const { credentialId, issuer, holder, credentialType } = event.args;
          
          console.log(`Processing past event: credentialId=${Number(credentialId)}, issuer=${issuer}, holder=${holder}, type=${credentialType}`);
          
          // Get full credential details from blockchain
          const credential = await this.credentialRegistry.getCredential(Number(credentialId));
          
          // Parse credential data
          let parsedData = {};
          try {
            parsedData = JSON.parse(credential.data);
          } catch {
            parsedData = { raw: credential.data };
          }

          // Create notification data structure
          const eventData = {
            credentialId: Number(credentialId),
            issuer: issuer,
            holder: holder,
            credentialType: credentialType,
            issuerDID: `did:ethr:${issuer}`,
            credentialTitle: parsedData.title || `${credentialType} Credential`,
            issueDate: new Date(Number(credential.issuedAt) * 1000).toISOString(),
            expiryDate: new Date(Number(credential.expiresAt) * 1000).toISOString(),
            data: parsedData,
            blockNumber: event?.blockNumber || null,
            transactionHash: event?.transactionHash || null,
            timestamp: new Date(Number(credential.issuedAt) * 1000).toISOString(),
            isPastEvent: true
          };

          processedEvents.push(eventData);
          console.log(`✅ Processed past event for credential ${credentialId}`);
        } catch (error) {
          console.error(`❌ Error processing past event:`, error);
        }
      }

      console.log(`✅ Successfully processed ${processedEvents.length} past events for ${userAddress}`);
      return processedEvents;
    } catch (error) {
      console.error('❌ Failed to fetch past credential events:', error);
      return [];
    }
  }

  // On-chain credential sharing with MetaMask signing
  async shareCredential(credential, verifierDID, message = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }

      // Validate user eligibility (only accounts 2-7 can share credentials)
      const isEligibleUser = await this.validateUserRegistration();
      if (!isEligibleUser) {
        throw new Error('Only user accounts (2-7) can share credentials.');
      }

      // Extract verifier address from DID
      const verifierAddress = verifierDID.replace('did:ethr:', '');
      
      // Validate verifier address format
      if (!ethers.isAddress(verifierAddress)) {
        throw new Error('Invalid verifier DID format. Please provide a valid Ethereum DID.');
      }

      // Check if verifier is a valid verifier account (8-9)
      const allowedVerifierAccounts = [
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // Account 8
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'  // Account 9
      ];

      const isValidVerifier = allowedVerifierAccounts.some(addr => 
        addr.toLowerCase() === verifierAddress.toLowerCase()
      );

      if (!isValidVerifier) {
        throw new Error('Credentials can only be shared with registered verifiers (accounts 8-9).');
      }

      console.log('🔐 Sharing credential on blockchain...');
      console.log('📋 Share details:', {
        holder: this.account,
        verifier: verifierAddress,
        credentialId: credential.id || credential.uniqueId,
        credentialType: credential.credentialType || credential.type
      });

      // Create credential sharing data
      const shareData = {
        holderAddress: this.account,
        verifierAddress: verifierAddress,
        credentialId: credential.id || credential.uniqueId,
        credentialType: credential.credentialType || credential.type,
        credentialTitle: credential.title || credential.data?.title || 'Untitled Credential',
        message: message,
        timestamp: Date.now(),
        holderDID: `did:ethr:${this.account}`,
        verifierDID: verifierDID
      };

      // Create message to sign with MetaMask
      const messageToSign = `Share Credential\n\nCredential ID: ${shareData.credentialId}\nCredential Type: ${shareData.credentialType}\nTitle: ${shareData.credentialTitle}\n\nFrom: ${this.account}\nTo: ${verifierAddress}\nMessage: ${message}\n\nTimestamp: ${shareData.timestamp}`;
      
      console.log('📝 Signing credential sharing message with MetaMask...');
      const signature = await this.signer.signMessage(messageToSign);
      
      console.log('✅ Credential sharing signed successfully');
      console.log('🔑 Signature:', signature.substring(0, 20) + '...');

      // Create blockchain transaction data
      const blockchainData = {
        ...shareData,
        signature,
        messageToSign,
        signedAt: new Date().toISOString()
      };

      return {
        success: true,
        signature,
        messageToSign,
        shareData: blockchainData,
        transactionHash: signature, // Use signature as transaction identifier
        blockNumber: null, // No actual blockchain transaction for credential sharing
        message: `Credential "${shareData.credentialTitle}" shared with ${verifierDID}`
      };
    } catch (error) {
      console.error('❌ Credential sharing failed:', error);
      throw error;
    }
  }

  // Validate verifier DID format and eligibility
  async validateVerifierDID(verifierDID) {
    try {
      if (!verifierDID || !verifierDID.startsWith('did:ethr:')) {
        return {
          isValid: false,
          error: 'DID must start with "did:ethr:"'
        };
      }

      const verifierAddress = verifierDID.replace('did:ethr:', '');
      
      if (!ethers.isAddress(verifierAddress)) {
        return {
          isValid: false,
          error: 'Invalid Ethereum address in DID'
        };
      }

      // Check if verifier is eligible (accounts 8-9)
      const allowedVerifierAccounts = [
        '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', // Account 8
        '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'  // Account 9
      ];

      const isValidVerifier = allowedVerifierAccounts.some(addr => 
        addr.toLowerCase() === verifierAddress.toLowerCase()
      );

      if (!isValidVerifier) {
        return {
          isValid: false,
          error: 'Credentials can only be shared with registered verifiers (accounts 8-9)'
        };
      }

      // Check if verifier is registered on blockchain (optional check)
      let isRegistered = false;
      try {
        if (this.verifierRegistry) {
          isRegistered = await this.verifierRegistry.isRegisteredVerifier(verifierAddress);
        }
      } catch (error) {
        console.log('Could not check verifier registration status:', error);
      }

      return {
        isValid: true,
        address: verifierAddress,
        isRegistered,
        accountType: 'verifier'
      };
    } catch (error) {
      console.error('Error validating verifier DID:', error);
      return {
        isValid: false,
        error: 'Failed to validate verifier DID'
      };
    }
  }

  // MetaMask signing for credential verification approval
  async approveCredentialVerification(credentialData, message = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }

      // Validate verifier eligibility
      const eligibility = await this.checkVerifierEligibility();
      if (!eligibility.isAllowed || !eligibility.isRegistered) {
        throw new Error('Only registered verifiers (accounts 8-9) can approve credential verifications.');
      }

      console.log('🔐 Approving credential verification with MetaMask...');
      console.log('📋 Credential details:', {
        credentialId: credentialData.id,
        credentialType: credentialData.credentialType,
        recipientDID: credentialData.recipientDID,
        verifier: this.account
      });

      // Create approval data
      const approvalData = {
        action: 'APPROVE',
        verifierAddress: this.account,
        verifierDID: `did:ethr:${this.account}`,
        credentialId: credentialData.id,
        credentialType: credentialData.credentialType,
        recipientDID: credentialData.recipientDID,
        recipientName: credentialData.recipientName,
        message: message,
        timestamp: Date.now(),
        status: 'approved'
      };

      // Create message to sign with MetaMask
      const messageToSign = `Approve Credential Verification\n\nAction: APPROVE\nCredential ID: ${approvalData.credentialId}\nCredential Type: ${approvalData.credentialType}\nRecipient: ${approvalData.recipientDID}\n\nVerifier: ${this.account}\nMessage: ${message}\n\nTimestamp: ${approvalData.timestamp}`;
      
      console.log('📝 Signing credential approval with MetaMask...');
      const signature = await this.signer.signMessage(messageToSign);
      
      console.log('✅ Credential approval signed successfully');
      console.log('🔑 Signature:', signature.substring(0, 20) + '...');

      return {
        success: true,
        signature,
        messageToSign,
        approvalData: {
          ...approvalData,
          signature,
          signedAt: new Date().toISOString()
        },
        transactionHash: signature, // Use signature as transaction identifier
        message: `Credential verification approved by ${approvalData.verifierDID}`
      };
    } catch (error) {
      console.error('❌ Credential approval failed:', error);
      throw error;
    }
  }

  // MetaMask signing for credential verification rejection
  async rejectCredentialVerification(credentialData, message = '') {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected. Please connect your MetaMask wallet first.');
      }

      // Validate verifier eligibility
      const eligibility = await this.checkVerifierEligibility();
      if (!eligibility.isAllowed || !eligibility.isRegistered) {
        throw new Error('Only registered verifiers (accounts 8-9) can reject credential verifications.');
      }

      console.log('🔐 Rejecting credential verification with MetaMask...');
      console.log('📋 Credential details:', {
        credentialId: credentialData.id,
        credentialType: credentialData.credentialType,
        recipientDID: credentialData.recipientDID,
        verifier: this.account
      });

      // Create rejection data
      const rejectionData = {
        action: 'REJECT',
        verifierAddress: this.account,
        verifierDID: `did:ethr:${this.account}`,
        credentialId: credentialData.id,
        credentialType: credentialData.credentialType,
        recipientDID: credentialData.recipientDID,
        recipientName: credentialData.recipientName,
        message: message,
        timestamp: Date.now(),
        status: 'rejected'
      };

      // Create message to sign with MetaMask
      const messageToSign = `Reject Credential Verification\n\nAction: REJECT\nCredential ID: ${rejectionData.credentialId}\nCredential Type: ${rejectionData.credentialType}\nRecipient: ${rejectionData.recipientDID}\n\nVerifier: ${this.account}\nMessage: ${message}\n\nTimestamp: ${rejectionData.timestamp}`;
      
      console.log('📝 Signing credential rejection with MetaMask...');
      const signature = await this.signer.signMessage(messageToSign);
      
      console.log('✅ Credential rejection signed successfully');
      console.log('🔑 Signature:', signature.substring(0, 20) + '...');

      return {
        success: true,
        signature,
        messageToSign,
        rejectionData: {
          ...rejectionData,
          signature,
          signedAt: new Date().toISOString()
        },
        transactionHash: signature, // Use signature as transaction identifier
        message: `Credential verification rejected by ${rejectionData.verifierDID}`
      };
    } catch (error) {
      console.error('❌ Credential rejection failed:', error);
      throw error;
    }
  }

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
    console.log('Active Event Listeners:', this.getActiveListeners().length);
    console.log('========================');
    
    return {
      address: currentAccount,
      type: accountInfo,
      isIssuerAccount: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'].includes(currentAccount),
      activeListeners: this.getActiveListeners()
    };
  }
}

// Export both the class and a singleton instance
export { Web3Service };
export default new Web3Service();
