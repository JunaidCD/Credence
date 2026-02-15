const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControl Tests", function () {
  let accessControl;
  let owner, user1, user2, user3;

  before(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const AccessControl = await ethers.getContractFactory("AccessControl");
    accessControl = await AccessControl.deploy();
    await accessControl.waitForDeployment();
  });

  describe("Role Management", function () {
    it("should grant roles correctly", async function () {
      const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
      
      await accessControl.grantRole(user1.address, ISSUER_ROLE);
      const hasRole = await accessControl.checkRole(user1.address, ISSUER_ROLE);
      
      expect(hasRole).to.be.true;
      console.log("✓ Test 1: Role granted successfully");
    });

    it("should revoke roles correctly", async function () {
      const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
      
      await accessControl.grantRole(user2.address, VERIFIER_ROLE);
      await accessControl.revokeRole(user2.address, VERIFIER_ROLE);
      
      const hasRole = await accessControl.checkRole(user2.address, VERIFIER_ROLE);
      expect(hasRole).to.be.false;
      console.log("✓ Test 1a: Role revoked successfully");
    });

    it("should fail to grant role from non-owner", async function () {
      const USER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("USER_ROLE"));
      
      await expect(
        accessControl.connect(user1).grantRole(user2.address, USER_ROLE)
      ).to.be.reverted;
      console.log("✓ Test 1b: Non-owner cannot grant roles");
    });
  });

  describe("Pause Functionality", function () {
    it("should pause contract", async function () {
      await accessControl.pause();
      const paused = await accessControl.paused();
      expect(paused).to.be.true;
      console.log("✓ Test 2: Contract paused successfully");
    });

    it("should unpause contract", async function () {
      await accessControl.unpause();
      const paused = await accessControl.paused();
      expect(paused).to.be.false;
      console.log("✓ Test 2a: Contract unpaused successfully");
    });

    it("should fail to pause when already paused", async function () {
      await accessControl.pause();
      await expect(accessControl.pause()).to.be.reverted;
      await accessControl.unpause();
      console.log("✓ Test 2b: Cannot pause when already paused");
    });
  });

  describe("Ownership", function () {
    it("should transfer ownership", async function () {
      await accessControl.transferOwnership(user1.address);
      const newOwner = await accessControl.owner();
      expect(newOwner).to.equal(user1.address);
      console.log("✓ Test 3: Ownership transferred");
    });
  });
});
