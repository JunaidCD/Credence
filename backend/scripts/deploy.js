const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy IssuerRegistry first
  console.log("\nDeploying IssuerRegistry...");
  const IssuerRegistry = await ethers.getContractFactory("IssuerRegistry");
  const issuerRegistry = await IssuerRegistry.deploy();
  await issuerRegistry.waitForDeployment();
  
  const issuerRegistryAddress = await issuerRegistry.getAddress();
  console.log("IssuerRegistry deployed to:", issuerRegistryAddress);

  // Deploy CredentialRegistry with IssuerRegistry address
  console.log("\nDeploying CredentialRegistry...");
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(issuerRegistryAddress);
  await credentialRegistry.waitForDeployment();
  
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("CredentialRegistry deployed to:", credentialRegistryAddress);

  // Deploy UserRegistry
  console.log("\nDeploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry deployed to:", userRegistryAddress);

  // Deploy VerifierRegistry
  console.log("\nDeploying VerifierRegistry...");
  const VerifierRegistry = await ethers.getContractFactory("VerifierRegistry");
  const verifierRegistry = await VerifierRegistry.deploy();
  await verifierRegistry.waitForDeployment();
  
  const verifierRegistryAddress = await verifierRegistry.getAddress();
  console.log("VerifierRegistry deployed to:", verifierRegistryAddress);

  // Get network information dynamically
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const networkName = network.name === 'unknown' ? 'Custom Network' : network.name;

  // Save deployment addresses to backend and frontend
  const fs = require('fs');
  const path = require('path');
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    contracts: {
      IssuerRegistry: issuerRegistryAddress,
      CredentialRegistry: credentialRegistryAddress,
      UserRegistry: userRegistryAddress,
      VerifierRegistry: verifierRegistryAddress
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
    console.log("Deployment info also saved to frontend/client/public/");
  } catch (error) {
    console.warn("Could not save to frontend public folder:", error.message);
  }

  console.log("\nDeployment info saved to deployment-info.json");
  console.log("\nDeployment completed successfully!");
  console.log("\nSummary:");
  console.log("- IssuerRegistry:", issuerRegistryAddress);
  console.log("- CredentialRegistry:", credentialRegistryAddress);
  console.log("- UserRegistry:", userRegistryAddress);
  console.log("- VerifierRegistry:", verifierRegistryAddress);
  console.log("- Network:", networkName, "(Chain ID:", chainId, ")");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
