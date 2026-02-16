/**
 * IPFS Routes for Backend API
 * 
 * Provides REST API endpoints for IPFS operations
 * 
 * Endpoints:
 * POST /api/ipfs/upload - Upload JSON to IPFS
 * POST /api/ipfs/upload-file - Upload file to IPFS
 * GET /api/ipfs/download/:hash - Download from IPFS
 * DELETE /api/ipfs/unpin/:hash - Unpin from IPFS
 */

const express = require('express');
const router = express.Router();
const {
    uploadJSON,
    uploadFile,
    uploadBuffer,
    downloadJSON,
    downloadFile,
    unpin,
    listPinned,
    createCredentialMetadata
} = require('../utils/ipfsStorage');

const {
    uploadJSON: uploadToArweave,
    downloadJSON: downloadFromArweave,
    createCredentialMetadata: createArweaveMetadata
} = require('../utils/arweaveStorage');

/**
 * POST /api/ipfs/upload
 * Upload JSON data to IPFS via Pinata
 */
router.post('/upload', async (req, res) => {
    try {
        const { data, apiKey, secretKey, storageType } = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'No data provided' });
        }

        let ipfsHash;
        
        if (storageType === 'arweave') {
            const metadata = createArweaveMetadata(data);
            ipfsHash = await uploadToArweave(metadata);
        } else {
            const metadata = createCredentialMetadata(data);
            ipfsHash = await uploadJSON(metadata, apiKey, secretKey);
        }

        res.json({
            success: true,
            ipfsHash,
            storageType: storageType || 'ipfs',
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            arweaveUrl: storageType === 'arweave' ? `https://arweave.net/${ipfsHash}` : null
        });
    } catch (error) {
        console.error('IPFS Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ipfs/upload-file
 * Upload file to IPFS via Pinata
 */
router.post('/upload-file', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const file = req.files.file;
        const { apiKey, secretKey } = req.body;

        // Convert file to buffer
        const buffer = Buffer.from(file.data);
        const ipfsHash = await uploadBuffer(buffer, file.name, apiKey, secretKey);

        res.json({
            success: true,
            ipfsHash,
            fileName: file.name,
            fileSize: file.size,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        });
    } catch (error) {
        console.error('IPFS File Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ipfs/download/:hash
 * Download JSON data from IPFS
 */
router.get('/download/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        
        if (!hash) {
            return res.status(400).json({ error: 'No IPFS hash provided' });
        }

        // Try IPFS first
        try {
            const data = await downloadJSON(hash);
            return res.json({
                success: true,
                source: 'ipfs',
                data
            });
        } catch (ipfsError) {
            // Try Arweave
            try {
                const data = await downloadFromArweave(hash);
                return res.json({
                    success: true,
                    source: 'arweave',
                    data
                });
            } catch (arweaveError) {
                return res.status(404).json({ 
                    error: 'Content not found on any storage network' 
                });
            }
        }
    } catch (error) {
        console.error('IPFS Download Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/ipfs/unpin/:hash
 * Unpin content from IPFS
 */
router.delete('/unpin/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const { apiKey, secretKey } = req.body;

        if (!hash) {
            return res.status(400).json({ error: 'No IPFS hash provided' });
        }

        await unpin(hash, apiKey, secretKey);

        res.json({
            success: true,
            message: `Successfully unpinned ${hash}`
        });
    } catch (error) {
        console.error('IPFS Unpin Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ipfs/list
 * List pinned files from Pinata
 */
router.get('/list', async (req, res) => {
    try {
        const { apiKey, secretKey, limit } = req.query;

        const files = await listPinned(
            parseInt(limit) || 10,
            apiKey,
            secretKey
        );

        res.json({
            success: true,
            count: files.length,
            files
        });
    } catch (error) {
        console.error('IPFS List Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ipfs/credential
 * Upload credential metadata specifically formatted for Credence
 */
router.post('/credential', async (req, res) => {
    try {
        const { 
            credentialId,
            credentialType,
            holderAddress,
            issuerAddress,
            issueDate,
            expiryDate,
            metadata,
            apiKey,
            secretKey,
            storageType
        } = req.body;

        // Create credential metadata
        const credentialData = {
            id: credentialId,
            type: credentialType,
            holder: holderAddress,
            issuer: issuerAddress,
            issuedAt: issueDate || new Date().toISOString(),
            expiresAt: expiryDate || null,
            metadata: metadata || {},
            platform: 'Credence',
            version: '1.0'
        };

        let storageHash;
        
        if (storageType === 'arweave') {
            const arweaveMetadata = createArweaveMetadata(credentialData);
            storageHash = await uploadToArweave(arweaveMetadata);
        } else {
            const ipfsMetadata = createCredentialMetadata(credentialData);
            storageHash = await uploadJSON(ipfsMetadata, apiKey, secretKey);
        }

        res.json({
            success: true,
            storageHash,
            storageType: storageType || 'ipfs',
            credentialId,
            metadata: credentialData,
            gatewayUrl: `https://gateway.pinata.cloud/ipfs/${storageHash}`
        });
    } catch (error) {
        console.error('Credential Upload Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ipfs/verify
 * Verify that content exists on IPFS/Arweave
 */
router.post('/verify', async (req, res) => {
    try {
        const { hash } = req.body;

        if (!hash) {
            return res.status(400).json({ error: 'No hash provided' });
        }

        // Try IPFS
        try {
            await downloadJSON(hash);
            return res.json({
                verified: true,
                network: 'ipfs',
                hash
            });
        } catch (ipfsError) {
            // Try Arweave
            try {
                await downloadFromArweave(hash);
                return res.json({
                    verified: true,
                    network: 'arweave',
                    hash
                });
            } catch (arweaveError) {
                return res.json({
                    verified: false,
                    hash,
                    error: 'Content not found on any network'
                });
            }
        }
    } catch (error) {
        console.error('Verify Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
