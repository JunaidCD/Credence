const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy IssuerRegistry first
  console.log("\n📋 Deploying IssuerRegistry...");
  const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
  const issuerRegistry = await IssuerRegistry.deploy();
  await issuerRegistry.waitForDeployment();
  
  const issuerRegistryAddress = await issuerRegistry.getAddress();
  console.log("✅ IssuerRegistry deployed to:", issuerRegistryAddress);

  // Deploy CredentialRegistry with IssuerRegistry address
  console.log("\n🎓 Deploying CredentialRegistry...");
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(issuerRegistryAddress);
  await credentialRegistry.waitForDeployment();
  
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("✅ CredentialRegistry deployed to:", credentialRegistryAddress);

  // Save deployment addresses to backend and frontend
  const fs = require('fs');
  const path = require('path');
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    contracts: {
      IssuerRegistry: issuerRegistryAddress,
      CredentialRegistry: credentialRegistryAddress
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Save to backend folder
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Save to frontend public folder for direct access
  const frontendPublicPath = path.join(__dirname, '../../frontend/client/public/deployment-info.json');
  try {
    fs.writeFileSync(frontendPublicPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info also saved to frontend/client/public/");
  } catch (error) {
    console.warn("⚠️  Could not save to frontend public folder:", error.message);
  }

  console.log("\n📄 Deployment info saved to deployment-info.json");
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- IssuerRegistry:", issuerRegistryAddress);
  console.log("- CredentialRegistry:", credentialRegistryAddress);
  console.log("- Network: Hardhat Localhost (Chain ID: 31337)");
  console.log("- Allowed Issuers: Account 0 & Account 1 only");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
