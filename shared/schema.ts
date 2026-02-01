// MyJantes Database Schema
// References: javascript_log_in_with_replit, javascript_database blueprints

import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password", { length: 255 }), // Hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  address: text("address"),
  postalCode: varchar("postal_code"),
  city: varchar("city"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["client", "client_professionnel", "employe", "admin"] }).notNull().default("client"),
  // Champs pour clients professionnels
  companyName: varchar("company_name"),
  siret: varchar("siret", { length: 14 }),
  tvaNumber: varchar("tva_number", { length: 20 }),
  companyAddress: text("company_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Services offered
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  estimatedDuration: integer("estimated_duration"), // Duration in minutes
  imageUrl: varchar("image_url", { length: 500 }),
  customFormFields: jsonb("custom_form_fields"), // Array of field definitions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote requests
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reference: varchar("reference", { length: 50 }).unique(), // Format: DEV-MM-00001
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  status: varchar("status", { enum: ["pending", "approved", "rejected", "completed"] }).notNull().default("pending"),
  requestDetails: jsonb("request_details"), // Custom form data from client
  quoteAmount: decimal("quote_amount", { precision: 10, scale: 2 }),
  wheelCount: integer("wheel_count"), // Number of wheels: 1, 2, 3, or 4
  diameter: varchar("diameter", { length: 50 }), // Wheel diameter
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }), // Prix HT
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }), // TVA rate (e.g., 20.00 for 20%)
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }), // TVA amount
  productDetails: text("product_details"), // Details about products
  notes: text("notes"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote Items (lignes de devis)
export const quoteItems = pgTable("quote_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPriceExcludingTax: decimal("unit_price_excluding_tax", { precision: 10, scale: 2 }).notNull(),
  totalExcludingTax: decimal("total_excluding_tax", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalIncludingTax: decimal("total_including_tax", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").references(() => quotes.id, { onDelete: 'cascade' }), // Optional - nullable for direct invoices
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { enum: ["cash", "wire_transfer", "card"] }).notNull().default("wire_transfer"), // Required for direct invoices
  wheelCount: integer("wheel_count"), // Number of wheels: 1, 2, 3, or 4
  diameter: varchar("diameter", { length: 50 }), // Wheel diameter
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }), // Prix HT
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }), // TVA rate (e.g., 20.00 for 20%)
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }), // TVA amount
  productDetails: text("product_details"), // Details about products
  status: varchar("status", { enum: ["pending", "paid", "overdue", "cancelled"] }).notNull().default("pending"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice Items (lignes de facture)
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPriceExcludingTax: decimal("unit_price_excluding_tax", { precision: 10, scale: 2 }).notNull(),
  totalExcludingTax: decimal("total_excluding_tax", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  totalIncludingTax: decimal("total_including_tax", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservations
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").references(() => quotes.id, { onDelete: 'cascade' }), // Optional - nullable for direct reservations
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  assignedEmployeeId: varchar("assigned_employee_id").references(() => users.id, { onDelete: 'set null' }), // Employee assigned to the reservation
  scheduledDate: timestamp("scheduled_date").notNull(),
  estimatedEndDate: timestamp("estimated_end_date"), // Estimated end time for calendar display
  wheelCount: integer("wheel_count"), // Number of wheels: 1, 2, 3, or 4
  diameter: varchar("diameter", { length: 50 }), // Wheel diameter
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }), // Prix HT
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }), // TVA rate (e.g., 20.00 for 20%)
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }), // TVA amount
  productDetails: text("product_details"), // Details about products
  status: varchar("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reservation Services (table de liaison pour services multiples par réservation)
export const reservationServices = pgTable("reservation_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull().default(1),
  priceExcludingTax: decimal("price_excluding_tax", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type", { enum: ["quote", "invoice", "reservation", "service", "chat"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // ID of related quote/invoice/reservation/conversation
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Conversations (Discussion threads)
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  createdById: varchar("created_by_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  isArchived: boolean("is_archived").notNull().default(false),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Participants (Who is part of which conversation)
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastReadAt: timestamp("last_read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: 'cascade' }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Attachments (Files attached to messages)
export const chatAttachments = pgTable("chat_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),
  fileType: varchar("file_type", { enum: ["image", "video", "document"] }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice counters for incremental numbering
export const invoiceCounters = pgTable("invoice_counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentType: varchar("payment_type", { enum: ["cash", "wire_transfer", "card"] }).notNull().unique(),
  currentNumber: integer("current_number").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media files for quotes (images and videos)
export const quoteMedia = pgTable("quote_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteId: varchar("quote_id").notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  fileType: varchar("file_type", { enum: ["image", "video"] }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Media files for invoices (images and videos)
export const invoiceMedia = pgTable("invoice_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  fileType: varchar("file_type", { enum: ["image", "video"] }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Application Settings (singleton table for app-wide configuration)
export const applicationSettings = pgTable("application_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  defaultWheelCount: integer("default_wheel_count").notNull().default(4), // Default: 4 jantes
  defaultDiameter: varchar("default_diameter", { length: 50 }).notNull().default("17"), // Default diameter
  defaultTaxRate: decimal("default_tax_rate", { precision: 5, scale: 2 }).notNull().default("20.00"), // Default: 20% TVA
  wheelCountOptions: varchar("wheel_count_options").notNull().default("1,2,3,4"), // Available options (comma-separated)
  diameterOptions: text("diameter_options").notNull().default("14,15,16,17,18,19,20,21,22"), // Available diameters (comma-separated)
  companyName: varchar("company_name", { length: 255 }).notNull().default("MyJantes"),
  companyTagline: varchar("company_tagline", { length: 255 }),
  companyAddress: text("company_address"),
  companyCity: varchar("company_city", { length: 255 }),
  companyPhone: varchar("company_phone", { length: 50 }),
  companyEmail: varchar("company_email", { length: 255 }),
  companyWebsite: varchar("company_website", { length: 255 }),
  companySiret: varchar("company_siret", { length: 20 }),
  companyTvaNumber: varchar("company_tva_number", { length: 30 }),
  companyIban: varchar("company_iban", { length: 50 }),
  companySwift: varchar("company_swift", { length: 20 }),
  companyLogo: text("company_logo"), // Base64 encoded logo or Object Storage URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Engagements (Prestations) - groups quotes, invoices and reservations per client
export const engagements = pgTable("engagements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows - define the steps required for a service
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow steps - individual steps within a workflow
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service-Workflow associations
export const serviceWorkflows = pgTable("service_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: 'cascade' }),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workshop tracking - tracks the progress of a reservation
export const workshopTasks = pgTable("workshop_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reservationId: varchar("reservation_id").notNull().references(() => reservations.id, { onDelete: 'cascade' }),
  workflowStepId: varchar("workflow_step_id").notNull().references(() => workflowSteps.id, { onDelete: 'cascade' }),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  completedByUserId: varchar("completed_by_user_id").references(() => users.id),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Logs - tracks all actions performed in the system
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type", { 
    enum: ["quote", "invoice", "reservation", "service", "workflow", "workflow_step", "user", "workshop_task"] 
  }).notNull(),
  entityId: varchar("entity_id").notNull(),
  action: varchar("action", { 
    enum: ["created", "updated", "deleted", "validated", "rejected", "completed", "cancelled", "paid", "confirmed"] 
  }).notNull(),
  actorId: varchar("actor_id").references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar("actor_role", { enum: ["client", "client_professionnel", "employe", "admin"] }),
  actorName: varchar("actor_name", { length: 255 }), // Store name at time of action
  summary: text("summary"), // Human-readable summary of action
  metadata: jsonb("metadata"), // Additional context (e.g., related entity info)
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_audit_entity").on(table.entityType, table.entityId),
  index("IDX_audit_actor").on(table.actorId),
  index("IDX_audit_occurred").on(table.occurredAt),
]);

// Audit Log Changes - stores field-level changes for each audit log entry
export const auditLogChanges = pgTable("audit_log_changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditLogId: varchar("audit_log_id").notNull().references(() => auditLogs.id, { onDelete: 'cascade' }),
  field: varchar("field", { length: 100 }).notNull(),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  invoices: many(invoices),
  reservations: many(reservations),
  notifications: many(notifications),
  engagements: many(engagements),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  quotes: many(quotes),
  reservations: many(reservations),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(users, {
    fields: [quotes.clientId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [quotes.serviceId],
    references: [services.id],
  }),
  invoices: many(invoices),
  reservations: many(reservations),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [invoices.quoteId],
    references: [quotes.id],
  }),
  client: one(users, {
    fields: [invoices.clientId],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  quote: one(quotes, {
    fields: [reservations.quoteId],
    references: [quotes.id],
  }),
  client: one(users, {
    fields: [reservations.clientId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [reservations.serviceId],
    references: [services.id],
  }),
  additionalServices: many(reservationServices),
}));

export const reservationServicesRelations = relations(reservationServices, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationServices.reservationId],
    references: [reservations.id],
  }),
  service: one(services, {
    fields: [reservationServices.serviceId],
    references: [services.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ many }) => ({
  steps: many(workflowSteps),
  serviceWorkflows: many(serviceWorkflows),
}));

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  workshopTasks: many(workshopTasks),
}));

export const serviceWorkflowsRelations = relations(serviceWorkflows, ({ one }) => ({
  service: one(services, {
    fields: [serviceWorkflows.serviceId],
    references: [services.id],
  }),
  workflow: one(workflows, {
    fields: [serviceWorkflows.workflowId],
    references: [workflows.id],
  }),
}));

export const workshopTasksRelations = relations(workshopTasks, ({ one }) => ({
  reservation: one(reservations, {
    fields: [workshopTasks.reservationId],
    references: [reservations.id],
  }),
  step: one(workflowSteps, {
    fields: [workshopTasks.workflowStepId],
    references: [workflowSteps.id],
  }),
  completedBy: one(users, {
    fields: [workshopTasks.completedByUserId],
    references: [users.id],
  }),
}));

export const engagementsRelations = relations(engagements, ({ one }) => ({
  client: one(users, {
    fields: [engagements.clientId],
    references: [users.id],
  }),
}));

export const quoteMediaRelations = relations(quoteMedia, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteMedia.quoteId],
    references: [quotes.id],
  }),
}));

