# 🛡️ Credence - Decentralized Identity & Credential Verification System

**Credence** is a comprehensive blockchain-based platform for issuing, managing, and verifying digital credentials using Ethereum smart contracts and MetaMask integration. Built with modern web technologies, it provides a secure, transparent, and decentralized approach to credential management.

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
- **Ethers.js** for blockchain interaction and EIP-712 verification

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

## 🔗 Smart Contracts

### **Core Contracts**
| Contract | Description |
|----------|-------------|
| **UserRegistry** | Manages user registration and profiles |
| **IssuerRegistry** | Handles issuer registration and permissions |
| **CredentialRegistry** | Stores and manages credentials on blockchain |
| **VerifierRegistry** | Manages verifier registrations |
| **AccessControl** | Role-based access control |

### **Key Smart Contract Features**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    // EIP-712 Domain Separator for typed data signing
    bytes32 public DOMAIN_SEPARATOR;
    
    // Credential struct with full lifecycle management
    struct Credential {
        uint256 id;
        address issuer;
        address holder;
        string credentialType;
        string data;           // Off-chain data (IPFS hash or encrypted)
        uint256 issuedAt;
        uint256 expiresAt;
        bool isActive;
        bool isRevoked;
        string ipfsHash;
    }
    
    // Issue credential on-chain
    function issueCredential(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        string memory _ipfsHash
    ) external onlyRegisteredIssuer returns (uint256) { ... }
    
    // Issue with EIP-712 signature (off-chain data)
    function issueCredentialWithSignature(
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        uint256 _nonce,
        bytes calldata _signature
    ) external onlyRegisteredIssuer returns (bytes32) { ... }
    
    // Verify EIP-712 off-chain credential
    function verifyOffChainCredential(
        address _issuer,
        address _holder,
        string memory _credentialType,
        string memory _data,
        uint256 _expiresAt,
        uint256 _nonce,
        bytes calldata _signature
    ) external view returns (bool) { ... }
    
    // Create Merkle credential for selective disclosure
    function createMerkleCredential(
        address _holder,
        string memory _credentialType,
        bytes32 _merkleRoot,
        uint256 _expiresAt
    ) external onlyRegisteredIssuer returns (uint256) { ... }
    
    // Verify Merkle proof (privacy-preserving)
    function verifyMerkleProof(
        uint256 _credentialId,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external view returns (bool) { ... }
}
```

### **Key Functions**
```solidity
// User Management
function registerUser(string memory _name, string memory _email) external;

// Issuer Management
function registerIssuer(string memory _name, string memory _organization, string memory _email) external;
function isRegisteredIssuer(address _issuer) external view returns (bool);

// Credential Management
function issueCredential(address _holder, string memory _credentialType, string memory _data, uint256 _expiresAt, string memory _ipfsHash) external;
function verifyCredential(uint256 _credentialId) external view returns (bool);
```

---

## 🔐 Advanced Features: EIP-712 & Merkle Proofs

### What are EIP-712 Credentials?

**EIP-712** is an Ethereum improvement proposal for typed data signing. It allows issuers to sign credential data off-chain, creating a cryptographic signature that anyone can verify.

#### Benefits:
- **No on-chain data storage** - credential data stays off-chain (can be stored in IPFS)
- **Cryptographic verification** - signatures can be verified on-chain or off-chain
- **User-controlled data** - users hold their own credential data
- **Reduced gas costs** - no transaction needed for credential issuance
- **Human-readable** - shows clear signing message in MetaMask

#### How It Works:

1. **Issuer** creates credential data (JSON)
2. **Issuer** signs it using EIP-712 via MetaMask
3. **Signature** is generated (cryptographic proof)
4. **Holder** receives: credential data + signature
5. **Verifier** can instantly verify the signature

### What are Merkle Proofs?

**Merkle proofs** enable privacy-preserving verification. They allow a user to prove that a piece of data exists within a larger dataset without revealing the entire dataset.

#### Benefits:
- **Selective disclosure** - prove specific attributes without revealing all data
- **Compact proofs** - efficient verification with small proof sizes
- **Privacy** - example: prove "age > 18" without revealing actual age
- **Efficient** - only need the root hash stored on-chain

#### Real-World Example:
```
Credential contains: {name: "John", age: 25, degree: "BS CS", gpa: 3.8, salary: 75000}

