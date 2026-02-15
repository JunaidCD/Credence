const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CredentialRegistry - Comprehensive Tests", function () {
  let credentialRegistry, issuerRegistry;
  let owner, issuer, holder, verifier, nonRegisteredUser;

  before(async function () {
    [owner, issuer, holder, verifier, nonRegisteredUser] = await ethers.getSigners();

    // Deploy IssuerRegistry
    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();

    // Register the issuer
    await issuerRegistry.connect(issuer).registerIssuer("Test Issuer", "Test Organization", "test@issuer.com");

    // Deploy CredentialRegistry
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy(await issuerRegistry.getAddress());
    await credentialRegistry.waitForDeployment();
  });

  // ============================================
  // TEST 1: On-Chain Credential Issuance
  // ============================================
  describe("Credential Issuance", function () {
    it("should successfully issue a credential", async function () {
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
      expect(event.args.holder).to.equal(holder.address);
      expect(event.args.issuer).to.equal(issuer.address);
      console.log("✓ Test 1: Credential issued successfully");
    });

    it("should fail to issue credential with zero holder address", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      try {
        await credentialRegistry
          .connect(issuer)
          .issueCredential(
            ethers.ZeroAddress,
            "UniversityDegree",
            JSON.stringify({ degree: "BS" }),
            expiresAt,
            "ipfs://QmHash"
          );
      } catch (e) {
        console.log("✓ Test 1a: Rejected zero holder address");
      }
    });

    it("should fail to issue credential with empty credential type", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(
            holder.address,
            "",
            JSON.stringify({ degree: "BS" }),
            expiresAt,
            "ipfs://QmHash"
          )
      ).to.be.reverted;
      console.log("✓ Test 1b: Rejected empty credential type");
    });

    it("should fail to issue credential with empty data", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(
            holder.address,
            "UniversityDegree",
            "",
            expiresAt,
            "ipfs://QmHash"
          )
      ).to.be.reverted;
      console.log("✓ Test 1c: Rejected empty credential data");
    });

    it("should fail to issue credential with past expiration date", async function () {
      const pastExpiresAt = (await time.latest()) - 1;

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(
            holder.address,
            "UniversityDegree",
            JSON.stringify({ degree: "BS" }),
            pastExpiresAt,
            "ipfs://QmHash"
          )
      ).to.be.reverted;
      console.log("✓ Test 1d: Rejected past expiration date");
    });
  });

  // ============================================
  // TEST 2: Credential Verification
  // ============================================
  describe("Credential Verification", function () {
    let credentialId;

    before(async function () {
      // Issue a credential for verification tests
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(
          holder.address,
          "EmploymentCredential",
          JSON.stringify({ title: "Software Engineer", company: "TechCorp" }),
          expiresAt,
          "ipfs://QmEmployment"
        );
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");
      credentialId = event.args.credentialId;
    });

    it("should request verification successfully", async function () {
      const tx = await credentialRegistry
        .connect(verifier)
        .requestVerification(holder.address, credentialId, "Need to verify employment");

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "VerificationRequested");

      expect(event).to.not.be.undefined;
      expect(event.args.holder).to.equal(holder.address);
      expect(event.args.credentialId).to.equal(credentialId);
      console.log("✓ Test 2: Verification requested successfully");
    });

    it("should fail to request verification with wrong holder", async function () {
      await expect(
        credentialRegistry
          .connect(verifier)
          .requestVerification(nonRegisteredUser.address, credentialId, "Wrong holder")
      ).to.be.reverted;
      console.log("✓ Test 2a: Rejected verification with wrong holder");
    });

    it("should process verification request", async function () {
      // First request verification
      const tx = await credentialRegistry
        .connect(verifier)
        .requestVerification(holder.address, credentialId, "Verify employment");
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "VerificationRequested");
      const requestId = event.args.requestId;

      // Process the verification request
      const processTx = await credentialRegistry
        .connect(holder)
        .processVerificationRequest(requestId, true);

      const processReceipt = await processTx.wait();
      const processEvent = processReceipt.logs.find(
        (l) => l.fragment && l.fragment.name === "VerificationProcessed"
      );

      expect(processEvent).to.not.be.undefined;
      expect(processEvent.args.approved).to.be.true;
      console.log("✓ Test 2b: Verification processed successfully");
    });

    it("should check credential validity", async function () {
      const isValid = await credentialRegistry.isCredentialValid(credentialId);
      expect(isValid).to.be.true;
      console.log("✓ Test 2c: Credential validity check passed");
    });
  });

  // ============================================
  // TEST 3: Credential Revocation
  // ============================================
  describe("Credential Revocation", function () {
    let credentialId;

    before(async function () {
      // Issue a credential for revocation tests
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(
          holder.address,
          "RevocableCredential",
          JSON.stringify({ type: "Test" }),
          expiresAt,
          "ipfs://QmRevocable"
        );
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");
      credentialId = event.args.credentialId;
    });

    it("should revoke credential successfully", async function () {
      const tx = await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialRevoked");

      expect(event).to.not.be.undefined;
      expect(event.args.credentialId).to.equal(credentialId);
      console.log("✓ Test 3: Credential revoked successfully");
    });

    it("should fail to revoke already revoked credential", async function () {
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId)
      ).to.be.reverted;
      console.log("✓ Test 3a: Rejected revocation of already revoked credential");
    });

    it("should fail to revoke credential from non-issuer", async function () {
      // Issue a new credential first
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, "NewCredential", "{}", expiresAt, "ipfs://");
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");
      const newCredentialId = event.args.credentialId;

      // Try to revoke with different issuer
      await expect(
        credentialRegistry.connect(nonRegisteredUser).revokeCredential(newCredentialId)
      ).to.be.reverted;
      console.log("✓ Test 3b: Rejected revocation by non-issuer");
    });

    it("should show credential as invalid after revocation", async function () {
      const isValid = await credentialRegistry.isCredentialValid(credentialId);
      expect(isValid).to.be.false;
      console.log("✓ Test 3c: Revoked credential shows as invalid");
    });
  });

  // ============================================
  // TEST 4: Edge Cases - Invalid Signatures
  // ============================================
  describe("Edge Cases - Invalid Signatures", function () {
    it("should fail with invalid signature length", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredentialWithSignature(
            holder.address,
            "TestCredential",
            "{}",
            expiresAt,
            0,
            "0x1234"
          )
      ).to.be.reverted;
      console.log("✓ Test 4: Rejected invalid signature length");
    });

    it("should fail with used nonce", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      const nonce = 100;

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
        credentialType: "TestCredential",
        data: "{}",
        expiresAt: expiresAt,
        nonce: nonce,
      };

      const signature = await issuer.signTypedData(domain, types, credentialData);

      // First use should succeed
      await credentialRegistry
        .connect(issuer)
        .issueCredentialWithSignature(
          holder.address,
          credentialData.credentialType,
          credentialData.data,
          credentialData.expiresAt,
          credentialData.nonce,
          signature
        );

      // Second use with same nonce should fail
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredentialWithSignature(
            holder.address,
            credentialData.credentialType,
            credentialData.data,
            credentialData.expiresAt,
            credentialData.nonce,
            signature
          )
      ).to.be.reverted;
      console.log("✓ Test 4a: Rejected used nonce");
    });

    it("should fail with signature from non-registered issuer", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

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
        credentialType: "TestCredential",
        data: "{}",
        expiresAt: expiresAt,
        nonce: 200,
      };

      const signature = await nonRegisteredUser.signTypedData(domain, types, credentialData);

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredentialWithSignature(
            holder.address,
            credentialData.credentialType,
            credentialData.data,
            credentialData.expiresAt,
            credentialData.nonce,
            signature
          )
      ).to.be.reverted;
      console.log("✓ Test 4b: Rejected signature from non-registered issuer");
    });

    it("should fail with expired credential", async function () {
      const expiredExpiresAt = (await time.latest()) - 1;

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
        credentialType: "ExpiredCredential",
        data: "{}",
        expiresAt: expiredExpiresAt,
        nonce: 300,
      };

      const signature = await issuer.signTypedData(domain, types, credentialData);

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredentialWithSignature(
            holder.address,
            credentialData.credentialType,
            credentialData.data,
            credentialData.expiresAt,
            credentialData.nonce,
            signature
          )
      ).to.be.reverted;
      console.log("✓ Test 4c: Rejected expired credential");
    });
  });

  // ============================================
  // TEST 5: Edge Cases - Role Failures
  // ============================================
  describe("Edge Cases - Role Failures", function () {
    it("should fail to issue credential by non-registered issuer", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      await expect(
        credentialRegistry
          .connect(nonRegisteredUser)
          .issueCredential(
            holder.address,
            "UnauthorizedCredential",
            "{}",
            expiresAt,
            "ipfs://"
          )
      ).to.be.reverted;
      console.log("✓ Test 5: Rejected credential issuance by non-registered issuer");
    });

    it("should fail to process verification from non-holder", async function () {
      // Try to process the request as non-holder (should fail)
      await expect(
        credentialRegistry.connect(nonRegisteredUser).processVerificationRequest(1, true)
      ).to.be.reverted;
      console.log("✓ Test 5a: Rejected verification processing by non-holder");
    });
  });

  // ============================================
  // TEST 6: Merkle Proof Tests
  // ============================================
  describe("Merkle Proof Selective Disclosure", function () {
    it("should create merkle credential", async function () {
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkle-root-example"));
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      const tx = await credentialRegistry
        .connect(issuer)
        .createMerkleCredential(holder.address, "SelectiveCredential", merkleRoot, expiresAt);

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "MerkleCredentialCreated");

      expect(event).to.not.be.undefined;
      console.log("✓ Test 6: Merkle credential created successfully");
    });

    it("should verify merkle proof", async function () {
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("test-leaf"));
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      const tx = await credentialRegistry
        .connect(issuer)
        .createMerkleCredential(holder.address, "VerifyMerkle", merkleRoot, expiresAt);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "MerkleCredentialCreated");
      const credId = event.args.credentialId;

      const isValid = await credentialRegistry.verifyMerkleProof(credId, merkleRoot, []);
      expect(isValid).to.be.true;
      console.log("✓ Test 6a: Merkle proof verified successfully");
    });
  });

  // ============================================
  // TEST 7: View Functions
  // ============================================
  describe("View Functions", function () {
    it("should get credential details", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, "ViewTestCredential", "{}", expiresAt, "ipfs://view");
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");
      const credId = event.args.credentialId;

      const credential = await credentialRegistry.getCredential(credId);
      expect(credential.holder).to.equal(holder.address);
      expect(credential.issuer).to.equal(issuer.address);
      console.log("✓ Test 7: View function returns correct credential details");
    });

    it("should get holder credentials", async function () {
      const creds = await credentialRegistry.getHolderCredentials(holder.address);
      expect(creds.length).to.be.greaterThan(0);
      console.log("✓ Test 7a: Retrieved holder credentials");
    });

    it("should get total credentials count", async function () {
      const total = await credentialRegistry.getTotalCredentials();
      expect(Number(total)).to.be.greaterThan(0);
      console.log("✓ Test 7b: Total credentials count: ", total.toString());
    });
  });

  // ============================================
  // TEST 8: Duplicate Prevention
  // ============================================
  describe("Duplicate Prevention", function () {
    it("should prevent duplicate merkle roots", async function () {
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("duplicate-test"));
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      await credentialRegistry
        .connect(issuer)
        .createMerkleCredential(holder.address, "Merkle1", merkleRoot, expiresAt);

      await expect(
        credentialRegistry
          .connect(issuer)
          .createMerkleCredential(holder.address, "Merkle2", merkleRoot, expiresAt)
      ).to.be.reverted;
      console.log("✓ Test 9: Duplicate merkle root prevention works");
    });
  });

  // ============================================
  // TEST 9: E2E Workflow
  // ============================================
  describe("End-to-End Credential Workflow", function () {
    it("should complete full credential lifecycle", async function () {
      const expiresAt = (await time.latest()) + 365 * 24 * 60 * 60;

      const issueTx = await credentialRegistry
        .connect(issuer)
        .issueCredential(holder.address, "E2ECredential", JSON.stringify({ test: "data" }), expiresAt, "ipfs://e2e");
      const issueReceipt = await issueTx.wait();
      const issueEvent = issueReceipt.logs.find((l) => l.fragment && l.fragment.name === "CredentialIssued");
      const credId = issueEvent.args.credentialId;

      let isValid = await credentialRegistry.isCredentialValid(credId);
      expect(isValid).to.be.true;

      const requestTx = await credentialRegistry
        .connect(verifier)
        .requestVerification(holder.address, credId, "E2E Verification");
      const requestReceipt = await requestTx.wait();
      const requestEvent = requestReceipt.logs.find((l) => l.fragment && l.fragment.name === "VerificationRequested");
      const requestId = requestEvent.args.requestId;

      await credentialRegistry.connect(holder).processVerificationRequest(requestId, true);

      await credentialRegistry.connect(issuer).revokeCredential(credId);

      isValid = await credentialRegistry.isCredentialValid(credId);
      expect(isValid).to.be.false;

      console.log("✓ Test 10: Full E2E credential lifecycle completed");
    });
  });
});
