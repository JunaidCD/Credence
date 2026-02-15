const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerifierRegistry Tests", function () {
  let verifierRegistry;
  let owner, verifier1, verifier2, otherUser;

  before(async function () {
    [owner, verifier1, verifier2, otherUser] = await ethers.getSigners();

    const VerifierRegistry = await ethers.getContractFactory("VerifierRegistry");
    verifierRegistry = await VerifierRegistry.deploy();
    await verifierRegistry.waitForDeployment();
  });

  describe("Verifier Registration", function () {
    it("should register verifier correctly", async function () {
      await verifierRegistry.connect(verifier1).registerVerifier(
        "Test Verifier",
        "Verification Corp",
        "verifier@test.com"
      );

      const isRegistered = await verifierRegistry.isRegisteredVerifier(verifier1.address);
      expect(isRegistered).to.be.true;
      console.log("✓ Test VR1: Verifier registered successfully");
    });

    it("should fail to register same verifier twice", async function () {
      await expect(
        verifierRegistry.connect(verifier1).registerVerifier(
          "Test Verifier",
          "Verification Corp",
          "verifier@test.com"
        )
      ).to.be.reverted;
      console.log("✓ Test VR1a: Duplicate registration rejected");
    });

    it("should fail to register with empty name", async function () {
      await expect(
        verifierRegistry.connect(verifier2).registerVerifier(
          "",
          "Org",
          "test@test.com"
        )
      ).to.be.reverted;
      console.log("✓ Test VR1b: Empty name rejected");
    });

    it("should fail to register with empty organization", async function () {
      await expect(
        verifierRegistry.connect(verifier2).registerVerifier(
          "Name",
          "",
          "test@test.com"
        )
      ).to.be.reverted;
      console.log("✓ Test VR1c: Empty organization rejected");
    });

    it("should register second verifier", async function () {
      await verifierRegistry.connect(verifier2).registerVerifier(
        "Verifier 2",
        "Org 2",
        "verifier2@test.com"
      );

      const isRegistered = await verifierRegistry.isRegisteredVerifier(verifier2.address);
      expect(isRegistered).to.be.true;
      console.log("✓ Test VR1d: Second verifier registered");
    });
  });

  describe("Verifier Details", function () {
    it("should get verifier details", async function () {
      const verifier = await verifierRegistry.getVerifier(verifier1.address);
      expect(verifier.name).to.equal("Test Verifier");
      expect(verifier.organization).to.equal("Verification Corp");
      expect(verifier.isActive).to.be.true;
      console.log("✓ Test VR2: Verifier details retrieved");
    });

    it("should get all verifiers", async function () {
      const allVerifiers = await verifierRegistry.getAllVerifiers();
      expect(allVerifiers.length).to.equal(2);
      console.log("✓ Test VR3: All verifiers retrieved");
    });

    it("should get active verifiers", async function () {
      const activeVerifiers = await verifierRegistry.getActiveVerifiers();
      expect(activeVerifiers.length).to.equal(2);
      console.log("✓ Test VR4: Active verifiers retrieved");
    });

    it("should get total verifiers count", async function () {
      const count = await verifierRegistry.getTotalVerifiers();
      expect(Number(count)).to.equal(2);
      console.log("✓ Test VR5: Total verifiers count");
    });

    it("should get active verifier count", async function () {
      const count = await verifierRegistry.getActiveVerifierCount();
      expect(Number(count)).to.equal(2);
      console.log("✓ Test VR6: Active verifier count");
    });
  });

  describe("Verifier Deactivation", function () {
    it("should deactivate verifier", async function () {
      await verifierRegistry.connect(verifier1).deactivateVerifier(verifier1.address);

      const verifier = await verifierRegistry.getVerifier(verifier1.address);
      expect(verifier.isActive).to.be.false;
      console.log("✓ Test VR7: Verifier deactivated");
    });

    it("should fail to deactivate already deactivated", async function () {
      await expect(
        verifierRegistry.connect(verifier1).deactivateVerifier(verifier1.address)
      ).to.be.reverted;
      console.log("✓ Test VR7a: Cannot deactivate twice");
    });

    it("should fail to deactivate another verifier", async function () {
      await expect(
        verifierRegistry.connect(otherUser).deactivateVerifier(verifier2.address)
      ).to.be.reverted;
      console.log("✓ Test VR7b: Cannot deactivate others");
    });

    it("should reactivate verifier", async function () {
      await verifierRegistry.connect(verifier1).reactivateVerifier(verifier1.address);

      const verifier = await verifierRegistry.getVerifier(verifier1.address);
      expect(verifier.isActive).to.be.true;
      console.log("✓ Test VR8: Verifier reactivated");
    });

    it("should fail to reactivate already active", async function () {
      await expect(
        verifierRegistry.connect(verifier1).reactivateVerifier(verifier1.address)
      ).to.be.reverted;
      console.log("✓ Test VR8a: Cannot reactivate twice");
    });

    it("should update active verifier count after deactivation", async function () {
      await verifierRegistry.connect(verifier2).deactivateVerifier(verifier2.address);
      let count = await verifierRegistry.getActiveVerifierCount();
      expect(Number(count)).to.equal(1);

      await verifierRegistry.connect(verifier2).reactivateVerifier(verifier2.address);
      count = await verifierRegistry.getActiveVerifierCount();
      expect(Number(count)).to.equal(2);
      console.log("✓ Test VR9: Active count updated correctly");
    });
  });

  describe("Verification Count", function () {
    it("should increment verifications count", async function () {
      await verifierRegistry.incrementVerificationsCount(verifier1.address);
      const verifier = await verifierRegistry.getVerifier(verifier1.address);
      expect(Number(verifier.verificationsCount)).to.equal(1);
      console.log("✓ Test VR10: Verifications count incremented");
    });

    it("should increment multiple times", async function () {
      await verifierRegistry.incrementVerificationsCount(verifier1.address);
      await verifierRegistry.incrementVerificationsCount(verifier1.address);
      const verifier = await verifierRegistry.getVerifier(verifier1.address);
      expect(Number(verifier.verificationsCount)).to.equal(3);
      console.log("✓ Test VR10a: Multiple increments work");
    });
  });

  describe("Edge Cases", function () {
    it("should fail to get non-existent verifier", async function () {
      await expect(
        verifierRegistry.getVerifier(owner.address)
      ).to.be.reverted;
      console.log("✓ Test VR11: Non-existent verifier check works");
    });

    it("should handle empty verifier list", async function () {
      const NewVerifierRegistry = await ethers.getContractFactory("VerifierRegistry");
      const newRegistry = await NewVerifierRegistry.deploy();
      
      const count = await newRegistry.getTotalVerifiers();
      expect(Number(count)).to.equal(0);
      console.log("✓ Test VR12: Empty registry handled correctly");
    });
  });
});