User wants to prove: "I have a bachelor's degree"
- They DON'T reveal: name, age, gpa, salary
- They ONLY reveal: degree credential exists in Merkle tree
- Recruiter verifies the Merkle proof against on-chain root
```

---

## 💻 Smart Contract API

### EIP-712 Functions

```solidity
// Issue credential with EIP-712 signature
function issueCredentialWithSignature(
    address _holder,
    string memory _credentialType,
    string memory _data,
    uint256 _expiresAt,
    uint256 _nonce,
    bytes calldata _signature
) external onlyRegisteredIssuer returns (bytes32);

// Verify off-chain credential
function verifyOffChainCredential(
    address _issuer,
    address _holder,
    string memory _credentialType,
    string memory _data,
    uint256 _expiresAt,
    uint256 _nonce,
    bytes calldata _signature
) external view returns (bool);
```

### Merkle Proof Functions

```solidity
// Create credential with Merkle root
function createMerkleCredential(
    address _holder,
    string memory _credentialType,
    bytes32 _merkleRoot,
    uint256 _expiresAt
) external onlyRegisteredIssuer returns (uint256);

// Verify Merkle proof
function verifyMerkleProof(
    uint256 _credentialId,
    bytes32 _leaf,
    bytes32[] calldata _proof
) external view returns (bool);
```

---

## 🧪 Testing

### Run Contract Tests

```bash
cd backend
npx hardhat test test/credentials.test.js
```

**Test Results:**
```
CredentialRegistry EIP-712 & Merkle Tests
  On-Chain Credential Issuance
    ✓ should issue credential on-chain
  EIP-712 Off-Chain Credentials
    ✓ should issue credential with EIP-712 signature
    ✓ should verify off-chain credential
  Merkle Proof Selective Disclosure
    ✓ should create Merkle credential
  View Functions
    ✓ should get domain separator

  5 passing (2s)
```

---

## 🎨 Frontend Components

### EIP712CredentialIssuer

**Location:** `frontend/client/src/components/EIP712CredentialIssuer.jsx`

Allows issuers to create and sign credentials using EIP-712:

1. Fill in credential details (holder, type, data)
2. Click "Sign Credential"
3. MetaMask prompts to sign
4. Copy signature to share with holder
5. Optional: also store on-chain

### CredentialVerification

**Location:** `frontend/client/src/components/CredentialVerification.jsx`

Allows anyone to verify credentials:

1. **Two modes:**
   - **Off-chain (Free):** Instant verification using ethers.js
   - **On-chain:** Verified on blockchain (may cost gas)

2. Enter credential data and signature
3. Get instant verification result

---

## 👔 How Recruiters Can Verify Credentials

### Scenario: Verifying a Candidate's Credential

1. **Candidate applies** with credential data + EIP-712 signature
2. **Recruiter goes to** CredentialVerification component
3. **Enters:**
   - Issuer Address (university/company wallet)
   - Credential Data (JSON from candidate)
   - EIP-712 Signature (from candidate)
4. **Chooses verification method:**
   - **Off-chain (Free):** Instant verification
   - **On-chain:** Verified on blockchain
5. **Gets result:** ✅ VALID or ❌ INVALID

### Verification Result Shows:
- If signature is valid
- If issuer is legitimate
- If credential has expired
- The recovered issuer address

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
│   ├── cache/            # Hardhat cache
│   ├── test/             # Test files
│   │   └── credentials.test.js
│   └── package.json
├── frontend/
│   ├── client/           # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── CredentialVerification.jsx    # NEW: EIP-712 verification
│   │   │   │   └── EIP712CredentialIssuer.jsx   # NEW: EIP-712 issuer
│   │   │   ├── pages/
│   │   │   ├── context/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── public/
│   ├── server/           # Express.js backend
│   └── shared/           # Shared types/schemas
├── README.md
└── SETUP.md
```

