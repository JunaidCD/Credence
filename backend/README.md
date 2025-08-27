# Credence Contracts - Pure DApp

Smart contracts for the Credence decentralized credential management system. This is a **pure DApp** with all data stored on-chain, no backend server required.

## 🚀 Features

- **Pure DApp Architecture**: No backend server, all data on blockchain
- **Smart Contracts**: Solidity contracts for issuer registration and credential management
- **Hardhat Integration**: Local blockchain development environment
- **Direct MetaMask Integration**: Frontend connects directly to smart contracts
- **Restricted Issuers**: Only Hardhat accounts 0 and 1 can register as issuers
- **Complete On-chain Storage**: All credential data stored on blockchain

## 📁 Project Structure

```
backend/
├── contracts/
│   ├── IssuerRegistry.sol      # Issuer registration and management
│   └── CredentialRegistry.sol  # Credential issuance and verification
├── scripts/
│   └── deploy.js              # Contract deployment script
├── hardhat.config.js          # Hardhat configuration
└── package.json               # Dependencies and scripts
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Hardhat Local Network

```bash
# Terminal 1 - Start Hardhat node
npm run node
```

This will start a local Ethereum network on `http://127.0.0.1:8545` with pre-funded accounts.

### 3. Deploy Smart Contracts

```bash
# Terminal 2 - Deploy contracts
npm run deploy:local
```

This will deploy the contracts and save deployment info to `deployment-info.json` and copy it to the frontend public folder for direct access.

## 🎯 Smart Contract Details

### IssuerRegistry Contract

**Purpose**: Manages issuer registration and validation

**Key Features**:
- Only allows Hardhat accounts 0 and 1 to register as issuers
- Stores issuer information (name, organization, email)
- Tracks credential issuance statistics
- Provides issuer status management

**Hardhat Account Addresses**:
- Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Account 1: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

### CredentialRegistry Contract

**Purpose**: Manages credential lifecycle and verification

**Key Features**:
- Issue credentials with expiration dates
- Revoke credentials
- Request and process verification
- Store credential metadata and IPFS hashes
- Track credential ownership and status

## 🔧 Frontend Integration

The frontend Web3 service (`frontend/client/src/utils/web3.js`) connects directly to smart contracts:

1. **Direct Contract Interaction**: No API calls, pure blockchain communication
2. **MetaMask Connection**: Users connect wallets directly to contracts
3. **Contract Address Loading**: Reads deployment info from public folder
4. **On-chain Operations**: All CRUD operations via smart contract calls

## 📝 Usage Flow

1. **Deploy Contracts**: Run Hardhat node and deploy contracts
2. **Connect MetaMask**: Users connect wallet to localhost:8545
3. **Switch Accounts**: Use Hardhat account 0 or 1 in MetaMask
4. **Register as Issuer**: Direct blockchain transaction via MetaMask
5. **Issue Credentials**: Direct smart contract calls for credential creation
6. **Verify Credentials**: All verification logic handled on-chain

## 🔍 Development Commands

```bash
# Compile contracts
npm run compile

# Deploy to localhost
npm run deploy:local

# Start Hardhat node
npm run node
```

## 🌐 Network Configuration

- **Network**: Hardhat Localhost
- **Chain ID**: 31337
- **RPC URL**: http://127.0.0.1:8545
- **Accounts**: Pre-funded test accounts with 10,000 ETH each

## 🔐 Security Features

- **Restricted Registration**: Only specific accounts can become issuers
- **On-chain Validation**: All operations validated by smart contracts
- **Signature Verification**: MetaMask signatures required for transactions
- **Access Control**: Role-based permissions for different operations

## 🚨 Important Notes

- **Pure DApp**: No backend server required - frontend connects directly to contracts
- **Localhost Development**: This setup is for local development only
- **Required Accounts**: Use Hardhat accounts 0 or 1 for issuer registration
- **Two Terminals**: Keep Hardhat node running and deploy contracts once
- **MetaMask Setup**: Connect to localhost:8545 with Chain ID 31337
- **Contract Addresses**: Automatically saved to frontend public folder

## 📞 Troubleshooting

If you encounter issues, verify:

1. **Hardhat Node**: Running on `http://127.0.0.1:8545`
2. **Contracts**: Successfully deployed with addresses in `deployment-info.json`
3. **Frontend**: Can access deployment info from public folder
4. **MetaMask**: Connected to localhost network (Chain ID: 31337)
5. **Account**: Using Hardhat account 0 or 1 for issuer operations

## 🎯 Quick Start

```bash
# Terminal 1: Start blockchain
npm run node

# Terminal 2: Deploy contracts (run once)
npm run deploy:local

# Then start frontend and connect MetaMask to localhost:8545
```
