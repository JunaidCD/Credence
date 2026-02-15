const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZKCredentialVerifier Tests", function () {
  let zkVerifier;
  let owner, holder, verifier;

  before(async function () {
    [owner, holder, verifier] = await ethers.getSigners();

    const ZKCredentialVerifier = await ethers.getContractFactory("ZKCredentialVerifier");
    zkVerifier = await ZKCredentialVerifier.deploy();
    await zkVerifier.waitForDeployment();
  });

  describe("ZK Proof Submission", function () {
    it("should submit a ZK proof", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential"));
      const a = [1, 2];
      const b = [3, 4];
      const c = [5, 6];
      const publicSignals = "0x1234";

      const tx = await zkVerifier.connect(holder).submitProof(
        holder.address,
        credentialHash,
        a,
        b,
        c,
        publicSignals
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ZKProofSubmitted");

      expect(event).to.not.be.undefined;
      console.log("✓ Test ZK1: ZK proof submitted successfully");
    });

    it("should verify a ZK proof", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential-2"));
      
      const tx = await zkVerifier.connect(holder).submitProof(
        holder.address,
        credentialHash,
        [1, 2],
        [3, 4],
        [5, 6],
        "0xabcd"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ZKProofSubmitted");
      const proofId = event.args.proofId;

      const isValid = await zkVerifier.connect(verifier).verifyProof(proofId);
      expect(isValid).to.be.true;
      console.log("✓ Test ZK2: ZK proof verified successfully");
    });

    it("should verify credential ownership", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential-ownership"));
      
      const tx = await zkVerifier.connect(holder).submitProof(
        holder.address,
        credentialHash,
        [1, 2],
        [3, 4],
        [5, 6],
        "0xdefa"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ZKProofSubmitted");
      const proofId = event.args.proofId;

      await zkVerifier.verifyProof(proofId);

      const isOwner = await zkVerifier.verifyCredentialOwnership(holder.address, proofId);
      expect(isOwner).to.be.true;
      console.log("✓ Test ZK3: Credential ownership verified");
    });

    it("should create commitment", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("secret-data"));
      const secret = ethers.keccak256(ethers.toUtf8Bytes("my-secret"));

      const commitment = await zkVerifier.createCommitment(dataHash, secret);
      expect(commitment).to.not.equal(ethers.ZeroHash);
      console.log("✓ Test ZK4: Commitment created");
    });

    it("should verify criteria", async function () {
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential-4"));
      
      const tx = await zkVerifier.connect(holder).submitProof(
        holder.address,
        credentialHash,
        [1, 2],
        [3, 4],
        [5, 6],
        "0x5678"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ZKProofSubmitted");
      const proofId = event.args.proofId;

      await zkVerifier.verifyProof(proofId);

      const meetsCriteria = await zkVerifier.verifyCriteria(proofId, credentialHash);
      expect(meetsCriteria).to.be.true;
      console.log("✓ Test ZK5: Criteria verified");
    });

    it("should get verification count", async function () {
      // First verify and count a proof to increment the count
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("test-credential-count"));
      
      const tx = await zkVerifier.connect(holder).submitProof(
        holder.address,
        credentialHash,
        [1, 2],
        [3, 4],
        [5, 6],
        "0x9999"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment && l.fragment.name === "ZKProofSubmitted");
      const proofId = event.args.proofId;

      // Use verifyProofAndCount to increment the verification count
      await zkVerifier.verifyProofAndCount(proofId);

      const count = await zkVerifier.getVerificationCount(holder.address);
      expect(Number(count)).to.be.greaterThan(0);
      console.log("✓ Test ZK6: Verification count retrieved");
    });

    it("should update verifier key", async function () {
      await zkVerifier.updateVerifierKey(holder.address);
      const newKey = await zkVerifier.verifierKey();
      expect(newKey).to.equal(holder.address);
      console.log("✓ Test ZK7: Verifier key updated");
    });

    it("should get holder proofs", async function () {
      const proofs = await zkVerifier.getHolderProofs(holder.address);
      expect(proofs.length).to.be.greaterThan(0);
      console.log("✓ Test ZK8: Holder proofs retrieved");
    });
  });
});
