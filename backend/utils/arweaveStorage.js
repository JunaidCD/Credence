/**
 * Arweave Storage Utility
 * 
 * Provides Arweave storage functionality for permanent,
 * decentralized off-chain storage of credential metadata
 * 
 * Usage:
 * const { uploadToArweave, downloadFromArweave } = require('./utils/arweaveStorage');
 * const transactionId = await uploadToArweave(credentialData);
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Arweave configuration
const ARWEAVE_BASE_URL = process.env.ARWEAVE_URL || 'https://arweave.net';
const ARWEAVE_GATEWAY = process.env.ARWEAVE_GATEWAY || 'https://arweave.net';

/**
 * Upload JSON data to Arweave
 * @param {Object} jsonData - JSON data to upload
 * @param {string} jwkPath - Path to Arweave JWK wallet file (optional)
 * @returns {Promise<string>} - Arweave transaction ID
 */
async function uploadJSON(jsonData, jwkPath = null) {
    const dataString = JSON.stringify(jsonData);
    const dataBuffer = Buffer.from(dataString, 'utf8');
    
    return uploadBuffer(dataBuffer, 'application/json', jwkPath);
}

/**
 * Upload buffer to Arweave
 * @param {Buffer} buffer - Data buffer to upload
 * @param {string} contentType - MIME type of the data
 * @param {string} jwkPath - Path to Arweave JWK wallet file (optional)
 * @returns {Promise<string>} - Arweave transaction ID
 */
async function uploadBuffer(buffer, contentType = 'application/json', jwkPath = null) {
    // If JWK is provided, use it for direct upload
    if (jwkPath && fs.existsSync(jwkPath)) {
        return uploadWithJWK(buffer, contentType, jwkPath);
    }
    
    // Otherwise use gateway's minting API (for small files)
    return uploadViaGateway(buffer, contentType);
}

/**
 * Upload using Arweave JWK wallet
 * @param {Buffer} buffer - Data buffer
 * @param {string} contentType - MIME type
 * @param {string} jwkPath - Path to JWK file
 * @returns {Promise<string>} - Transaction ID
 */
async function uploadWithJWK(buffer, contentType, jwkPath) {
    const jwk = JSON.parse(fs.readFileSync(jwkPath, 'utf8'));
    
    // Create transaction
    const transaction = {
        last_tx: await getLastTransactionId(jwk.n),
        quantity: '0',
        reward: await calculateReward(buffer.length),
        data: buffer.toString('base64'),
        data_size: buffer.length.toString(),
        data_type: contentType,
        tags: [
            { name: 'App-Name', value: 'Credence' },
            { name: 'Content-Type', value: contentType },
            { name: 'Timestamp', value: Date.now().toString() }
        ]
    };
    
    // Sign transaction (simplified - in production use arweave-js)
    const transactionId = crypto.createHash('sha256')
        .update(JSON.stringify(transaction) + jwk.n)
        .digest('hex');
    
    // For demo, we'll use gateway upload
    return uploadViaGateway(buffer, contentType);
}

/**
 * Upload via Arweave gateway (simplified for demo)
 * @param {Buffer} buffer - Data buffer
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Transaction ID
 */
async function uploadViaGateway(buffer, contentType) {
    // Using Arweave's minting API through gateway
    // Note: For production, you should use arweave-js library
    
    // For now, use IPFS as fallback (since IPFS is more accessible)
    const { uploadBuffer } = require('./ipfsStorage');
    console.log('Arweave direct upload requires wallet setup. Using IPFS fallback...');
    return uploadBuffer(buffer, `arweave_${Date.now()}.json`);
}

/**
 * Get last transaction ID for wallet
 * @param {string} publicKey - Public key (n value from JWK)
 * @returns {Promise<string>} - Last transaction ID
 */
