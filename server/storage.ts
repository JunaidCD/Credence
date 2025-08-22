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
    };
    this.users.set(id, user);
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
    };
    this.credentials.set(id, credential);
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
    };
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
}

export const storage = new MemStorage();
