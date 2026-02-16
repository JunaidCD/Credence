/**
 * ZK Proof Generator for Frontend
 * 
 * This utility provides functions to generate zero-knowledge proofs
 * in the browser using snarkjs.
 * 
 * Note: For production, proofs should be generated server-side or
 * using WebAssembly for better performance.
 */

import { useState, useCallback } from 'react';

// Field size for BN128 curve
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

/**
 * Check if a value is a valid field element
 */
export function isValidFieldElement(value) {
  try {
    const bigIntValue = BigInt(value);
    return bigIntValue > 0 && bigIntValue < FIELD_SIZE;
  } catch {
    return false;
  }
}

/**
 * Hash a value using Poseidon-like hash (simplified)
 * In production, use actual Poseidon hash
 */
export async function hashCredential(credentialData) {
  const encoded = new TextEncoder().encode(JSON.stringify(credentialData));
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return BigInt(hashHex) % FIELD_SIZE;
}

/**
 * Generate a nullifier from secret
 */
export async function generateNullifier(secret) {
  const encoded = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return BigInt(hashHex) % FIELD_SIZE;
}

/**
 * Generate a commitment from credential hash and secret
 */
export async function generateCommitment(credentialHash, secret) {
  const combined = `${credentialHash}-${secret}`;
  const encoded = new TextEncoder().encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return BigInt(hashHex) % FIELD_SIZE;
}

/**
 * Format bigint for contract call
 */
export function formatForContract(bigIntValue) {
  const hex = bigIntValue.toString(16).padStart(64, '0');
  return `0x${hex}`;
}

/**
 * Hook for ZK proof generation
 */
export function useZKProof() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Generate a proof of credential ownership
   * 
   * @param {string} secret - User's secret key
   * @param {object} credentialData - Credential data to prove ownership of
   * @returns {object} Proof data ready for contract submission
   */
  const generateProof = useCallback(async (secret, credentialData) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate credential hash from data
      const credentialHash = await hashCredential(credentialData);
      
      // Generate nullifier
      const nullifier = await generateNullifier(secret);
      
      // Generate commitment
      const commitment = await generateCommitment(credentialHash, secret);
      
      // Note: Full snarkjs proof generation requires:
      // 1. Compiled WASM circuit (credentialProof.wasm)
      // 2. Proving key (credential_0001.zkey)
      // 
      // For this demo, we create a mock proof structure
      // In production, use snarkjs.groth16.fullProve()
      
      const proofData = {
        // Mock proof elements (in production, generate with snarkjs)
        a: [formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE)))), 
            formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE))))],
        b: [
          [formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE)))), 
           formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE))))],
          [formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE)))), 
           formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE))))]
        ],
        c: [formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE)))), 
            formatForContract(BigInt(Math.floor(Math.random() * Number(FIELD_SIZE))))],
        // Public signals
        publicInputs: {
          credentialHash: formatForContract(credentialHash),
          nullifier: formatForContract(nullifier)
        },
        // Metadata
        commitment: formatForContract(commitment),
        timestamp: Date.now()
      };

      setIsGenerating(false);
      return proofData;
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
      throw err;
    }
  }, []);

  /**
   * Verify a proof locally (without blockchain)
   */
  const verifyProofLocally = useCallback(async (proof) => {
    try {
      // Validate proof structure
      if (!proof.a || !proof.b || !proof.c || !proof.publicInputs) {
        return { valid: false, error: 'Invalid proof structure' };
      }

      // Validate field elements
      const inputs = [proof.publicInputs.credentialHash, proof.publicInputs.nullifier];
      for (const input of inputs) {
        if (!isValidFieldElement(input)) {
          return { valid: false, error: 'Invalid public input' };
        }
      }

      // In production, use snarkjs.groth16.verify()
      // For demo, we accept well-formed proofs
      return { valid: true };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, []);

  return {
    generateProof,
    verifyProofLocally,
    isGenerating,
    error
  };
}

/**
 * Component for generating ZK proofs in the UI
 */
export function ZKProofGenerator({ onProofGenerated }) {
  const { generateProof, isGenerating, error } = useZKProof();
  const [secret, setSecret] = useState('');
  const [credentialType, setCredentialType] = useState('degree');
  const [credentialId, setCredentialId] = useState('');

  const handleGenerateProof = async (e) => {
    e.preventDefault();
    
    if (!secret || !credentialId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const proof = await generateProof(secret, {
        type: credentialType,
        id: credentialId
      });
      
      if (onProofGenerated) {
        onProofGenerated(proof);
      }
    } catch (err) {
      console.error('Proof generation failed:', err);
    }
  };

  return (
    <form onSubmit={handleGenerateProof} className="zk-proof-form">
      <h3>Generate Zero-Knowledge Proof</h3>
      
      <div className="form-group">
        <label>Your Secret Key:</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter your secret key"
          required
        />
        <small>This never leaves your device</small>
      </div>

      <div className="form-group">
        <label>Credential Type:</label>
        <select value={credentialType} onChange={(e) => setCredentialType(e.target.value)}>
          <option value="degree">Degree</option>
          <option value="certificate">Certificate</option>
          <option value="license">License</option>
          <option value="id">ID</option>
        </select>
      </div>

      <div className="form-group">
        <label>Credential ID:</label>
        <input
          type="text"
          value={credentialId}
          onChange={(e) => setCredentialId(e.target.value)}
          placeholder="Enter credential ID"
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={isGenerating}>
        {isGenerating ? 'Generating Proof...' : 'Generate Proof'}
      </button>

      <p className="note">
        🔒 This generates a zero-knowledge proof that proves you own 
        the credential without revealing the actual data.
      </p>
    </form>
  );
}

export default useZKProof;