async function getLastTransactionId(publicKey) {
    try {
        const response = await axios.get(`${ARWEAVE_BASE_URL}/wallet/${publicKey}/last_tx`);
        return response.data;
    } catch (error) {
        // Return empty tx for new wallets
        return '';
    }
}

/**
 * Calculate transaction reward
 * @param {number} dataSize - Size of data in bytes
 * @returns {Promise<string>} - Reward in winston
 */
async function calculateReward(dataSize) {
    try {
        const response = await axios.get(`${ARWEAVE_BASE_URL}/price/0/${dataSize}`);
        return response.data;
    } catch (error) {
        // Default fallback
        return (dataSize * 10).toString();
    }
}

/**
 * Download data from Arweave
 * @param {string} transactionId - Arweave transaction ID
 * @returns {Promise<Object>} - Downloaded data
 */
async function downloadJSON(transactionId) {
    const data = await downloadRaw(transactionId);
    return JSON.parse(data.toString('utf8'));
}

/**
 * Download raw data from Arweave
 * @param {string} transactionId - Arweave transaction ID
 * @returns {Promise<Buffer>} - Raw data buffer
 */
async function downloadRaw(transactionId) {
    const gateways = [
        `${ARWEAVE_GATEWAY}/${transactionId}`,
        `https://arweave.net/${transactionId}`,
        `https://gateway.arweave.org/${transactionId}`
    ];
    
    for (const gateway of gateways) {
        try {
            const response = await axios.get(gateway, { 
                responseType: 'arraybuffer',
                timeout: 30000 
            });
            return Buffer.from(response.data);
        } catch (error) {
            console.log(`Failed to fetch from ${gateway}: ${error.message}`);
            continue;
        }
    }
    
    throw new Error('Failed to download from all Arweave gateways');
}

/**
 * Download file from Arweave
 * @param {string} transactionId - Arweave transaction ID
 * @param {string} outputPath - Path to save file
 * @returns {Promise<void>}
 */
async function downloadFile(transactionId, outputPath) {
    const data = await downloadRaw(transactionId);
    fs.writeFileSync(outputPath, data);
}

/**
 * Get transaction status
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} - Transaction status
 */
async function getTransactionStatus(transactionId) {
    try {
        const response = await axios.get(`${ARWEAVE_BASE_URL}/tx/${transactionId}`);
        return response.data;
    } catch (error) {
        return { status: 'not_found', error: error.message };
    }
}

/**
 * Get transaction confirmation status
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<number>} - Number of confirmations
 */
async function getConfirmations(transactionId) {
    try {
        const response = await axios.get(`${ARWEAVE_BASE_URL}/tx/${transactionId}/status`);
        return response.data.confirmations || 0;
    } catch (error) {
        return 0;
    }
}

/**
 * Create credential metadata for Arweave
 * @param {Object} credentialData - Credential data
 * @returns {Object} - Formatted metadata for Arweave
 */
function createCredentialMetadata(credentialData) {
    return {
        app: 'Credence',
        version: '1.0',
        type: 'credential-metadata',
        name: credentialData.name || 'Credence Credential',
        description: credentialData.description || 'Decentralized credential issued on Credence',
        image: credentialData.image || '',
        attributes: {
            credentialType: credentialData.type || 'Unknown',
            issuer: credentialData.issuer || '',
            issuedAt: credentialData.issuedAt || new Date().toISOString(),
            expiresAt: credentialData.expiresAt || null,
            credentialId: credentialData.id?.toString() || '',
            chainId: credentialData.chainId || 31337,
            contractAddress: credentialData.contractAddress || ''
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

module.exports = {
    uploadJSON,
    uploadBuffer,
    uploadFile: async (filePath) => {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        return uploadBuffer(buffer, contentType);
    },
    downloadJSON,
    downloadRaw,
    downloadFile,
    getTransactionStatus,
    getConfirmations,
    createCredentialMetadata
};

/**
 * Get MIME type from file extension
 */
function getContentType(ext) {
    const types = {
        '.json': 'application/json',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
}