---

## 🛠️ Development Scripts

### **Backend Scripts**
```bash
npm run compile      # Compile smart contracts
npm run deploy:local # Deploy to local network
npm run test         # Run contract tests
npx hardhat node    # Start local blockchain
```

### **Frontend Scripts**
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

---

## 🔒 Security Features

- **MetaMask Integration**: Secure wallet-based authentication using browser extension
- **Blockchain Verification**: Immutable credential records stored on Ethereum
- **EIP-712 Typed Data**: Human-readable signatures for secure off-chain credential issuance and on-chain verification
- **Merkle Proofs**: Cryptographic verification without data disclosure - enables selective disclosure (e.g., prove "has degree" without revealing GPA)
- **Role-Based Access**: Strict permission controls with onlyRegisteredIssuer and onlyRegisteredUser modifiers
- **Event Logging**: Comprehensive audit trails for all credential operations
- **Replay Attack Protection**: Nonce-based signature validation prevents reuse of credentials
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

## 🔐 Zero-Knowledge Proofs (ZK)

Credence implements **zero-knowledge proofs** for privacy-preserving credential verification using **snarkjs + Circom**.

### What is ZK?

Zero-knowledge proofs allow a prover to verify to a verifier that they know a secret **without revealing the secret itself**. For credentials, this means:

- ✅ Prove you have a valid credential
- ✅ Prove you meet certain criteria (e.g., age > 18)
- ❌ Don't reveal your actual data
- ❌ Don't reveal your secret key

### How It Works

1. **Circuit** ([`backend/circuits/credentialProof.circom`](backend/circuits/credentialProof.circom)): Defines the ZK proof logic
2. **Trusted Setup**: Generates proving/verification keys (run once) - takes ~10-15 minutes
3. **Proof Generation**: Off-chain - generates proof from secret + credential
4. **On-chain Verification**: Smart contract verifies the proof

### Setup ZK Circuit

```bash
# Navigate to circuits folder
cd backend/circuits

# Install dependencies (includes circom & snarkjs)
npm install

# Compile the circuit
npm run compile

# Run trusted setup (Phase 1 + Phase 2)
npm run full-setup
```

**Or step by step:**
```bash
npm run setup         # Phase 1: Generate Powers of Tau
npm run contribute   # Add randomness
npm run prepare      # Prepare Phase 2
npm run setup-keys   # Generate proving/verification keys
npm run export-keys  # Export verification key for smart contract
```

### Generate Proof

```bash
node ../scripts/generate-proof.js <secret> <credentialHash> [nullifier]

# Example:
node ../scripts/generate-proof.js "my-secret" "0x123abc..."
```

### Key Files

| File | Purpose |
|------|---------|
| [`backend/circuits/credentialProof.circom`](backend/circuits/credentialProof.circom) | Circom circuit for credential proof |
| [`backend/circuits/package.json`](backend/circuits/package.json) | Build scripts |
| [`backend/scripts/generate-proof.js`](backend/scripts/generate-proof.js) | Proof generation utility |
| [`backend/contracts/Groth16Verifier.sol`](backend/contracts/Groth16Verifier.sol) | On-chain verifier contract |
| [`frontend/client/src/utils/zkProof.js`](frontend/client/src/utils/zkProof.js) | Frontend ZK component |

### Usage

**Generate proof (Node.js):**
```javascript
const { generateProof } = require('./scripts/generate-proof.js');
const proof = await generateProof(
  'user-secret-key',
  '0xcredentialhash...'
);

// Submit to contract
await credentialVerifier.verifyProof(
  proof.a, proof.b, proof.c,
  [proof.publicInputs.credentialHash, proof.publicInputs.nullifier]
);
```

