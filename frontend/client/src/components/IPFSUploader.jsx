/**
 * IPFS Upload Component for Frontend
 * 
 * Provides a UI component for uploading credential metadata
 * to IPFS via Pinata
 * 
 * Usage:
 * import { IPFSUploader } from './components/IPFSUploader';
 * <IPFSUploader onUpload={handleUpload} />
 */

import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/**
 * IPFS Upload Component
 * @param {Function} onUpload - Callback when upload completes
 * @param {string} apiKey - Optional Pinata API key
 * @param {string} secretKey - Optional Pinata secret key
 */
export const IPFSUploader = ({ onUpload, apiKey = '', secretKey = '' }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedHash, setUploadedHash] = useState('');
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    /**
     * Upload JSON to IPFS via backend API
     */
    const uploadToIPFS = async (jsonData) => {
        setUploading(true);
        setError('');
        setUploadedHash('');

        try {
            const response = await fetch('/api/ipfs/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: jsonData,
                    apiKey: apiKey || undefined,
                    secretKey: secretKey || undefined
                })
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            const hash = result.ipfsHash || result.IpfsHash;
            
            setUploadedHash(hash);
            
            if (onUpload) {
                onUpload(hash, jsonData);
            }
            
            return hash;
        } catch (err) {
            setError(err.message || 'Failed to upload to IPFS');
            throw err;
        } finally {
            setUploading(false);
        }
    };

    /**
     * Handle file drop
     */
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer?.files || e.target?.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        
        // Check if it's a JSON file
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
            setError('Please upload a JSON file');
            return;
        }

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            await uploadToIPFS(jsonData);
        } catch (err) {
            setError(err.message || 'Invalid JSON file');
        }
    };

    /**
     * Handle paste from clipboard
     */
    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let item of items) {
            if (item.type === 'application/json') {
                item.getAsString(async (text) => {
                    try {
                        const jsonData = JSON.parse(text);
                        await uploadToIPFS(jsonData);
                    } catch (err) {
                        setError('Invalid JSON in clipboard');
                    }
                });
                break;
            }
        }
    };

    return (
        <div className="ipfs-uploader p-4 border-2 border-dashed rounded-lg">
            {/* Drag and drop zone */}
            <div
                className={`drag-zone p-8 text-center rounded-lg transition-colors ${
                    dragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onPaste={handlePaste}
            >
                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader className="w-12 h-12 animate-spin text-primary" />
                        <p className="mt-2 text-gray-600">Uploading to IPFS...</p>
                    </div>
                ) : uploadedHash ? (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                        <p className="mt-2 text-gray-600">Upload Complete!</p>
                        <a 
                            href={`https://gateway.pinata.cloud/ipfs/${uploadedHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-sm text-blue-500 hover:underline break-all"
                        >
                            {uploadedHash}
                        </a>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Upload className="w-12 h-12 text-gray-400" />
                        <p className="mt-2 text-gray-600">
                            Drag & drop a JSON file here, or click to paste
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                            You can also paste JSON from clipboard (Ctrl+V)
                        </p>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* IPFS Hash display */}
            {uploadedHash && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">IPFS Hash:</p>
                    <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 text-sm bg-white p-2 rounded border overflow-x-auto">
                            {uploadedHash}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(uploadedHash)}
                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * IPFS Image Uploader Component
 * @param {Function} onUpload - Callback when upload completes
 */
export const IPFSImageUploader = ({ onUpload }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [uploadedHash, setUploadedHash] = useState('');
    const [error, setError] = useState('');

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);

        // Upload to IPFS
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/ipfs/upload-file', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            const hash = result.ipfsHash || result.IpfsHash;
            
            setUploadedHash(hash);
            
            if (onUpload) {
                onUpload(hash);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="ipfs-image-uploader">
            <div className="relative">
                {preview ? (
                    <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                    />
                ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <File className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>

            {uploading && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    Uploading to IPFS...
                </div>
            )}

            {uploadedHash && (
                <div className="mt-2 text-sm text-green-600">
                    Uploaded! Hash: {uploadedHash.slice(0, 20)}...
                </div>
            )}

            {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
            )}
        </div>
    );
};

/**
 * IPFS Download Component
 * @param {string} ipfsHash - IPFS hash to download
 */
export const IPFSDownloader = ({ ipfsHash }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const downloadFromIPFS = async () => {
        if (!ipfsHash) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/ipfs/download/${ipfsHash}`);
            
            if (!response.ok) {
                throw new Error('Download failed');
            }

            const jsonData = await response.json();
            setData(jsonData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ipfs-downloader p-4 border rounded-lg">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={ipfsHash || ''}
                    onChange={(e) => {}}
                    placeholder="Enter IPFS hash"
                    className="flex-1 px-3 py-2 border rounded"
                />
                <button
                    onClick={downloadFromIPFS}
                    disabled={loading || !ipfsHash}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Download'}
                </button>
            </div>

            {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
            )}

            {data && (
                <div className="mt-4">
                    <pre className="p-3 bg-gray-100 rounded overflow-x-auto text-sm">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default IPFSUploader;
