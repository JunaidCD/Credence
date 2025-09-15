import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(), // MetaMask wallet address
  did: text("did").notNull().unique(), // Decentralized Identity
  name: text("name").notNull(),
  email: text("email"),
  userType: text("user_type").notNull().default("user"), // user, verifier, issuer
  createdAt: timestamp("created_at").defaultNow(),
});

export const credentials = pgTable("credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  issuerId: varchar("issuer_id").notNull().references(() => users.id),
  type: text("type").notNull(), // degree, pan, license, certificate, etc.
  title: text("title").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  status: text("status").notNull().default("active"), // active, revoked, expired
  metadata: jsonb("metadata"), // Additional credential data
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  verifierId: varchar("verifier_id").notNull().references(() => users.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  credentialType: text("credential_type").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  signature: text("signature"), // MetaMask signature for Web3 verification
  verifierDID: text("verifier_did"), // Verifier's DID
  holderDID: text("holder_did"), // Holder's DID
  blockchainData: jsonb("blockchain_data"), // Additional blockchain verification data
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // credential_issued, verification_request, credential_shared, system_update
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional notification data (credential details, issuer info, etc.)
  read: boolean("read").notNull().default(false),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  requestedAt: true,
  respondedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCredential = z.infer<typeof insertCredentialSchema>;
export type Credential = typeof credentials.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