**Frontend component:**
```jsx
import { ZKProofGenerator } from './utils/zkProof';

<ZKProofGenerator onProofGenerated={(proof) => {
  // Submit proof to contract
}} />
```

---

## 📦 Off-Chain Storage: IPFS & Arweave

Credence supports **off-chain storage** for credential metadata using **IPFS** (via Pinata) and **Arweave** for permanent, decentralized storage.

### Why Off-Chain Storage?

- **Reduced gas costs** - Store large credential metadata off-chain
- **Permanent storage** - IPFS with Pinata keeps files available
- **Decentralization** - Content-addressed storage
- **Privacy** - Can encrypt data before uploading

### Supported Storage Networks

| Network | Provider | Features |
|---------|----------|----------|
| IPFS | Pinata | Fast, widely supported, free tier |
| Arweave | arweave.net | Permanent storage, one-time fee |

### Setup IPFS (Pinata)

1. **Get Pinata API Keys:**
   - Sign up at [Pinata.cloud](https://www.pinata.cloud)
   - Go to API Keys -> Create New Key
   - Copy your API Key and Secret Key

2. **Set Environment Variables:**
   ```bash
   # Backend (.env)
   PINATA_API_KEY=your_api_key
   PINATA_SECRET_KEY=your_secret_key
   
   # Frontend
   VITE_PINATA_API_KEY=your_api_key
   ```

3. **Install Dependencies:**
   ```bash
   cd backend
   npm install axios form-data
   ```

### Backend API Endpoints

```bash
# Upload JSON to IPFS
POST /api/ipfs/upload
Content-Type: application/json
{
  "data": { "name": "Credential", "type": "Degree" },
  "storageType": "ipfs"  // or "arweave"
}

# Upload File to IPFS  
POST /api/ipfs/upload-file
Content-Type: multipart/form-data
file: <file>

# Download from IPFS
GET /api/ipfs/download/:hash

# Upload Credential Metadata
POST /api/ipfs/credential
{
  "credentialId": "123",
  "credentialType": "Degree",
  "holderAddress": "0x...",
  "issuerAddress": "0x...",
  "issueDate": "2024-01-01"
}

# Verify content exists
POST /api/ipfs/verify
{ "hash": "Qm..." }
```

### Usage Examples

**Upload Credential Metadata:**
```javascript
const response = await fetch('/api/ipfs/credential', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    credentialId: '1',
    credentialType: 'UniversityDegree',
    holderAddress: '0x123...',
    issuerAddress: '0x456...',
    issueDate: new Date().toISOString(),
    metadata: { degree: 'BS Computer Science', gpa: '3.8' }
  })
});

const { storageHash } = await response.json();
// Returns IPFS hash like: QmXyZ... 
```

**Frontend Component:**
```jsx
import { IPFSUploader } from './components/IPFSUploader';

<IPFSUploader 
  onUpload={(hash) => console.log('Uploaded:', hash)}
/>
```

### Key Files

| File | Purpose |
|------|---------|
| [`backend/utils/ipfsStorage.js`](backend/utils/ipfsStorage.js) | IPFS/Pinata integration |
| [`backend/utils/arweaveStorage.js`](backend/utils/arweaveStorage.js) | Arweave integration |
| [`backend/routes/ipfs.js`](backend/routes/ipfs.js) | REST API routes |
| [`frontend/client/src/components/IPFSUploader.jsx`](frontend/client/src/components/IPFSUploader.jsx) | Frontend upload UI |

### Integration with Smart Contracts

The smart contracts already support IPFS hashes:
```solidity
function issueCredential(
    address _holder,
    string memory _credentialType,
    string memory _data,
    uint256 _expiresAt,
    string memory _ipfsHash  // Store IPFS hash on-chain
) external;
```

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
