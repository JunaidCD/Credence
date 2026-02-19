const { ethers } = require("hardhat");

// Helper function to get explorer URL
function getExplorerUrl(chainId) {
  const explorers = {
    '421614': 'https://sepolia.arbiscan.io',  // Arbitrum Sepolia
    '42161': 'https://arbiscan.io',            // Arbitrum One
    '11155111': 'https://sepolia.etherscan.io', // Sepolia
    '1': 'https://etherscan.io'                // Ethereum Mainnet
  };
  return explorers[chainId] || 'https://etherscan.io';
}

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
  const issuerRegistryTx = issuerRegistry.deploymentTransaction();
  await issuerRegistry.waitForDeployment();
  
  const issuerRegistryAddress = await issuerRegistry.getAddress();
  const issuerRegistryTxHash = issuerRegistryTx.hash;
  console.log("IssuerRegistry deployed to:", issuerRegistryAddress);
  console.log("Transaction hash:", issuerRegistryTxHash);

  // Deploy CredentialRegistry with IssuerRegistry address
  console.log("\nDeploying CredentialRegistry...");
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(issuerRegistryAddress);
  const credentialRegistryTx = credentialRegistry.deploymentTransaction();
  await credentialRegistry.waitForDeployment();
  
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  const credentialRegistryTxHash = credentialRegistryTx.hash;
  console.log("CredentialRegistry deployed to:", credentialRegistryAddress);
  console.log("Transaction hash:", credentialRegistryTxHash);

  // Deploy UserRegistry
  console.log("\nDeploying UserRegistry...");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  const userRegistryTx = userRegistry.deploymentTransaction();
  await userRegistry.waitForDeployment();
  
  const userRegistryAddress = await userRegistry.getAddress();
  const userRegistryTxHash = userRegistryTx.hash;
  console.log("UserRegistry deployed to:", userRegistryAddress);
  console.log("Transaction hash:", userRegistryTxHash);

  // Deploy VerifierRegistry
  console.log("\nDeploying VerifierRegistry...");
  const VerifierRegistry = await ethers.getContractFactory("VerifierRegistry");
  const verifierRegistry = await VerifierRegistry.deploy();
  const verifierRegistryTx = verifierRegistry.deploymentTransaction();
  await verifierRegistry.waitForDeployment();
  
  const verifierRegistryAddress = await verifierRegistry.getAddress();
  const verifierRegistryTxHash = verifierRegistryTx.hash;
  console.log("VerifierRegistry deployed to:", verifierRegistryAddress);
  console.log("Transaction hash:", verifierRegistryTxHash);

  // Get network information dynamically
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId.toString();
  const networkName = network.name === 'unknown' ? 'Custom Network' : network.name;
  const explorerUrl = getExplorerUrl(chainId);

  // Save deployment addresses to backend and frontend
  const fs = require('fs');
  const path = require('path');
  
  // Detailed deployment info with transaction hashes
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    explorerUrl: explorerUrl,
    contracts: {
      IssuerRegistry: {
        address: issuerRegistryAddress,
        transactionHash: issuerRegistryTxHash
      },
      CredentialRegistry: {
        address: credentialRegistryAddress,
        transactionHash: credentialRegistryTxHash
      },
      UserRegistry: {
        address: userRegistryAddress,
        transactionHash: userRegistryTxHash
      },
      VerifierRegistry: {
        address: verifierRegistryAddress,
        transactionHash: verifierRegistryTxHash
      }
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Simple format for frontend (just addresses)
  const frontendDeploymentInfo = {
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

  // Save detailed info to backend folder
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Save simple format to frontend public folder for direct access
  const frontendPublicPath = path.join(__dirname, '../../frontend/client/public/deployment-info.json');
  try {
    fs.writeFileSync(frontendPublicPath, JSON.stringify(frontendDeploymentInfo, null, 2));
    console.log("Deployment info also saved to frontend/client/public/");
  } catch (error) {
    console.warn("Could not save to frontend public folder:", error.message);
  }

  console.log("\nDeployment info saved to deployment-info.json");
  console.log("\nDeployment completed successfully!");
  console.log("\n=== Deployment Summary ===");
  console.log(`- IssuerRegistry: ${issuerRegistryAddress}`);
  console.log(`  Explorer: ${explorerUrl}/address/${issuerRegistryAddress}`);
  console.log(`  Transaction: ${explorerUrl}/tx/${issuerRegistryTxHash}`);
  console.log(`- CredentialRegistry: ${credentialRegistryAddress}`);
  console.log(`  Explorer: ${explorerUrl}/address/${credentialRegistryAddress}`);
  console.log(`  Transaction: ${explorerUrl}/tx/${credentialRegistryTxHash}`);
  console.log(`- UserRegistry: ${userRegistryAddress}`);
  console.log(`  Explorer: ${explorerUrl}/address/${userRegistryAddress}`);
  console.log(`  Transaction: ${explorerUrl}/tx/${userRegistryTxHash}`);
  console.log(`- VerifierRegistry: ${verifierRegistryAddress}`);
  console.log(`  Explorer: ${explorerUrl}/address/${verifierRegistryAddress}`);
  console.log(`  Transaction: ${explorerUrl}/tx/${verifierRegistryTxHash}`);
  console.log(`- Network: ${networkName} (Chain ID: ${chainId})`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
