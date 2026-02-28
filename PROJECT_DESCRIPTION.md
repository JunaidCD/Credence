# Credence - Project Description

## Overview

**Credence** is a comprehensive decentralized identity and credential verification system built on **Arbitrum Sepolia (Layer 2)**. It provides a secure, transparent, and decentralized platform for issuing, managing, and verifying digital credentials in a trustless manner.

---

## Problem Statement

Traditional credential verification systems suffer from:
- Centralized data storage vulnerable to attacks
- Manual verification processes that are time-consuming
- Lack of user control over personal data
- No universal standard for credential verification
- High costs associated with credential issuance and verification

---

## Solution

Credence addresses these challenges by leveraging:
- **Blockchain Technology**: Immutable and transparent credential records
- **Zero-Knowledge Proofs**: Privacy-preserving credential verification
- **Decentralized Storage**: IPFS/Arweave for off-chain metadata
- **EIP-712 Signatures**: Secure off-chain credential issuance
- **Layer 2 Scaling**: Low gas fees on Arbitrum Sepolia

---

## Core Features

### 1. Decentralized Identity Management
- Ethereum-based Decentralized Identifiers (DIDs)
- Self-sovereign identity with user control
- Wallet-based authentication via MetaMask

### 2. Role-Based Access Control
| Role | Description |
|------|-------------|
| **Users** | Receive, manage, and share credentials |
| **Issuers** | Issue digital credentials (universities, employers) |
| **Verifiers** | Verify and approve shared credentials |

### 3. Credential Management
- Issue credentials with cryptographic proof
- Store credentials on-chain with metadata on IPFS
- Share credentials with specific verifiers
- Real-time verification status tracking

### 4. Privacy-Preserving Verification
- **Zero-Knowledge Proofs (ZK)**: Verify credentials without revealing underlying data
- **Merkle Proofs**: Selective disclosure of credential attributes
- **EIP-712 Typed Data**: Human-readable off-chain signatures

### 5. Smart Contract Security
- Role-based access modifiers
- Replay attack protection via nonces
- Comprehensive event logging for audit trails
- Multi-sig wallet support for organizational accounts

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Ethers.js v6 | Blockchain Interaction |
| Shadcn/UI | Component Library |
| Wouter | Routing |
| React Query | Server State Management |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | API Framework |
| Hardhat | Ethereum Development |
| Solidity 0.8.x | Smart Contracts |

### Blockchain & Storage
| Technology | Purpose |
|------------|---------|
| Arbitrum Sepolia | L2 Network |
| IPFS | Distributed Storage |
| Arweave | Permanent Storage |
| Circom | ZK Circuit Development |
| snarkjs | ZK Proof Generation |

---

## Architecture

```
Credence/
├── frontend/
│   ├── client/           # React Frontend
│   │   ├── src/
│   │   │   ├── components/   # UI Components
│   │   │   ├── pages/         # Dashboard Pages
│   │   │   ├── context/       # State Management
│   │   │   ├── hooks/         # Custom Hooks
│   │   │   └── utils/         # Utilities
│   │   └── public/
│   └── server/          # Express Backend
├── backend/
│   ├── contracts/       # Solidity Smart Contracts
│   ├── scripts/        # Deployment Scripts
│   ├── test/           # Contract Tests
│   ├── utils/          # Storage Utilities
│   └── circuits/       # ZK Circuits
└── assets/             # Documentation Assets
```

---

## Smart Contracts

### Core Contracts

| Contract | Purpose |
|----------|---------|
| **CredentialRegistry** | Main credential storage and management |
| **UserRegistry** | User registration and profiles |
| **IssuerRegistry** | Issuer registration and permissions |
| **VerifierRegistry** | Verifier registration management |
| **CredentialNFT** | NFT-based credential representation |
| **ZKCredentialVerifier** | Zero-knowledge proof verification |
| **PaymentProcessor** | Fee collection for operations |
| **OracleAggregator** | External data aggregation |

### Deployed Addresses (Arbitrum Sepolia)

| Contract | Address |
|----------|---------|
| CredentialRegistry | `0x2154CEF8A0147F6192fC35DA53682759B037fcee` |
| IssuerRegistry | `0x02Fc5273C7449374601309fc456c0FE4847e4a3e` |
| UserRegistry | `0x3b45272254758fD51E1e9A00F079684bcd19be86` |
| VerifierRegistry | `0xF42EA9e12321DfEF68f501E4D7A5ca3D887eD091` |

---

## User Workflows

### Credential Issuance
1. Issuer registers on the platform
2. Issuer creates credential with user details
3. Credential signed using EIP-712 standard
4. Credential stored on blockchain + metadata on IPFS
5. User receives notification of new credential

### Credential Verification
1. User shares credential with verifier
2. Verifier reviews credential details
3. ZK proof generated for privacy-preserving verification
4. On-chain verification via smart contract
5. Verification result recorded on blockchain

---

## Security Features

- **MetaMask Integration**: Secure wallet-based authentication
- **EIP-712 Signatures**: Tamper-proof credential issuance
- **Replay Attack Protection**: Nonce-based validation
- **Role-Based Access**: Strict permission controls
- **Event Logging**: Complete audit trail
- **Multi-Sig Support**: Organizational account security
- **Rate Limiting**: Protection against abuse
- **Pausable Contracts**: Emergency shutdown capability

---

## Gas Optimization

Deployed on **Arbitrum Sepolia** (L2) provides:
- **Lower transaction costs** compared to Ethereum mainnet
- **Faster block times** for quicker confirmations
- **EVM compatibility** with existing tooling
- **Scalability** for mass credential operations

---

## Development Status

| Component | Status |
|-----------|--------|
| Smart Contracts | ✅ Deployed |
| Frontend Application | ✅ Live |
| ZK Circuits | ✅ Implemented |
| IPFS Integration | ✅ Functional |
| Testing Suite | ✅ Complete |

---

## Live Demo

**Application URL**: [https://frontend-phi-wine-35.vercel.app](https://frontend-phi-wine-35.vercel.app)

**Network**: Arbitrum Sepolia (Chain ID: 421614)

**Explorer**: [https://sepolia.arbiscan.io](https://sepolia.arbiscan.io)

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- MetaMask browser extension
- npm or yarn

### Quick Setup

```bash
# Clone repository
git clone https://github.com/JunaidCD/Credence.git
cd Credence

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env

# Start application
cd frontend && npm run dev
```

---

## License

MIT License

---

## Author

**Junaid** - [GitHub Profile](https://github.com/JunaidCD)

---

## Acknowledgments

- Ethereum Foundation
- Arbitrum
- MetaMask
- Hardhat
- OpenZeppelin
- React Team
- Tailwind CSS
