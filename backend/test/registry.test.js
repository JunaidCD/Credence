const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IssuerRegistry & UserRegistry Tests", function () {
  let issuerRegistry, userRegistry;
  let owner, issuer, user, otherUser;

  before(async function () {
    [owner, issuer, user, otherUser] = await ethers.getSigners();

    const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
    issuerRegistry = await IssuerRegistry.deploy();
    await issuerRegistry.waitForDeployment();

    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
  });

  describe("IssuerRegistry", function () {
    it("should register issuer correctly", async function () {
      await issuerRegistry.connect(issuer).registerIssuer(
        "Test Issuer",
        "Test Org",
        "test@issuer.com"
      );

      const isRegistered = await issuerRegistry.isRegisteredIssuer(issuer.address);
      expect(isRegistered).to.be.true;
      console.log("✓ Test IR1: Issuer registered successfully");
    });

    it("should fail to register same issuer twice", async function () {
      await expect(
        issuerRegistry.connect(issuer).registerIssuer(
          "Test Issuer",
          "Test Org",
          "test@issuer.com"
        )
      ).to.be.reverted;
      console.log("✓ Test IR1a: Duplicate registration rejected");
    });

    it("should get issuer details", async function () {
      const issuerDetails = await issuerRegistry.getIssuer(issuer.address);
      expect(issuerDetails.name).to.equal("Test Issuer");
      expect(issuerDetails.organization).to.equal("Test Org");
      console.log("✓ Test IR2: Issuer details retrieved");
    });

    it("should get all issuers", async function () {
      const allIssuers = await issuerRegistry.getAllIssuers();
      expect(allIssuers.length).to.be.greaterThan(0);
      console.log("✓ Test IR3: All issuers retrieved");
    });

    it("should increment credentials issued", async function () {
      const initialCount = (await issuerRegistry.getIssuer(issuer.address)).credentialsIssued;
      await issuerRegistry.incrementCredentialsIssued(issuer.address);
      const newCount = (await issuerRegistry.getIssuer(issuer.address)).credentialsIssued;
      expect(newCount).to.equal(initialCount + 1n);
      console.log("✓ Test IR4: Credentials count incremented");
    });

    it("should deactivate and reactivate issuer", async function () {
      await issuerRegistry.connect(issuer).deactivateIssuer();
      let issuerDetails = await issuerRegistry.getIssuer(issuer.address);
      expect(issuerDetails.isActive).to.be.false;

      await issuerRegistry.connect(issuer).reactivateIssuer();
      issuerDetails = await issuerRegistry.getIssuer(issuer.address);
      expect(issuerDetails.isActive).to.be.true;
      console.log("✓ Test IR5: Issuer activation/deactivation works");
    });

    it("should fail to register with empty name", async function () {
      await expect(
        issuerRegistry.connect(otherUser).registerIssuer(
          "",
          "Test Org",
          "test@issuer.com"
        )
      ).to.be.reverted;
      console.log("✓ Test IR6: Empty name rejected");
    });

    it("should check allowed accounts", async function () {
      const hardhatAccount1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      const isAllowed = await issuerRegistry.isAllowedAccount(hardhatAccount1);
      expect(isAllowed).to.be.true;
      console.log("✓ Test IR7: Allowed account check works");
    });

    it("should get active issuers count", async function () {
      const count = await issuerRegistry.getActiveIssuersCount();
      expect(Number(count)).to.be.greaterThan(0);
      console.log("✓ Test IR8: Active issuers count retrieved");
    });
  });

  describe("UserRegistry", function () {
    it("should register user correctly", async function () {
      await userRegistry.connect(user).registerUser(
        "Test User",
        "test@user.com"
      );

      const isRegistered = await userRegistry.isRegisteredUser(user.address);
      expect(isRegistered).to.be.true;
      console.log("✓ Test UR1: User registered successfully");
    });

    it("should fail to register same user twice", async function () {
      await expect(
        userRegistry.connect(user).registerUser(
          "Test User",
          "test@user.com"
        )
      ).to.be.reverted;
      console.log("✓ Test UR1a: Duplicate user registration rejected");
    });

    it("should get user details", async function () {
      const userDetails = await userRegistry.getUser(user.address);
      expect(userDetails.name).to.equal("Test User");
      expect(userDetails.email).to.equal("test@user.com");
      console.log("✓ Test UR2: User details retrieved");
    });

    it("should get all users", async function () {
      const allUsers = await userRegistry.getAllUsers();
      expect(allUsers.length).to.be.greaterThan(0);
      console.log("✓ Test UR3: All users retrieved");
    });

    it("should get total users count", async function () {
      const count = await userRegistry.getTotalUsers();
      expect(Number(count)).to.be.greaterThan(0);
      console.log("✓ Test UR4: Total users count retrieved");
    });

    it("should increment credentials received", async function () {
      const initialCount = (await userRegistry.getUser(user.address)).credentialsReceived;
      await userRegistry.incrementCredentialsReceived(user.address);
      const newCount = (await userRegistry.getUser(user.address)).credentialsReceived;
      expect(newCount).to.equal(initialCount + 1n);
      console.log("✓ Test UR5: Credentials received incremented");
    });

    it("should deactivate user", async function () {
      await userRegistry.connect(user).deactivateUser();
      const userDetails = await userRegistry.getUser(user.address);
      expect(userDetails.isActive).to.be.false;
      console.log("✓ Test UR6: User deactivated");
    });

    it("should get user addresses", async function () {
      const addresses = await userRegistry.getUserAddresses();
      expect(addresses.length).to.be.greaterThan(0);
      console.log("✓ Test UR7: User addresses retrieved");
    });

    it("should check allowed accounts", async function () {
      const allowedAccount = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
      const isAllowed = await userRegistry.isAllowedAccount(allowedAccount);
      expect(isAllowed).to.be.true;
      console.log("✓ Test UR8: Allowed account check works");
    });
  });

  describe("Edge Cases", function () {
    it("should fail to get non-existent user", async function () {
      await expect(
        userRegistry.getUser(owner.address)
      ).to.be.reverted;
      console.log("✓ Test EC2: Non-existent user check works");
    });
  });
});
