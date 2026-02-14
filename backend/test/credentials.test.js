const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CredentialRegistry EIP-712 & Merkle Tests", function () {
  let credentialRegistry, issuerRegistry;
  let owner, issuer, holder, verifier;

  before(async function () {
    [owner, issuer, holder, verifier] = await ethers.getSigners();

    // Deploy IssuerRegistry first
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();

    // Register the issuer (the 'issuer' account should be registered)
    await issuerRegistry.connect(issuer).registerIssuer("Test Issuer", "Test Organization", "test@issuer.com");

    // Deploy CredentialRegistry
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy(await issuerRegistry.getAddress());
    await credentialRegistry.waitForDeployment();
  });

  describe("On-Chain Credential Issuance", function () {
    it("should issue credential on-chain", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(
          holder.address,
          "UniversityDegree",
          JSON.stringify({ degree: "BS Computer Science", gpa: "3.8" }),
          expiresAt,
          "ipfs://QmHash..."
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");

      expect(event).to.not.be.undefined;
      console.log("✓ On-chain credential issued");
    });
  });

  describe("EIP-712 Off-Chain Credentials", function () {
    it("should issue credential with EIP-712 signature", async function () {
      // Get domain separator from contract
      const domainSeparator = await credentialRegistry.DOMAIN_SEPARATOR();
      console.log("Domain Separator:", domainSeparator);

      const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const nonce = 0;

      // Build EIP-712 signature data - use BigInt for chainId in ethers v6
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const domain = {
        name: "CredenceCredentialRegistry",
        version: "1",
        chainId: typeof chainId === 'bigint' ? chainId : parseInt(chainId),
        verifyingContract: await credentialRegistry.getAddress(),
      };

      const types = {
        OffChainCredential: [
          { name: "holder", type: "address" },
          { name: "credentialType", type: "string" },
          { name: "data", type: "string" },
          { name: "expiresAt", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const credentialData = {
        holder: holder.address,
        credentialType: "WorkExperience",
        data: JSON.stringify({ title: "Senior Developer", years: 5 }),
        expiresAt: expiresAt,
        nonce: nonce,
      };

      // Sign as issuer using ethers v6 API
      const signature = await issuer.signTypedData(domain, types, credentialData);
      console.log("Signature:", signature);

      // Issue credential with signature
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredentialWithSignature(
          credentialData.holder,
          credentialData.credentialType,
          credentialData.data,
          credentialData.expiresAt,
          credentialData.nonce,
          signature
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "OffChainCredentialIssued");

      expect(event).to.not.be.undefined;
      console.log("✓ EIP-712 credential issued!");
    });

    it("should verify off-chain credential", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      const nonce = 1;

      const chainId = (await ethers.provider.getNetwork()).chainId;
      const domain = {
        name: "CredenceCredentialRegistry",
        version: "1",
        chainId: typeof chainId === 'bigint' ? chainId : parseInt(chainId),
        verifyingContract: await credentialRegistry.getAddress(),
      };

      const types = {
        OffChainCredential: [
          { name: "holder", type: "address" },
          { name: "credentialType", type: "string" },
          { name: "data", type: "string" },
          { name: "expiresAt", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      const credentialData = {
        holder: holder.address,
        credentialType: "IdentityCredential",
        data: JSON.stringify({ did: "did:cred:123", name: "John" }),
        expiresAt: expiresAt,
        nonce: nonce,
      };

      const signature = await issuer.signTypedData(domain, types, credentialData);

      // The verify function needs the issuer address first
      const isValid = await credentialRegistry.verifyOffChainCredential(
        issuer.address,  // _issuer
        credentialData.holder,
        credentialData.credentialType,
        credentialData.data,
        credentialData.expiresAt,
        credentialData.nonce,
        signature
      );

      expect(isValid).to.be.true;
      console.log("✓ Off-chain credential verified!");
    });
  });

  describe("Merkle Proof Selective Disclosure", function () {
    it("should create Merkle credential", async function () {
      // Hardcoded Merkle root (in real scenario, build this off-chain)
      // This is a simple example - in production use merkletreejs
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkle-root-example"));
      
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      const tx = await credentialRegistry
        .connect(issuer)
        .createMerkleCredential(
          holder.address,
          "SelectiveCredential",
          merkleRoot,
          expiresAt
        );

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "MerkleCredentialCreated");

      expect(event).to.not.be.undefined;
      console.log("✓ Merkle credential created!");
    });
  });

  describe("View Functions", function () {
    it("should get domain separator", async function () {
      const domainSeparator = await credentialRegistry.DOMAIN_SEPARATOR();
      expect(domainSeparator).to.not.equal(ethers.ZeroHash);
      console.log("✓ Domain separator retrieved:", domainSeparator);
    });
  });
});