export const invoiceMediaRelations = relations(invoiceMedia, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceMedia.invoiceId],
    references: [invoices.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one, many }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
  changes: many(auditLogChanges),
}));

export const auditLogChangesRelations = relations(auditLogChanges, ({ one }) => ({
  auditLog: one(auditLogs, {
    fields: [auditLogChanges.auditLogId],
    references: [auditLogs.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chatConversations.createdById],
    references: [users.id],
  }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatParticipants.conversationId],
    references: [chatConversations.id],
  }),
  user: one(users, {
    fields: [chatParticipants.userId],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  attachments: many(chatAttachments),
}));

export const chatAttachmentsRelations = relations(chatAttachments, ({ one }) => ({
  message: one(chatMessages, {
    fields: [chatAttachments.messageId],
    references: [chatMessages.id],
  }),
}));

// Zod Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });

// Custom invoice schema with data transformations
export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({ id: true, createdAt: true, updatedAt: true, invoiceNumber: true })
  .extend({
    amount: z.union([z.string(), z.number()]).transform(val => String(val)),
    dueDate: z.union([z.date(), z.string()]).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ).optional(),
    quoteId: z.string().nullable().optional(), // Optional for direct invoices
    paymentMethod: z.enum(["cash", "wire_transfer", "card"]).default("wire_transfer"), // Required for direct invoices
    wheelCount: z.number().min(1).max(4).nullable().optional(),
    diameter: z.string().nullable().optional(),
    priceExcludingTax: z.string().nullable().optional(),
    taxRate: z.string().nullable().optional(),
    taxAmount: z.string().nullable().optional(),
    productDetails: z.string().nullable().optional(),
  });

