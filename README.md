# 🛡️ Credence - Decentralized Identity & Credential Verification System

[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum%20Sepolia-28a0f0?style=flat-square)](https://sepolia.arbiscan.io/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=flat-square)](https://docs.soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Credence** is a comprehensive blockchain-based platform for issuing, managing, and verifying digital credentials using Ethereum smart contracts and MetaMask integration. Built with modern web technologies, it provides a secure, transparent, and decentralized approach to credential management.

---

## 🔗 Smart Contracts (Live on Arbitrum Sepolia)

| Contract | Etherscan | Description |
|----------|-----------|-------------|
| **CredentialRegistry** | [View on Arbiscan](https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS) | Main credential contract |
| **IssuerRegistry** | [View on Arbiscan](https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS) | Issuer management |
| **UserRegistry** | [View on Arbiscan](https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS) | User management |
| **VerifierRegistry** | [View on Arbiscan](https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS) | Verifier management |

> 📝 **Note:** Replace `YOUR_CONTRACT_ADDRESS` with actual deployed contract addresses after deployment.

---

## 🌟 Features

### 🔐 **Core Functionality**
- **Decentralized Identity Management**: Ethereum-based DIDs (Decentralized Identifiers)
- **Smart Contract Integration**: Secure credential storage and verification on blockchain
- **MetaMask Integration**: Seamless wallet connectivity and transaction signing
- **Role-Based Access Control**: Separate interfaces for Users, Issuers, and Verifiers
- **EIP-712 Signatures**: Off-chain credential issuance with typed data signatures
- **Merkle Proofs**: Selective disclosure for privacy-preserving verification
- **Zero-Knowledge Proofs (ZK)**: Privacy-preserving credential verification using snarkjs + Circom
- **Off-Chain Storage**: IPFS/Arweave for credential metadata storage

### 👥 **User Roles**
- **Users (Accounts 2-7)**: Receive, manage, and share credentials
- **Issuers (Accounts 0-1)**: Issue and manage digital credentials
- **Verifiers (Accounts 8-9)**: Verify and approve shared credentials (Recruiters)

### 🎯 **Key Features**
- **Real-time Notifications**: Instant updates for credential activities via event emission
- **Blockchain Verification**: Cryptographic proof of credential authenticity using EIP-712 signatures
- **Credential Sharing**: Secure sharing with verifiers using EIP-712 typed data signatures
- **Dashboard Analytics**: Comprehensive statistics and activity tracking
- **Responsive Design**: Modern, mobile-friendly interface with TailwindCSS

---

## 🏗️ Architecture

### **Frontend Stack**
- **React 18** with Hooks and Context API for state management
- **Vite** for fast development and building
- **TailwindCSS** for modern styling
- **Shadcn/UI** for accessible, consistent component library
- **React Query** for efficient server state management
- **Wouter** for lightweight client-side routing
- **Ethers.js v6** for blockchain interaction and EIP-712 typed data signing

### **Backend Stack**
- **Node.js** with Express.js
- **Hardhat** for Ethereum development
- **Solidity 0.8.x** smart contracts
- **Ethers.js** for blockchain interaction
- **In-memory storage** for development (extensible to databases)

### **Blockchain Layer**
- **Ethereum** compatible networks
- **MetaMask** for wallet management
- **Smart Contracts** for credential registry
- **Event-driven** architecture for real-time updates

---

## 📋 Prerequisites

Before running Credence locally, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git** for version control

---

## 🚀 Local Development Setup

Follow these steps to run Credence on your local machine:

### 1. **Clone the Repository**
```bash
git clone https://github.com/JunaidCD/Credence.git
cd Credence
```

### 2. **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start local Hardhat blockchain node (keep this terminal open)
npx hardhat node
```

### 3. **Deploy Smart Contracts**
Open a **new terminal** and run:
```bash
# Make sure you're in the backend directory
cd backend

# Compile smart contracts
npm run compile

# Deploy contracts to local network
npm run deploy:local
```

### 4. **Frontend Setup**
Open a **third terminal** and run:
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. **Access the Application**
Open your browser and navigate to:
```
http://localhost:5000
```

---

## 🔧 MetaMask Configuration

### **Network Setup**
Add the local Hardhat network to MetaMask:
- **Network Name**: Hardhat Localhost
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### **Import Test Accounts**
Import these private keys into MetaMask for testing:

**Issuer Accounts (0-1):**
```
Account 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Account 1: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**User Accounts (2-7):**
```
Account 2: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Account 3: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
Account 4: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
Account 5: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
Account 6: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
Account 7: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
```

**Verifier Accounts (8-9):**
```
Account 8: 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
Account 9: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```

---

## 🎮 Usage Guide

### **For Users (Credential Holders)**
1. **Register**: Connect MetaMask and register as a user
2. **Receive Credentials**: Credentials issued by issuers appear automatically
3. **Share Credentials**: Share with verifiers using their DID
4. **Track Status**: Monitor verification status in real-time
5. **Notifications**: Receive updates about credential activities

### **For Issuers (Universities, Companies)**
1. **Register**: Connect MetaMask and register as an issuer
2. **Issue Credentials**: Create and issue credentials to users
3. **EIP-712 Signing**: Sign credentials off-chain using MetaMask
4. **Manage Portfolio**: Track issued credentials and their status
5. **Blockchain Integration**: All issuance recorded on blockchain

### **For Verifiers (Recruiters, Employers)**
1. **Register**: Connect MetaMask and register as a verifier
2. **Review Credentials**: View credentials shared by users
3. **Verify Credentials**: Use EIP-712 or Merkle Proof verification
4. **Dashboard Analytics**: Track verification statistics

---

## ⛓️ How to Interact with Live Contracts

### Prerequisites
1. **MetaMask** browser extension installed
2. **ARB Sepolia** testnet added to MetaMask
3. **Test ETH** from Arbitrum Sepolia faucet

### Add Arbitrum Sepolia to MetaMask
| Setting | Value |
|---------|-------|
| Network Name | Arbitrum Sepolia |
| RPC URL | `https://sepolia-rollup.arbitrum.io/rpc` |
| Chain ID | `421614` |
| Currency Symbol | `ETH` |
| Block Explorer | `https://sepolia.arbiscan.io` |

### Get Test ETH
1. Go to [Arbitrum Sepolia Faucet](https://faucet.arbiscan.io/)
2. Enter your wallet address
3. Wait for test ETH to arrive

### Deploy Contracts to Arbitrum Sepolia
```bash
cd backend

# Compile contracts
npm run compile

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

### Update Frontend Configuration
After deployment, update the frontend with the new contract addresses:

```javascript
// frontend/client/src/utils/web3.js
const CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_CONTRACT_ADDRESS";
const NETWORK_ID = 421614; // Arbitrum Sepolia
const RPC_URL = "https://sepolia-rollup.arbitrum.io/rpc";
```

### View Contracts on Arbiscan
- **CredentialRegistry**: `https://sepolia.arbiscan.io/address/YOUR_CONTRACT_ADDRESS`
- **Verify Contract**: Search your address on [Arbiscan](https://sepolia.arbiscan.io/)

### Interact via Remix (Optional)
1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Connect to "Injected Provider - MetaMask"
3. Select Arbitrum Sepolia network
4. Load contract ABI (from `backend/artifacts/`)
5. Interact with deployed contracts

---

## 🔗 Smart Contracts Overview

### **Core Contracts**
| Contract | Description |
|----------|-------------|
| **UserRegistry** | Manages user registration and profiles |
| **IssuerRegistry** | Handles issuer registration and permissions |
| **CredentialRegistry** | Stores and manages credentials on blockchain |
| **VerifierRegistry** | Manages verifier registrations |
| **AccessControl** | Role-based access control |

For detailed API documentation, see [API.md](API.md).

---

## 📊 Project Structure

```
Credence/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── CredentialRegistry.sol
│   │   ├── IssuerRegistry.sol
│   │   ├── UserRegistry.sol
│   │   ├── VerifierRegistry.sol
│   │   └── AccessControl.sol
│   ├── scripts/           # Deployment scripts
│   ├── artifacts/         # Compiled contracts
│   ├── cache/             # Hardhat cache
│   ├── utils/             # IPFS/Arweave utilities
│   ├── routes/            # API routes
│   └── package.json
├── frontend/
│   ├── client/            # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── public/
│   ├── server/            # Express.js backend
│   └── shared/            # Shared types/schemas
├── README.md
├── API.md                 # Detailed API Reference
└── SETUP.md
```

---

## 🛠️ Development Scripts

### **Backend Scripts**
```bash
npm run compile      # Compile smart contracts
npm run deploy:local # Deploy to local network
npm run test         # Run contract tests
npx hardhat node     # Start local blockchain
```

### **Frontend Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🔒 Security Features

- **MetaMask Integration**: Secure wallet-based authentication using browser extension
- **Blockchain Verification**: Immutable credential records stored on Ethereum
- **EIP-712 Typed Data**: Human-readable signatures for secure off-chain credential issuance
- **Merkle Proofs**: Cryptographic verification without data disclosure
- **Role-Based Access**: Strict permission controls with onlyRegisteredIssuer modifier
- **Event Logging**: Comprehensive audit trails for all credential operations
- **Replay Attack Protection**: Nonce-based signature validation

---

## 🚀 Deployment

### **Production Deployment**
1. Configure environment variables
2. Deploy smart contracts to mainnet/testnet
3. Build frontend for production
4. Deploy to hosting platform (Vercel, Netlify, etc.)
5. Configure MetaMask for production network

### **Environment Variables**
```env
REACT_APP_CONTRACT_ADDRESS=your_contract_address
REACT_APP_NETWORK_ID=your_network_id
REACT_APP_RPC_URL=your_rpc_url
```

---

## 📚 More Information

- **[API.md](API.md)** - Detailed API reference and technical specifications
- **[SETUP.md](SETUP.md)** - Additional setup instructions
- **Smart Contract API** - See [API.md](API.md#smart-contracts-api)
- **EIP-712 Credentials** - See [API.md](API.md#eip-712-credentials)
- **Zero-Knowledge Proofs** - See [API.md](API.md#zero-knowledge-proofs-zk)
- **IPFS/Arweave Storage** - See [API.md](API.md#off-chain-storage)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Junaid** - [GitHub Profile](https://github.com/JunaidCD)

---

## 🙏 Acknowledgments

- **Ethereum Foundation** for blockchain infrastructure
- **MetaMask** for wallet integration
- **Hardhat** for development framework
- **React Team** for the frontend framework
- **Tailwind CSS** for styling framework
- **OpenZeppelin** for secure smart contract libraries

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/JunaidCD/Credence/issues) page
2. Create a new issue with detailed description
3. Join our community discussions

---

**🎉 Happy Coding with Credence!** 🛡️

*Building the future of decentralized identity, one credential at a time.*
