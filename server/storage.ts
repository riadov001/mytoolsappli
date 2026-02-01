import {
  users,
  services,
  quotes,
  quoteItems,
  invoices,
  invoiceItems,
  reservations,
  reservationServices,
  notifications,
  invoiceCounters,
  quoteMedia,
  invoiceMedia,
  applicationSettings,
  engagements,
  workflows,
  workflowSteps,
  serviceWorkflows,
  workshopTasks,
  auditLogs,
  auditLogChanges,
  passwordResetTokens,
  chatConversations,
  chatParticipants,
  chatMessages,
  chatAttachments,
  type User,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type UpsertUser,
  type Service,
  type InsertService,
  type Quote,
  type InsertQuote,
  type QuoteItem,
  type InsertQuoteItem,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Reservation,
  type InsertReservation,
  type ReservationService,
  type InsertReservationService,
  type Notification,
  type InsertNotification,
  type InvoiceCounter,
  type InsertInvoiceCounter,
  type ApplicationSettings,
  type InsertApplicationSettings,
  type Engagement,
  type InsertEngagement,
  type Workflow,
  type InsertWorkflow,
  type WorkflowStep,
  type InsertWorkflowStep,
  type ServiceWorkflow,
  type InsertServiceWorkflow,
  type WorkshopTask,
  type InsertWorkshopTask,
  type AuditLog,
  type InsertAuditLog,
  type AuditLogChange,
  type InsertAuditLogChange,
  type ChatConversation,
  type InsertChatConversation,
  type ChatParticipant,
  type InsertChatParticipant,
  type ChatMessage,
  type InsertChatMessage,
  type ChatAttachment,
  type InsertChatAttachment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  createUser(user: { email: string; password?: string; firstName?: string; lastName?: string; role?: "client" | "client_professionnel" | "employe" | "admin"; companyName?: string; siret?: string; tvaNumber?: string; companyAddress?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;
  getQuotes(clientId?: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote>;
  getQuoteItems(quoteId: string): Promise<QuoteItem[]>;
  getQuoteItem(id: string): Promise<QuoteItem | undefined>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: string, item: Partial<InsertQuoteItem>): Promise<QuoteItem>;
  deleteQuoteItem(id: string): Promise<void>;
  recalculateQuoteTotals(quoteId: string): Promise<Quote>;
  getInvoices(clientId?: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  getInvoiceItem(id: string): Promise<InvoiceItem | undefined>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: string): Promise<void>;
  recalculateInvoiceTotals(invoiceId: string): Promise<Invoice>;
  getReservations(clientId?: string): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, reservation: Partial<InsertReservation>): Promise<Reservation>;
  getReservationServices(reservationId: string): Promise<(ReservationService & { service: Service })[]>;
  addReservationService(data: InsertReservationService): Promise<ReservationService>;
  deleteReservationServices(reservationId: string): Promise<void>;
  setReservationServices(reservationId: string, serviceIds: string[]): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  getInvoiceCounter(paymentType: "cash" | "wire_transfer" | "card"): Promise<InvoiceCounter | undefined>;
  createInvoiceCounter(counter: InsertInvoiceCounter): Promise<InvoiceCounter>;
  incrementInvoiceCounter(paymentType: "cash" | "wire_transfer" | "card"): Promise<InvoiceCounter>;
  createQuoteMedia(media: { quoteId: string; filePath: string; fileType: string; fileName?: string }): Promise<void>;
  createInvoiceMedia(media: { invoiceId: string; filePath: string; fileType: string; fileName?: string }): Promise<void>;
  getQuoteMedia(quoteId: string): Promise<{ id: string; quoteId: string; fileType: string; filePath: string; fileName: string; fileSize: number | null; createdAt: Date | null }[]>;
  getInvoiceMedia(invoiceId: string): Promise<{ id: string; invoiceId: string; fileType: string; filePath: string; fileName: string; fileSize: number | null; createdAt: Date | null }[]>;
  getApplicationSettings(): Promise<ApplicationSettings | undefined>;
  createOrUpdateApplicationSettings(settings: Partial<InsertApplicationSettings>): Promise<ApplicationSettings>;
  getEngagements(clientId?: string): Promise<Engagement[]>;
  getEngagement(id: string): Promise<Engagement | undefined>;
  createEngagement(engagement: InsertEngagement): Promise<Engagement>;
  updateEngagement(id: string, engagement: Partial<InsertEngagement>): Promise<Engagement>;
  getEngagementSummary(clientId: string): Promise<{ 
    quotes: (Quote & { media: { id: string; fileType: string; filePath: string; fileName: string }[] })[]; 
    invoices: (Invoice & { media: { id: string; fileType: string; filePath: string; fileName: string }[] })[]; 
    reservations: Reservation[] 
  }>;
  createWorkflow(workflowData: InsertWorkflow): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  getWorkflows(): Promise<Workflow[]>;
  getWorkflowByServiceId(serviceId: string): Promise<Workflow | undefined>;
  updateWorkflow(id: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<void>;
  createWorkflowStep(stepData: InsertWorkflowStep): Promise<WorkflowStep>;
  getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]>;
  updateWorkflowStep(id: string, stepData: Partial<InsertWorkflowStep>): Promise<WorkflowStep>;
  deleteWorkflowStep(id: string): Promise<void>;
  assignWorkflowToService(serviceWorkflowData: InsertServiceWorkflow): Promise<ServiceWorkflow>;
  getServiceWorkflows(serviceId: string): Promise<Workflow[]>;
  deleteServiceWorkflow(serviceId: string, workflowId: string): Promise<void>;
  createWorkshopTask(taskData: InsertWorkshopTask): Promise<WorkshopTask>;
  updateWorkshopTask(id: string, taskData: Partial<InsertWorkshopTask>): Promise<WorkshopTask>;
  getReservationTasks(reservationId: string): Promise<(WorkshopTask & { step: WorkflowStep })[]>;
  initializeReservationWorkflow(reservationId: string, workflowSteps: WorkflowStep[]): Promise<void>;
  // Audit Log methods
  createAuditLog(logData: InsertAuditLog, changes?: { field: string; previousValue: any; newValue: any }[]): Promise<AuditLog>;
  getAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: (AuditLog & { actor?: User; changes: AuditLogChange[] })[]; total: number }>;
  getAuditLog(id: string): Promise<(AuditLog & { actor?: User; changes: AuditLogChange[] }) | undefined>;
  getEntityAuditHistory(entityType: string, entityId: string): Promise<(AuditLog & { actor?: User; changes: AuditLogChange[] })[]>;
  // Password reset tokens
  createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  
  // Chat methods
  createChatConversation(data: InsertChatConversation): Promise<ChatConversation>;
  getChatConversation(id: string): Promise<ChatConversation | undefined>;
  getChatConversations(userId: string): Promise<(ChatConversation & { participants: (ChatParticipant & { user: User })[], unreadCount: number, lastMessage?: ChatMessage & { sender: User; attachmentCount: number } })[]>;
  updateChatConversation(id: string, data: Partial<InsertChatConversation>): Promise<ChatConversation>;
  deleteChatConversation(id: string): Promise<void>;
  
  addChatParticipant(data: InsertChatParticipant): Promise<ChatParticipant>;
  removeChatParticipant(conversationId: string, userId: string): Promise<void>;
  getChatParticipants(conversationId: string): Promise<(ChatParticipant & { user: User })[]>;
  updateLastRead(conversationId: string, userId: string): Promise<void>;
  
  createChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(conversationId: string, limit?: number, offset?: number): Promise<(ChatMessage & { sender: User, attachments: ChatAttachment[] })[]>;
  updateChatMessage(id: string, content: string): Promise<ChatMessage>;
  deleteChatMessage(id: string): Promise<void>;
  
  createChatAttachment(data: InsertChatAttachment): Promise<ChatAttachment>;
  getChatAttachments(messageId: string): Promise<ChatAttachment[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createUser(userData: { email: string; password?: string; firstName?: string; lastName?: string; role?: "client" | "client_professionnel" | "employe" | "admin"; companyName?: string; siret?: string; tvaNumber?: string; companyAddress?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "client",
        companyName: userData.companyName,
        siret: userData.siret,
        tvaNumber: userData.tvaNumber,
        companyAddress: userData.companyAddress,
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(desc(services.createdAt));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async updateService(id: string, serviceData: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getQuotes(clientId?: string): Promise<Quote[]> {
    if (clientId) {
      return await db.select().from(quotes).where(eq(quotes.clientId, clientId)).orderBy(desc(quotes.createdAt));
    }
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quoteData: InsertQuote): Promise<Quote> {
    // Generate quote reference: DEV-MM-00001
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get total count of quotes for this month to generate sequential number
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const existingQuotes = await db.select({ reference: quotes.reference })
      .from(quotes)
      .where(sql`${quotes.createdAt} >= ${startOfMonth}`);
    
    const sequentialNumber = existingQuotes.length + 1;
    const reference = `DEV-${month}-${String(sequentialNumber).padStart(5, '0')}`;
    
    const [quote] = await db.insert(quotes).values({ ...quoteData, reference }).returning();
    return quote;
  }

  async updateQuote(id: string, quoteData: Partial<InsertQuote>): Promise<Quote> {
    const [quote] = await db
      .update(quotes)
      .set({ ...quoteData, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return quote;
  }

  async getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
    return await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, quoteId))
      .orderBy(quoteItems.createdAt);
  }

  async getQuoteItem(id: string): Promise<QuoteItem | undefined> {
    const [item] = await db.select().from(quoteItems).where(eq(quoteItems.id, id));
    return item;
  }

  async createQuoteItem(itemData: InsertQuoteItem): Promise<QuoteItem> {
    const [item] = await db.insert(quoteItems).values([itemData]).returning();
    return item;
  }

  async updateQuoteItem(id: string, itemData: Partial<InsertQuoteItem>): Promise<QuoteItem> {
    const [item] = await db
      .update(quoteItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(quoteItems.id, id))
      .returning();
    return item;
  }

  async deleteQuoteItem(id: string): Promise<void> {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
  }

  async recalculateQuoteTotals(quoteId: string): Promise<Quote> {
    const items = await this.getQuoteItems(quoteId);
    const totalHT = items.reduce((sum, item) => sum + parseFloat(item.totalExcludingTax || '0'), 0);
    const totalVAT = items.reduce((sum, item) => sum + parseFloat(item.taxAmount || '0'), 0);
    const totalTTC = totalHT + totalVAT;
    const avgTaxRate = items.length > 0 ? parseFloat(items[0].taxRate || '20') : 20;
    
    return await this.updateQuote(quoteId, {
      quoteAmount: totalTTC.toFixed(2),
      priceExcludingTax: totalHT.toFixed(2),
      taxAmount: totalVAT.toFixed(2),
      taxRate: avgTaxRate.toFixed(2),
    });
  }

  async getInvoices(clientId?: string): Promise<Invoice[]> {
    if (clientId) {
      return await db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt));
    }
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get total count of invoices for this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const existingInvoices = await db.select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(sql`${invoices.createdAt} >= ${startOfMonth}`);
    
    const sequentialNumber = existingInvoices.length + 1;
    const invoiceNumber = `DEV-${month}-${String(sequentialNumber).padStart(5, '0')}`;
    
    const [invoice] = await db.insert(invoices).values([{
      ...invoiceData,
      invoiceNumber,
    }]).returning();
    return invoice;
  }

  async updateInvoice(id: string, invoiceData: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...invoiceData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(invoiceItems.createdAt);
  }

  async getInvoiceItem(id: string): Promise<InvoiceItem | undefined> {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return item;
  }

  async createInvoiceItem(itemData: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values([itemData]).returning();
    return item;
  }

  async updateInvoiceItem(id: string, itemData: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [item] = await db
      .update(invoiceItems)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  }

  async deleteInvoiceItem(id: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
  }

  async recalculateInvoiceTotals(invoiceId: string): Promise<Invoice> {
    const items = await this.getInvoiceItems(invoiceId);
    const totalHT = items.reduce((sum, item) => sum + parseFloat(item.totalExcludingTax || '0'), 0);
    const totalVAT = items.reduce((sum, item) => sum + parseFloat(item.taxAmount || '0'), 0);
    const totalTTC = totalHT + totalVAT;
    const avgTaxRate = items.length > 0 ? parseFloat(items[0].taxRate || '20') : 20;
    
    return await this.updateInvoice(invoiceId, {
      amount: totalTTC.toFixed(2),
      priceExcludingTax: totalHT.toFixed(2),
      taxAmount: totalVAT.toFixed(2),
      taxRate: avgTaxRate.toFixed(2),
    });
  }

  async getReservations(clientId?: string): Promise<Reservation[]> {
    if (clientId) {
      return await db.select().from(reservations).where(eq(reservations.clientId, clientId)).orderBy(desc(reservations.createdAt));
    }
    return await db.select().from(reservations).orderBy(desc(reservations.createdAt));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    const [reservation] = await db.insert(reservations).values(reservationData).returning();
    return reservation;
  }

  async updateReservation(id: string, reservationData: Partial<InsertReservation>): Promise<Reservation> {
    const [reservation] = await db
      .update(reservations)
      .set({ ...reservationData, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    return reservation;
  }

  async getReservationServices(reservationId: string): Promise<(ReservationService & { service: Service })[]> {
    const results = await db
      .select({
        id: reservationServices.id,
        reservationId: reservationServices.reservationId,
        serviceId: reservationServices.serviceId,
        quantity: reservationServices.quantity,
        priceExcludingTax: reservationServices.priceExcludingTax,
        notes: reservationServices.notes,
        createdAt: reservationServices.createdAt,
        service: services,
      })
      .from(reservationServices)
      .innerJoin(services, eq(reservationServices.serviceId, services.id))
      .where(eq(reservationServices.reservationId, reservationId));
    return results;
  }

  async addReservationService(data: InsertReservationService): Promise<ReservationService> {
    const [result] = await db.insert(reservationServices).values(data).returning();
    return result;
  }

  async deleteReservationServices(reservationId: string): Promise<void> {
    await db.delete(reservationServices).where(eq(reservationServices.reservationId, reservationId));
  }

  async setReservationServices(reservationId: string, serviceIds: string[]): Promise<void> {
    // Delete existing additional services
    await this.deleteReservationServices(reservationId);
    // Add new services if any
    if (serviceIds.length > 0) {
      const values = serviceIds.map(serviceId => ({
        reservationId,
        serviceId,
        quantity: 1,
      }));
      await db.insert(reservationServices).values(values);
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async getInvoiceCounter(paymentType: "cash" | "wire_transfer" | "card"): Promise<InvoiceCounter | undefined> {
    const [counter] = await db.select().from(invoiceCounters).where(eq(invoiceCounters.paymentType, paymentType));
    return counter;
  }

  async createInvoiceCounter(counterData: InsertInvoiceCounter): Promise<InvoiceCounter> {
    const [counter] = await db.insert(invoiceCounters).values(counterData).returning();
    return counter;
  }

  async incrementInvoiceCounter(paymentType: "cash" | "wire_transfer" | "card"): Promise<InvoiceCounter> {
    const [counter] = await db
      .insert(invoiceCounters)
      .values({ paymentType, currentNumber: 1 })
      .onConflictDoUpdate({
        target: invoiceCounters.paymentType,
        set: {
          currentNumber: sql`${invoiceCounters.currentNumber} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning();
    return counter;
  }

  async createQuoteMedia(media: { quoteId: string; filePath: string; fileType: string; fileName?: string }): Promise<void> {
    await db.insert(quoteMedia).values({
      quoteId: media.quoteId,
      filePath: media.filePath,
      fileType: media.fileType as any,
      fileName: media.fileName || "file",
    });
  }

  async createInvoiceMedia(media: { invoiceId: string; filePath: string; fileType: string; fileName?: string }): Promise<void> {
    await db.insert(invoiceMedia).values({
      invoiceId: media.invoiceId,
      filePath: media.filePath,
      fileType: media.fileType as any,
      fileName: media.fileName || "file",
    });
  }

  async getQuoteMedia(quoteId: string): Promise<(typeof quoteMedia.$inferSelect)[]> {
    return await db.select().from(quoteMedia).where(eq(quoteMedia.quoteId, quoteId));
  }

  async getInvoiceMedia(invoiceId: string): Promise<(typeof invoiceMedia.$inferSelect)[]> {
    return await db.select().from(invoiceMedia).where(eq(invoiceMedia.invoiceId, invoiceId));
  }

  async getApplicationSettings(): Promise<ApplicationSettings | undefined> {
    const [settings] = await db.select().from(applicationSettings).limit(1);
    return settings;
  }

  async createOrUpdateApplicationSettings(settingsData: Partial<InsertApplicationSettings>): Promise<ApplicationSettings> {
    const existing = await this.getApplicationSettings();
    
    if (existing) {
      const [updated] = await db
        .update(applicationSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(applicationSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(applicationSettings)
        .values([settingsData as InsertApplicationSettings])
        .returning();
      return created;
    }
  }

  async getEngagements(clientId?: string): Promise<Engagement[]> {
    if (clientId) {
      return await db.select().from(engagements).where(eq(engagements.clientId, clientId)).orderBy(desc(engagements.createdAt));
    }
    return await db.select().from(engagements).orderBy(desc(engagements.createdAt));
  }

  async getEngagement(id: string): Promise<Engagement | undefined> {
    const [engagement] = await db.select().from(engagements).where(eq(engagements.id, id));
    return engagement;
  }

  async createEngagement(engagementData: InsertEngagement): Promise<Engagement> {
    const [engagement] = await db.insert(engagements).values([engagementData]).returning();
    return engagement;
  }

  async updateEngagement(id: string, engagementData: Partial<InsertEngagement>): Promise<Engagement> {
    const [engagement] = await db
      .update(engagements)
      .set({ ...engagementData, updatedAt: new Date() })
      .where(eq(engagements.id, id))
      .returning();
    return engagement;
  }

  async getEngagementSummary(clientId: string): Promise<{ 
    quotes: (Quote & { media: { id: string; fileType: string; filePath: string; fileName: string }[] })[]; 
    invoices: (Invoice & { media: { id: string; fileType: string; filePath: string; fileName: string }[] })[]; 
    reservations: Reservation[] 
  }> {
    const [quotesList, invoicesList, reservationsList] = await Promise.all([
      db.select().from(quotes).where(eq(quotes.clientId, clientId)).orderBy(desc(quotes.createdAt)),
      db.select().from(invoices).where(eq(invoices.clientId, clientId)).orderBy(desc(invoices.createdAt)),
      db.select().from(reservations).where(eq(reservations.clientId, clientId)).orderBy(desc(reservations.createdAt)),
    ]);
    
    // Fetch all media for these quotes and invoices in a single query
    const quoteIds = quotesList.map(q => q.id);
    const invoiceIds = invoicesList.map(i => i.id);
    
    const [allQuoteMedia, allInvoiceMedia] = await Promise.all([
      quoteIds.length > 0 ? db.select().from(quoteMedia).where(inArray(quoteMedia.quoteId, quoteIds)) : Promise.resolve([]),
      invoiceIds.length > 0 ? db.select().from(invoiceMedia).where(inArray(invoiceMedia.invoiceId, invoiceIds)) : Promise.resolve([]),
    ]);
    
    const quotesWithMedia = quotesList.map(quote => ({
      ...quote,
      media: allQuoteMedia
        .filter(m => m.quoteId === quote.id)
        .map(m => ({
          id: m.id,
          fileType: m.fileType,
          filePath: m.filePath,
          fileName: m.fileName,
        })),
    }));
    
    const invoicesWithMedia = invoicesList.map(invoice => ({
      ...invoice,
      media: allInvoiceMedia
        .filter(m => m.invoiceId === invoice.id)
        .map(m => ({
          id: m.id,
          fileType: m.fileType,
          filePath: m.filePath,
          fileName: m.fileName,
        })),
    }));
    
    return { quotes: quotesWithMedia, invoices: invoicesWithMedia, reservations: reservationsList };
  }

  async createWorkflow(workflowData: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values([workflowData]).returning();
    return workflow;
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async getWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows).orderBy(desc(workflows.createdAt));
  }

  async getWorkflowByServiceId(serviceId: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.serviceId, serviceId));
    return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow> {
    const [workflow] = await db
      .update(workflows)
      .set({ ...workflowData, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  async createWorkflowStep(stepData: InsertWorkflowStep): Promise<WorkflowStep> {
    const [step] = await db.insert(workflowSteps).values([stepData]).returning();
    return step;
  }

  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await db.select().from(workflowSteps).where(eq(workflowSteps.workflowId, workflowId)).orderBy(workflowSteps.stepNumber);
  }

  async updateWorkflowStep(id: string, stepData: Partial<InsertWorkflowStep>): Promise<WorkflowStep> {
    const [step] = await db
      .update(workflowSteps)
      .set({ ...stepData, updatedAt: new Date() })
      .where(eq(workflowSteps.id, id))
      .returning();
    return step;
  }

  async deleteWorkflowStep(id: string): Promise<void> {
    await db.delete(workflowSteps).where(eq(workflowSteps.id, id));
  }

  async assignWorkflowToService(serviceWorkflowData: InsertServiceWorkflow): Promise<ServiceWorkflow> {
    const [sw] = await db.insert(serviceWorkflows).values([serviceWorkflowData]).returning();
    return sw;
  }

  async getServiceWorkflows(serviceId: string): Promise<Workflow[]> {
    const serviceWorkflowsList = await db.select().from(serviceWorkflows).where(eq(serviceWorkflows.serviceId, serviceId));
    const workflowIds = serviceWorkflowsList.map(sw => sw.workflowId);
    if (workflowIds.length === 0) return [];
    return await db.select().from(workflows).where(inArray(workflows.id, workflowIds));
  }

  async deleteServiceWorkflow(serviceId: string, workflowId: string): Promise<void> {
    await db.delete(serviceWorkflows).where(
      and(eq(serviceWorkflows.serviceId, serviceId), eq(serviceWorkflows.workflowId, workflowId))
    );
  }

  async createWorkshopTask(taskData: InsertWorkshopTask): Promise<WorkshopTask> {
    const [task] = await db.insert(workshopTasks).values([taskData]).returning();
    return task;
  }

  async updateWorkshopTask(id: string, taskData: Partial<InsertWorkshopTask>): Promise<WorkshopTask> {
    const [task] = await db
      .update(workshopTasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(workshopTasks.id, id))
      .returning();
    return task;
  }

  async getReservationTasks(reservationId: string): Promise<(WorkshopTask & { step: WorkflowStep })[]> {
    const tasks = await db.select().from(workshopTasks).where(eq(workshopTasks.reservationId, reservationId));
    
    return Promise.all(tasks.map(async (task) => {
      const [step] = await db.select().from(workflowSteps).where(eq(workflowSteps.id, task.workflowStepId));
      return { ...task, step: step! };
    }));
  }

  async initializeReservationWorkflow(reservationId: string, workflowSteps: WorkflowStep[]): Promise<void> {
    for (const step of workflowSteps) {
      await this.createWorkshopTask({
        reservationId,
        workflowStepId: step.id,
        isCompleted: false,
      });
    }
  }

  // Audit Log methods
  async createAuditLog(logData: InsertAuditLog, changes?: { field: string; previousValue: any; newValue: any }[]): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values([logData]).returning();
    
    if (changes && changes.length > 0) {
      await db.insert(auditLogChanges).values(
        changes.map(change => ({
          auditLogId: auditLog.id,
          field: change.field,
          previousValue: change.previousValue,
          newValue: change.newValue,
        }))
      );
    }
    
    return auditLog;
  }

  async getAuditLogs(filters?: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: (AuditLog & { actor?: User; changes: AuditLogChange[] })[]; total: number }> {
    const conditions = [];
    
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType as any));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }
    if (filters?.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action as any));
    }
    if (filters?.startDate) {
      conditions.push(sql`${auditLogs.occurredAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.occurredAt} <= ${filters.endDate}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count
    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);
    
    // Get paginated logs
    let query = db.select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.occurredAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    const logs = await query;
    
    // Fetch actor and changes for each log
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      let actor: User | undefined;
      if (log.actorId) {
        const [foundActor] = await db.select().from(users).where(eq(users.id, log.actorId));
        actor = foundActor;
      }
      
      const changes = await db.select().from(auditLogChanges).where(eq(auditLogChanges.auditLogId, log.id));
      
      return { ...log, actor, changes };
    }));
    
    return { logs: enrichedLogs, total: Number(count) };
  }

  async getAuditLog(id: string): Promise<(AuditLog & { actor?: User; changes: AuditLogChange[] }) | undefined> {
    const [log] = await db.select().from(auditLogs).where(eq(auditLogs.id, id));
    if (!log) return undefined;
    
    let actor: User | undefined;
    if (log.actorId) {
      const [foundActor] = await db.select().from(users).where(eq(users.id, log.actorId));
      actor = foundActor;
    }
    
    const changes = await db.select().from(auditLogChanges).where(eq(auditLogChanges.auditLogId, log.id));
    
    return { ...log, actor, changes };
  }

  async getEntityAuditHistory(entityType: string, entityId: string): Promise<(AuditLog & { actor?: User; changes: AuditLogChange[] })[]> {
    const logs = await db.select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType as any), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.occurredAt));
    
    return Promise.all(logs.map(async (log) => {
      let actor: User | undefined;
      if (log.actorId) {
        const [foundActor] = await db.select().from(users).where(eq(users.id, log.actorId));
        actor = foundActor;
      }
      
      const changes = await db.select().from(auditLogChanges).where(eq(auditLogChanges.auditLogId, log.id));
      
      return { ...log, actor, changes };
    }));
  }

  // Password reset tokens
  async createPasswordResetToken(data: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  // Chat methods
  async createChatConversation(data: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db.insert(chatConversations).values(data).returning();
    return conversation;
  }

  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    const [conversation] = await db.select().from(chatConversations).where(eq(chatConversations.id, id));
    return conversation;
  }

  async getChatConversations(userId: string): Promise<(ChatConversation & { participants: (ChatParticipant & { user: User })[], unreadCount: number, lastMessage?: ChatMessage & { sender: User; attachmentCount: number } })[]> {
    const participantRecords = await db.select().from(chatParticipants).where(eq(chatParticipants.userId, userId));
    const conversationIds = participantRecords.map(p => p.conversationId);
    
    if (conversationIds.length === 0) return [];
    
    const conversations = await db.select()
      .from(chatConversations)
      .where(inArray(chatConversations.id, conversationIds))
      .orderBy(desc(chatConversations.lastMessageAt));
    
    return Promise.all(conversations.map(async (conv) => {
      const participants = await this.getChatParticipants(conv.id);
      
      const userParticipant = participantRecords.find(p => p.conversationId === conv.id);
      const lastReadAt = userParticipant?.lastReadAt;
      
      let unreadCount = 0;
      if (lastReadAt) {
        const unreadMessages = await db.select({ count: sql<number>`count(*)` })
          .from(chatMessages)
          .where(and(
            eq(chatMessages.conversationId, conv.id),
            sql`${chatMessages.createdAt} > ${lastReadAt}`
          ));
        unreadCount = Number(unreadMessages[0]?.count || 0);
      } else {
        const allMessages = await db.select({ count: sql<number>`count(*)` })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, conv.id));
        unreadCount = Number(allMessages[0]?.count || 0);
      }
      
      const [lastMessageRow] = await db.select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conv.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);
      
      let lastMessage: (ChatMessage & { sender: User; attachmentCount: number }) | undefined;
      if (lastMessageRow) {
        const [sender] = await db.select().from(users).where(eq(users.id, lastMessageRow.senderId));
        if (sender) {
          const attachments = await db.select({ count: sql<number>`count(*)` })
            .from(chatAttachments)
            .where(eq(chatAttachments.messageId, lastMessageRow.id));
          const attachmentCount = Number(attachments[0]?.count || 0);
          lastMessage = { ...lastMessageRow, sender, attachmentCount };
        }
      }
      
      return { ...conv, participants, unreadCount, lastMessage };
    }));
  }

  async updateChatConversation(id: string, data: Partial<InsertChatConversation>): Promise<ChatConversation> {
    const [conversation] = await db.update(chatConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return conversation;
  }

  async deleteChatConversation(id: string): Promise<void> {
    await db.delete(chatConversations).where(eq(chatConversations.id, id));
  }

  async addChatParticipant(data: InsertChatParticipant): Promise<ChatParticipant> {
    const [participant] = await db.insert(chatParticipants).values(data).returning();
    return participant;
  }

  async removeChatParticipant(conversationId: string, odUserId: string): Promise<void> {
    await db.delete(chatParticipants).where(
      and(eq(chatParticipants.conversationId, conversationId), eq(chatParticipants.userId, odUserId))
    );
  }

  async getChatParticipants(conversationId: string): Promise<(ChatParticipant & { user: User })[]> {
    const participants = await db.select().from(chatParticipants).where(eq(chatParticipants.conversationId, conversationId));
    return Promise.all(participants.map(async (p) => {
      const [user] = await db.select().from(users).where(eq(users.id, p.userId));
      return { ...p, user };
    }));
  }

  async updateLastRead(conversationId: string, userId: string): Promise<void> {
    await db.update(chatParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(eq(chatParticipants.conversationId, conversationId), eq(chatParticipants.userId, userId)));
  }

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    await db.update(chatConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatConversations.id, data.conversationId));
    return message;
  }

  async getChatMessages(conversationId: string, limit = 50, offset = 0): Promise<(ChatMessage & { sender: User, attachments: ChatAttachment[] })[]> {
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    return Promise.all(messages.reverse().map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      const attachments = await db.select().from(chatAttachments).where(eq(chatAttachments.messageId, msg.id));
      return { ...msg, sender, attachments };
    }));
  }

  async updateChatMessage(id: string, content: string): Promise<ChatMessage> {
    const [message] = await db.update(chatMessages)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(eq(chatMessages.id, id))
      .returning();
    return message;
  }

  async deleteChatMessage(id: string): Promise<void> {
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
  }

  async createChatAttachment(data: InsertChatAttachment): Promise<ChatAttachment> {
    const [attachment] = await db.insert(chatAttachments).values(data).returning();
    return attachment;
  }

  async getChatAttachments(messageId: string): Promise<ChatAttachment[]> {
    return await db.select().from(chatAttachments).where(eq(chatAttachments.messageId, messageId));
  }
}

export const storage = new DatabaseStorage();