// Custom reservation schema with data transformations
export const insertReservationSchema = createInsertSchema(reservations)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    scheduledDate: z.union([z.date(), z.string()]).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ),
    estimatedEndDate: z.union([z.date(), z.string()]).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ).optional().nullable(),
    quoteId: z.string().nullable().optional(),
    wheelCount: z.number().min(1).max(4).nullable().optional(),
    diameter: z.string().nullable().optional(),
    priceExcludingTax: z.string().nullable().optional(),
    taxRate: z.string().nullable().optional(),
    taxAmount: z.string().nullable().optional(),
    productDetails: z.string().nullable().optional(),
  });

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReservationServiceSchema = createInsertSchema(reservationServices).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertInvoiceCounterSchema = createInsertSchema(invoiceCounters).omit({ id: true, updatedAt: true });
export const insertQuoteMediaSchema = createInsertSchema(quoteMedia).omit({ id: true, createdAt: true });
export const insertInvoiceMediaSchema = createInsertSchema(invoiceMedia).omit({ id: true, createdAt: true });
export const insertApplicationSettingsSchema = createInsertSchema(applicationSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEngagementSchema = createInsertSchema(engagements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceWorkflowSchema = createInsertSchema(serviceWorkflows).omit({ id: true, createdAt: true });
export const insertWorkshopTaskSchema = createInsertSchema(workshopTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, occurredAt: true });
export const insertAuditLogChangeSchema = createInsertSchema(auditLogChanges).omit({ id: true });
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true, updatedAt: true, lastMessageAt: true });
export const insertChatParticipantSchema = createInsertSchema(chatParticipants).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, updatedAt: true, isEdited: true });
export const insertChatAttachmentSchema = createInsertSchema(chatAttachments).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservationService = z.infer<typeof insertReservationServiceSchema>;
export type ReservationService = typeof reservationServices.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertInvoiceCounter = z.infer<typeof insertInvoiceCounterSchema>;
export type InvoiceCounter = typeof invoiceCounters.$inferSelect;
export type InsertQuoteMedia = z.infer<typeof insertQuoteMediaSchema>;
export type QuoteMedia = typeof quoteMedia.$inferSelect;
export type InsertInvoiceMedia = z.infer<typeof insertInvoiceMediaSchema>;
export type InvoiceMedia = typeof invoiceMedia.$inferSelect;
export type InsertApplicationSettings = z.infer<typeof insertApplicationSettingsSchema>;
export type ApplicationSettings = typeof applicationSettings.$inferSelect;
export type InsertEngagement = z.infer<typeof insertEngagementSchema>;
export type Engagement = typeof engagements.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertServiceWorkflow = z.infer<typeof insertServiceWorkflowSchema>;
export type ServiceWorkflow = typeof serviceWorkflows.$inferSelect;
export type InsertWorkshopTask = z.infer<typeof insertWorkshopTaskSchema>;
export type WorkshopTask = typeof workshopTasks.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLogChange = z.infer<typeof insertAuditLogChangeSchema>;
export type AuditLogChange = typeof auditLogChanges.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatAttachment = z.infer<typeof insertChatAttachmentSchema>;
export type ChatAttachment = typeof chatAttachments.$inferSelect;
