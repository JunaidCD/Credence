import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCredentialSchema, insertVerificationRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/connect", async (req, res) => {
    try {
      const { address, userType = "user" } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      // Normalize address to lowercase for consistent storage
      const normalizedAddress = address.toLowerCase();
      let user = await storage.getUserByAddress(normalizedAddress);
      
      if (!user) {
        // Generate a mock DID for new users
        const did = `did:ethr:${address}`;
        const name = `User ${address.slice(-4)}`;
        
        const userData = insertUserSchema.parse({
          address: normalizedAddress,
          did: `did:ethr:${normalizedAddress}`,
          name,
          userType,
          email: `${name.toLowerCase()}@example.com`
        });
        
        user = await storage.createUser(userData);
        
        // After creating user, link any existing credentials issued to this wallet address
        await storage.linkCredentialsToUser(user.id, normalizedAddress);
      } else {
        // Update existing user's userType if it's different
        if (user.userType !== userType) {
          user = await storage.updateUser(user.id, { userType });
        }
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/did/:did", async (req, res) => {
    try {
      const user = await storage.getUserByDID(req.params.did);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/wallet/:address", async (req, res) => {
    try {
      const address = req.params.address.toLowerCase();
      const user = await storage.getUserByAddress(address);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credential routes
  app.get("/api/credentials/user/:userId", async (req, res) => {
    try {
      const credentials = await storage.getCredentialsByUserId(req.params.userId);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credentials/issuer/:issuerId", async (req, res) => {
    try {
      const credentials = await storage.getCredentialsByIssuerId(req.params.issuerId);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/credentials/wallet/:walletAddress", async (req, res) => {
    try {
      const walletAddress = req.params.walletAddress.toLowerCase();
      console.log('=== SERVER CREDENTIAL FETCH DEBUG ===');
      console.log('Original wallet address:', req.params.walletAddress);
      console.log('Lowercase wallet address:', walletAddress);
      
      // Debug: Check all users in storage
      const allUsers = Array.from((storage as any).users.values());
      console.log('All users in storage:', allUsers.map(u => ({ id: u.id, address: u.address, name: u.name })));
      
      // Debug: Check all credentials in storage
      const allCredentials = Array.from((storage as any).credentials.values());
      console.log('All credentials in storage:', allCredentials.length);
      console.log('Credentials details:', allCredentials.map(c => ({ 
        id: c.id, 
        userId: c.userId, 
        title: c.title,
        studentDid: c.metadata?.studentDid 
      })));
      
      // First try to find user by wallet address
      let user = await storage.getUserByAddress(walletAddress);
      console.log('Found user for wallet:', user);
      
      let credentials = [];
      
      if (user) {
        // Get credentials for registered user
        credentials = await storage.getCredentialsByUserId(user.id);
        console.log('Found credentials for registered user ID', user.id, ':', credentials);
      } else {
        // If no registered user, check if there are credentials issued to this wallet address
        // by looking at the studentDid field in credential metadata
        credentials = allCredentials.filter(cred => 
          cred.metadata?.studentDid?.toLowerCase() === walletAddress
        );
        console.log('Found credentials for unregistered wallet address:', credentials);
      }
      
      console.log('=== END SERVER DEBUG ===');
      
      res.json(credentials);
    } catch (error) {
      console.error('Error in wallet credentials endpoint:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Debug endpoint to check all users and credentials
  app.get("/api/debug/data", async (req, res) => {
    try {
      const allUsers = Array.from((storage as any).users.values());
      const allCredentials = Array.from((storage as any).credentials.values());
      
      // Log to server console for debugging
      console.log('=== DEBUG DATA ENDPOINT ===');
      console.log('Total users:', allUsers.length);
      console.log('Users:', allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })));
      console.log('Total credentials:', allCredentials.length);
      console.log('Credentials:', allCredentials.map(c => ({ id: c.id, userId: c.userId, issuerId: c.issuerId, title: c.title })));
      console.log('=== END DEBUG DATA ===');
      
      res.json({
        users: allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })),
        credentials: allCredentials.map(c => ({ id: c.id, userId: c.userId, issuerId: c.issuerId, title: c.title, status: c.status })),
        totalUsers: allUsers.length,
        totalCredentials: allCredentials.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/credentials", async (req, res) => {
    try {
      const credentialData = insertCredentialSchema.parse(req.body);
      const credential = await storage.createCredential(credentialData);
      res.json(credential);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/credentials/:id", async (req, res) => {
    try {
      const credential = await storage.updateCredential(req.params.id, req.body);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json(credential);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Verification request routes
  app.get("/api/verification-requests/user/:userId", async (req, res) => {
    try {
      const requests = await storage.getVerificationRequestsByUserId(req.params.userId);
      
      // Include verifier information
      const requestsWithVerifiers = await Promise.all(
        requests.map(async (request) => {
          const verifier = await storage.getUser(request.verifierId);
          return { ...request, verifier };
        })
      );
      
      res.json(requestsWithVerifiers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/verification-requests/verifier/:verifierId", async (req, res) => {
    try {
      const requests = await storage.getVerificationRequestsByVerifierId(req.params.verifierId);
      
      // Include user information
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return { ...request, user };
        })
      );
      
      res.json(requestsWithUsers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/verification-requests", async (req, res) => {
    try {
      const requestData = insertVerificationRequestSchema.parse(req.body);
      const request = await storage.createVerificationRequest(requestData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/verification-requests/:id", async (req, res) => {
    try {
      const request = await storage.updateVerificationRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Blockchain credential sync endpoint
  app.post("/api/credentials/sync-blockchain", async (req, res) => {
    try {
      const { walletAddress, credentials } = req.body;
      
      if (!walletAddress || !Array.isArray(credentials)) {
        return res.status(400).json({ message: "Wallet address and credentials array are required" });
      }

      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find or create user for this wallet address
      let user = await storage.getUserByAddress(normalizedAddress);
      if (!user) {
        const userData = insertUserSchema.parse({
          address: normalizedAddress,
          did: `did:ethr:${normalizedAddress}`,
          name: `User ${normalizedAddress.slice(-4)}`,
          userType: 'user',
          email: `user${normalizedAddress.slice(-4)}@blockchain.local`
        });
        user = await storage.createUser(userData);
      }

      const syncedCredentials = [];
      
      // Process each blockchain credential
      for (const blockchainCred of credentials) {
        try {
          // Check if credential already exists in backend
          const existingCred = await storage.getCredential(blockchainCred.id.toString());
          
          if (!existingCred) {
            // Create new credential from blockchain data
            const credentialData = insertCredentialSchema.parse({
              userId: user.id,
              issuerId: user.id, // Temporary - should be mapped to actual issuer
              type: blockchainCred.credentialType,
              title: `${blockchainCred.credentialType} Credential`,
              issueDate: blockchainCred.issueDate,
              expiryDate: blockchainCred.expiryDate,
              status: blockchainCred.status.toLowerCase(),
              metadata: {
                blockchainId: blockchainCred.id,
                issuerAddress: blockchainCred.issuer,
                holderAddress: blockchainCred.holder,
                issuedAt: blockchainCred.issuedAt,
                expiresAt: blockchainCred.expiresAt,
                isActive: blockchainCred.isActive,
                isRevoked: blockchainCred.isRevoked,
                ipfsHash: blockchainCred.ipfsHash,
                data: blockchainCred.data,
                source: 'blockchain'
              }
            });
            
            const newCredential = await storage.createCredential(credentialData);
            syncedCredentials.push(newCredential);
          } else {
            syncedCredentials.push(existingCred);
          }
        } catch (error) {
          console.error(`Failed to sync credential ${blockchainCred.id}:`, error);
        }
      }

      res.json({ 
        message: `Synced ${syncedCredentials.length} credentials from blockchain`,
        syncedCredentials,
        user
      });
    } catch (error) {
      console.error('Blockchain sync error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
