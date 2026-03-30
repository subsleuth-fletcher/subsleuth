import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  decimal,
  integer,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// Enums
export const planEnum = pgEnum("plan", ["starter", "growth", "business"]);

export const orgRoleEnum = pgEnum("org_role", ["admin", "member", "viewer"]);

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "annual",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "trial",
]);

export const detectedSourceEnum = pgEnum("detected_source", [
  "csv_import",
  "quickbooks",
  "xero",
  "manual",
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "renewal",
  "price_change",
  "unused",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "sent",
  "dismissed",
]);

export const alertChannelEnum = pgEnum("alert_channel", ["email", "slack"]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  companyName: text("company_name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auth.js tables
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  plan: planEnum("plan"),
  stripeCustomerId: text("stripe_customer_id"),
  previewStartedAt: timestamp("preview_started_at"),
  previewEndsAt: timestamp("preview_ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orgMembers = pgTable("org_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  role: orgRoleEnum("role").default("member").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  vendorName: text("vendor_name").notNull(),
  category: text("category"),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }).notNull(),
  billingCycle: billingCycleEnum("billing_cycle").default("monthly").notNull(),
  renewalDate: timestamp("renewal_date"),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  detectedSource: detectedSourceEnum("detected_source")
    .default("manual")
    .notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionAlerts = pgTable("subscription_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id),
  alertType: alertTypeEnum("alert_type").notNull(),
  alertDate: timestamp("alert_date").notNull(),
  status: alertStatusEnum("status").default("pending").notNull(),
  channel: alertChannelEnum("channel").default("email").notNull(),
});

export const csvImports = pgTable("csv_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  fileName: text("file_name").notNull(),
  rowCount: integer("row_count"),
  status: importStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  ownedOrganizations: many(organizations),
  memberships: many(orgMembers),
  csvImports: many(csvImports),
  auditLogs: many(auditLog),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
    }),
    members: many(orgMembers),
    subscriptions: many(subscriptions),
    csvImports: many(csvImports),
    auditLogs: many(auditLog),
  })
);

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgMembers.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [subscriptions.orgId],
      references: [organizations.id],
    }),
    alerts: many(subscriptionAlerts),
  })
);

export const subscriptionAlertsRelations = relations(
  subscriptionAlerts,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [subscriptionAlerts.subscriptionId],
      references: [subscriptions.id],
    }),
  })
);

export const csvImportsRelations = relations(csvImports, ({ one }) => ({
  organization: one(organizations, {
    fields: [csvImports.orgId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [csvImports.uploadedBy],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLog.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type OrgMember = typeof orgMembers.$inferSelect;
export type NewOrgMember = typeof orgMembers.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type SubscriptionAlert = typeof subscriptionAlerts.$inferSelect;
export type NewSubscriptionAlert = typeof subscriptionAlerts.$inferInsert;

export type CsvImport = typeof csvImports.$inferSelect;
export type NewCsvImport = typeof csvImports.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
