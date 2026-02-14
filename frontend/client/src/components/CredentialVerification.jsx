import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from "lucide-react";

/**
 * CredentialVerification Component
 * 
 * This component allows users to verify EIP-712 signed credentials
 * either on-chain (using the smart contract) or off-chain (free verification).
 * 
 * How it works:
 * 1. User enters credential data and signature
 * 2. User chooses verification method (on-chain or off-chain)
 * 3. System verifies the EIP-712 signature
 * 4.结果显示credential是否有效
 */
export default function CredentialVerification({ credentialRegistryAddress }) {
  const [credentialData, setCredentialData] = useState({
    holder: "",
    credentialType: "",
    data: "",
    expiresAt: "",
    nonce: ""
  });
  const [signature, setSignature] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState("off-chain"); // "on-chain" or "off-chain"

  // EIP-712 domain separator matching the smart contract
  const getDomain = (chainId) => ({
    name: "CredenceCredentialRegistry",
    version: "1",
    chainId: chainId,
    verifyingContract: credentialRegistryAddress
  });

  // EIP-712 types matching the smart contract
  const types = {
    OffChainCredential: [
      { name: "holder", type: "address" },
      { name: "credentialType", type: "string" },
      { name: "data", type: "string" },
      { name: "expiresAt", type: "uint256" },
      { name: "nonce", type: "uint256" }
    ]
  };

  /**
   * Off-chain verification using ethers.js
   * This is FREE and doesn't require any blockchain transaction
   */
  const verifyOffChain = async () => {
    try {
      setIsVerifying(true);
      setVerificationResult(null);

      // Get the current network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      const domain = getDomain(Number(network.chainId));

      const credential = {
        holder: credentialData.holder,
        credentialType: credentialData.credentialType,
        data: credentialData.data,
        expiresAt: parseInt(credentialData.expiresAt),
        nonce: parseInt(credentialData.nonce)
      };

      // Recover the signer from the signature
      const recoveredIssuer = ethers.verifyTypedData(
        domain,
        types,
        credential,
        signature
      );

      // Check if the recovered address matches the expected issuer
      const isValid = recoveredIssuer.toLowerCase() === issuerAddress.toLowerCase();

      // Check if credential has expired
      const isExpired = Date.now() / 1000 > credential.expiresAt;

      setVerificationResult({
        isValid: isValid && !isExpired,
        recoveredIssuer,
        expectedIssuer: issuerAddress,
        isExpired,
        method: "off-chain",
        message: isValid 
          ? (isExpired ? "Credential signature valid but EXPIRED" : "Credential is VALID!")
          : `Invalid signature. Expected issuer: ${issuerAddress}, Recovered: ${recoveredIssuer}`
      });
    } catch (error) {
      setVerificationResult({
        isValid: false,
        error: error.message,
        method: "off-chain"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * On-chain verification using the smart contract
   * This requires a blockchain transaction and may cost gas
   */
  const verifyOnChain = async () => {
    try {
      setIsVerifying(true);
      setVerificationResult(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(
        credentialRegistryAddress,
        [
          "function verifyOffChainCredential(address _issuer, address _holder, string _credentialType, string _data, uint256 _expiresAt, uint256 _nonce, bytes _signature) external view returns (bool)"
        ],
        signer
      );

      const isValid = await contract.verifyOffChainCredential(
        issuerAddress,
        credentialData.holder,
        credentialData.credentialType,
        credentialData.data,
        parseInt(credentialData.expiresAt),
        parseInt(credentialData.nonce),
        signature
      );

      setVerificationResult({
        isValid,
        method: "on-chain",
        message: isValid ? "Credential is VALID (on-chain verified)!" : "Credential is INVALID"
      });
    } catch (error) {
      setVerificationResult({
        isValid: false,
        error: error.message,
        method: "on-chain"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (verificationMethod === "off-chain") {
      verifyOffChain();
    } else {
      verifyOnChain();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Verify EIP-712 Credential
        </CardTitle>
        <CardDescription>
          Verify credential authenticity using EIP-712 typed data signatures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Verification Method Toggle */}
        <div className="flex gap-2">
          <Button
            variant={verificationMethod === "off-chain" ? "default" : "outline"}
            onClick={() => setVerificationMethod("off-chain")}
            className="flex-1"
          >
            🔓 Off-Chain (Free)
          </Button>
          <Button
            variant={verificationMethod === "on-chain" ? "default" : "outline"}
            onClick={() => setVerificationMethod("on-chain")}
            className="flex-1"
          >
            ⛽ On-Chain (Verified)
          </Button>
        </div>

        {verificationMethod === "off-chain" && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            💡 <strong>Off-chain verification</strong> is free and instant! 
            Uses ethers.js to verify the signature directly in your browser.
          </div>
        )}

        {verificationMethod === "on-chain" && (
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
            ⚠️ <strong>On-chain verification</strong> requires a blockchain transaction 
            and may cost gas. This provides additional security by checking the contract state.
          </div>
        )}

        {/* Issuer Address */}
        <div>
          <label className="text-sm font-medium">Issuer Address</label>
          <Input
            placeholder="0x..."
            value={issuerAddress}
            onChange={(e) => setIssuerAddress(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Credential Data */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Holder Address</label>
            <Input
              placeholder="0x..."
              value={credentialData.holder}
              onChange={(e) => setCredentialData({...credentialData, holder: e.target.value})}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Credential Type</label>
            <Input
              placeholder="UniversityDegree"
              value={credentialData.credentialType}
              onChange={(e) => setCredentialData({...credentialData, credentialType: e.target.value})}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Expires At (Unix)</label>
            <Input
              placeholder="1735689600"
              value={credentialData.expiresAt}
              onChange={(e) => setCredentialData({...credentialData, expiresAt: e.target.value})}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nonce</label>
            <Input
              placeholder="0"
              value={credentialData.nonce}
              onChange={(e) => setCredentialData({...credentialData, nonce: e.target.value})}
              className="mt-1"
            />
          </div>
        </div>

        {/* Credential Data JSON */}
        <div>
          <label className="text-sm font-medium">Credential Data (JSON)</label>
          <textarea
            className="w-full mt-1 p-2 border rounded-md font-mono text-sm"
            placeholder='{"degree": "BS Computer Science", "gpa": "3.8"}'
            rows={3}
            value={credentialData.data}
            onChange={(e) => setCredentialData({...credentialData, data: e.target.value})}
          />
        </div>

        {/* Signature */}
        <div>
          <label className="text-sm font-medium">EIP-712 Signature</label>
          <div className="flex gap-2 mt-1">
            <textarea
              className="flex-1 p-2 border rounded-md font-mono text-xs"
              placeholder="0x..."
              rows={2}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            {signature && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(signature)}
                title="Copy signature"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Verify Button */}
        <Button 
          onClick={handleVerify} 
          disabled={isVerifying || !signature || !issuerAddress}
          className="w-full"
        >
          {isVerifying ? "Verifying..." : `Verify Credential (${verificationMethod === "off-chain" ? "Free" : "On-Chain"})`}
        </Button>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`p-4 rounded-lg ${
            verificationResult.isValid 
              ? "bg-green-50 border border-green-200" 
              : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center gap-2">
              {verificationResult.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                verificationResult.isValid ? "text-green-700" : "text-red-700"
              }`}>
                {verificationResult.isValid ? "✅ VALID" : "❌ INVALID"}
              </span>
            </div>
            
            <p className="mt-2 text-sm">{verificationResult.message}</p>

            {/* Additional Details */}
            {verificationResult.recoveredIssuer && (
              <div className="mt-3 text-xs space-y-1">
                <p><strong>Recovered Issuer:</strong> {verificationResult.recoveredIssuer}</p>
                <p><strong>Expected Issuer:</strong> {verificationResult.expectedIssuer}</p>
                {verificationResult.isExpired && (
                  <p className="text-red-600 font-medium">⚠️ This credential has EXPIRED</p>
                )}
              </div>
            )}

            {verificationResult.error && (
              <p className="mt-2 text-sm text-red-600">Error: {verificationResult.error}</p>
            )}

            <div className="mt-2 text-xs text-gray-500">
              Verification Method: {verificationResult.method}
            </div>
          </div>
        )}

        {/* Sample Data for Testing */}
        <details className="text-sm text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            📋 Sample Credential Data (for testing)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{JSON.stringify({
  holder: "0x123...",
  credentialType: "UniversityDegree",
  data: '{"degree": "BS Computer Science", "gpa": "3.8"}',
  expiresAt: "1735689600",
  nonce: "0"
}, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}
