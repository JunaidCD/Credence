import { type User, type InsertUser, type Credential, type InsertCredential, type VerificationRequest, type InsertVerificationRequest } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private credentials: Map<string, Credential>;
  private verificationRequests: Map<string, VerificationRequest>;

  constructor() {
    this.users = new Map();
    this.credentials = new Map();
    this.verificationRequests = new Map();
    
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
    const id = randomUUID();
    const credential: Credential = { 
      ...insertCredential, 
      id, 
      createdAt: new Date()
    } as Credential;
    this.credentials.set(id, credential);
    console.log('Created credential:', { id: credential.id, userId: credential.userId, title: credential.title });
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
    for (const credential of credentialsToLink) {
      console.log(`Linking credential ${credential.id} to user ${userId}`);
      await this.updateCredential(credential.id, { userId });
    }
    
    console.log(`=== LINKING COMPLETE ===`);
  }
}

export const storage = new MemStorage();
