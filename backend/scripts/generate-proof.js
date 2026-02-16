/**
 * ZK Proof Generator for Credence
 * 
 * Generates zero-knowledge proofs for credential verification
 * using snarkjs and the compiled Circom circuit
 * 
 * Usage: node generate-proof.js <secret> <credentialHash> <nullifier>
 * 
 * Example:
 * node generate-proof.js "123" "0xabc123..." "0xdef456..."
 */

const fs = require('fs');
const path = require('path');

// Check if snarkjs is available
let snarkjs;
try {
    snarkjs = require('snarkjs');
} catch (e) {
    console.error('Error: snarkjs not found. Please run: npm install snarkjs');
    process.exit(1);
}

// Paths
const buildDir = path.join(__dirname, '..', 'circuits', 'build');
const zkeyPath = path.join(buildDir, 'credential_0001.zkey');
const vkeyPath = path.join(buildDir, 'verification_key.json');

// Field size for BN128 curve
const FIELD_SIZE = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

/**
 * Convert hex string to bigint array for snarkjs
 */
function hexToBigIntArray(hex) {
    // Remove '0x' prefix if present
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    
    // Pad to even length
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    
    const result = [];
    for (let i = 0; i < hex.length; i += 64) {
        // Take 64 hex chars (32 bytes) at a time
        const chunk = hex.slice(Math.max(0, i), i + 64);
        result.push(BigInt('0x' + chunk));
    }
    
    return result;
}

/**
 * Convert bigint array to hex
 */
function bigIntArrayToHex(arr) {
    return '0x' + arr.map(x => x.toString(16).padStart(64, '0')).join('');
}

/**
 * Generate a nullifier from secret
 */
async function computeNullifier(secret) {
    // Use Poseidon hash for nullifier
    const { cr } = await snarkjs.poseidon.FS.bandersnatch;
    // Simple hash for now - in production use proper Poseidon
    return BigInt('0x' + require('crypto').createHash('sha256').update(secret.toString()).digest('hex').slice(0, 64));
}

/**
 * Generate the proof
 */
async function generateProof(secret, credentialHash, nullifier) {
    console.log('\n=== ZK Proof Generation ===\n');
    console.log('Input:');
    console.log('  Secret:', secret);
    console.log('  Credential Hash:', credentialHash);
    console.log('  Nullifier:', nullifier);
    
    // Check if circuit is compiled
    if (!fs.existsSync(buildDir)) {
        console.error('Error: Circuit not compiled. Run: npm run compile');
        console.error('  cd backend/circuits && npm run compile');
        process.exit(1);
    }
    
    // Check if keys exist
    if (!fs.existsSync(zkeyPath)) {
        console.error('Error: ZKey not found. Run: npm run full-setup');
        console.error('  cd backend/circuits && npm run full-setup');
        process.exit(1);
    }
    
    // Load verification key
    let vkey;
    if (fs.existsSync(vkeyPath)) {
        vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
    } else {
        // Generate vkey from zkey
        const zkey = await snarkjs.zKey.parseTauFile(fs.readFileSync(zkeyPath));
        vkey = await snarkjs.zKey.exportVerificationKey(zkey);
    }
    
    // Input format for the circuit
    // Note: The circuit expects: secret (private), credentialHash (public), nullifier (public)
    const input = {
        secret: BigInt(secret),
        credentialHash: BigInt(credentialHash),
        nullifier: BigInt(nullifier)
    };
    
    console.log('\nGenerating proof...');
    
    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        path.join(buildDir, 'credentialProof.wasm'),
        zkeyPath
    );
    
    console.log('\nProof generated successfully!');
    console.log('\n=== Proof Output ===\n');
    
    // Format proof for smart contract
    const proofData = {
        // Groth16 proof elements (a, b, c)
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        // Public signals
        publicSignals: publicSignals,
        // Formatted for contract
        formatted: {
            a: [proof.pi_a[0], proof.pi_a[1]],
            b: [
                [proof.pi_b[0][1], proof.pi_b[0][0]],
                [proof.pi_b[1][1], proof.pi_b[1][0]]
            ],
            c: [proof.pi_c[0], proof.pi_c[1]]
        }
    };
    
    console.log('Proof A:', proofData.formatted.a);
    console.log('Proof B:', proofData.formatted.b);
    console.log('Proof C:', proofData.formatted.c);
    console.log('Public Signals:', publicSignals);
    
    // Verify locally
    console.log('\nVerifying proof locally...');
    const vKey = await snarkjs.zKey.parseTauFile(fs.readFileSync(zkeyPath));
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.log('Local verification:', isValid ? '✓ VALID' : '✗ INVALID');
    
    // Save proof files
    const outputDir = path.join(__dirname, '..', 'proofs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    
    const timestamp = Date.now();
    fs.writeFileSync(
        path.join(outputDir, `proof_${timestamp}.json`),
        JSON.stringify(proofData, null, 2)
    );
    
    fs.writeFileSync(
        path.join(outputDir, `public_${timestamp}.json`),
        JSON.stringify(publicSignals, null, 2)
    );
    
    console.log(`\nProof saved to: proofs/proof_${timestamp}.json`);
    console.log(`Public signals saved to: proofs/public_${timestamp}.json`);
    
    return proofData;
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Usage: node generate-proof.js <secret> <credentialHash> [nullifier]');
        console.log('\nExample:');
        console.log('  node generate-proof.js "12345" "0x1234567890abcdef"');
        console.log('\nOr use the module programmatically:');
        console.log('  const { generateProof } = require("./scripts/generate-proof.js");');
        console.log('  await generateProof(secret, credentialHash, nullifier);');
        process.exit(1);
    }
    
    const secret = args[0];
    const credentialHash = args[1];
    const nullifier = args[2] || secret; // Default nullifier to secret if not provided
    
    generateProof(secret, credentialHash, nullifier)
        .then(() => console.log('\nDone!'))
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}

module.exports = { generateProof };
