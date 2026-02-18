# Credence Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CREDENCE PLATFORM                                  │
│                    Decentralized Credential Management System                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│     USERS         │   │    ISSUERS        │   │   VERIFIERS       │
│                   │   │                   │   │                   │
│ • Register        │   │ • Register        │   │ • Register        │
│ • Receive VC      │   │ • Issue VC        │   │ • Verify VC       │
│ • Share VC        │   │ • Revoke VC       │   │ • Request VC      │
│ • Manage DID      │   │ • Manage DID      │   │ • Manage DID      │
└───────────────────┘   └───────────────────┘   └───────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React + Vite)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Navbar     │  │  Dashboard  │  │  Forms      │  │  Cards      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                     Web3 Service Layer                               │     │
│  │  • connectWallet()  • issueCredential()  • verifyCredential()    │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           METAMASK WALLET                                      │
│  • Transaction Signing  • Account Management  • Network Connection           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER (Arbitrum)                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      SMART CONTRACTS                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │    │
│  │  │ CredentialRegistry│  │ UserRegistry     │  │IssuerRegistry │  │    │
│  │  │                  │  │                  │  │                │  │    │
│  │  │ • issueCredential│  │ • registerUser   │  │• registerIssuer│ │    │
│  │  │ • revokeCredential│ │ • isRegisteredUser│ │• isRegistered  │ │    │
│  │  │ • getCredential  │  │ • getUserInfo    │  │• getIssuerInfo │  │    │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │    │
│  │                                                                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │    │
│  │  │VerifierRegistry  │  │PaymentProcessor  │  │MultiSigWallet │  │    │
│  │  │                  │  │                  │  │                │  │    │
│  │  │• registerVerifier│  │ • processPayment │  │• executeMultiSig│ │    │
│  │  │• isRegistered    │  │ • withdrawFunds  │  │• confirmTransaction│    │
│  │  │• getVerifierInfo │  │ • getBalance     │  │• getConfirmations│  │    │
│  │  └──────────────────┘  └──────────────────┘  └────────────────┘  │    │
│  │                                                                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                      │    │
│  │  │ZKCredentialVerif.│  │OracleAggregator  │                      │    │
│  │  │                  │  │                  │                      │    │
│  │  │• verifyProof     │  │ • fetchPrice     │                      │    │
│  │  │• validateZKP     │  │ • getExchangeRate│                      │    │
│  │  └──────────────────┘  └──────────────────┘                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────────────────┐
│     BACKEND (Node.js)      │   │           STORAGE LAYER                 │
│                             │   │                                         │
│  ┌─────────────────────┐   │   │  ┌─────────────┐    ┌─────────────┐    │
│  │   API Routes        │   │   │  │    IPFS     │    │  Arweave    │    │
│  │                     │   │   │  │             │    │             │    │
│  │ • /api/users        │   │   │  │ • Metadata  │    │ • Backup    │    │
│  │ • /api/issuers      │   │   │  │ • Documents │    │ • Permanent │    │
│  │ • /api/verifiers   │   │   │  │ • JSON Data │    │ • Storage   │    │
│  │ • /api/credentials │   │   │  └─────────────┘    └─────────────┘    │
│  │ • /api/notifications│  │   │                                         │
│  └─────────────────────┘   │   │                                         │
│           │               │   └─────────────────────────────────────────┘
│           ▼               │
│  ┌─────────────────────┐   │
│  │   Database (SQLite) │   │
│  │                     │   │
│  │ • Users             │   │
│  │ • Issuers           │   │
│  │ • Verifiers         │   │
│  │ • Credentials       │   │
│  │ • Notifications     │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Credential Issuance Flow
```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Issuer  │────▶│  Frontend    │────▶│  MetaMask   │────▶│  Blockchain  │
│         │     │              │     │  (Sign)     │     │  Contract    │
└─────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                      │
                                        ┌──────────────────────────────┘
                                        ▼
                               ┌─────────────────┐     ┌─────────────┐
                               │   Backend       │────▶│   IPFS      │
                               │   (Store Meta)  │     │  (Storage)  │
                               └─────────────────┘     └─────────────┘
```

### 2. Credential Verification Flow
```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Verifier│────▶│  Frontend    │────▶│  Blockchain │────▶│  Contract   │
│         │     │  (Request)   │     │  (Verify)   │     │  (Validate) │
└─────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                                      │
                                        ┌──────────────────────────────┘
                                        ▼
                               ┌─────────────────┐
                               │   ZK Proof      │
                               │   Verification  │
                               └─────────────────┘
```

---

## Component Architecture

### Frontend Components
```
src/
├── components/
│   ├── CredentialCard.jsx       # Display credential details
│   ├── CredentialForm.jsx       # Issue new credentials
│   ├── CredentialVerification.jsx # Verify credentials
│   ├── EIP712CredentialIssuer.jsx # EIP-712 signing
│   ├── IPFSUploader.jsx        # Upload to IPFS
│   ├── LoginModal.jsx          # Authentication
│   ├── Navbar.jsx              # Navigation
│   └── Sidebar (User/Issuer/Verifier)
├── pages/
│   ├── UserDashboard.jsx       # User view
│   ├── IssuerDashboard.jsx     # Issuer view
│   └── VerifierDashboard.jsx   # Verifier view
├── utils/
│   ├── web3.js                 # Web3 interactions
│   ├── ZKCredentialVerifier.js # ZK verification
│   ├── zkProof.js              # ZK proof generation
│   └── blockchainNotifications.js
├── hooks/
│   └── use-metamask.js         # MetaMask hook
└── context/
    └── AuthContext.jsx         # Authentication state
```

### Smart Contracts
```
contracts/
├── CredentialRegistry.sol      # Main credential contract
├── UserRegistry.sol            # User management
├── IssuerRegistry.sol          # Issuer management
├── VerifierRegistry.sol        # Verifier management
├── CredentialNFT.sol           # NFT for credentials
├── PaymentProcessor.sol         # Payment handling
├── MultiSigWallet.sol          # Multi-sig wallet
├── ZKCredentialVerifier.sol    # ZK verification
├── OracleAggregator.sol        # Oracle integration
├── AccessControl.sol           # RBAC
├── RateLimiter.sol             # Rate limiting
└── Groth16Verifier.sol         # ZK-SNARK verifier
```

---

## Technology Stack

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

---

## Security Features

1. **EIP-712 Signing** - Typed data signing for credential issuance
2. **Role-Based Access Control** - Different roles for Users, Issuers, Verifiers
3. **Multi-Sig Wallet** - Requires multiple signatures for critical operations
4. **Rate Limiting** - Prevents abuse of contract functions
5. **ZK Proofs** - Privacy-preserving verification
6. **Oracle Aggregation** - Secure external data fetching
