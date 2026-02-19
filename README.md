# 🛡️ Credence - Decentralized Identity & Credential Verification System (L2)

[![Arbitrum Sepolia](https://img.shields.io/badge/Network-Arbitrum%20Sepolia%20(L2)-28a0f0?style=flat-square)](https://sepolia.arbiscan.io/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=flat-square)](https://docs.soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Credence** is a comprehensive blockchain-based platform for issuing, managing, and verifying digital credentials. Built with modern web technologies, it provides a secure, transparent, and decentralized approach to credential management on **Arbitrum Sepolia (L2)**.

---

## 🔗 Smart Contracts (Live on Arbitrum Sepolia L2)

| Contract | Address | Transaction | Description |
|----------|---------|-------------|-------------|
| **CredentialRegistry** | [0x5d43665D082d49100F56831Ed9D3b32a41a51950](https://sepolia.arbiscan.io/address/0x5d43665D082d49100F56831Ed9D3b32a41a51950) | [View Tx](https://sepolia.arbiscan.io/tx/0xb2d5d3e3085b5579cfc0c80a83bceb6a77867760d6226f2ec1478a5ca732b810) | Main credential contract |
| **IssuerRegistry** | [0x6127215cC0f3DBD44c78EA1158e68FC570527be2](https://sepolia.arbiscan.io/address/0x6127215cC0f3DBD44c78EA1158e68FC570527be2) | [View Tx](https://sepolia.arbiscan.io/tx/0xe4b88f574f7c1af800648c40ade4e6a3498c348222c272c1dc784655a68888ac) | Issuer management |
| **UserRegistry** | [0xa3eE836757817cCbED082FfE51B0a83E303B2b95](https://sepolia.arbiscan.io/address/0xa3eE836757817cCbED082FfE51B0a83E303B2b95) | [View Tx](https://sepolia.arbiscan.io/tx/0x4055a754b6443db831a124d6e23202a4320cd7655d3e25131d51ce61f385126b) | User management |
| **VerifierRegistry** | [0x2E46be122A43F1aaA447b64112d7aca01d970F40](https://sepolia.arbiscan.io/address/0x2E46be122A43F1aaA447b64112d7aca01d970F40) | [View Tx](https://sepolia.arbiscan.io/tx/0xae52e93dbcf9900f50be642d895420742830e9c9465890e4b624c4de6e27af51) | Verifier management |

**Network:** Arbitrum Sepolia (Chain ID: 421614) - Layer 2
**Explorer:** [https://sepolia.arbiscan.io](https://sepolia.arbiscan.io)

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
- **Low Gas Fees**: Deployed on Arbitrum Sepolia L2 for cost-effective transactions

### 👥 **User Roles**
- **Users**: Receive, manage, and share credentials
- **Issuers**: Issue and manage digital credentials (universities, companies)
- **Verifiers**: Verify and approve shared credentials (recruiters, employers)

### 🎯 **Key Features**
- **Real-time Notifications**: Instant updates for credential activities via event emission
- **Blockchain Verification**: Cryptographic proof of credential authenticity using EIP-712 signatures
- **Credential Sharing**: Secure sharing with verifiers using EIP-712 typed data signatures
- **Dashboard Analytics**: Comprehensive statistics and activity tracking
- **Responsive Design**: Modern, mobile-friendly interface with TailwindCSS

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, Vite, Tailwind CSS |
| **Web3** | Ethers.js, MetaMask |
| **Blockchain** | Arbitrum, Solidity |
| **Backend** | Node.js, Express |
| **Database** | SQLite (Drizzle ORM) |
| **Storage** | IPFS, Arweave |
| **ZK Proofs** | Circom, Groth16 |
| **Testing** | Hardhat, Chai |

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
- **Arbitrum Sepolia** (L2) - Primary test network
- **MetaMask** for wallet management
- **Smart Contracts** for credential registry
- **Event-driven** architecture for real-time updates

---

## 📋 Prerequisites

Before running Credence, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Git** for version control

---

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone https://github.com/JunaidCD/Credence.git
cd Credence
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
# Backend
cd backend
cp .env.example .env
```

Edit `.env` with your values (see Environment Variables section below).

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 🖥️ Running the Application

### Option 1: Using Arbitrum Sepolia (Recommended - Live Contracts)

The contracts are already deployed to Arbitrum Sepolia. Just configure MetaMask:

1. **Add Arbitrum Sepolia to MetaMask:**
   | Setting | Value |
   |---------|-------|
   | Network Name | Arbitrum Sepolia |
   | RPC URL | `https://sepolia-rollup.arbitrum.io/rpc` |
   | Chain ID | `421614` |
   | Currency Symbol | `ETH` |
   | Block Explorer | `https://sepolia.arbiscan.io` |

2. **Get Test ETH:**
   - Go to [Arbitrum Sepolia Faucet](https://faucet.arbiscan.io/)
   - Enter your wallet address
   - Wait for test ETH to arrive

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the Application:**
   ```
   http://localhost:5173
   ```

---

### Option 2: Running Locally with Hardhat

#### Start Hardhat Local Node

```bash
cd backend
npx hardhat node
```

This will start a local blockchain at `http://127.0.0.1:8545` with 10 test accounts.

#### Add Local Network to MetaMask

| Setting | Value |
|---------|-------|
| Network Name | Hardhat Localhost |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

#### Import Test Account (Optional)

For testing, you can import one of Hardhat's test accounts into MetaMask:

```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Deploy Contracts to Local Network

Open a **new terminal**:

```bash
cd backend

# Compile smart contracts
npm run compile

# Deploy to local network
npm run deploy:local
```

#### Start Frontend

```bash
cd frontend
npm run dev
```

#### Access the Application

```
http://localhost:5173
```

---

### Option 3: Deploy to Arbitrum Sepolia

```bash
cd backend

# Compile contracts
npm run compile

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

After deployment, the contract addresses will be:
- Saved to `backend/deployment-info.json`
- Saved to `frontend/client/public/deployment-info.json`

The frontend will automatically load the new addresses.

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory:

```env
# ======================
# ARBITRUM SEPOLIA (L2 Testnet)
# ======================
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
ARBISCAN_API_KEY=your_arbiscan_api_key

# ======================
# ETHERSCAN / ARBISCAN
# ======================
# Get your API key from https://arbiscan.io/apis
ETHERSCAN_API_KEY=your_etherscan_api_key

# ======================
# WALLET CONFIGURATION
# ======================
# Your wallet private key (DO NOT COMMIT THIS!)
# For deployment - use a wallet with testnet ETH
PRIVATE_KEY=0xyour_private_key_here

# ======================
# SEPOLIA NETWORK (L1 Testnet - Optional)
# ======================
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# ======================
# IPFS / PINATA (Optional)
# ======================
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# ======================
# GAS REPORTER (Optional)
# ======================
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### Getting API Keys:

- **Arbiscan API Key**: https://arbiscan.io/apis
- **Infura**: https://infura.io
- **Pinata**: https://www.pinata.cloud

---

## 🎮 Usage Guide

### For Users (Credential Holders)
1. **Register**: Connect MetaMask and register as a user
2. **Receive Credentials**: Credentials issued by issuers appear automatically
3. **Share Credentials**: Share with verifiers using their wallet address
4. **Track Status**: Monitor verification status in real-time

### For Issuers (Universities, Companies)
1. **Register**: Connect MetaMask and register as an issuer
2. **Issue Credentials**: Create and issue credentials to users
3. **EIP-712 Signing**: Sign credentials off-chain using MetaMask
4. **Manage Portfolio**: Track issued credentials and their status

### For Verifiers (Recruiters, Employers)
1. **Register**: Connect MetaMask and register as a verifier
2. **Review Credentials**: View credentials shared by users
3. **Verify Credentials**: Use EIP-712 or Merkle Proof verification
4. **Dashboard Analytics**: Track verification statistics

---

## 🔗 Smart Contracts Overview

### Core Contracts
| Contract | Description |
|----------|-------------|
| **UserRegistry** | Manages user registration and profiles |
| **IssuerRegistry** | Handles issuer registration and permissions |
| **CredentialRegistry** | Stores and manages credentials on blockchain |
| **VerifierRegistry** | Manages verifier registrations |

For detailed API documentation, see [TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md).

---

## 📊 Project Structure

```
Credence/
├── backend/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── CredentialRegistry.sol
│   │   ├── IssuerRegistry.sol
│   │   ├── UserRegistry.sol
│   │   └── VerifierRegistry.sol
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
└── TECHNICAL_REFERENCE.md
```

---

## 🛠️ Development Scripts

### Backend Scripts
```bash
npm run compile      # Compile smart contracts
npm run deploy:local # Deploy to local network
npm run test         # Run contract tests
npx hardhat node     # Start local blockchain
```

### Frontend Scripts
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

### Production Deployment
1. Configure environment variables
2. Deploy smart contracts to mainnet/testnet
3. Build frontend for production
4. Deploy to hosting platform (Vercel, Netlify, etc.)
5. Configure MetaMask for production network

---

## 📚 More Information

- **[TECHNICAL_REFERENCE.md](TECHNICAL_REFERENCE.md)** - Detailed API reference and technical specifications
- **Smart Contract API** - See Technical Reference
- **EIP-712 Credentials** - Typed data signing
- **Zero-Knowledge Proofs** - Privacy-preserving verification
- **IPFS/Arweave Storage** - Off-chain metadata storage

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Junaid** - [GitHub Profile](https://github.com/JunaidCD)

---

## 🙏 Acknowledgments

- **[Ethereum Foundation](https://ethereum.org/)** for blockchain infrastructure
- **[Arbitrum](https://arbitrum.io/)** for L2 scaling solution
- **[MetaMask](https://metamask.io/)** for wallet integration
- **[Hardhat](https://hardhat.org/)** for development framework
- **[React Team](https://react.dev/)** for the frontend framework
- **[Tailwind CSS](https://tailwindcss.com/)** for styling framework
- **[OpenZeppelin](https://openzeppelin.com/)** for secure smart contract libraries

---

**🎉 Happy Coding with Credence!** 🛡️

*Building the future of decentralized identity, one credential at a time.*
