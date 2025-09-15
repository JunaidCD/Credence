import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCredentialSchema, insertVerificationRequestSchema, insertNotificationSchema } from "@shared/schema";

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
        
        console.log(`🔔 User registration complete for ${normalizedAddress}, checking for blockchain credentials...`);
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
      console.log('=== DID LOOKUP DEBUG ===');
      console.log('Requested DID:', req.params.did);
      console.log('Decoded DID:', decodeURIComponent(req.params.did));
      
      // Debug: Check all users in storage
      const allUsers = Array.from((storage as any).users.values());
      console.log('All users in storage:', allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })));
      
      let user = await storage.getUserByDID(decodeURIComponent(req.params.did));
      console.log('Found user by DID:', user);
      
      // If not found by DID, try to extract address and find by address
      if (!user) {
        const didParam = decodeURIComponent(req.params.did);
        if (didParam.startsWith('did:ethr:')) {
          const extractedAddress = didParam.replace('did:ethr:', '').toLowerCase();
          console.log('Trying to find user by extracted address:', extractedAddress);
          user = await storage.getUserByAddress(extractedAddress);
          console.log('Found user by address:', user);
        }
      }
      
      console.log('=== END DID LOOKUP DEBUG ===');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('DID lookup error:', error);
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
      console.log('=== CREDENTIAL CREATION API DEBUG ===');
      console.log('Received credential creation request:', req.body);
      
      const credentialData = insertCredentialSchema.parse(req.body);
      console.log('Parsed credential data:', credentialData);
      
      const credential = await storage.createCredential(credentialData);
      console.log('Successfully created credential:', credential.id);
      
      console.log('=== END CREDENTIAL CREATION API DEBUG ===');
      res.json(credential);
    } catch (error) {
      console.error('Error creating credential:', error);
      res.status(400).json({ message: (error as Error).message });
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
      console.log('=== VERIFICATION REQUEST API DEBUG ===');
      console.log('Received verification request:', req.body);
      
      const requestData = insertVerificationRequestSchema.parse(req.body);
      console.log('Parsed request data:', requestData);
      console.log('User ID from request:', requestData.userId);
      
      const request = await storage.createVerificationRequest(requestData);
      console.log('Created verification request:', request.id);
      
      // Create notification for the user about the verification request
      if (requestData.userId) {
        console.log('🔔 Creating verification request notification for user:', requestData.userId);
        
        // Get verifier information for better notification
        const verifier = await storage.getUser(requestData.verifierId);
        const verifierName = verifier?.name || 'Unknown Verifier';
        console.log('Found verifier:', verifierName);
        
        const notificationData = {
          userId: requestData.userId,
          type: 'verification_request',
          title: 'Share Credential Request',
          message: `You have received a request to share your ${requestData.credentialType} credential from ${verifierName}.`,
          data: {
            requestId: request.id,
            verifierId: requestData.verifierId,
            credentialType: requestData.credentialType,
            message: requestData.message,
            verifierDID: requestData.verifierDID || 'Unknown',
            holderDID: requestData.holderDID || 'Unknown',
            signature: requestData.signature || null,
            blockchainData: requestData.blockchainData || null,
            timestamp: new Date().toISOString(),
            verifierName: verifierName
          },
          read: false,
          priority: 'high'
        };
        
        console.log('Notification data to create:', notificationData);
        const createdNotification = await storage.createNotification(notificationData);
        console.log('✅ Verification request notification created:', createdNotification.id);
        
        // Verify notification was stored
        const userNotifications = await storage.getNotificationsByUserId(requestData.userId);
        console.log(`User now has ${userNotifications.length} total notifications`);
        console.log('Latest notifications:', userNotifications.slice(0, 3).map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          read: n.read
        })));
      } else {
        console.log('❌ No userId provided - notification not created');
        console.log('Request data keys:', Object.keys(requestData));
      }
      
      console.log('=== END VERIFICATION REQUEST API DEBUG ===');
      res.json(request);
    } catch (error) {
      console.error('Error creating verification request:', error);
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

  // Notification routes
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      console.log('=== NOTIFICATION API DEBUG ===');
      console.log('Fetching notifications for userId:', req.params.userId);
      
      const notifications = await storage.getNotificationsByUserId(req.params.userId);
      console.log(`Found ${notifications.length} notifications for user ${req.params.userId}`);
      console.log('Notifications:', notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        read: n.read,
        createdAt: n.createdAt
      })));
      
      // Debug: Check all notifications in storage
      const allNotifications = Array.from((storage as any).notifications.values());
      console.log(`Total notifications in storage: ${allNotifications.length}`);
      console.log('All notifications by userId:', allNotifications.reduce((acc, n) => {
        acc[n.userId] = (acc[n.userId] || 0) + 1;
        return acc;
      }, {}));
      
      console.log('=== END NOTIFICATION API DEBUG ===');
      res.json(notifications);
    } catch (error) {
      console.error('Error in notifications endpoint:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ message: "All notifications marked as read" });
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

      const syncedCredentials: any[] = [];
      const newCredentials: any[] = [];
      
      // Process each blockchain credential
      for (const blockchainCred of credentials) {
        try {
          // Check if credential already exists in backend
          const existingCred = await storage.getCredential(blockchainCred.id.toString());
          
          if (!existingCred) {
            // Find the actual issuer by blockchain address
            let actualIssuer = await storage.getUserByAddress(blockchainCred.issuer?.toLowerCase());
            const issuerId = actualIssuer?.id || user.id; // Fallback to user.id if issuer not found
            
            // Create new credential from blockchain data
            const credentialData = insertCredentialSchema.parse({
              userId: user.id,
              issuerId: issuerId,
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
            newCredentials.push(newCredential);
            
            console.log('✅ Created credential and notification for blockchain sync:', newCredential.id);
          } else {
            syncedCredentials.push(existingCred);
          }
        } catch (error) {
          console.error(`Failed to sync credential ${blockchainCred.id}:`, error);
        }
      }

      // Create notifications for newly synced credentials
      if (newCredentials.length > 0) {
        console.log(`🔔 Creating notifications for ${newCredentials.length} newly synced credentials`);
        // The createCredential method already creates notifications, so they should be created automatically
      }
      
      // Also create notifications for any blockchain credentials that weren't synced to backend
      const blockchainOnlyCredentials = credentials.filter(blockchainCred => 
        !syncedCredentials.some(synced => synced.metadata?.blockchainId === blockchainCred.id)
      );
      
      if (blockchainOnlyCredentials.length > 0) {
        console.log(`🔔 Creating notifications for ${blockchainOnlyCredentials.length} blockchain-only credentials`);
        await storage.createNotificationsForBlockchainCredentials(user.id, blockchainOnlyCredentials);
      }

      res.json({ 
        message: `Synced ${syncedCredentials.length} credentials from blockchain`,
        syncedCredentials,
        user,
        newNotifications: newCredentials.length
      });
    } catch (error) {
      console.error('Blockchain sync error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Test endpoint to create a notification manually
  app.post("/api/test/notification", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const normalizedAddress = walletAddress.toLowerCase();
      
      // Find user by wallet address
      let user = await storage.getUserByAddress(normalizedAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a test notification
      const testNotification = await storage.createNotification({
        userId: user.id,
        type: 'credential_issued',
        title: 'Test Credential Issued',
        message: 'This is a test notification to verify the notification system is working.',
        data: {
          credentialId: 'test-123',
          credentialType: 'Test Certificate',
          issuerName: 'Test Issuer',
          issueDate: new Date().toISOString()
        },
        read: false,
        priority: 'high'
      });

      console.log('✅ Created test notification:', testNotification.id);
      
      res.json({ 
        message: 'Test notification created successfully',
        notification: testNotification,
        user: { id: user.id, address: user.address, name: user.name }
      });
    } catch (error) {
      console.error('Test notification creation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
