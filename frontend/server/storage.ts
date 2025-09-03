import { type User, type InsertUser, type Credential, type InsertCredential, type VerificationRequest, type InsertVerificationRequest, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByAddress(address: string): Promise<User | undefined>;
  getUserByDID(did: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Credentials
  getCredential(id: string): Promise<Credential | undefined>;
  getCredentialsByUserId(userId: string): Promise<Credential[]>;
  getCredentialsByIssuerId(issuerId: string): Promise<Credential[]>;
  createCredential(credential: InsertCredential): Promise<Credential>;
  updateCredential(id: string, updates: Partial<Credential>): Promise<Credential | undefined>;
  linkCredentialsToUser(userId: string, walletAddress: string): Promise<void>;

  // Verification Requests
  getVerificationRequest(id: string): Promise<VerificationRequest | undefined>;
  getVerificationRequestsByUserId(userId: string): Promise<VerificationRequest[]>;
  getVerificationRequestsByVerifierId(verifierId: string): Promise<VerificationRequest[]>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequest(id: string, updates: Partial<VerificationRequest>): Promise<VerificationRequest | undefined>;

  // Notifications
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private credentials: Map<string, Credential>;
  private verificationRequests: Map<string, VerificationRequest>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.credentials = new Map();
    this.verificationRequests = new Map();
    this.notifications = new Map();
    
    // Initialize with some test data for debugging
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create test issuer (account 0)
    const testIssuer: User = {
      id: "test-issuer-1",
      address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      did: "did:ethr:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      name: "Test Issuer",
      email: "issuer@example.com",
      userType: "issuer", 
      createdAt: new Date()
    } as User;

    this.users.set(testIssuer.id, testIssuer);

    // No test credentials - only real credentials issued by users will be stored

    console.log('=== TEST DATA INITIALIZED ===');
    console.log('Users created:', this.users.size);
    console.log('Credentials created:', this.credentials.size);
    console.log('Test users:', Array.from(this.users.values()).map(u => ({ id: u.id, address: u.address, name: u.name })));
    console.log('Test credentials:', Array.from(this.credentials.values()).map(c => ({ id: c.id, userId: c.userId, title: c.title })));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.address === address);
  }

  async getUserByDID(did: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.did === did);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    } as User;
    this.users.set(id, user);
    console.log('Created user:', { id: user.id, address: user.address, name: user.name });
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Credentials
  async getCredential(id: string): Promise<Credential | undefined> {
    return this.credentials.get(id);
  }

  async getCredentialsByUserId(userId: string): Promise<Credential[]> {
    return Array.from(this.credentials.values()).filter(cred => cred.userId === userId);
  }

  async getCredentialsByIssuerId(issuerId: string): Promise<Credential[]> {
    return Array.from(this.credentials.values()).filter(cred => cred.issuerId === issuerId);
  }

  async createCredential(insertCredential: InsertCredential): Promise<Credential> {
    console.log('=== CREATE CREDENTIAL DEBUG ===');
    console.log('Input credential data:', insertCredential);
    
    const id = randomUUID();
    const credential: Credential = { 
      ...insertCredential, 
      id, 
      createdAt: new Date()
    } as Credential;
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

  async updateCredential(id: string, updates: Partial<Credential>): Promise<Credential | undefined> {
    const credential = this.credentials.get(id);
    if (!credential) return undefined;
    
    const updatedCredential = { ...credential, ...updates };
    this.credentials.set(id, updatedCredential);
    return updatedCredential;
  }

  // Verification Requests
  async getVerificationRequest(id: string): Promise<VerificationRequest | undefined> {
    return this.verificationRequests.get(id);
  }

  async getVerificationRequestsByUserId(userId: string): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values()).filter(req => req.userId === userId);
  }

  async getVerificationRequestsByVerifierId(verifierId: string): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values()).filter(req => req.verifierId === verifierId);
  }

  async createVerificationRequest(insertRequest: InsertVerificationRequest): Promise<VerificationRequest> {
    const id = randomUUID();
    const request: VerificationRequest = { 
      ...insertRequest, 
      id, 
      requestedAt: new Date(),
      respondedAt: null
    } as VerificationRequest;
    this.verificationRequests.set(id, request);
    return request;
  }

  async updateVerificationRequest(id: string, updates: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
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
  async linkCredentialsToUser(userId: string, walletAddress: string): Promise<void> {
    console.log(`=== LINKING CREDENTIALS ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Wallet Address: ${walletAddress}`);
    
    const allCredentials = Array.from(this.credentials.values());
    console.log(`Total credentials in storage: ${allCredentials.length}`);
    
    // Find credentials that were issued to this wallet address but don't have a userId yet
    const credentialsToLink = allCredentials.filter(credential => {
      const studentDid = (credential.metadata as any)?.studentDid?.toLowerCase();
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
    
    console.log(`=== LINKING COMPLETE ===`);
  }

  // Notifications
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: new Date()
    } as Notification;
    this.notifications.set(id, notification);
    console.log('Created notification:', { id: notification.id, userId: notification.userId, type: notification.type });
    return notification;
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, ...updates };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    return this.updateNotification(id, { read: true });
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const userNotifications = await this.getNotificationsByUserId(userId);
    for (const notification of userNotifications) {
      if (!notification.read) {
        await this.markNotificationAsRead(notification.id);
      }
    }
  }

  // Helper method to create credential notification
  private async createCredentialNotification(credential: Credential): Promise<void> {
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
  private async createNotificationsForLinkedCredentials(userId: string, credentials: Credential[]): Promise<void> {
    console.log(`=== CREATING REGISTRATION NOTIFICATIONS ===`);
    console.log(`Creating notifications for ${credentials.length} credentials for user ${userId}`);
    
    for (const credential of credentials) {
      try {
        // Get issuer information
        const issuer = await this.getUser(credential.issuerId);
        const issuerName = issuer?.name || 'Unknown Issuer';
        const metadata = credential.metadata as any;
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
            issuerAddress: issuer?.address || (credential.metadata as any)?.issuerAddress,
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
  async createNotificationsForBlockchainCredentials(userId: string, blockchainCredentials: any[]): Promise<void> {
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
  async notificationExistsForBlockchainEvent(userId: string, credentialId: string, transactionHash: string): Promise<boolean> {
    const userNotifications = await this.getNotificationsByUserId(userId);
    
    return userNotifications.some(notification => {
      const data = notification.data as any;
      return data?.credentialId === credentialId || 
             data?.metadata?.transactionHash === transactionHash ||
             data?.metadata?.blockchainId === credentialId;
    });
  }
}

export const storage = new MemStorage();
