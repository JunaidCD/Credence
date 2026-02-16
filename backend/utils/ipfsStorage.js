/**
 * IPFS Storage Utility
 * 
 * Provides IPFS storage functionality using Pinata SDK
 * for credential metadata off-chain storage
 * 
 * Usage:
 * const { uploadToIPFS, downloadFromIPFS } = require('./utils/ipfsStorage');
 * const hash = await uploadToIPFS(credentialData);
 * const data = await downloadFromIPFS(hash);
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Pinata configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_BASE_URL = 'https://api.pinata.cloud';

/**
 * Upload JSON data to IPFS via Pinata
 * @param {Object} jsonData - JSON data to upload
 * @param {string} pinataApiKey - Pinata API Key (optional, uses env var)
 * @param {string} pinataSecretKey - Pinata Secret Key (optional, uses env var)
 * @returns {Promise<string>} - IPFS hash (CID)
 */
async function uploadJSON(jsonData, pinataApiKey = PINATA_API_KEY, pinataSecretKey = PINATA_SECRET_KEY) {
    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API keys not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY environment variables.');
    }

    const url = `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`;
    
    try {
        const response = await axios.post(url, jsonData, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            }
        });
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS Upload Error:', error.response?.data || error.message);
        throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
}

/**
 * Upload file to IPFS via Pinata
 * @param {string} filePath - Path to file to upload
 * @param {string} pinataApiKey - Pinata API Key (optional)
 * @param {string} pinataSecretKey - Pinata Secret Key (optional)
 * @returns {Promise<string>} - IPFS hash (CID)
 */
async function uploadFile(filePath, pinataApiKey = PINATA_API_KEY, pinataSecretKey = PINATA_SECRET_KEY) {
    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API keys not configured');
    }

    const url = `${PINATA_BASE_URL}/pinning/pinFileToIPFS`;
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            }
        });
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS File Upload Error:', error.response?.data || error.message);
        throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
}

/**
 * Upload buffer to IPFS via Pinata
 * @param {Buffer} buffer - Buffer to upload
 * @param {string} fileName - Name for the file
 * @param {string} pinataApiKey - Pinata API Key (optional)
 * @param {string} pinataSecretKey - Pinata Secret Key (optional)
 * @returns {Promise<string>} - IPFS hash (CID)
 */
async function uploadBuffer(buffer, fileName, pinataApiKey = PINATA_API_KEY, pinataSecretKey = PINATA_SECRET_KEY) {
    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API keys not configured');
    }

    const url = `${PINATA_BASE_URL}/pinning/pinFileToIPFS`;
    
    const formData = new FormData();
    formData.append('file', buffer, { filename: fileName });

    try {
        const response = await axios.post(url, formData, {
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            }
        });
        
        return response.data.IpfsHash;
    } catch (error) {
        console.error('IPFS Buffer Upload Error:', error.response?.data || error.message);
        throw new Error(`Failed to upload buffer to IPFS: ${error.message}`);
    }
}

/**
 * Download JSON data from IPFS
 * @param {string} ipfsHash - IPFS hash (CID)
 * @returns {Promise<Object>} - Downloaded JSON data
 */
async function downloadJSON(ipfsHash) {
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
    ];

    for (const gateway of gateways) {
        try {
            const response = await axios.get(gateway, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.log(`Failed to fetch from ${gateway}: ${error.message}`);
            continue;
        }
    }

    throw new Error('Failed to download from all IPFS gateways');
}

/**
 * Download file from IPFS
 * @param {string} ipfsHash - IPFS hash (CID)
 * @param {string} outputPath - Path to save the file
 * @returns {Promise<void>}
 */
async function downloadFile(ipfsHash, outputPath) {
    const gateway = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    try {
        const response = await axios.get(gateway, { 
            responseType: 'stream',
            timeout: 30000 
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('IPFS Download Error:', error.message);
        throw new Error(`Failed to download from IPFS: ${error.message}`);
    }
}

/**
 * Unpin content from IPFS (remove from Pinata)
 * @param {string} ipfsHash - IPFS hash to unpin
 * @returns {Promise<void>}
 */
async function unpin(ipfsHash, pinataApiKey = PINATA_API_KEY, pinataSecretKey = PINATA_SECRET_KEY) {
    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API keys not configured');
    }

    const url = `${PINATA_BASE_URL}/pinning/unpin/${ipfsHash}`;
    
    try {
        await axios.delete(url, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            }
        });
        
        console.log(`Successfully unpinned: ${ipfsHash}`);
    } catch (error) {
        console.error('IPFS Unpin Error:', error.response?.data || error.message);
        throw new Error(`Failed to unpin from IPFS: ${error.message}`);
    }
}

/**
 * List pinned files from Pinata
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - List of pinned files
 */
async function listPinned(limit = 10, pinataApiKey = PINATA_API_KEY, pinataSecretKey = PINATA_SECRET_KEY) {
    if (!pinataApiKey || !pinataSecretKey) {
        throw new Error('Pinata API keys not configured');
    }

    const url = `${PINATA_BASE_URL}/pins/list?limit=${limit}`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretKey
            }
        });
        
        return response.data.rows;
    } catch (error) {
        console.error('IPFS List Error:', error.response?.data || error.message);
        throw new Error(`Failed to list pinned files: ${error.message}`);
    }
}

/**
 * Create credential metadata for IPFS
 * @param {Object} credentialData - Credential data
 * @returns {Object} - Formatted metadata for IPFS
 */
function createCredentialMetadata(credentialData) {
    return {
        name: credentialData.name || 'Credence Credential',
        description: credentialData.description || 'Decentralized credential issued on Credence',
        image: credentialData.image || '',  // IPFS hash for image
        attributes: [
            {
                trait_type: 'Credential Type',
                value: credentialData.type || 'Unknown'
            },
            {
                trait_type: 'Issuer',
                value: credentialData.issuer
            },
            {
                trait_type: 'Issue Date',
                value: credentialData.issuedAt || new Date().toISOString()
            },
            {
                trait_type: 'Expiration Date',
                value: credentialData.expiresAt || 'None'
            },
            {
                trait_type: 'Credential ID',
                value: credentialData.id?.toString() || ''
            }
        ],
        // Additional custom attributes
        ...credentialData
    };
}

module.exports = {
    uploadJSON,
    uploadFile,
    uploadBuffer,
    downloadJSON,
    downloadFile,
    unpin,
    listPinned,
    createCredentialMetadata
};
