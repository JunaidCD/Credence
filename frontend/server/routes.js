import { createServer } from "http";
import { storage } from "./storage.js";
import { insertUserSchema, insertCredentialSchema, insertVerificationRequestSchema, insertNotificationSchema } from "../shared/schema.js";

export async function registerRoutes(app) {
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
      const allUsers = Array.from(storage.users.values());
      console.log('All users in storage:', allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })));
      
      let user = await storage.getUserByDID(decodeURIComponent(req.params.did));
      console.log('Found user by DID:', user);
      
      // If not found by DID, try to extract address and find by address
      if (!user) {
        const didParam = decodeURIComponent(req.params.did);
        // Handle both DID format (did:ethr:0x...) and plain address (0x...)
        let extractedAddress = null;
        if (didParam.startsWith('did:ethr:')) {
          extractedAddress = didParam.replace('did:ethr:', '').toLowerCase();
        } else if (didParam.startsWith('0x') && didParam.length === 42) {
          // It's already a plain Ethereum address
          extractedAddress = didParam.toLowerCase();
        }
        
        if (extractedAddress) {
          console.log('Trying to find user by extracted address:', extractedAddress);
          user = await storage.getUserByAddress(extractedAddress);
          console.log('Found user by address:', user);
        }
      }

      // If still not found, try case-insensitive DID match
      if (!user) {
        const didParam = decodeURIComponent(req.params.did).toLowerCase();
        for (const u of allUsers) {
          if (u.did && u.did.toLowerCase() === didParam) {
            user = u;
            break;
          }
          if (u.address && u.address.toLowerCase() === didParam) {
            user = u;
            break;
          }
        }
        console.log('Found user by case-insensitive match:', user);
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
      const allUsers = Array.from(storage.users.values());
      console.log('All users in storage:', allUsers.map(u => ({ id: u.id, address: u.address, name: u.name })));
      
      // Debug: Check all credentials in storage
      const allCredentials = Array.from(storage.credentials.values());
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
      const allUsers = Array.from(storage.users.values());
      const allCredentials = Array.from(storage.credentials.values());
      
      // Also get shared credentials for debugging
      const allSharedCredentials = storage.sharedCredentials ? 
        Array.from(storage.sharedCredentials.values()) : [];
      
      // Log to server console for debugging
      console.log('=== DEBUG DATA ENDPOINT ===');
      console.log('Total users:', allUsers.length);
      console.log('Users:', allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })));
      console.log('Total credentials:', allCredentials.length);
      console.log('Credentials:', allCredentials.map(c => ({ id: c.id, userId: c.userId, issuerId: c.issuerId, title: c.title })));
      console.log('Total shared credentials:', allSharedCredentials.length);
      console.log('Shared credentials:', allSharedCredentials.map(sc => ({ 
        id: sc.id, 
        holderAddress: sc.holderAddress, 
        verifierAddress: sc.verifierAddress,
        credentialType: sc.credentialType,
        status: sc.status 
      })));
      console.log('=== END DEBUG DATA ===');
      
      res.json({
        users: allUsers.map(u => ({ id: u.id, address: u.address, did: u.did, name: u.name })),
        credentials: allCredentials.map(c => ({ id: c.id, userId: c.userId, issuerId: c.issuerId, title: c.title, status: c.status })),
        sharedCredentials: allSharedCredentials.map(sc => ({ 
          id: sc.id, 
          holderAddress: sc.holderAddress, 
          verifierAddress: sc.verifierAddress,
          credentialType: sc.credentialType,
          status: sc.status,
          sharedAt: sc.sharedAt
        })),
        totalUsers: allUsers.length,
        totalCredentials: allCredentials.length,
        totalSharedCredentials: allSharedCredentials.length
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
      const allNotifications = Array.from(storage.notifications.values());
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

      const syncedCredentials = [];
      const newCredentials = [];
      
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

  // Shared credentials endpoints for verifiers
  app.post("/api/credentials/share", async (req, res) => {
    try {
      console.log('=== CREDENTIAL SHARING API DEBUG ===');
      console.log('Received credential sharing request:', req.body);
      console.log('Request body keys:', Object.keys(req.body));
      
      const { 
        holderAddress, 
        verifierAddress, 
        credentialId, 
        credentialType, 
        credentialTitle, 
        message, 
        signature, 
        holderDID, 
        verifierDID,
        credentialData 
      } = req.body;
      
      // Validate required fields
      if (!holderAddress || !verifierAddress || !credentialId || !signature) {
        return res.status(400).json({ message: "Missing required fields for credential sharing" });
      }

      // Find holder and verifier users (optional - create placeholder if not found)
      let holder = await storage.getUserByAddress(holderAddress.toLowerCase());
      let verifier = await storage.getUserByAddress(verifierAddress.toLowerCase());
      
      // Create placeholder holder if not found
      if (!holder) {
        holder = {
          id: `holder-${holderAddress.toLowerCase()}`,
          did: holderDID || `did:ethr:${holderAddress}`,
          address: holderAddress.toLowerCase(),
          name: `User ${holderAddress.slice(0, 6)}...${holderAddress.slice(-4)}`,
          userType: 'user',
          email: null,
          createdAt: new Date()
        };
        console.log('Created placeholder holder:', holder);
      }
      
      // Create placeholder verifier if not found
      if (!verifier) {
        verifier = {
          id: `verifier-${verifierAddress.toLowerCase()}`,
          did: verifierDID || `did:ethr:${verifierAddress}`,
          address: verifierAddress.toLowerCase(),
          name: `Verifier ${verifierAddress.slice(0, 6)}...${verifierAddress.slice(-4)}`,
          userType: 'verifier',
          email: null,
          createdAt: new Date()
        };
        console.log('Created placeholder verifier:', verifier);
      }

      // Create shared credential record
      const sharedCredential = {
        id: `shared-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        holderId: holder.id,
        verifierId: verifier.id,
        credentialId: credentialId,
        credentialType: credentialType,
        credentialTitle: credentialTitle || `${credentialType} Credential`,
        message: message || '',
        signature: signature,
        holderDID: holderDID,
        verifierDID: verifierDID,
        holderAddress: holderAddress.toLowerCase(),
        verifierAddress: verifierAddress.toLowerCase(),
        credentialData: credentialData || {},
        status: 'pending',
        sharedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      // Store in memory (you could extend storage to handle shared credentials)
      if (!storage.sharedCredentials) {
        storage.sharedCredentials = new Map();
      }
      storage.sharedCredentials.set(sharedCredential.id, sharedCredential);

      console.log('✅ Created shared credential record:', sharedCredential.id);
      
      res.json({ 
        success: true,
        sharedCredential,
        message: `Credential shared successfully with ${verifierDID}`
      });
    } catch (error) {
      console.error('Credential sharing API error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get shared credentials for a verifier
  app.get("/api/credentials/shared/:verifierAddress", async (req, res) => {
    try {
      console.log('=== SHARED CREDENTIALS FETCH DEBUG ===');
      const verifierAddress = req.params.verifierAddress.toLowerCase();
      console.log('Fetching shared credentials for verifier:', verifierAddress);
      console.log('Original verifier address from params:', req.params.verifierAddress);
      
      // Initialize shared credentials map if it doesn't exist
      if (!storage.sharedCredentials) {
        storage.sharedCredentials = new Map();
      }

      // Get all shared credentials for this verifier
      const allSharedCredentials = Array.from(storage.sharedCredentials.values());
      const verifierSharedCredentials = allSharedCredentials.filter(
        cred => cred.verifierAddress === verifierAddress
      );

      console.log(`Found ${verifierSharedCredentials.length} shared credentials for verifier`);
      console.log('Shared credentials:', verifierSharedCredentials.map(c => ({
        id: c.id,
        credentialType: c.credentialType,
        holderDID: c.holderDID,
        status: c.status,
        sharedAt: c.sharedAt
      })));

      // Transform to match the expected format for the verifier dashboard
      const formattedCredentials = verifierSharedCredentials.map(cred => ({
        id: cred.id,
        title: cred.credentialTitle,
        subtitle: `Shared by ${cred.holderDID}`,
        credentialType: cred.credentialType,
        status: cred.status,
        holderDID: cred.holderDID,
        verifierDID: cred.verifierDID,
        issuerDID: cred.credentialData?.issuer ? `did:ethr:${cred.credentialData.issuer}` : 'Unknown',
        recipientName: cred.credentialData?.title || 'Unknown User',
        recipientDID: cred.holderDID,
        issueDate: cred.credentialData?.issueDate || cred.sharedAt.split('T')[0],
        submittedAt: new Date(cred.sharedAt),
        message: cred.message,
        signature: cred.signature,
        icon: cred.credentialType.includes('Degree') ? '🎓' : 
              cred.credentialType.includes('Certificate') ? '📜' : 
              cred.credentialType.includes('License') ? '🪪' : '📋'
      }));

      console.log('=== END SHARED CREDENTIALS FETCH DEBUG ===');
      res.json(formattedCredentials);
    } catch (error) {
      console.error('Error fetching shared credentials:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update shared credential status (approve/reject)
  app.patch("/api/credentials/shared/:id", async (req, res) => {
    try {
      console.log('=== CREDENTIAL VERIFICATION STATUS UPDATE DEBUG ===');
      const { status, signature, verifierDID, blockchainData, transactionHash } = req.body;
      const sharedCredentialId = req.params.id;
      
      console.log('🔍 VERIFIER ACTION RECEIVED:');
      console.log('  - Shared Credential ID:', sharedCredentialId);
      console.log('  - New Status:', status);
      console.log('  - Verifier DID:', verifierDID);
      console.log('  - Has Signature:', !!signature);
      console.log('  - Transaction Hash:', transactionHash);
      console.log('  - Request Body:', req.body);
      
      if (!storage.sharedCredentials) {
        return res.status(404).json({ message: "Shared credential not found" });
      }

      const sharedCredential = storage.sharedCredentials.get(sharedCredentialId);
      if (!sharedCredential) {
        return res.status(404).json({ message: "Shared credential not found" });
      }

      // Update status and blockchain data
      sharedCredential.status = status;
      sharedCredential.updatedAt = new Date().toISOString();
      sharedCredential.signature = signature;
      sharedCredential.verifierDID = verifierDID;
      sharedCredential.blockchainData = blockchainData;
      sharedCredential.transactionHash = transactionHash;
      
      storage.sharedCredentials.set(sharedCredentialId, sharedCredential);

      console.log(`✅ Updated shared credential ${sharedCredentialId} status to ${status}`);
      
      // Create notification for the user about the verification result
      try {
        console.log('🔍 Debug: Looking for holder with address:', sharedCredential.holderAddress);
        console.log('🔍 Debug: Shared credential data:', {
          id: sharedCredential.id,
          holderAddress: sharedCredential.holderAddress,
          verifierAddress: sharedCredential.verifierAddress,
          credentialType: sharedCredential.credentialType
        });
        
        // Find the holder user to send notification to
        let holder = await storage.getUserByAddress(sharedCredential.holderAddress);
        console.log('🔍 Debug: Found holder user:', holder ? { id: holder.id, address: holder.address, name: holder.name } : 'null');
        
        if (holder) {
          console.log('🔔 Creating verification result notification for user:', holder.id);
          
          // Create appropriate notification based on status
          const isApproved = status === 'approved';
          const notificationTitle = isApproved 
            ? 'Your Credential Got Approved' 
            : 'Your Credential Got Rejected';
          
          const verifierInfo = verifierDID || sharedCredential.verifierDID || 'Unknown Verifier';
          const notificationMessage = isApproved
            ? `Your ${sharedCredential.credentialType} credential has been verified and approved by verifier ${verifierInfo}.`
            : `Your ${sharedCredential.credentialType} credential verification was rejected by verifier ${verifierInfo}. Please contact the verifier for more details.`;
          
          const notificationData = {
            userId: holder.id,
            type: 'credential_verification',
            title: notificationTitle,
            message: notificationMessage,
            data: {
              credentialId: sharedCredential.credentialId,
              credentialType: sharedCredential.credentialType,
              credentialTitle: sharedCredential.credentialTitle,
              verifierDID: verifierDID || sharedCredential.verifierDID,
              verifierAddress: sharedCredential.verifierAddress,
              status: status,
              signature: signature,
              transactionHash: transactionHash,
              blockchainData: blockchainData,
              verificationDate: new Date().toISOString(),
              sharedCredentialId: sharedCredentialId,
              message: sharedCredential.message
            },
            read: false,
            priority: 'high'
          };
          
          console.log('Creating notification with data:', notificationData);
          const createdNotification = await storage.createNotification(notificationData);
          console.log('✅ Verification result notification created:', createdNotification.id);
          
          // Verify notification was stored
          const userNotifications = await storage.getNotificationsByUserId(holder.id);
          console.log(`User now has ${userNotifications.length} total notifications`);
          console.log('Latest notifications:', userNotifications.slice(0, 3).map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            read: n.read,
            createdAt: n.createdAt
          })));
          
          // Also log all users for debugging
          const allUsers = Array.from(storage.users.values());
          console.log('All registered users:', allUsers.map(u => ({ 
            id: u.id, 
            address: u.address, 
            name: u.name 
          })));
        } else {
          console.log('❌ Holder user not found for address:', sharedCredential.holderAddress);
          console.log('Available users:', Array.from(storage.users.values()).map(u => ({ id: u.id, address: u.address })));
        }
      } catch (notificationError) {
        console.error('❌ Failed to create verification result notification:', notificationError);
        // Don't fail the main request if notification creation fails
      }
      
      console.log('=== END CREDENTIAL VERIFICATION STATUS UPDATE DEBUG ===');
      res.json(sharedCredential);
    } catch (error) {
      console.error('Error updating shared credential:', error);
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
