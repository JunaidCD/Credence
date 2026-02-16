# 📖 Credence API Reference

This document contains detailed API documentation, endpoint specifications, and technical references for the Credence system.

> **Quick Links:**
> - [Main README](README.md) - Project overview and setup
> - [Smart Contracts](#smart-contracts-api)
> - [Backend API](#backend-api)
> - [Frontend Components](#frontend-components)

---

## 🔗 Smart Contracts API

### CredentialRegistry.sol

The main contract for managing credentials on the blockchain.

#### Data Structures

```solidity
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
```

#### Key Functions

##### User Management

```solidity
function registerUser(string memory _name, string memory _email) external;
```

**Parameters:**
- `_name` - User's display name
- `_email` - User's email address

##### Issuer Management

```solidity
function registerIssuer(
    string memory _name, 
    string memory _organization, 
    string memory _email
) external;

function isRegisteredIssuer(address _issuer) external view returns (bool);
```

##### Credential Management

```solidity
function issueCredential(
    address _holder,
    string memory _credentialType,
    string memory _data,
    uint256 _expiresAt,
    string memory _ipfsHash
) external onlyRegisteredIssuer returns (uint256);

function verifyCredential(uint256 _credentialId) external view returns (bool);

function getCredential(uint256 _credentialId) 
    external view returns (Credential memory);
```

---

## 🔐 EIP-712 Credentials

### What is EIP-712?

**EIP-712** is an Ethereum improvement proposal for typed data signing. It allows issuers to sign credential data off-chain, creating a cryptographic signature that anyone can verify.

#### Benefits

- **No on-chain data storage** - credential data stays off-chain (can be stored in IPFS)
- **Cryptographic verification** - signatures can be verified on-chain or off-chain
- **User-controlled data** - users hold their own credential data
- **Reduced gas costs** - no transaction needed for credential issuance
- **Human-readable** - shows clear signing message in MetaMask

#### How It Works

1. **Issuer** creates credential data (JSON)
2. **Issuer** signs it using EIP-712 via MetaMask
3. **Signature** is generated (cryptographic proof)
4. **Holder** receives: credential data + signature
5. **Verifier** can instantly verify the signature

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

### EIP-712 Typed Data Structure

```javascript
const domain = {
    name: 'Credence',
    version: '1',
    chainId: 31337,
    verifyingContract: '0x...'
};

const types = {
    Credential: [
        { name: 'holder', type: 'address' },
        { name: 'credentialType', type: 'string' },
        { name: 'data', type: 'string' },
        { name: 'expiresAt', type: 'uint256' },
        { name: 'nonce', type: 'uint256' }
    ]
};

const value = {
    holder: '0x123...',
    credentialType: 'Degree',
    data: '{"university":"MIT","degree":"BS CS","year":2024}',
    expiresAt: 1735689600, // 1 year from now
    nonce: 0
};
```

---

## 🌳 Merkle Proofs

### What are Merkle Proofs?

**Merkle proofs** enable privacy-preserving verification. They allow a user to prove that a piece of data exists within a larger dataset without revealing the entire dataset.

#### Benefits

- **Selective disclosure** - prove specific attributes without revealing all data
- **Compact proofs** - efficient verification with small proof sizes
- **Privacy** - example: prove "age > 18" without revealing actual age
- **Efficient** - only need the root hash stored on-chain

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

### Example: Selective Disclosure

```
Credential contains: {name: "John", age: 25, degree: "BS CS", gpa: 3.8, salary: 75000}

User wants to prove: "I have a bachelor's degree"
- They DON'T reveal: name, age, gpa, salary
- They ONLY reveal: degree credential exists in Merkle tree
- Recruiter verifies the Merkle proof against on-chain root
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

---

## 🖥️ Backend API

### IPFS Routes

Base URL: `/api/ipfs`

#### Upload JSON to IPFS

```
POST /api/ipfs/upload
Content-Type: application/json

{
  "data": { "name": "Credential", "type": "Degree" },
  "storageType": "ipfs"  // or "arweave"
}

Response:
{
  "success": true,
  "ipfsHash": "QmXyZ...",
  "storageType": "ipfs",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXyZ..."
}
```

#### Upload File to IPFS

```
POST /api/ipfs/upload-file
Content-Type: multipart/form-data

file: <file>

Response:
{
  "success": true,
  "ipfsHash": "QmXyZ...",
  "fileName": "document.pdf",
  "fileSize": 1024,
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXyZ..."
}
```

#### Download from IPFS

```
GET /api/ipfs/download/:hash

Response:
{
  "success": true,
  "source": "ipfs",
  "data": { ... }
}
```

#### Upload Credential Metadata

```
POST /api/ipfs/credential

{
  "credentialId": "123",
  "credentialType": "Degree",
  "holderAddress": "0x...",
  "issuerAddress": "0x...",
  "issueDate": "2024-01-01",
  "metadata": { ... }
}

Response:
{
  "success": true,
  "storageHash": "QmXyZ...",
  "storageType": "ipfs",
  "credentialId": "123",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXyZ..."
}
```

#### Verify Content Exists

```
POST /api/ipfs/verify

{
  "hash": "QmXyZ..."
}

Response:
{
  "verified": true,
  "network": "ipfs",
  "hash": "QmXyZ..."
}
```

#### Unpin Content

```
DELETE /api/ipfs/unpin/:hash

Response:
{
  "success": true,
  "message": "Successfully unpinned QmXyZ..."
}
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

### IPFSUploader

**Location:** `frontend/client/src/components/IPFSUploader.jsx`

Drag & drop component for uploading credential metadata to IPFS:

```jsx
import { IPFSUploader } from './components/IPFSUploader';

<IPFSUploader 
  onUpload={(hash) => console.log('Uploaded:', hash)}
/>
```

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

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PINATA_API_KEY` | Pinata API key for IPFS | - |
| `PINATA_SECRET_KEY` | Pinata secret key | - |
| `ARWEAVE_URL` | Arweave gateway URL | https://arweave.net |
| `REACT_APP_CONTRACT_ADDRESS` | Deployed contract address | - |
| `REACT_APP_NETWORK_ID` | Ethereum network ID | 31337 |
| `REACT_APP_RPC_URL` | RPC endpoint URL | http://127.0.0.1:8545 |

---

## 📁 Key Files Reference

### Backend

| File | Description |
|------|-------------|
| `backend/contracts/CredentialRegistry.sol` | Main credential contract |
| `backend/contracts/IssuerRegistry.sol` | Issuer management |
| `backend/contracts/UserRegistry.sol` | User management |
| `backend/utils/ipfsStorage.js` | IPFS utility functions |
| `backend/utils/arweaveStorage.js` | Arweave utility functions |
| `backend/routes/ipfs.js` | IPFS API routes |
| `backend/scripts/deploy.js` | Deployment script |
| `backend/scripts/generate-proof.js` | ZK proof generation |

### Frontend

| File | Description |
|------|-------------|
| `frontend/client/src/App.jsx` | Main application |
| `frontend/client/src/pages/IssuerDashboard.jsx` | Issuer dashboard |
| `frontend/client/src/pages/UserDashboard.jsx` | User dashboard |
| `frontend/client/src/pages/VerifierDashboard.jsx` | Verifier dashboard |
| `frontend/client/src/utils/web3.js` | Web3 utilities |
| `frontend/client/src/utils/zkProof.js` | ZK proof frontend |
| `frontend/client/src/components/IPFSUploader.jsx` | IPFS upload UI |

---

## 🔗 Related Documentation

- [Main README](README.md) - Project overview and setup
- [SETUP.md](SETUP.md) - Additional setup instructions
- [Ethereum EIP-712](https://eips.ethereum.org/EIPS/eip-712) - Official EIP-712 spec
- [snarkjs](https://github.com/iden3/snarkjs) - ZK proof library
- [Circom](https://docs.circom.io/) - ZK circuit compiler
- [Pinata](https://www.pinata.cloud/) - IPFS pinning service
- [Arweave](https://www.arweave.org/) - Permanent storage

---

*For more information, see [README.md](README.md)*
