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

      let user = await storage.getUserByAddress(address);
      
      if (!user) {
        // Generate a mock DID for new users
        const did = `did:ethr:${address}`;
        const name = `User ${address.slice(-4)}`;
        
        const userData = insertUserSchema.parse({
          address,
          did,
          name,
          userType,
          email: `${name.toLowerCase()}@example.com`
        });
        
        user = await storage.createUser(userData);
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

  const httpServer = createServer(app);
  return httpServer;
}
