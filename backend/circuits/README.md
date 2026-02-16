# ZK Proof Setup Guide

This directory contains the Circom circuits and snarkjs configuration for zero-knowledge credential proofs.

## Quick Start

### 1. Install Dependencies

```bash
cd backend/circuits
npm install
```

### 2. Compile the Circuit

```bash
npm run compile
```

This compiles `credentialProof.circom` to:
- `build/credentialProof.r1cs` - R1CS constraint system
- `build/credentialProof.wasm` - WebAssembly for proof generation

### 3. Trusted Setup (Generate Keys)

```bash
# Full setup (takes ~10-15 minutes)
npm run full-setup

# Or step by step:
npm run setup           # Phase 1: Generate Powers of Tau
npm run contribute     # Contribute randomness
npm run prepare        # Prepare Phase 2
npm run setup-keys     # Generate proving/verification keys
npm run contribute-keys # Contribute to final key
npm run export-keys    # Export verification key
```

### 4. Generate Proof

```bash
# From command line
npm run prove -- <secret> <credentialHash> [nullifier]

# Example
npm run prove -- "my-secret" "0x123abc..."
```

### 5. Verify Proof

```bash
npm run verify
```

## Circuit Explanation

### credentialProof.circom

This circuit proves:
1. **Knowledge of a secret** - The holder knows a private secret key
2. **Credential ownership** - The credentialHash matches a commitment
3. **Nullifier uniqueness** - Prevents double-spending

**Inputs:**
- `secret` (private): Holder's secret key
- `credentialHash` (public): Hash of the credential
- `nullifier` (public): Unique identifier

**Outputs:**
- Valid proof if all constraints satisfied

## Files

```
circuits/
├── credentialProof.circom   # Main circuit
├── package.json             # Dependencies and scripts
├── build/                   # Compiled outputs
│   ├── credentialProof.r1cs
│   ├── credentialProof.wasm
│   ├── credential_0001.zkey
│   └── verification_key.json
└── pot15_*.ptau           # Trusted setup files
```

## Usage with Smart Contract

### 1. Deploy Verifier

```bash
# Generate Solidity verifier contract
cd ../scripts
node generate-verifier.js

# Deploy to blockchain
npx hardhat run scripts/deploy-verifier.js --network localhost
```

### 2. Submit Proof

```javascript
const proof = await generateProof(secret, credentialHash, nullifier);

await credentialVerifier.verifyProof(
  [proof.a[0], proof.a[1]],
  [[proof.b[0][0], proof.b[0][1]], [proof.b[1][0], proof.b[1][1]]],
  [proof.c[0], proof.c[1]],
  [proof.publicInputs.credentialHash, proof.publicInputs.nullifier]
);
```

## Security Notes

1. **Trusted Setup**: The ceremony requires multiple participants. More participants = more secure.
2. **Secret Handling**: Never expose the secret key. It should only be known to the credential holder.
3. **Nullifier**: Each credential can only be proven once (prevents replay attacks).

## Troubleshooting

### Circom not found
```bash
npm install -g circom
```

### snarkjs errors
```bash
npm install snarkjs@latest
```

### Memory issues during trusted setup
The Phase 2 setup requires significant RAM. Use a machine with at least 16GB RAM.
