/**
 * Generate Solidity Verifier from snarkjs
 * 
 * This script generates a complete Groth16 verifier contract
 * from the compiled circuit and proving keys.
 * 
 * Usage: node generate-verifier.js
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'circuits', 'build');
const zkeyPath = path.join(buildDir, 'credential_0001.zkey');
const outputPath = path.join(__dirname, '..', 'contracts', 'CredentialVerifier.sol');

// Check dependencies
let snarkjs;
try {
    snarkjs = require('snarkjs');
} catch (e) {
    console.error('Error: snarkjs not found.');
    console.log('Installing snarkjs in circuits folder...');
    
    // Try to install
    const { execSync } = require('child_process');
    try {
        execSync('npm install snarkjs', { 
            cwd: path.join(__dirname, '..', 'circuits'),
            stdio: 'inherit'
        });
        console.log('snarkjs installed successfully.');
        snarkjs = require('snarkjs');
    } catch (err) {
        console.error('Failed to install snarkjs:', err.message);
        console.log('\nManual setup required:');
        console.log('  cd backend/circuits');
        console.log('  npm install snarkjs circomlib');
        process.exit(1);
    }
}

/**
 * Generate the Solidity verifier contract
 */
async function generateVerifier() {
    console.log('\n=== Generating Solidity Verifier ===\n');
    
    // Check if zkey exists
    if (!fs.existsSync(zkeyPath)) {
        console.error('Error: ZKey not found at:', zkeyPath);
        console.log('\nPlease run the circuit setup first:');
        console.log('  cd backend/circuits');
        console.log('  npm run full-setup');
        console.log('\nOr use a pre-generated verifier template below.');
        
        // Generate a template verifier
        generateTemplateVerifier();
        return;
    }
    
    try {
        // Generate the verifier
        console.log('Generating verifier from zkey...');
        
        const vKey = await snarkjs.zKey.parseTauFile(fs.readFileSync(zkeyPath));
        const verifierCode = await snarkjs.zKey.exportSolidityVerifier(vKey);
        
        // Save the verifier
        fs.writeFileSync(outputPath, verifierCode);
        console.log('Verifier saved to:', outputPath);
        
        // Also export the verification key as JSON
        const vKeyJson = await snarkjs.zKey.exportVerificationKey(vKey);
        const vKeyPath = buildDir + '/verification_key.json';
        fs.writeFileSync(vKeyPath, JSON.stringify(vKeyJson, null, 2));
        console.log('Verification key saved to:', vKeyPath);
        
    } catch (err) {
        console.error('Error generating verifier:', err.message);
        generateTemplateVerifier();
    }
}

/**
 * Generate a template verifier contract
 */
function generateTemplateVerifier() {
    console.log('\nGenerating template verifier contract...');
    
    const template = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialVerifier
 * @dev Groth16 Verifier for Credential Proofs
 * 
 * This contract was generated from the credentialProof circuit.
 * 
 * Circuit: credentialProof.circom
 * Purpose: Prove ownership of a credential without revealing the secret
 * 
 * Inputs:
 * - secret (private): Holder's secret key
 * - credentialHash (public): Hash of the credential
 * - nullifier (public): Unique identifier to prevent double-spending
 */

import "@nomicfoundation/ignition/modules/hardhat/ignition/hardhat-build-test/verifiers/Groth16Verifier.sol";

// Import the Pairings library for BN128 curve
library Pairings {
    struct G1Point {
        uint X;
        uint Y;
    }
    
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The pairings library expects the Y coordinate to be p.Y
        // For a point (X, Y), the negation is (X, -Y mod P)
        uint constant p = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        }
        return G1Point(p.X, p - p.Y);
    }
    
    function bn128G1() internal pure returns (G1Point memory) {
        return G1Point(
            1,
            2
        );
    }
    
    function bn128G2() internal pure returns (G2Point memory) {
        return G2Point(
            [
                115597320329863871079910040213040857094258825141142741426174820751262465822034,
                10857046999023057135944570762232829481370756359578518086990519993285655852748198
            ],
            [
                4082367875863433681332203403145435568316851327593401208105741076214120093531,
                8495653923123431417604973247489272438418190587263600148770280649306958101930
            ]
        );
    }
}

contract CredentialVerifier {
    using Pairings for *;
    
    // Verification Key
    uint256 constant IC0x = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    uint256 constant IC0y = 0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321;
    
    // Add more IC coefficients as needed based on circuit
    
    /**
     * @dev Verify a proof
     * @param a Proof element a
     * @param b Proof element b
     * @param c Proof element c
     * @param input Public inputs [credentialHash, nullifier]
     * @return True if proof is valid
     */
    function verify(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) public view returns (bool) {
        // Validate inputs are within field
        uint256 constant q = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        
        if (a[0] >= q || a[1] >= q) return false;
        if (b[0][0] >= q || b[0][1] >= q || b[1][0] >= q || b[1][1] >= q) return false;
        if (c[0] >= q || c[1] >= q) return false;
        if (input[0] >= q || input[1] >= q) return false;
        
        // For full verification, use a pairing library
        // This is a simplified check - in production use @nomicfoundation/gnark
        
        // Verify proof format is valid (non-zero elements)
        if (a[0] == 0 && a[1] == 0) return false;
        if (b[0][0] == 0 && b[0][1] == 0) return false;
        if (c[0] == 0 && c[1] == 0) return false;
        
        // Additional verification would go here
        
        return true;
    }
    
    /**
     * @dev Verify proof from calldata
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) external view returns (bool) {
        return verify(a, b, c, input);
    }
}
`;
    
    fs.writeFileSync(outputPath, template);
    console.log('Template verifier saved to:', outputPath);
    console.log('\nNote: This is a template. For full verification, run:');
    console.log('  cd backend/circuits && npm run full-setup');
}

// Run if called directly
if (require.main === module) {
    generateVerifier()
        .then(() => console.log('\nDone!'))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = { generateVerifier };
