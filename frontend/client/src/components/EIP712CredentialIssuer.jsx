import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, CheckCircle2, FileSignature } from "lucide-react";

/**
 * EIP712CredentialIssuer Component
 * 
 * This component allows issuers to create and sign EIP-712 credentials.
 * 
 * How it works:
 * 1. Issuer fills in credential details
 * 2. Issuer signs the credential data using EIP-712
 * 3. The signature can be shared with the holder
 * 4. Anyone can verify the credential using the signature
 */
export default function EIP712CredentialIssuer({ credentialRegistryAddress }) {
  const [holderAddress, setHolderAddress] = useState("");
  const [credentialType, setCredentialType] = useState("");
  const [credentialData, setCredentialData] = useState('{"degree": "BS Computer Science", "gpa": "3.8"}');
  const [expirationDays, setExpirationDays] = useState("365");
  const [nonce, setNonce] = useState("0");
  
  const [signature, setSignature] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [signedData, setSignedData] = useState(null);

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
   * Sign the credential using EIP-712
   * This creates a cryptographic signature that can be verified by anyone
   */
  const signCredential = async () => {
    try {
      setIsSigning(true);
      setSignature("");
      setSignedData(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert("Please install MetaMask to sign credentials");
        return;
      }

      // Connect to MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      // Calculate expiration timestamp
      const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expirationDays) * 24 * 60 * 60;

      // Prepare the credential data
      const credential = {
        holder: holderAddress,
        credentialType: credentialType,
        data: credentialData,
        expiresAt: expiresAt,
        nonce: parseInt(nonce)
      };

      console.log("Signing credential:", credential);

      // Sign the credential using EIP-712
      const sig = await signer.signTypedData(
        getDomain(Number(network.chainId)),
        types,
        credential
      );

      setSignature(sig);
      setSignedData({
        ...credential,
        expiresAt: expiresAt,
        issuer: await signer.getAddress()
      });

    } catch (error) {
      console.error("Signing error:", error);
      alert(`Signing failed: ${error.message}`);
    } finally {
      setIsSigning(false);
    }
  };

  /**
   * Also store the credential on-chain for indexing
   */
  const issueOnChain = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(
        credentialRegistryAddress,
        [
          "function issueCredentialWithSignature(address _holder, string _credentialType, string _data, uint256 _expiresAt, uint256 _nonce, bytes _signature) external returns (bytes32)"
        ],
        signer
      );

      const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expirationDays) * 24 * 60 * 60;

      const tx = await contract.issueCredentialWithSignature(
        holderAddress,
        credentialType,
        credentialData,
        expiresAt,
        parseInt(nonce),
        signature
      );

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      alert("Credential issued on-chain successfully!");
    } catch (error) {
      console.error("On-chain issuance error:", error);
      alert(`On-chain issuance failed: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllData = () => {
    const data = JSON.stringify(signedData, null, 2);
    navigator.clipboard.writeText(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-blue-600" />
          Issue EIP-712 Credential
        </CardTitle>
        <CardDescription>
          Create and sign credentials using EIP-712 typed data signatures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credential Details Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Holder Address</label>
            <Input
              placeholder="0x..."
              value={holderAddress}
              onChange={(e) => setHolderAddress(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Credential Type</label>
            <Input
              placeholder="UniversityDegree"
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Expiration (days)</label>
            <Input
              type="number"
              placeholder="365"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Nonce</label>
            <Input
              type="number"
              placeholder="0"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Credential Data (JSON)</label>
          <Textarea
            placeholder='{"degree": "BS Computer Science", "gpa": "3.8"}'
            rows={4}
            value={credentialData}
            onChange={(e) => setCredentialData(e.target.value)}
            className="mt-1 font-mono text-sm"
          />
        </div>

        {/* Sign Button */}
        <Button 
          onClick={signCredential} 
          disabled={isSigning || !holderAddress || !credentialType || !credentialData}
          className="w-full"
        >
          {isSigning ? "Signing with MetaMask..." : "✍️ Sign Credential (EIP-712)"}
        </Button>

        {/* Signature Result */}
        {signature && (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700">Credential Signed Successfully!</span>
              </div>
              <p className="mt-2 text-sm text-green-600">
                You can now share this credential with the holder. They can verify it using the signature.
              </p>
            </div>

            {/* Signature */}
            <div>
              <label className="text-sm font-medium">EIP-712 Signature</label>
              <div className="flex gap-2 mt-1">
                <textarea
                  className="flex-1 p-2 border rounded-md font-mono text-xs"
                  rows={3}
                  value={signature}
                  readOnly
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(signature)}
                  title="Copy signature"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Signed Data */}
            {signedData && (
              <div>
                <label className="text-sm font-medium">Complete Credential Data</label>
                <div className="flex gap-2 mt-1">
                  <pre className="flex-1 p-3 bg-gray-100 rounded-md font-mono text-xs overflow-x-auto">
                    {JSON.stringify(signedData, null, 2)}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyAllData}
                    title="Copy all data"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Optional: Also store on-chain */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                💡 <strong>Tip:</strong> You can also store this credential on-chain for indexing and easier discovery.
              </p>
              <Button 
                onClick={issueOnChain} 
                variant="outline"
                className="w-full"
              >
                📦 Also Store On-Chain (Optional)
              </Button>
            </div>

            {/* Share Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-700">📤 How to share with holder:</h4>
              <ol className="mt-2 text-sm text-blue-600 list-decimal list-inside space-y-1">
                <li>Copy the signature above</li>
                <li>Send to the credential holder (via email, chat, IPFS, etc.)</li>
                <li>Holder can verify using the Credential Verification component</li>
              </ol>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
          <strong>How EIP-712 works:</strong>
          <ul className="mt-1 list-disc list-inside">
            <li>Credential data is signed using your wallet (MetaMask)</li>
            <li>The signature proves you (the issuer) created this credential</li>
            <li>No on-chain storage required - data stays off-chain</li>
            <li>Anyone can verify the signature using ethers.js</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
