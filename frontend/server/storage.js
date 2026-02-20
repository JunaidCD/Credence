import { randomUUID } from "crypto";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.credentials = new Map();
    this.verificationRequests = new Map();
    this.notifications = new Map();
    
    // Initialize with some test data for debugging
    this.initializeTestData();
    
    const timestamp = new Date().toISOString();
    console.log(`🔧 MemStorage initialized at ${timestamp} - all data will persist until server restart`);
  }

  initializeTestData() {
    // Create test issuer (account 0)
    const testIssuer = {
      id: "test-issuer-1",
      address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      did: "did:ethr:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      name: "Test Issuer",
      email: "issuer@example.com",
      userType: "issuer", 
      createdAt: new Date()
    };

    this.users.set(testIssuer.id, testIssuer);

    // Create test user (account 2) - the one from the error
    const testUser = {
      id: "test-user-1",
      address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      did: "did:ethr:0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      name: "Test User",
      email: "user@example.com",
      userType: "user", 
      createdAt: new Date()
    };

    this.users.set(testUser.id, testUser);

    // No test credential - removed as requested by user

    // No test credentials - only real credentials issued by users will be stored

    console.log('=== TEST DATA INITIALIZED ===');
    console.log('Users created:', this.users.size);
    console.log('Credentials created:', this.credentials.size);
    console.log('Test users:', Array.from(this.users.values()).map(u => ({ id: u.id, address: u.address, name: u.name })));
    console.log('Test credentials:', Array.from(this.credentials.values()).map(c => ({ id: c.id, userId: c.userId, title: c.title })));
  }

  // Users
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByAddress(address) {
    return Array.from(this.users.values()).find(user => user.address === address);
  }

  async getUserByDID(did) {
    // Normalize DID to lowercase for case-insensitive lookup
    const normalizedDID = did.toLowerCase();
    return Array.from(this.users.values()).find(user => user.did?.toLowerCase() === normalizedDID);
  }

  async createUser(insertUser) {
    const id = randomUUID();
    const user = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    console.log('Created user:', { id: user.id, address: user.address, name: user.name });
    return user;
  }

  async updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Credentials
  async getCredential(id) {
    return this.credentials.get(id);
  }

  async getCredentialsByUserId(userId) {
    return Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
  }

  async getCredentialsByIssuerId(issuerId) {
    return Array.from(this.credentials.values()).filter(cred => cred.issuerId === issuerId);
  }

  async createCredential(insertCredential) {
    console.log('=== CREATE CREDENTIAL DEBUG ===');
    console.log('Input credential data:', insertCredential);
    
    const id = randomUUID();
    const credential = { 
      ...insertCredential, 
      id, 
      createdAt: new Date()
    };
    this.credentials.set(id, credential);
    console.log('✅ Created credential in storage:', { 
      id: credential.id, 
      userId: credential.userId, 
      issuerId: credential.issuerId,
      title: credential.title,
      type: credential.type
    });
    
    // Create notification for the user who received the credential
    console.log('🔔 About to create notification for credential...');
    await this.createCredentialNotification(credential);
    console.log('✅ Notification creation completed');
    
    console.log('=== END CREATE CREDENTIAL DEBUG ===');
    return credential;
  }

  async updateCredential(id, updates) {
    const credential = this.credentials.get(id);
    if (!credential) return undefined;
    
    const updatedCredential = { ...credential, ...updates };
    this.credentials.set(id, updatedCredential);
    return updatedCredential;
  }

  // Verification Requests
  async getVerificationRequest(id) {
    return this.verificationRequests.get(id);
  }

  async getVerificationRequestsByUserId(userId) {
    return Array.from(this.verificationRequests.values()).filter(req => req.userId === userId);
  }

  async getVerificationRequestsByVerifierId(verifierId) {
    return Array.from(this.verificationRequests.values()).filter(req => req.verifierId === verifierId);
  }

  async createVerificationRequest(insertRequest) {
    const id = randomUUID();
    const request = { 
      ...insertRequest, 
      id, 
      requestedAt: new Date(),
      respondedAt: null
    };
    this.verificationRequests.set(id, request);
    return request;
  }

  async updateVerificationRequest(id, updates) {
    const request = this.verificationRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...updates };
    if (updates.status && updates.status !== 'pending') {
      updatedRequest.respondedAt = new Date();
    }
    this.verificationRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Link existing credentials to a newly registered user
  async linkCredentialsToUser(userId, walletAddress) {
    console.log(`=== LINKING CREDENTIALS ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Wallet Address: ${walletAddress}`);
    
    const allCredentials = Array.from(this.credentials.values());
    console.log(`Total credentials in storage: ${allCredentials.length}`);
    
    // Find credentials that were issued to this wallet address but don't have a userId yet
    const credentialsToLink = allCredentials.filter(credential => {
      const studentDid = credential.metadata?.studentDid?.toLowerCase();
      const hasNoUser = !credential.userId || credential.userId === "";
      const matchesWallet = studentDid === walletAddress.toLowerCase();
      
      console.log(`Credential ${credential.id}: studentDid=${studentDid}, hasNoUser=${hasNoUser}, matchesWallet=${matchesWallet}`);
      
      return hasNoUser && matchesWallet;
    });
    
    console.log(`Found ${credentialsToLink.length} credentials to link`);
    
    // Update each credential to link it to the user
    const linkedCredentials = [];
    for (const credential of credentialsToLink) {
      console.log(`Linking credential ${credential.id} to user ${userId}`);
      const updatedCredential = await this.updateCredential(credential.id, { userId });
      if (updatedCredential) {
        linkedCredentials.push(updatedCredential);
      }
    }
    
    // Create notifications for all newly linked credentials
    if (linkedCredentials.length > 0) {
      console.log(`Creating notifications for ${linkedCredentials.length} linked credentials`);
      await this.createNotificationsForLinkedCredentials(userId, linkedCredentials);
    }

    // Link existing verification requests to the newly registered user
    await this.linkVerificationRequestsToUser(userId, walletAddress);
    
    console.log(`=== LINKING COMPLETE ===`);
  }

  // Notifications
  async getNotification(id) {
    return this.notifications.get(id);
  }

  async getNotificationsByUserId(userId) {
    const notifications = Array.from(this.notifications.values()).filter(notification => notification.userId === userId);
    console.log(`🔍 Storage: Found ${notifications.length} notifications for userId: ${userId}`);
    console.log('🔍 Storage: All notifications in memory:', Array.from(this.notifications.values()).map(n => ({ id: n.id, userId: n.userId, type: n.type, title: n.title })));
    return notifications.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createNotification(insertNotification) {
    const id = randomUUID();
    const notification = { 
      ...insertNotification, 
      id, 
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    console.log('Created notification:', { id: notification.id, userId: notification.userId, type: notification.type });
    return notification;
  }

  async updateNotification(id, updates) {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...updates };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsRead(id) {
    return this.updateNotification(id, { read: true });
  }

  async markAllNotificationsAsRead(userId) {
    const userNotifications = await this.getNotificationsByUserId(userId);
    for (const notification of userNotifications) {
      if (!notification.read) {
        await this.markNotificationAsRead(notification.id);
      }
    }
  }

  // Helper method to create credential notification
  async createCredentialNotification(credential) {
    console.log('=== CREATE CREDENTIAL NOTIFICATION DEBUG ===');
    console.log('Credential received:', {
      id: credential.id,
      userId: credential.userId,
      issuerId: credential.issuerId,
      type: credential.type,
      title: credential.title
    });
    
    try {
      // Get issuer information
      const issuer = await this.getUser(credential.issuerId);
      console.log('Found issuer:', {
        id: issuer?.id,
        name: issuer?.name,
        did: issuer?.did,
        address: issuer?.address
      });
      
      const issuerName = issuer?.name || 'Unknown Issuer';
      const issuerDID = issuer?.did || 'Unknown DID';
      
      // Only create notification if user exists (has userId)
      if (credential.userId) {
        console.log('Creating notification for userId:', credential.userId);
        
        const notificationData = {
          userId: credential.userId,
          type: 'credential_issued',
          title: 'New Credential Received',
          message: `You have received a new ${credential.type} credential: "${credential.title}" from ${issuerName}`,
          data: {
            credentialId: credential.id,
            credentialType: credential.type,
            credentialTitle: credential.title,
            issuerName,
            issuerDID,
            issuerAddress: issuer?.address,
            issueDate: credential.issueDate,
            expiryDate: credential.expiryDate,
            status: credential.status,
            metadata: credential.metadata
          },
          read: false,
          priority: 'high'
        };
        
        console.log('Notification data to create:', notificationData);
        
        const createdNotification = await this.createNotification(notificationData);
        console.log('Successfully created notification:', {
          id: createdNotification.id,
          userId: createdNotification.userId,
          type: createdNotification.type,
          title: createdNotification.title
        });
        
        // Verify notification was stored
        const allNotifications = Array.from(this.notifications.values());
        const userNotifications = allNotifications.filter(n => n.userId === credential.userId);
        console.log(`Total notifications in storage: ${allNotifications.length}`);
        console.log(`Notifications for user ${credential.userId}: ${userNotifications.length}`);
        
      } else {
        console.log('❌ Notification not created - credential has no userId (user not registered yet)');
        console.log('Credential userId:', credential.userId);
      }
    } catch (error) {
      console.error('❌ Failed to create credential notification:', error);
    }
    console.log('=== END CREATE CREDENTIAL NOTIFICATION DEBUG ===');
  }

  // Helper method to create notifications for newly linked credentials during registration
  async createNotificationsForLinkedCredentials(userId, credentials) {
    console.log(`=== CREATING REGISTRATION NOTIFICATIONS ===`);
    console.log(`Creating notifications for ${credentials.length} credentials for user ${userId}`);
    
    for (const credential of credentials) {
      try {
        // Get issuer information
        const issuer = await this.getUser(credential.issuerId);
        const issuerName = issuer?.name || 'Unknown Issuer';
        const metadata = credential.metadata;
        const issuerDID = issuer?.did || (metadata?.issuerAddress ? `did:ethr:${metadata.issuerAddress}` : 'Unknown DID');
        
        console.log(`Creating notification for credential ${credential.id}:`);
        console.log(`- Credential Type: ${credential.type}`);
        console.log(`- Credential Title: ${credential.title}`);
        console.log(`- Issuer Name: ${issuerName}`);
        console.log(`- Issuer DID: ${issuerDID}`);
        console.log(`- Issue Date: ${credential.issueDate}`);
        
        // Create notification for the newly linked credential
        const notificationData = {
          userId: userId,
          type: 'credential_issued',
          title: 'Existing Credential Found',
          message: `We found an existing ${credential.type} credential: "${credential.title}" issued by ${issuerName}. This credential was issued to your wallet address before registration.`,
          data: {
            credentialId: credential.id,
            credentialType: credential.type,
            credentialTitle: credential.title,
            issuerName,
            issuerDID,
            issuerAddress: issuer?.address || metadata?.issuerAddress,
            issueDate: credential.issueDate,
            expiryDate: credential.expiryDate,
            status: credential.status,
            metadata: credential.metadata,
            isExistingCredential: true
          },
          read: false,
          priority: 'high'
        };
        
        const createdNotification = await this.createNotification(notificationData);
        console.log(`✅ Created registration notification ${createdNotification.id} for credential ${credential.id}`);
      } catch (error) {
        console.error(`❌ Failed to create notification for linked credential ${credential.id}:`, error);
      }
    }
    console.log(`=== REGISTRATION NOTIFICATIONS COMPLETE ===`);
  }

  // New method to create notifications for blockchain credentials during registration
  async createNotificationsForBlockchainCredentials(userId, blockchainCredentials) {
    console.log(`=== CREATING BLOCKCHAIN CREDENTIAL NOTIFICATIONS ===`);
    console.log(`Processing ${blockchainCredentials.length} blockchain credentials for user ${userId}`);
    
    for (const blockchainCred of blockchainCredentials) {
      try {
        // Find issuer by blockchain address
        let issuer = await this.getUserByAddress(blockchainCred.issuer?.toLowerCase());
        const issuerName = issuer?.name || `Issuer ${blockchainCred.issuer?.slice(-4)}`;
        const issuerDID = issuer?.did || `did:ethr:${blockchainCred.issuer}`;
        
        console.log(`Creating notification for blockchain credential:`);
        console.log(`- Blockchain ID: ${blockchainCred.id}`);
        console.log(`- Credential Type: ${blockchainCred.credentialType}`);
        console.log(`- Issuer Address: ${blockchainCred.issuer}`);
        console.log(`- Issuer Name: ${issuerName}`);
        console.log(`- Issuer DID: ${issuerDID}`);
        console.log(`- Issue Date: ${blockchainCred.issueDate}`);
        
        // Create notification for blockchain credential
        const notificationData = {
          userId: userId,
          type: 'credential_issued',
          title: 'Blockchain Credential Found',
          message: `We found a ${blockchainCred.credentialType} credential on the blockchain issued by ${issuerName}. This credential is now linked to your account.`,
          data: {
            credentialId: blockchainCred.id?.toString(),
            credentialType: blockchainCred.credentialType,
            credentialTitle: `${blockchainCred.credentialType} Credential`,
            issuerName,
            issuerDID,
            issuerAddress: blockchainCred.issuer,
            issueDate: blockchainCred.issueDate,
            expiryDate: blockchainCred.expiryDate,
            status: blockchainCred.status?.toLowerCase() || 'active',
            metadata: {
              blockchainId: blockchainCred.id,
              source: 'blockchain',
              issuedAt: blockchainCred.issuedAt,
              expiresAt: blockchainCred.expiresAt,
              isActive: blockchainCred.isActive,
              isRevoked: blockchainCred.isRevoked
            },
            isBlockchainCredential: true
          },
          read: false,
          priority: 'high'
        };
        
        const createdNotification = await this.createNotification(notificationData);
        console.log(`✅ Created blockchain notification ${createdNotification.id} for blockchain credential ${blockchainCred.id}`);
      } catch (error) {
        console.error(`❌ Failed to create notification for blockchain credential ${blockchainCred.id}:`, error);
      }
    }
    console.log(`=== BLOCKCHAIN CREDENTIAL NOTIFICATIONS COMPLETE ===`);
  }

  // Check if notification already exists for a specific blockchain event
  async notificationExistsForBlockchainEvent(userId, credentialId, transactionHash) {
    const userNotifications = await this.getNotificationsByUserId(userId);
    
    return userNotifications.some(notification => {
      const data = notification.data;
      return data?.credentialId === credentialId || 
             data?.metadata?.transactionHash === transactionHash ||
             data?.metadata?.blockchainId === credentialId;
    });
  }

  // Link existing verification requests to a newly registered user
  async linkVerificationRequestsToUser(userId, walletAddress) {
    console.log(`=== LINKING VERIFICATION REQUESTS ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Wallet Address: ${walletAddress}`);
    
    const user = await this.getUser(userId);
    if (!user) {
      console.log('❌ User not found, cannot link verification requests');
      return;
    }

    const userDID = user.did || `did:ethr:${walletAddress.toLowerCase()}`;
    console.log(`User DID: ${userDID}`);
    
    const allRequests = Array.from(this.verificationRequests.values());
    console.log(`Total verification requests in storage: ${allRequests.length}`);
    
    // Find verification requests that were sent to this user's DID or wallet address but don't have a userId yet
    const requestsToLink = allRequests.filter(request => {
      const holderDID = request.holderDID?.toLowerCase();
      const hasNoUser = !request.userId || request.userId === "";
      const matchesDID = holderDID === userDID.toLowerCase();
      const matchesWallet = holderDID === `did:ethr:${walletAddress.toLowerCase()}`;
      
      console.log(`Request ${request.id}: holderDID=${holderDID}, hasNoUser=${hasNoUser}, matchesDID=${matchesDID}, matchesWallet=${matchesWallet}`);
      
      return hasNoUser && (matchesDID || matchesWallet);
    });
    
    console.log(`Found ${requestsToLink.length} verification requests to link`);
    
    // Update each verification request to link it to the user and create notifications
    const linkedRequests = [];
    for (const request of requestsToLink) {
      console.log(`Linking verification request ${request.id} to user ${userId}`);
      const updatedRequest = await this.updateVerificationRequest(request.id, { userId });
      if (updatedRequest) {
        linkedRequests.push(updatedRequest);
        
        // Create notification for this verification request
        console.log(`🔔 Creating notification for linked verification request ${request.id}`);
        
        // Get verifier information
        const verifier = await this.getUser(request.verifierId);
        const verifierName = verifier?.name || 'Unknown Verifier';
        const verifierDID = request.verifierDID || verifier?.did || 'Unknown DID';
        
        const notificationData = {
          userId: userId,
          type: 'verification_request',
          title: 'Share Credential Request',
          message: `You have received a request to share your ${request.credentialType} credential from ${verifierName}.`,
          data: {
            requestId: request.id,
            verifierId: request.verifierId,
            credentialType: request.credentialType,
            message: request.message,
            verifierDID: verifierDID,
            holderDID: request.holderDID,
            signature: request.signature,
            blockchainData: request.blockchainData,
            timestamp: request.requestedAt?.toISOString() || new Date().toISOString(),
            verifierName: verifierName,
            isExistingRequest: true
          },
          read: false,
          priority: 'high'
        };
        
        await this.createNotification(notificationData);
        console.log(`✅ Created notification for linked verification request ${request.id}`);
      }
    }
    
    console.log(`=== VERIFICATION REQUEST LINKING COMPLETE ===`);
    console.log(`Linked ${linkedRequests.length} verification requests and created notifications`);
  }
}

// Use global to persist across serverless function calls in same instance
let globalStorage = global.__storage || null;

if (!globalStorage) {
  globalStorage = new MemStorage();
  global.__storage = globalStorage;
}

export const storage = globalStorage;
