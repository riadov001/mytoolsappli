// Local authentication with email/password
import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./localAuth";
import { insertServiceSchema, insertQuoteSchema, insertInvoiceSchema, insertReservationSchema, type User, type InsertAuditLog } from "@shared/schema";
import { sendEmail, generateVoiceDictationEmailHtml } from "./emailService";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";
import { registerObjectStorageRoutes, ObjectStorageService as NewObjectStorageService } from "./replit_integrations/object_storage";

// Global object storage service instance for media attachments
const objectStorageService = new ObjectStorageService();

// WebSocket clients map
const wsClients = new Map<string, WebSocket>();

// Utility function to sanitize user objects (remove password)
function sanitizeUser<T extends User>(user: T): Omit<T, 'password'> {
  const { password, ...sanitized } = user;
  return sanitized;
}

function sanitizeUsers<T extends User>(users: T[]): Omit<T, 'password'>[] {
  return users.map(sanitizeUser);
}

// Audit logging helper
type EntityType = "quote" | "invoice" | "reservation" | "service" | "workflow" | "workflow_step" | "user" | "workshop_task";
type ActionType = "created" | "updated" | "deleted" | "validated" | "rejected" | "completed" | "cancelled" | "paid" | "confirmed";

interface AuditContext {
  req: Request & { user?: User };
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  summary: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  metadata?: Record<string, any>;
}

async function logAuditEvent(ctx: AuditContext): Promise<void> {
  try {
    const user = ctx.req.user;
    
    // Compute field-level changes
    const changes: { field: string; previousValue: any; newValue: any }[] = [];
    if (ctx.previousData && ctx.newData) {
      const allKeys = Array.from(new Set([...Object.keys(ctx.previousData), ...Object.keys(ctx.newData)]));
      for (const key of allKeys) {
        const prev = ctx.previousData[key];
        const curr = ctx.newData[key];
        if (JSON.stringify(prev) !== JSON.stringify(curr)) {
          changes.push({ field: key, previousValue: prev, newValue: curr });
        }
      }
    }
    
    const logData: InsertAuditLog = {
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      action: ctx.action,
      actorId: user?.id ?? null,
      actorRole: user?.role as any ?? null,
      actorName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : null,
      summary: ctx.summary,
      metadata: ctx.metadata ?? null,
      ipAddress: ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? null,
      userAgent: ctx.req.headers['user-agent'] ?? null,
    };
    
    await storage.createAuditLog(logData, changes);
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}

// Helper to get action labels in French
const actionLabels: Record<ActionType, string> = {
  created: "créé",
  updated: "modifié",
  deleted: "supprimé",
  validated: "validé",
  rejected: "refusé",
  completed: "terminé",
  cancelled: "annulé",
  paid: "payé",
  confirmed: "confirmé",
};

const entityLabels: Record<EntityType, string> = {
  quote: "Devis",
  invoice: "Facture",
  reservation: "Réservation",
  service: "Service",
  workflow: "Workflow",
  workflow_step: "Étape de workflow",
  user: "Utilisateur",
  workshop_task: "Tâche atelier",
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Register object storage routes for persistent file uploads
  registerObjectStorageRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Sanitize user object - remove password before sending to client
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Forgot password - Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "L'email est requis" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      // Always return success message to prevent email enumeration
      if (!user) {
        return res.json({ 
          message: "Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation." 
        });
      }
      
      // Generate a secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Save the token
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
      });
      
      // Get the base URL for the reset link
      const baseUrl = process.env.REPLIT_DEPLOYMENT_URL 
        ? `https://${process.env.REPLIT_DEPLOYMENT_URL}`
        : process.env.REPL_SLUG && process.env.REPL_OWNER
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
          : 'http://localhost:5000';
      
      const resetUrl = `${baseUrl}/reset-password/${token}`;
      
      // Send email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Réinitialisation de mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MY JANTES</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #dc2626; margin-top: 0;">Réinitialisation de mot de passe</h2>
            
            <p>Bonjour ${user.firstName || user.email},</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 1 heure.</p>
            
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
            
            <p>Cordialement,<br><strong>L'équipe MY JANTES</strong></p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>Ce message a été envoyé automatiquement depuis MY JANTES.</p>
          </div>
        </body>
        </html>
      `;
      
      const emailResult = await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe - MY JANTES",
        html: emailHtml,
        text: `Bonjour, cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetUrl}. Ce lien est valable 1 heure.`,
      });
      
      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
      }
      
      res.json({ 
        message: "Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation." 
      });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      res.status(500).json({ message: "Une erreur est survenue. Veuillez réessayer." });
    }
  });

  // Verify reset token
  app.get('/api/auth/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ valid: false, message: "Lien invalide ou expiré" });
      }
      
      if (resetToken.used) {
        return res.status(400).json({ valid: false, message: "Ce lien a déjà été utilisé" });
      }
      
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ valid: false, message: "Ce lien a expiré" });
      }
      
      res.json({ valid: true });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ valid: false, message: "Une erreur est survenue" });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token et mot de passe requis" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Lien invalide ou expiré" });
      }
      
      if (resetToken.used) {
        return res.status(400).json({ message: "Ce lien a déjà été utilisé" });
      }
      
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Ce lien a expiré" });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user's password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);
      
      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Une erreur est survenue. Veuillez réessayer." });
    }
  });

  // Service routes (public read, admin write)
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/admin/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/admin/services", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      
      // Automatically create a workflow for the service
      const workflow = await storage.createWorkflow({
        name: `Workflow - ${service.name}`,
        description: `Workflow pour le service ${service.name}`,
        serviceId: service.id,
      });
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "service",
        entityId: service.id,
        action: "created",
        summary: `${entityLabels.service} "${service.name}" ${actionLabels.created} avec workflow associé`,
        newData: service,
        metadata: { workflowId: workflow.id },
      });
      
      res.json(service);
    } catch (error: any) {
      console.error("Error creating service:", error);
      res.status(400).json({ message: error.message || "Failed to create service" });
    }
  });

  app.patch("/api/admin/services/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const previousService = await storage.getService(id);
      const service = await storage.updateService(id, req.body);
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "service",
        entityId: service.id,
        action: "updated",
        summary: `${entityLabels.service} "${service.name}" ${actionLabels.updated}`,
        previousData: previousService,
        newData: service,
      });
      
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const previousService = await storage.getService(id);
      await storage.deleteService(id);
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "service",
        entityId: id,
        action: "deleted",
        summary: `${entityLabels.service} "${previousService?.name || id}" ${actionLabels.deleted}`,
        previousData: previousService,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Quote routes
  app.get("/api/quotes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const quotes = await storage.getQuotes(userId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { mediaFiles, ...quoteData } = req.body;
      
      // Validate minimum 3 images requirement
      if (!mediaFiles || !Array.isArray(mediaFiles)) {
        return res.status(400).json({ message: "Les photos sont requises" });
      }
      
      const imageCount = mediaFiles.filter((f: any) => f.type.startsWith('image/')).length;
      if (imageCount < 3) {
        return res.status(400).json({ 
          message: `Au moins 3 photos sont requises (${imageCount}/3 fournis)` 
        });
      }
      
      // Generate reference: DEV-MM-00001
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allQuotes = await storage.getQuotes();
      const count = allQuotes.filter(q => {
        const qDate = new Date(q.createdAt || '');
        return qDate >= startOfMonth;
      }).length + 1;
      const reference = `DEV-${mm}-${String(count).padStart(5, '0')}`;
      
      const validatedData = insertQuoteSchema.parse({
        ...quoteData,
        reference,
        clientId: userId,
        status: "pending",
      });
      const quote = await storage.createQuote(validatedData);
      
      // Create media entries
      for (const file of mediaFiles) {
        await storage.createQuoteMedia({
          quoteId: quote.id,
          filePath: file.key,
          fileType: file.type.startsWith('image/') ? 'image' : 'video',
          fileName: file.name,
        });
      }
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "quote",
        entityId: quote.id,
        action: "created",
        summary: `${entityLabels.quote} ${actionLabels.created} par le client`,
        newData: quote,
      });
      
      res.json(quote);
    } catch (error: any) {
      console.error("Error creating quote:", error);
      res.status(400).json({ message: error.message || "Failed to create quote" });
    }
  });

  app.get("/api/admin/quotes", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/admin/quotes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post("/api/admin/quotes", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { mediaFiles, wheelCount, diameter, priceExcludingTax, taxRate, taxAmount, productDetails, quoteAmount, services, ...quoteData } = req.body;
      
      // Validate minimum 6 images requirement
      if (!mediaFiles || !Array.isArray(mediaFiles)) {
        return res.status(400).json({ message: "Media files are required" });
      }
      
      const imageCount = mediaFiles.filter((f: any) => f.type.startsWith('image/')).length;
      if (imageCount < 3) {
        return res.status(400).json({ 
          message: `Au moins 3 images sont requises (${imageCount}/3 fournis)` 
        });
      }

      // Generate reference: DEV-MM-00001
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allQuotes = await storage.getQuotes();
      const count = allQuotes.filter(q => {
        const qDate = new Date(q.createdAt || '');
        return qDate >= startOfMonth;
      }).length + 1;
      const reference = `DEV-${mm}-${String(count).padStart(5, '0')}`;
      
      const validatedData = insertQuoteSchema.parse({
        ...quoteData,
        reference,
        wheelCount: wheelCount ? parseInt(wheelCount) : null,
        diameter,
        priceExcludingTax,
        taxRate,
        taxAmount,
        productDetails,
        quoteAmount,
        status: "pending",
      });
      const quote = await storage.createQuote(validatedData);
      
      // Create media entries
      for (const file of mediaFiles) {
        await storage.createQuoteMedia({
          quoteId: quote.id,
          filePath: file.key,
          fileType: file.type.startsWith('image/') ? 'image' : 'video',
          fileName: file.name,
        });
      }
      
      // Create quote items if services array is provided
      if (services && Array.isArray(services) && services.length > 0) {
        for (const service of services) {
          const quantity = parseFloat(service.quantity || 1);
          const unitPrice = parseFloat(service.unitPrice || 0);
          const totalHT = quantity * unitPrice;
          const taxRateDecimal = parseFloat(taxRate || 0);
          const taxAmountItem = (totalHT * taxRateDecimal) / 100;
          const totalTTC = totalHT + taxAmountItem;
          
          await storage.createQuoteItem({
            quoteId: quote.id,
            description: service.serviceName,
            quantity: quantity.toString(),
            unitPriceExcludingTax: unitPrice.toString(),
            totalExcludingTax: totalHT.toString(),
            taxRate: taxRateDecimal.toString(),
            taxAmount: taxAmountItem.toString(),
            totalIncludingTax: totalTTC.toString(),
          });
        }
      }
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "quote",
        entityId: quote.id,
        action: "created",
        summary: `${entityLabels.quote} ${actionLabels.created} par l'administrateur`,
        newData: quote,
        metadata: { clientId: quote.clientId, servicesCount: services?.length || 0 },
      });
      
      // Create notification for client
      await storage.createNotification({
        userId: quote.clientId,
        type: "quote",
        title: "Nouveau devis",
        message: `Un devis a été créé pour vous`,
        relatedId: quote.id,
      });

      // Send WebSocket notification
      const client = wsClients.get(quote.clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "quote_updated",
          quoteId: quote.id,
          status: quote.status,
        }));
      }
      
      res.json(quote);
    } catch (error: any) {
      console.error("Error creating quote:", error);
      res.status(400).json({ message: error.message || "Failed to create quote" });
    }
  });

  app.patch("/api/admin/quotes/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const previousQuote = await storage.getQuote(id);
      const quote = await storage.updateQuote(id, req.body);
      
      // Determine the action based on status change
      let action: ActionType = "updated";
      if (req.body.status) {
        if (req.body.status === "approved") action = "validated";
        else if (req.body.status === "rejected") action = "rejected";
        else if (req.body.status === "completed") action = "completed";
        else if (req.body.status === "cancelled") action = "cancelled";
      }
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "quote",
        entityId: quote.id,
        action,
        summary: `${entityLabels.quote} ${actionLabels[action]}`,
        previousData: previousQuote,
        newData: quote,
      });
      
      // Create notification for client
      await storage.createNotification({
        userId: quote.clientId,
        type: "quote",
        title: "Devis mis à jour",
        message: `Votre devis a été ${actionLabels[action]}`,
        relatedId: quote.id,
      });

      // Send WebSocket notification
      const wsClient = wsClients.get(quote.clientId);
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
          type: "quote_updated",
          quoteId: quote.id,
          status: quote.status,
        }));
      }
      
      // Automatic email disabled - use manual sending via "Envoyer par email" button
      // if (req.body.status === "approved" && previousQuote?.status !== "approved") { ... }
      
      res.json(quote);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  // Send quote by email
  app.post("/api/admin/quotes/:id/send-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { 
        customRecipient, 
        customSubject, 
        customMessage, 
        additionalRecipients = [], 
        sendCopy = false 
      } = req.body;
      
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }

      const client = await storage.getUser(quote.clientId);
      if (!client || !client.email) {
        return res.status(400).json({ message: "Email du client non disponible" });
      }

      const items = await storage.getQuoteItems(id);
      const settings = await storage.getApplicationSettings();
      const adminUser = req.user;

      const { sendEmail, generateQuoteEmailHtml } = await import("./emailService");
      
      const formatPrice = (value: string | number | null): string => {
        if (value === null || value === undefined) return "0,00 €";
        const num = typeof value === "string" ? parseFloat(value) : value;
        return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
      };

      // Generate HTML with custom message if provided
      let html: string;
      if (customMessage) {
        const companyName = settings?.companyName || "MyJantes";
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Devis ${quote.id.slice(0, 8).toUpperCase()}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="white-space: pre-line; margin-bottom: 20px;">${customMessage}</div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="font-size: 12px; color: #6b7280; text-align: center;">
                Cet email a été envoyé par ${companyName}
              </p>
            </div>
          </body>
          </html>
        `;
      } else {
        html = generateQuoteEmailHtml({
          clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email,
          quoteNumber: quote.id.slice(0, 8).toUpperCase(),
          quoteDate: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
          amount: formatPrice(quote.quoteAmount),
          companyName: settings?.companyName || "MyJantes",
          items: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity || "1"),
            unitPrice: formatPrice(item.unitPriceExcludingTax),
            total: formatPrice(item.totalIncludingTax),
          })),
        });
      }

      const { generateQuotePDF } = await import("./emailService");
      const pdfBuffer = generateQuotePDF({
        quoteNumber: quote.id.slice(0, 8).toUpperCase(),
        quoteDate: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"),
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email,
        status: quote.status,
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity || "1"),
          unitPrice: formatPrice(item.unitPriceExcludingTax),
          total: formatPrice(item.totalIncludingTax),
        })),
        amount: formatPrice(quote.quoteAmount),
        companyName: settings?.companyName || "MyJantes",
      });

      // Get quote photos
      const media = await storage.getQuoteMedia(id);
      const photoAttachments: { filename: string; content: Buffer }[] = [];
      const fs = await import('fs');
      for (const item of media) {
        if (item.fileType === 'image') {
          try {
            let data: Buffer | null = null;
            // Try local file first (for uploads saved to ./uploads/)
            const localPath = item.filePath.startsWith('/') ? `.${item.filePath}` : item.filePath;
            if (fs.existsSync(localPath)) {
              data = fs.readFileSync(localPath);
            } else {
              // Try object storage
              const result = await objectStorageService.getObject(item.filePath);
              data = result.data;
            }
            if (data) {
              photoAttachments.push({
                filename: item.fileName || `photo-${item.id.slice(0, 4)}.jpg`,
                content: data,
              });
            }
          } catch (err) {
            console.error("Error attaching photo to manual quote email:", err);
          }
        }
      }

      // Use custom recipient or fall back to client email
      const toEmail = customRecipient || client.email;
      const emailSubject = customSubject || `Votre devis MyJantes - ${quote.id.slice(0, 8).toUpperCase()}`;
      
      // Build CC list
      const ccList: string[] = [...additionalRecipients];
      if (sendCopy && adminUser?.email && !ccList.includes(adminUser.email)) {
        ccList.push(adminUser.email);
      }

      const result = await sendEmail({
        to: toEmail,
        cc: ccList.length > 0 ? ccList : undefined,
        subject: emailSubject,
        html,
        attachments: [
          {
            filename: `Devis-${quote.id.slice(0, 8).toUpperCase()}.pdf`,
            content: pdfBuffer,
          },
          ...photoAttachments
        ],
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Échec de l'envoi de l'email" });
      }

      // Log audit event
      await logAuditEvent({
        req,
        entityType: "quote",
        entityId: id,
        action: "updated",
        summary: `Devis envoyé par email à ${toEmail}${ccList.length > 0 ? ` (CC: ${ccList.join(", ")})` : ""}`,
        metadata: { emailTo: toEmail, cc: ccList, messageId: result.messageId },
      });

      res.json({ success: true, message: "Email envoyé avec succès" });
    } catch (error: any) {
      console.error("Error sending quote email:", error);
      res.status(500).json({ message: error.message || "Échec de l'envoi de l'email" });
    }
  });

  // Quote Items routes
  app.get("/api/admin/quotes/:id/items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getQuoteItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching quote items:", error);
      res.status(500).json({ message: "Failed to fetch quote items" });
    }
  });

  app.post("/api/admin/quotes/:id/items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertQuoteItemSchema } = await import("@shared/schema");
      const validatedData = insertQuoteItemSchema.parse({ ...req.body, quoteId: id });
      const item = await storage.createQuoteItem(validatedData);
      // Recalculate quote totals after creating item
      await storage.recalculateQuoteTotals(id);
      res.json(item);
    } catch (error: any) {
      console.error("Error creating quote item:", error);
      res.status(400).json({ message: error.message || "Failed to create quote item" });
    }
  });

  app.patch("/api/admin/quote-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateQuoteItem(id, req.body);
      // Recalculate quote totals after updating item
      await storage.recalculateQuoteTotals(item.quoteId);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating quote item:", error);
      res.status(400).json({ message: error.message || "Failed to update quote item" });
    }
  });

  app.delete("/api/admin/quote-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Get item first to know its quoteId for recalculation
      const itemToDelete = await storage.getQuoteItem(id);
      if (!itemToDelete) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      await storage.deleteQuoteItem(id);
      // Recalculate quote totals after deleting item
      await storage.recalculateQuoteTotals(itemToDelete.quoteId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting quote item:", error);
      res.status(400).json({ message: error.message || "Failed to delete quote item" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/admin/invoices", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/admin/invoices", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { mediaFiles, ...invoiceData } = req.body;
      
      // Validate minimum 6 images requirement
      if (!mediaFiles || !Array.isArray(mediaFiles)) {
        return res.status(400).json({ message: "Media files are required" });
      }
      
      const imageCount = mediaFiles.filter((f: any) => f.type.startsWith('image/')).length;
      if (imageCount < 3) {
        return res.status(400).json({ 
          message: `Au moins 3 images sont requises (${imageCount}/3 fournis)` 
        });
      }
      
      // Generate invoice number: FACT-DD-MM-XXX
      const nowInvoiceNew = new Date();
      const ddInvoiceNew = String(nowInvoiceNew.getDate()).padStart(2, '0');
      const mmInvoiceNew = String(nowInvoiceNew.getMonth() + 1).padStart(2, '0');
      const startOfDayInvoiceNew = new Date(nowInvoiceNew.getFullYear(), nowInvoiceNew.getMonth(), nowInvoiceNew.getDate());
      const allInvoicesInvoiceNew = await storage.getInvoices();
      const countInvoiceNew = allInvoicesInvoiceNew.filter(i => {
        const iDate = new Date(i.createdAt || '');
        return iDate >= startOfDayInvoiceNew;
      }).length + 1;
      const invoiceNumberVal = `FACT-${ddInvoiceNew}-${mmInvoiceNew}-${String(countInvoiceNew).padStart(3, '0')}`;
      
      const validatedData = insertInvoiceSchema.parse(invoiceData);
      
      // Check if this is a quote-based invoice or direct invoice
      let quote = null;
      let paymentType = validatedData.paymentMethod;
      let wheelCount = validatedData.wheelCount || null;
      let diameter = validatedData.diameter || null;
      let priceExcludingTax = validatedData.priceExcludingTax || "0";
      let taxRate = validatedData.taxRate || 20;
      let taxAmount = validatedData.taxAmount || "0";
      let productDetails = validatedData.productDetails || null;
      
      if (validatedData.quoteId) {
        // Get quote to copy details
        quote = await storage.getQuote(validatedData.quoteId);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        // Copy quote details (paymentMethod comes from validatedData, not quote)
        wheelCount = quote.wheelCount;
        diameter = quote.diameter;
        priceExcludingTax = quote.priceExcludingTax ?? "0";
        taxRate = quote.taxRate ?? 20;
        taxAmount = quote.taxAmount ?? "0";
        productDetails = quote.productDetails;
      }
      
      // Atomically get next invoice number (handles initialization and increment)
      const counter = await storage.incrementInvoiceCounter(paymentType);
      
      // Create invoice with generated number
      const invoice = await storage.createInvoice({
        quoteId: validatedData.quoteId || null,
        clientId: validatedData.clientId,
        paymentMethod: paymentType,
        amount: validatedData.amount,
        status: validatedData.status || "pending",
        notes: validatedData.notes,
        dueDate: validatedData.dueDate,
        invoiceNumber: invoiceNumberVal,
        wheelCount,
        diameter,
        priceExcludingTax,
        taxRate,
        taxAmount,
        productDetails,
      } as any);
      
      // Copy quote items to invoice if creating from quote
      if (validatedData.quoteId && quote) {
        const quoteItems = await storage.getQuoteItems(validatedData.quoteId);
        for (const quoteItem of quoteItems) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            description: quoteItem.description,
            quantity: quoteItem.quantity,
            unitPriceExcludingTax: quoteItem.unitPriceExcludingTax,
            taxRate: quoteItem.taxRate,
            taxAmount: quoteItem.taxAmount,
            totalExcludingTax: quoteItem.totalExcludingTax,
            totalIncludingTax: quoteItem.totalIncludingTax,
          });
        }
      }
      
      // Create media entries
      for (const file of mediaFiles) {
        await storage.createInvoiceMedia({
          invoiceId: invoice.id,
          filePath: file.key,
          fileType: file.type.startsWith('image/') ? 'image' : 'video',
          fileName: file.name,
        });
      }

      // Create notification for client
      await storage.createNotification({
        userId: invoice.clientId,
        type: "invoice",
        title: "New Invoice",
        message: `A new invoice has been generated`,
        relatedId: invoice.id,
      });

      // Send WebSocket notification
      const wsClient = wsClients.get(invoice.clientId);
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
          type: "invoice_created",
          invoiceId: invoice.id,
        }));
      }
      
      // Send automatic email for new invoice (pending)
      try {
        const clientUser = await storage.getUser(invoice.clientId);
        if (clientUser?.email) {
          const items = await storage.getInvoiceItems(invoice.id);
          const settings = await storage.getApplicationSettings();
          const { sendEmail, generateInvoiceEmailHtml } = await import("./emailService");
          
          const formatPrice = (value: string | number | null): string => {
            if (value === null || value === undefined) return "0,00 €";
            const num = typeof value === "string" ? parseFloat(value) : value;
            return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
          };
          
          const invoiceCreatedAt = new Date();
          const dueDate = invoice.dueDate 
            ? new Date(invoice.dueDate).toLocaleDateString("fr-FR")
            : new Date(invoiceCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");
          
          const html = generateInvoiceEmailHtml({
            clientName: `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || clientUser.email,
            invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
            invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
            dueDate,
            amount: formatPrice(invoice.amount),
            companyName: settings?.companyName || "MyJantes",
            items: items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity || "1"),
              unitPrice: formatPrice(item.unitPriceExcludingTax),
              total: formatPrice(item.totalIncludingTax),
            })),
          });
          
          const { generateInvoicePDF } = await import("./emailService");
          const invoicePdfBuffer = generateInvoicePDF({
            invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
            invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
            dueDate,
            clientName: `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || clientUser.email,
            status: invoice.status,
            items: items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity || "1"),
              unitPrice: formatPrice(item.unitPriceExcludingTax),
              total: formatPrice(item.totalIncludingTax),
            })),
            amount: formatPrice(invoice.amount),
            companyName: settings?.companyName || "MyJantes",
          });
          
          // Get invoice photos
          const media = await storage.getInvoiceMedia(invoice.id);
          const photoAttachments: { filename: string; content: Buffer }[] = [];
          const fs = await import('fs');
          for (const item of media) {
            if (item.fileType === 'image') {
              try {
                let data: Buffer | null = null;
                // Try local file first (for uploads saved to ./uploads/)
                const localPath = item.filePath.startsWith('/') ? `.${item.filePath}` : item.filePath;
                if (fs.existsSync(localPath)) {
                  data = fs.readFileSync(localPath);
                } else {
                  // Try object storage
                  const result = await objectStorageService.getObject(item.filePath);
                  data = result.data;
                }
                if (data) {
                  photoAttachments.push({
                    filename: item.fileName || `photo-${item.id.slice(0, 4)}.jpg`,
                    content: data,
                  });
                }
              } catch (err) {
                console.error("Error attaching photo to auto invoice email:", err);
              }
            }
          }
          
          await sendEmail({
            to: clientUser.email,
            subject: `Nouvelle facture - ${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()} | MyJantes`,
            html,
            attachments: [
              {
                filename: `Facture-${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}.pdf`,
                content: invoicePdfBuffer,
              },
              ...photoAttachments
            ],
          });
          console.log(`Auto-email sent: Invoice created to ${clientUser.email}`);
        }
      } catch (emailError) {
        console.error("Error sending invoice created email:", emailError);
      }
      
      res.json(invoice);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to create invoice" });
    }
  });

  // Create invoice directly (without quote)
  app.post("/api/admin/invoices/direct", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { mediaFiles, invoiceItems, ...invoiceData } = req.body;
      
      // Validate minimum 3 images requirement
      if (!mediaFiles || !Array.isArray(mediaFiles)) {
        return res.status(400).json({ message: "Media files are required" });
      }
      
      const imageCount = mediaFiles.filter((f: any) => f.type.startsWith('image/')).length;
      if (imageCount < 3) {
        return res.status(400).json({ 
          message: `Au moins 3 images sont requises (${imageCount}/3 fournis)` 
        });
      }

      // Validate invoice items
      if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
        return res.status(400).json({ message: "Invoice items are required" });
      }
      
      // Generate invoice number: FACT-DD-MM-XXX
      const nowInvoiceDirect = new Date();
      const ddInvoiceDirect = String(nowInvoiceDirect.getDate()).padStart(2, '0');
      const mmInvoiceDirect = String(nowInvoiceDirect.getMonth() + 1).padStart(2, '0');
      const startOfDayInvoiceDirect = new Date(nowInvoiceDirect.getFullYear(), nowInvoiceDirect.getMonth(), nowInvoiceDirect.getDate());
      const allInvoicesInvoiceDirect = await storage.getInvoices();
      const countInvoiceDirect = allInvoicesInvoiceDirect.filter(i => {
        const iDate = new Date(i.createdAt || '');
        return iDate >= startOfDayInvoiceDirect;
      }).length + 1;
      const invoiceNumberGenerated = `FACT-${ddInvoiceDirect}-${mmInvoiceDirect}-${String(countInvoiceDirect).padStart(3, '0')}`;
      
      const validatedData = insertInvoiceSchema.parse(invoiceData);
      
      // Check if this is a quote-based invoice or direct invoice
      let quote = null;
      let paymentType = validatedData.paymentMethod;
      const counter = await storage.incrementInvoiceCounter(paymentType);
      
      // Create invoice with generated number
      const invoice = await storage.createInvoice({
        clientId: validatedData.clientId,
        paymentMethod: validatedData.paymentMethod,
        amount: validatedData.amount,
        status: validatedData.status || "pending",
        notes: validatedData.notes,
        dueDate: validatedData.dueDate,
        wheelCount: validatedData.wheelCount,
        diameter: validatedData.diameter,
        priceExcludingTax: validatedData.priceExcludingTax,
        taxRate: validatedData.taxRate,
        taxAmount: validatedData.taxAmount,
        productDetails: validatedData.productDetails,
        invoiceNumber: invoiceNumberGenerated,
      } as any);
      
      // Create invoice items
      for (const item of invoiceItems) {
        await storage.createInvoiceItem({
          ...item,
          invoiceId: invoice.id,
        });
      }
      
      // Create media entries
      for (const file of mediaFiles) {
        await storage.createInvoiceMedia({
          invoiceId: invoice.id,
          filePath: file.key,
          fileType: file.type.startsWith('image/') ? 'image' : 'video',
          fileName: file.name,
        });
      }

      // Create notification for client
      await storage.createNotification({
        userId: invoice.clientId,
        type: "invoice",
        title: "New Invoice",
        message: `A new invoice has been generated`,
        relatedId: invoice.id,
      });

      // Send WebSocket notification
      const wsClient = wsClients.get(invoice.clientId);
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
          type: "invoice_created",
          invoiceId: invoice.id,
        }));
      }
      
      // Send automatic email for new direct invoice (pending)
      try {
        const clientUser = await storage.getUser(invoice.clientId);
        if (clientUser?.email) {
          const items = await storage.getInvoiceItems(invoice.id);
          const settings = await storage.getApplicationSettings();
          const { sendEmail, generateInvoiceEmailHtml } = await import("./emailService");
          
          const formatPrice = (value: string | number | null): string => {
            if (value === null || value === undefined) return "0,00 €";
            const num = typeof value === "string" ? parseFloat(value) : value;
            return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
          };
          
          const invoiceCreatedAt = new Date();
          const dueDate = invoice.dueDate 
            ? new Date(invoice.dueDate).toLocaleDateString("fr-FR")
            : new Date(invoiceCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");
          
          const html = generateInvoiceEmailHtml({
            clientName: `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || clientUser.email,
            invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
            invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
            dueDate,
            amount: formatPrice(invoice.amount),
            companyName: settings?.companyName || "MyJantes",
            items: items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity || "1"),
              unitPrice: formatPrice(item.unitPriceExcludingTax),
              total: formatPrice(item.totalIncludingTax),
            })),
          });
          
          const { generateInvoicePDF: genInvPdf } = await import("./emailService");
          const directInvPdf = genInvPdf({
            invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
            invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
            dueDate,
            clientName: `${clientUser.firstName || ""} ${clientUser.lastName || ""}`.trim() || clientUser.email,
            items: items.map(item => ({
              description: item.description,
              quantity: parseFloat(item.quantity || "1"),
              unitPrice: formatPrice(item.unitPriceExcludingTax),
              total: formatPrice(item.totalIncludingTax),
            })),
            amount: formatPrice(invoice.amount),
            companyName: settings?.companyName || "MyJantes",
          });
          
          await sendEmail({
            to: clientUser.email,
            subject: `Nouvelle facture - ${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()} | MyJantes`,
            html,
            attachments: [{
              filename: `Facture-${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}.pdf`,
              content: directInvPdf,
            }],
          });
          console.log(`Auto-email sent: Direct invoice created to ${clientUser.email}`);
        }
      } catch (emailError) {
        console.error("Error sending direct invoice created email:", emailError);
      }
      
      res.json(invoice);
    } catch (error: any) {
      console.error("Error creating direct invoice:", error);
      res.status(400).json({ message: error.message || "Failed to create direct invoice" });
    }
  });

  // Get single invoice by ID
  app.get("/api/admin/invoices/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Update invoice
  app.patch("/api/admin/invoices/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      console.log("Update invoice request body:", JSON.stringify(req.body, null, 2));
      
      // Get the previous state for audit logging
      const previousInvoice = await storage.getInvoice(id);
      const updateData = { ...req.body };
      
      // Convert date strings to Date objects for all timestamp fields
      Object.keys(updateData).forEach(key => {
        const value = updateData[key];
        if (value && typeof value === 'string') {
          // Check if it looks like an ISO date string
          const dateRegex = /^\d{4}-\d{2}-\d{2}/;
          if (dateRegex.test(value)) {
            const parsedDate = new Date(value);
            if (!isNaN(parsedDate.getTime())) {
              updateData[key] = parsedDate;
            }
          }
        }
      });
      
      console.log("Update invoice processed data:", JSON.stringify(updateData, null, 2));
      const invoice = await storage.updateInvoice(id, updateData);
      
      // Determine action type based on status change
      let action: ActionType = "updated";
      let summary = "Facture mise à jour";
      if (updateData.status === "paid" && previousInvoice?.status !== "paid") {
        action = "paid";
        summary = "Facture marquée comme payée";
      } else if (updateData.status === "cancelled" && previousInvoice?.status !== "cancelled") {
        action = "cancelled";
        summary = "Facture annulée";
      }
      
      // Log audit event
      await logAuditEvent({
        req,
        entityType: "invoice",
        entityId: id,
        action,
        summary,
        previousData: previousInvoice,
        newData: invoice,
      });
      
      // Automatic email disabled - use manual sending via "Envoyer par email" button
      // if (updateData.status === "paid" && previousInvoice?.status !== "paid") { ... }
      
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice" });
    }
  });

  // Send invoice by email
  app.post("/api/admin/invoices/:id/send-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }

      const client = await storage.getUser(invoice.clientId);
      if (!client || !client.email) {
        return res.status(400).json({ message: "Email du client non disponible" });
      }

      const items = await storage.getInvoiceItems(id);
      const settings = await storage.getApplicationSettings();

      const { sendEmail, generateInvoiceEmailHtml } = await import("./emailService");
      
      const formatPrice = (value: string | number | null): string => {
        if (value === null || value === undefined) return "0,00 €";
        const num = typeof value === "string" ? parseFloat(value) : value;
        return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
      };

      const invoiceCreatedAt = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
      const dueDate = invoice.dueDate 
        ? new Date(invoice.dueDate).toLocaleDateString("fr-FR")
        : new Date(invoiceCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR");

      const html = generateInvoiceEmailHtml({
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email,
        invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
        invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
        dueDate,
        amount: formatPrice(invoice.amount),
        companyName: settings?.companyName || "MyJantes",
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity || "1"),
          unitPrice: formatPrice(item.unitPriceExcludingTax),
          total: formatPrice(item.totalIncludingTax),
        })),
      });

      const { generateInvoicePDF: genInvoicePdf } = await import("./emailService");
      const sendPdfBuffer = genInvoicePdf({
        invoiceNumber: invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase(),
        invoiceDate: invoiceCreatedAt.toLocaleDateString("fr-FR"),
        dueDate,
        clientName: `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.email,
        items: items.map(item => ({
          description: item.description,
          quantity: parseFloat(item.quantity || "1"),
          unitPrice: formatPrice(item.unitPriceExcludingTax),
          total: formatPrice(item.totalIncludingTax),
        })),
        amount: formatPrice(invoice.amount),
        companyName: settings?.companyName || "MyJantes",
      });

      // Get invoice photos
      const media = await storage.getInvoiceMedia(id);
      const photoAttachments: { filename: string; content: Buffer }[] = [];
      const fs = await import('fs');
      for (const item of media) {
        if (item.fileType === 'image') {
          try {
            let data: Buffer | null = null;
            // Try local file first (for uploads saved to ./uploads/)
            const localPath = item.filePath.startsWith('/') ? `.${item.filePath}` : item.filePath;
            if (fs.existsSync(localPath)) {
              data = fs.readFileSync(localPath);
            } else {
              // Try object storage
              const result = await objectStorageService.getObject(item.filePath);
              data = result.data;
            }
            if (data) {
              photoAttachments.push({
                filename: item.fileName || `photo-${item.id.slice(0, 4)}.jpg`,
                content: data,
              });
            }
          } catch (err) {
            console.error("Error attaching photo to manual invoice email:", err);
          }
        }
      }

      const result = await sendEmail({
        to: client.email,
        subject: `Votre facture MyJantes - ${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}`,
        html,
        attachments: [
          {
            filename: `Facture-${invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}.pdf`,
            content: sendPdfBuffer,
          },
          ...photoAttachments
        ],
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || "Échec de l'envoi de l'email" });
      }

      // Log audit event
      await logAuditEvent({
        req,
        entityType: "invoice",
        entityId: id,
        action: "updated",
        summary: `Facture envoyée par email à ${client.email}`,
        metadata: { emailTo: client.email, messageId: result.messageId },
      });

      res.json({ success: true, message: "Email envoyé avec succès" });
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: error.message || "Échec de l'envoi de l'email" });
    }
  });

  // Invoice Items routes
  app.get("/api/admin/invoices/:id/items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getInvoiceItems(id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/admin/invoices/:id/items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { insertInvoiceItemSchema } = await import("@shared/schema");
      const validatedData = insertInvoiceItemSchema.parse({ ...req.body, invoiceId: id });
      const item = await storage.createInvoiceItem(validatedData);
      // Recalculate invoice totals after creating item
      await storage.recalculateInvoiceTotals(id);
      res.json(item);
    } catch (error: any) {
      console.error("Error creating invoice item:", error);
      res.status(400).json({ message: error.message || "Failed to create invoice item" });
    }
  });

  app.patch("/api/admin/invoice-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateInvoiceItem(id, req.body);
      // Recalculate invoice totals after updating item
      await storage.recalculateInvoiceTotals(item.invoiceId);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating invoice item:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice item" });
    }
  });

  app.delete("/api/admin/invoice-items/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Get item first to know its invoiceId for recalculation
      const itemToDelete = await storage.getInvoiceItem(id);
      if (!itemToDelete) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      await storage.deleteInvoiceItem(id);
      // Recalculate invoice totals after deleting item
      await storage.recalculateInvoiceTotals(itemToDelete.invoiceId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting invoice item:", error);
      res.status(400).json({ message: error.message || "Failed to delete invoice item" });
    }
  });

  // Reservation routes
  app.get("/api/reservations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reservations = await storage.getReservations(userId);
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.get("/api/admin/reservations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Get additional services for a specific reservation
  app.get("/api/admin/reservations/:id/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const services = await storage.getReservationServices(id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching reservation services:", error);
      res.status(500).json({ message: "Failed to fetch reservation services" });
    }
  });

  app.post("/api/admin/reservations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { additionalServiceIds, ...reservationData } = req.body;
      const validatedData = insertReservationSchema.parse(reservationData);
      const reservation = await storage.createReservation(validatedData);

      // Add additional services if provided
      if (additionalServiceIds && Array.isArray(additionalServiceIds) && additionalServiceIds.length > 0) {
        await storage.setReservationServices(reservation.id, additionalServiceIds);
      }

      // Initialize workflow tasks for this reservation if service has workflows
      try {
        const serviceWorkflows = await storage.getServiceWorkflows(reservation.serviceId);
        for (const workflow of serviceWorkflows) {
          const workflowSteps = await storage.getWorkflowSteps(workflow.id);
          await storage.initializeReservationWorkflow(reservation.id, workflowSteps);
        }
      } catch (error) {
        console.log("No workflows for this service or error initializing tasks:", error);
      }

      // Create notification for client
      await storage.createNotification({
        userId: reservation.clientId,
        type: "reservation",
        title: "Reservation Confirmed",
        message: `Your reservation has been confirmed`,
        relatedId: reservation.id,
      });

      // Send WebSocket notification
      const client = wsClients.get(reservation.clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "reservation_confirmed",
          reservationId: reservation.id,
        }));
      }
      
      // Return reservation with additional services
      const additionalServices = await storage.getReservationServices(reservation.id);
      res.json({ ...reservation, additionalServices });
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      res.status(400).json({ message: error.message || "Failed to create reservation" });
    }
  });
  
  // Get additional services for a reservation
  app.get("/api/admin/reservations/:id/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const services = await storage.getReservationServices(id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching reservation services:", error);
      res.status(500).json({ message: "Failed to fetch reservation services" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // PDF Download routes for clients
  app.get("/api/quotes/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isUserAdmin = req.user.role === "admin";

      // Get the quote
      const quote = await storage.getQuote(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check authorization: user must own the quote or be an admin
      if (!isUserAdmin && quote.clientId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this quote" });
      }

      // Get related data
      const items = await storage.getQuoteItems(id);
      const client = await storage.getUser(quote.clientId);
      const service = await storage.getService(quote.serviceId);
      const settings = await storage.getApplicationSettings();

      // Return all data for client-side PDF generation
      res.json({ quote, items, client, service, settings });
    } catch (error: any) {
      console.error("Error fetching quote PDF data:", error);
      res.status(500).json({ message: error.message || "Failed to fetch quote PDF data" });
    }
  });

  app.get("/api/invoices/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isUserAdmin = req.user.role === "admin";

      // Get the invoice
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check authorization: user must own the invoice or be an admin
      if (!isUserAdmin && invoice.clientId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to this invoice" });
      }

      // Get related data
      const items = await storage.getInvoiceItems(id);
      const client = await storage.getUser(invoice.clientId);
      const quote = invoice.quoteId ? await storage.getQuote(invoice.quoteId) : null;
      const service = quote?.serviceId ? await storage.getService(quote.serviceId) : null;
      const settings = await storage.getApplicationSettings();

      // Return all data for client-side PDF generation
      res.json({ invoice, items, client, quote, service, settings });
    } catch (error: any) {
      console.error("Error fetching invoice PDF data:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invoice PDF data" });
    }
  });

  // Reservation CRUD routes for admin
  app.patch("/api/admin/reservations/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { additionalServiceIds, ...bodyData } = req.body;
      
      // Get previous state for audit logging
      const previousReservation = await storage.getReservation(id);
      
      const validatedData = insertReservationSchema.partial().parse(bodyData);
      const reservation = await storage.updateReservation(id, validatedData);
      
      // Update additional services if provided
      if (additionalServiceIds !== undefined && Array.isArray(additionalServiceIds)) {
        await storage.setReservationServices(id, additionalServiceIds);
      }

      // Determine action type based on status change
      let action: ActionType = "updated";
      let summary = "Réservation mise à jour";
      if (validatedData.status === "confirmed" && previousReservation?.status !== "confirmed") {
        action = "confirmed";
        summary = "Réservation confirmée";
      } else if (validatedData.status === "cancelled" && previousReservation?.status !== "cancelled") {
        action = "cancelled";
        summary = "Réservation annulée";
      } else if (validatedData.status === "completed" && previousReservation?.status !== "completed") {
        action = "completed";
        summary = "Réservation terminée";
      }

      // Log audit event
      await logAuditEvent({
        req,
        entityType: "reservation",
        entityId: id,
        action,
        summary,
        previousData: previousReservation,
        newData: reservation,
      });

      // Create notification for client if status changed
      if (validatedData.status) {
        await storage.createNotification({
          userId: reservation.clientId,
          type: "reservation",
          title: "Réservation mise à jour",
          message: `Votre réservation a été mise à jour - Statut: ${validatedData.status}`,
          relatedId: reservation.id,
        });

        // Send WebSocket notification
        const wsClient = wsClients.get(reservation.clientId);
        if (wsClient && wsClient.readyState === WebSocket.OPEN) {
          wsClient.send(JSON.stringify({
            type: "reservation_updated",
            reservationId: reservation.id,
            status: validatedData.status,
          }));
        }
      }
      
      // Automatic email disabled - use manual sending if needed
      // if (validatedData.status === "confirmed" && previousReservation?.status !== "confirmed") { ... }

      // Return reservation with additional services
      const additionalServices = await storage.getReservationServices(id);
      res.json({ ...reservation, additionalServices });
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      res.status(400).json({ message: error.message || "Failed to update reservation" });
    }
  });

  app.delete("/api/admin/reservations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      // Get reservation first to notify client
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Note: We'll need to add deleteReservation to storage interface
      // For now, we can update status to cancelled
      await storage.updateReservation(id, { status: "cancelled" });

      // Create notification for client
      await storage.createNotification({
        userId: reservation.clientId,
        type: "reservation",
        title: "Réservation annulée",
        message: "Votre réservation a été annulée",
        relatedId: reservation.id,
      });

      // Send WebSocket notification
      const client = wsClients.get(reservation.clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: "reservation_cancelled",
          reservationId: reservation.id,
        }));
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting reservation:", error);
      res.status(400).json({ message: error.message || "Failed to delete reservation" });
    }
  });

  // Admin users route
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Sanitize all users - remove passwords
      res.json(sanitizeUsers(users));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get single user by ID
  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      // Sanitize - remove password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      
      // Get target user to check their current role
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      const updateSchema = z.object({
        role: z.enum(["client", "client_professionnel", "employe", "admin"]).optional(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        companyName: z.string().optional(),
        siret: z.string().optional(),
        tvaNumber: z.string().optional(),
        companyAddress: z.string().optional(),
      });
      const validatedData = updateSchema.parse(req.body);
      
      // Employees cannot demote admin users
      if (currentUser.role === "employe" && targetUser.role === "admin") {
        if (validatedData.role && validatedData.role !== "admin") {
          return res.status(403).json({ 
            message: "Vous n'avez pas la permission de modifier le rôle d'un administrateur" 
          });
        }
      }
      
      // Employees cannot promote non-admins to admin
      if (currentUser.role === "employe" && validatedData.role === "admin" && targetUser.role !== "admin") {
        return res.status(403).json({ 
          message: "Vous n'avez pas la permission de promouvoir un utilisateur au rôle administrateur" 
        });
      }
      
      const user = await storage.updateUser(id, validatedData);
      res.json(sanitizeUser(user));
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  // Admin route to change user password
  app.patch("/api/admin/users/:id/password", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      const passwordSchema = z.object({
        newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
      });
      const { newPassword } = passwordSchema.parse(req.body);
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Employees cannot change admin passwords
      if (currentUser.role === "employe" && user.role === "admin") {
        return res.status(403).json({ 
          message: "Vous n'avez pas la permission de modifier le mot de passe d'un administrateur" 
        });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(id, { password: hashedPassword });
      
      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error: any) {
      console.error("Error changing user password:", error);
      res.status(400).json({ message: error.message || "Échec de la modification du mot de passe" });
    }
  });

  // User route to change own password
  app.patch("/api/user/password", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const passwordSchema = z.object({
        currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
        newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
      });
      const { currentPassword, newPassword } = passwordSchema.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Verify current password
      if (!user.password) {
        return res.status(400).json({ message: "Ce compte utilise une authentification externe" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { password: hashedPassword });
      
      res.json({ message: "Mot de passe modifié avec succès" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      res.status(400).json({ message: error.message || "Échec de la modification du mot de passe" });
    }
  });

  // Admin route to create a new client (professionnel or particulier) without password
  app.post("/api/admin/clients", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const createClientSchema = z.object({
        email: z.string().email(),
        firstName: z.string().min(1, "Le prénom est requis"),
        lastName: z.string().min(1, "Le nom est requis"),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        role: z.enum(["client", "client_professionnel"]),
        companyName: z.string().optional(),
        siret: z.string().optional(),
        tvaNumber: z.string().optional(),
        companyAddress: z.string().optional(),
      });

      const validatedData = createClientSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }

      // Generate a default password that can be changed later
      const { hashPassword } = await import("./localAuth");
      const defaultPassword = await hashPassword("123user");

      const userData: any = {
        email: validatedData.email,
        password: defaultPassword,
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        postalCode: validatedData.postalCode || null,
        city: validatedData.city || null,
        role: validatedData.role,
      };

      // Add company fields if professional client
      if (validatedData.role === "client_professionnel") {
        userData.companyName = validatedData.companyName || null;
        userData.siret = validatedData.siret || null;
        userData.tvaNumber = validatedData.tvaNumber || null;
        userData.companyAddress = validatedData.companyAddress || null;
      }

      const newClient = await storage.createUser(userData);

      res.json(sanitizeUser(newClient));
    } catch (error: any) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: error.message || "Échec de la création du client" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const createSchema = z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.enum(["client", "client_professionnel", "employe", "admin"]).optional(),
      });
      const validatedData = createSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(sanitizeUser(user));
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: error.message || "Failed to create user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user;
      
      // Check if target user is an admin
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Employees cannot delete admin users
      if (currentUser.role === "employe" && targetUser.role === "admin") {
        return res.status(403).json({ 
          message: "Vous n'avez pas la permission de supprimer un administrateur" 
        });
      }
      
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(400).json({ message: error.message || "Failed to delete user" });
    }
  });

  // Application Settings routes
  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      let settings = await storage.getApplicationSettings();
      
      // If no settings exist, create default settings
      if (!settings) {
        settings = await storage.createOrUpdateApplicationSettings({});
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching application settings:", error);
      res.status(500).json({ message: "Failed to fetch application settings" });
    }
  });

  app.patch("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.createOrUpdateApplicationSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating application settings:", error);
      res.status(400).json({ message: error.message || "Failed to update application settings" });
    }
  });

  // Engagement (Prestation) routes
  app.get("/api/admin/engagements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { clientId } = req.query;
      const engagements = await storage.getEngagements(clientId as string | undefined);
      res.json(engagements);
    } catch (error: any) {
      console.error("Error fetching engagements:", error);
      res.status(500).json({ message: "Failed to fetch engagements" });
    }
  });

  app.get("/api/admin/engagements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const engagement = await storage.getEngagement(req.params.id);
      if (!engagement) {
        return res.status(404).json({ message: "Engagement not found" });
      }
      res.json(engagement);
    } catch (error: any) {
      console.error("Error fetching engagement:", error);
      res.status(500).json({ message: "Failed to fetch engagement" });
    }
  });

  app.post("/api/admin/engagements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const engagement = await storage.createEngagement({
        clientId: req.body.clientId,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status || "active",
      });
      res.json(engagement);
    } catch (error: any) {
      console.error("Error creating engagement:", error);
      res.status(400).json({ message: error.message || "Failed to create engagement" });
    }
  });

  app.patch("/api/admin/engagements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const engagement = await storage.updateEngagement(req.params.id, req.body);
      res.json(engagement);
    } catch (error: any) {
      console.error("Error updating engagement:", error);
      res.status(400).json({ message: error.message || "Failed to update engagement" });
    }
  });

  app.delete("/api/admin/engagements/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.updateEngagement(req.params.id, { status: "cancelled" });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting engagement:", error);
      res.status(400).json({ message: error.message || "Failed to delete engagement" });
    }
  });

  app.get("/api/admin/engagements/summary/:clientId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const summary = await storage.getEngagementSummary(req.params.clientId);
      res.json(summary);
    } catch (error: any) {
      console.error("Error fetching engagement summary:", error);
      res.status(500).json({ message: "Failed to fetch engagement summary" });
    }
  });

  // Workflow routes
  app.get("/api/admin/workflows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error: any) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/admin/workflows/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error: any) {
      console.error("Error fetching workflow:", error);
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  // Get workflow by service ID (for employee view)
  app.get("/api/services/:serviceId/workflow", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflowByServiceId(req.params.serviceId);
      if (!workflow) {
        return res.status(404).json({ message: "No workflow found for this service" });
      }
      const steps = await storage.getWorkflowSteps(workflow.id);
      res.json({ ...workflow, steps });
    } catch (error: any) {
      console.error("Error fetching service workflow:", error);
      res.status(500).json({ message: "Failed to fetch service workflow" });
    }
  });

  // Get all services with their workflows (for employee/admin)
  app.get("/api/services-with-workflows", isAuthenticated, async (req, res) => {
    try {
      const allServices = await storage.getServices();
      const servicesWithWorkflows = await Promise.all(
        allServices.map(async (service) => {
          const workflow = await storage.getWorkflowByServiceId(service.id);
          let steps: any[] = [];
          if (workflow) {
            steps = await storage.getWorkflowSteps(workflow.id);
          }
          return { ...service, workflow: workflow ? { ...workflow, steps } : null };
        })
      );
      res.json(servicesWithWorkflows);
    } catch (error: any) {
      console.error("Error fetching services with workflows:", error);
      res.status(500).json({ message: "Failed to fetch services with workflows" });
    }
  });

  app.post("/api/admin/workflows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const workflow = await storage.createWorkflow({
        name: req.body.name,
        description: req.body.description,
      });
      res.json(workflow);
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      res.status(400).json({ message: error.message || "Failed to create workflow" });
    }
  });

  app.post("/api/admin/workflow-steps", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const step = await storage.createWorkflowStep({
        workflowId: req.body.workflowId,
        stepNumber: req.body.stepNumber,
        title: req.body.title,
        description: req.body.description,
      });
      res.json(step);
    } catch (error: any) {
      console.error("Error creating workflow step:", error);
      res.status(400).json({ message: error.message || "Failed to create workflow step" });
    }
  });

  app.get("/api/admin/workflows/:workflowId/steps", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.workflowId);
      res.json(steps);
    } catch (error: any) {
      console.error("Error fetching workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.post("/api/admin/services/:serviceId/workflows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const serviceWorkflow = await storage.assignWorkflowToService({
        serviceId: req.params.serviceId,
        workflowId: req.body.workflowId,
      });
      res.json(serviceWorkflow);
    } catch (error: any) {
      console.error("Error assigning workflow to service:", error);
      res.status(400).json({ message: error.message || "Failed to assign workflow" });
    }
  });

  app.get("/api/admin/services/:serviceId/workflows", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const workflows = await storage.getServiceWorkflows(req.params.serviceId);
      res.json(workflows);
    } catch (error: any) {
      console.error("Error fetching service workflows:", error);
      res.status(500).json({ message: "Failed to fetch service workflows" });
    }
  });

  app.delete("/api/admin/workflows/:workflowId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteWorkflow(req.params.workflowId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      res.status(400).json({ message: error.message || "Failed to delete workflow" });
    }
  });

  app.patch("/api/admin/workflows/:workflowId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.workflowId, {
        name: req.body.name,
        description: req.body.description,
      });
      res.json(workflow);
    } catch (error: any) {
      console.error("Error updating workflow:", error);
      res.status(400).json({ message: error.message || "Failed to update workflow" });
    }
  });

  app.delete("/api/admin/workflow-steps/:stepId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteWorkflowStep(req.params.stepId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting workflow step:", error);
      res.status(400).json({ message: error.message || "Failed to delete workflow step" });
    }
  });

  app.patch("/api/admin/workflow-steps/:stepId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const step = await storage.updateWorkflowStep(req.params.stepId, {
        title: req.body.title,
        description: req.body.description,
        stepNumber: req.body.stepNumber,
      });
      res.json(step);
    } catch (error: any) {
      console.error("Error updating workflow step:", error);
      res.status(400).json({ message: error.message || "Failed to update workflow step" });
    }
  });

  app.delete("/api/admin/services/:serviceId/workflows/:workflowId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteServiceWorkflow(req.params.serviceId, req.params.workflowId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error unassigning workflow:", error);
      res.status(400).json({ message: error.message || "Failed to unassign workflow" });
    }
  });

  // Workshop task routes
  app.get("/api/workshop/reservations/:reservationId/tasks", isAuthenticated, async (req, res) => {
    try {
      const tasks = await storage.getReservationTasks(req.params.reservationId);
      res.json(tasks);
    } catch (error: any) {
      console.error("Error fetching workshop tasks:", error);
      res.status(500).json({ message: "Failed to fetch workshop tasks" });
    }
  });

  app.patch("/api/workshop/tasks/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const task = await storage.updateWorkshopTask(req.params.taskId, {
        isCompleted: req.body.isCompleted,
        comment: req.body.comment,
        completedByUserId: req.body.isCompleted ? req.user.id : undefined,
        completedAt: req.body.isCompleted ? new Date() : undefined,
      });
      
      // Log audit event for workshop task update
      await logAuditEvent({
        req,
        entityType: "workshop_task",
        entityId: task.id,
        action: req.body.isCompleted ? "completed" : "updated",
        summary: `Étape ${req.body.isCompleted ? "validée" : "mise à jour"}`,
        newData: task,
      });
      
      res.json(task);
    } catch (error: any) {
      console.error("Error updating workshop task:", error);
      res.status(400).json({ message: error.message || "Failed to update workshop task" });
    }
  });

  // Audit Log routes
  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const filters: any = {};
      
      if (req.query.entityType) filters.entityType = req.query.entityType as string;
      if (req.query.entityId) filters.entityId = req.query.entityId as string;
      if (req.query.actorId) filters.actorId = req.query.actorId as string;
      if (req.query.action) filters.action = req.query.action as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
      
      const result = await storage.getAuditLogs(filters);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/admin/audit-logs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const log = await storage.getAuditLog(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Audit log not found" });
      }
      res.json(log);
    } catch (error: any) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  app.get("/api/admin/entity-history/:entityType/:entityId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const history = await storage.getEntityAuditHistory(req.params.entityType, req.params.entityId);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching entity history:", error);
      res.status(500).json({ message: "Failed to fetch entity history" });
    }
  });

  // Cache clearing route
  app.post("/api/admin/cache/clear", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Clear any server-side caches here
      // For now, we'll just return success
      // In the future, you could add Redis cache clearing, etc.
      
      res.json({ success: true, message: "Cache cleared successfully" });
    } catch (error: any) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ message: error.message || "Failed to clear cache" });
    }
  });

  // Object Storage routes (Reference: javascript_object_storage blueprint)
  const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const objectStorageService = new ObjectStorageService();
    const objectPath = req.path;
    
    try {
      // Check if user can access this object
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectPath,
        userId: userId,
        requestedPermission: (await import("./objectAcl")).ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      // Download and serve the object
      await objectStorageService.downloadObject(objectPath, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // File upload endpoint using express-fileupload
  app.post("/api/upload", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.files || !req.files.media) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const file = req.files.media;
      const mimetype = file.mimetype || '';
      
      // Validate file type
      if (!mimetype.startsWith('image/') && !mimetype.startsWith('video/')) {
        return res.status(400).json({ error: "Only images and videos are allowed" });
      }
      
      // Upload to persistent cloud storage (GCS via Object Storage)
      const newStorageService = new NewObjectStorageService();
      
      // Get presigned URL for upload
      const uploadURL = await newStorageService.getObjectEntityUploadURL();
      
      // Upload file directly to GCS using presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file.data,
        headers: {
          "Content-Type": mimetype,
        },
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Cloud upload failed: ${uploadResponse.status}`);
      }
      
      // Normalize the path for serving
      const objectPath = newStorageService.normalizeObjectEntityPath(uploadURL);
      
      // Set ACL policy for access control
      const userId = (req as any).user?.id;
      if (userId) {
        await newStorageService.trySetObjectEntityAclPolicy(objectPath, {
          owner: userId,
          visibility: "public",
        });
      }
      
      console.log(`File uploaded to cloud storage: ${objectPath}`);
      
      res.json({ 
        success: true,
        message: "Upload OK",
        objectPath: objectPath,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Serve uploaded files (static middleware added in index.ts)

  app.put("/api/quote-media", isAuthenticated, async (req, res) => {
    if (!req.body.mediaURL) {
      return res.status(400).json({ error: "mediaURL is required" });
    }

    const userId = (req as any).user.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/invoice-media", isAuthenticated, async (req, res) => {
    if (!req.body.mediaURL) {
      return res.status(400).json({ error: "mediaURL is required" });
    }

    const userId = (req as any).user.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Voice dictation routes for AI-powered email generation
  app.post("/api/voice-dictation/generate-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      
      // Initialize Gemini AI client
      const ai = new GoogleGenAI({
        apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        httpOptions: {
          apiVersion: "",
          baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
        },
      });

      // Get form data from multipart request
      const files = (req as any).files;
      if (!files || !files.audio) {
        return res.status(400).json({ message: "Fichier audio requis" });
      }

      const audioFile = files.audio;
      const clientName = req.body.clientName || "Client";
      const prestationsRaw = req.body.prestations || "[]";
      const prestations = JSON.parse(prestationsRaw);
      const technicalDetails = req.body.technicalDetails || "";
      const attachments = JSON.parse(req.body.attachments || "[]");
      const documentType = req.body.documentType || "invoice";
      const documentNumber = req.body.documentNumber || "";

      // Step 1: Transcribe audio using Gemini
      const audioBase64 = audioFile.data.toString('base64');
      const mimeType = audioFile.mimetype || 'audio/webm';

      const transcriptionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: audioBase64,
                },
              },
              {
                text: "Transcris cet enregistrement audio en français. Retourne uniquement le texte transcrit, sans commentaires ni formatage."
              }
            ],
          },
        ],
      });

      const transcription = transcriptionResponse.text || "";
      
      if (!transcription.trim()) {
        return res.status(400).json({ message: "Impossible de transcrire l'audio. Veuillez réessayer." });
      }

      // Step 2: Generate professional email
      const servicesList = prestations.length > 0 
        ? prestations.map((p: string) => `- ${p}`).join("\n")
        : "Aucun service spécifique";

      const attachmentsList = attachments.length > 0
        ? attachments.join(", ")
        : "Document PDF";

      const emailPrompt = `Tu es un assistant professionnel pour un atelier automobile MY JANTES.

DONNÉES FOURNIES :
- Texte dicté par l'utilisateur (TRANSCRIPTION) : "${transcription}"
- Liste des services officiels (POUR RÉFÉRENCE) :
${servicesList}
- Champs techniques fournis : ${technicalDetails || "Aucun"}
- Nom du client : ${clientName}
- Type de document : ${documentType === 'quote' ? 'Devis' : 'Facture'}
- Numéro du document : ${documentNumber}
- Pièces jointes : ${attachmentsList}

RÈGLES IMPÉRATIVES :
1. ANALYSE la transcription : Identifie toutes les prestations et travaux mentionnés par l'utilisateur.
2. UTILISE les termes des "services officiels" quand ils correspondent à ce qui a été dicté.
3. INCLUS impérativement tous les travaux dictés dans le corps de l'email.
4. Si une information n'est pas fournie, ne l'invente pas.
5. Ton professionnel, clair, standardisé. Langue : français.
6. Ne mentionne aucun prix.

OBJECTIF :
Rédiger un mail client récapitulatif complet et prêt à envoyer.

STRUCTURE DE L'EMAIL :
1. Salutation professionnelle (Bonjour ${clientName},)
2. Introduction courte (ex: "Suite à notre intervention...")
3. RÉCAPITULATIF DÉTAILLÉ des travaux réalisés (Sois précis et liste tout ce qui a été dicté)
4. Mention des pièces jointes (${attachmentsList})
5. Formule de politesse
6. Signature MY JANTES

Génère uniquement le corps de l'email, sans objet ni en-têtes.`;

      const emailResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: emailPrompt }],
          },
        ],
      });

      const generatedEmail = emailResponse.text || "";

      res.json({
        transcription,
        email: generatedEmail,
      });

    } catch (error: any) {
      console.error("Error in voice dictation:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la génération de l'email" });
    }
  });

  app.post("/api/voice-dictation/send-email", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { to, subject, body, documentType, documentNumber, documentId, clientName } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Destinataire, sujet et corps de l'email requis" });
      }

      const fs = await import('fs');
      const { generateQuotePDF, generateInvoicePDF } = await import("./emailService");
      const attachments: { filename: string; content: Buffer }[] = [];
      const attachmentNames: string[] = [];

      // Generate and attach PDF document
      if (documentId) {
        try {
          if (documentType === 'quote') {
            const quote = await storage.getQuote(documentId);
            if (quote) {
              const items = await storage.getQuoteItems(documentId);
              const settings = await storage.getApplicationSettings();
              const formatPrice = (val: any) => `${parseFloat(val || "0").toFixed(2)} €`;
              const pdfBuffer = generateQuotePDF({
                quoteNumber: quote.reference || quote.id,
                quoteDate: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
                clientName: clientName || 'Client',
                status: quote.status,
                items: items.map(i => ({
                  description: i.description || '',
                  quantity: Number(i.quantity) || 1,
                  unitPrice: formatPrice(i.unitPriceExcludingTax),
                  total: formatPrice(i.totalExcludingTax),
                })),
                amount: formatPrice(quote.quoteAmount),
                companyName: settings?.companyName || 'MY JANTES',
              });
              const pdfFilename = `Devis-${quote.reference || quote.id}.pdf`;
              attachments.push({ filename: pdfFilename, content: pdfBuffer });
              attachmentNames.push(pdfFilename);
            }
          } else if (documentType === 'invoice') {
            const invoice = await storage.getInvoice(documentId);
            if (invoice) {
              const items = await storage.getInvoiceItems(documentId);
              const settings = await storage.getApplicationSettings();
              const formatPrice = (val: any) => `${parseFloat(val || "0").toFixed(2)} €`;
              const pdfBuffer = generateInvoicePDF({
                invoiceNumber: invoice.invoiceNumber || invoice.id,
                invoiceDate: invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
                dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '',
                clientName: clientName || 'Client',
                status: invoice.status,
                items: items.map(i => ({
                  description: i.description || '',
                  quantity: Number(i.quantity) || 1,
                  unitPrice: formatPrice(i.unitPriceExcludingTax),
                  total: formatPrice(i.totalExcludingTax),
                })),
                amount: formatPrice(invoice.amount),
                companyName: settings?.companyName || 'MY JANTES',
              });
              const pdfFilename = `Facture-${invoice.invoiceNumber || invoice.id}.pdf`;
              attachments.push({ filename: pdfFilename, content: pdfBuffer });
              attachmentNames.push(pdfFilename);
            }
          }
        } catch (err) {
          console.error("Error generating PDF:", err);
        }

        // Fetch media attachments (photos/videos) from quote or invoice
        try {
          let media: any[] = [];
          if (documentType === 'quote') {
            media = await storage.getQuoteMedia(documentId);
          } else if (documentType === 'invoice') {
            media = await storage.getInvoiceMedia(documentId);
          }

          for (const item of media) {
            try {
              let data: Buffer | null = null;
              const localPath = item.filePath.startsWith('/') ? `.${item.filePath}` : item.filePath;
              if (fs.existsSync(localPath)) {
                data = fs.readFileSync(localPath);
              } else {
                const result = await objectStorageService.getObject(item.filePath);
                data = result.data;
              }
              if (data) {
                const ext = item.fileType === 'image' ? 'jpg' : 'mp4';
                const filename = item.fileName || `${item.fileType}-${item.id.slice(0, 4)}.${ext}`;
                attachments.push({ filename, content: data });
                attachmentNames.push(filename);
              }
            } catch (err) {
              console.error("Error fetching attachment:", err);
            }
          }
        } catch (err) {
          console.error("Error fetching document media:", err);
        }
      }

      // Generate HTML email with professional template
      const htmlEmail = generateVoiceDictationEmailHtml({
        clientName: clientName || 'Client',
        documentNumber: documentNumber || '',
        documentType: documentType === 'quote' ? 'quote' : 'invoice',
        emailBody: body,
        companyName: 'MY JANTES',
        attachmentNames: attachmentNames.length > 0 ? attachmentNames : undefined,
      });

      const result = await sendEmail({
        to,
        subject,
        html: htmlEmail,
        text: body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.success) {
        // Log audit event
        await logAuditEvent({
          req,
          entityType: documentType === 'quote' ? 'quote' : 'invoice',
          entityId: documentId || documentNumber,
          action: 'updated',
          summary: `Email envoyé via dictée vocale à ${to}`,
          metadata: { emailTo: to, emailSubject: subject, attachmentCount: attachments.length },
        });

        res.json({ success: true, message: "Email envoyé avec succès" });
      } else {
        res.status(500).json({ message: result.error || "Erreur lors de l'envoi de l'email" });
      }
    } catch (error: any) {
      console.error("Error sending voice dictation email:", error);
      res.status(500).json({ message: error.message || "Erreur lors de l'envoi de l'email" });
    }
  });

  // ==================== CHAT API ROUTES ====================
  
  // Helper: Check if user is a staff member (employee or admin)
  const isStaffUser = (user: any): boolean => {
    return user.role === 'employe' || user.role === 'admin';
  };
  
  // Helper: Check if user is a participant in a conversation
  const isConversationParticipant = async (conversationId: string, userId: string): Promise<boolean> => {
    const participants = await storage.getChatParticipants(conversationId);
    return participants.some(p => p.userId === userId);
  };

  // Get all conversations for the current user
  app.get("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      const conversations = await storage.getChatConversations(userId);
      res.json(conversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new conversation
  app.post("/api/chat/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { title, participantIds } = req.body;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      if (!title) {
        return res.status(400).json({ message: "Le titre est requis" });
      }
      
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "Au moins un participant est requis" });
      }
      
      // Validate all participants exist and are staff members
      const allUsers = await storage.getAllUsers();
      const validParticipantIds: string[] = [];
      
      for (const participantId of participantIds) {
        const participant = allUsers.find(u => u.id === participantId);
        if (!participant) {
          return res.status(400).json({ message: `Participant ${participantId} introuvable` });
        }
        if (participant.role !== 'employe' && participant.role !== 'admin') {
          return res.status(400).json({ message: "Seuls les employés et administrateurs peuvent participer au chat" });
        }
        if (participantId !== userId) {
          validParticipantIds.push(participantId);
        }
      }
      
      const conversation = await storage.createChatConversation({
        title,
        createdById: userId,
      });
      
      // Always add creator as participant
      await storage.addChatParticipant({ conversationId: conversation.id, userId });
      
      // Add validated participants
      for (const participantId of validParticipantIds) {
        await storage.addChatParticipant({ conversationId: conversation.id, userId: participantId });
      }
      
      const fullConversation = await storage.getChatConversations(userId);
      const created = fullConversation.find(c => c.id === conversation.id);
      
      res.json(created || conversation);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get messages for a conversation
  app.get("/api/chat/conversations/:conversationId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      // Verify user is a participant
      if (!await isConversationParticipant(conversationId, userId)) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette conversation" });
      }
      
      const messages = await storage.getChatMessages(conversationId, limit, offset);
      await storage.updateLastRead(conversationId, userId);
      
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Send a message
  app.post("/api/chat/conversations/:conversationId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      // Verify user is a participant
      if (!await isConversationParticipant(conversationId, userId)) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette conversation" });
      }
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Le message ne peut pas être vide" });
      }
      
      const message = await storage.createChatMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
      });
      
      const participants = await storage.getChatParticipants(conversationId);
      const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
      
      for (const participant of participants) {
        if (participant.userId !== userId) {
          await storage.createNotification({
            userId: participant.userId,
            type: "chat",
            title: `Nouveau message de ${senderName}`,
            message: content.length > 50 ? content.substring(0, 50) + "..." : content,
            relatedId: conversationId,
          });
          
          const wsClient = wsClients.get(participant.userId);
          if (wsClient && wsClient.readyState === WebSocket.OPEN) {
            wsClient.send(JSON.stringify({
              type: 'chat_message',
              conversationId,
              message: {
                ...message,
                sender: {
                  id: req.user.id,
                  firstName: req.user.firstName,
                  lastName: req.user.lastName,
                  email: req.user.email,
                  profileImageUrl: req.user.profileImageUrl,
                },
                attachments: [],
              },
            }));
          }
        }
      }
      
      const sender = await storage.getUser(userId);
      res.json({ ...message, sender, attachments: [] });
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Upload attachment for a message (removed - handled differently)

  // Get participants of a conversation
  app.get("/api/chat/conversations/:conversationId/participants", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      // Verify user is a participant
      if (!await isConversationParticipant(conversationId, userId)) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette conversation" });
      }
      
      const participants = await storage.getChatParticipants(conversationId);
      res.json(participants);
    } catch (error: any) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add participant to a conversation (admin only)
  app.post("/api/chat/conversations/:conversationId/participants", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { userId } = req.body;
      
      // Validate the new participant is a staff member
      const userToAdd = await storage.getUser(userId);
      if (!userToAdd) {
        return res.status(400).json({ message: "Utilisateur introuvable" });
      }
      if (userToAdd.role !== 'employe' && userToAdd.role !== 'admin') {
        return res.status(400).json({ message: "Seuls les employés et administrateurs peuvent être ajoutés" });
      }
      
      const participant = await storage.addChatParticipant({ conversationId, userId });
      res.json(participant);
    } catch (error: any) {
      console.error("Error adding participant:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get eligible users for chat (employees and admins only)
  app.get("/api/chat/users", isAuthenticated, async (req: any, res) => {
    try {
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      const allUsers = await storage.getAllUsers();
      const chatUsers = allUsers.filter(u => u.role === 'employe' || u.role === 'admin');
      res.json(sanitizeUsers(chatUsers));
    } catch (error: any) {
      console.error("Error fetching chat users:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mark conversation as read
  app.post("/api/chat/conversations/:conversationId/read", isAuthenticated, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      
      if (!isStaffUser(req.user)) {
        return res.status(403).json({ message: "Accès réservé aux employés et administrateurs" });
      }
      
      // Verify user is a participant
      if (!await isConversationParticipant(conversationId, userId)) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de cette conversation" });
      }
      
      await storage.updateLastRead(conversationId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Database export endpoint (admin only)
  app.get("/api/admin/export-database", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { pool } = await import("./db");
      
      const getTableNames = async (): Promise<string[]> => {
        const result = await pool.query(`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `);
        return result.rows.map((row: any) => row.tablename);
      };

      const getTableSchema = async (tableName: string): Promise<string> => {
        const result = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        const columns = result.rows.map((col: any) => {
          let def = `  "${col.column_name}" ${col.data_type.toUpperCase()}`;
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          return def;
        });
        
        return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${columns.join(',\n')}\n);`;
      };

      const getTableData = async (tableName: string): Promise<string> => {
        const result = await pool.query(`SELECT * FROM "${tableName}"`);
        
        if (result.rows.length === 0) {
          return `-- No data in table ${tableName}`;
        }
        
        const columns = Object.keys(result.rows[0]);
        const inserts: string[] = [];
        
        for (const row of result.rows) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return val.toString();
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          inserts.push(`INSERT INTO "${tableName}" ("${columns.join('", "')}") VALUES (${values.join(', ')});`);
        }
        
        return inserts.join('\n');
      };

      const tables = await getTableNames();
      let output = `-- Database Export\n-- Generated: ${new Date().toISOString()}\n-- Tables: ${tables.join(', ')}\n\n`;
      output += '-- Disable foreign key checks for import\nSET session_replication_role = replica;\n\n';
      
      for (const table of tables) {
        output += `-- ==========================================\n`;
        output += `-- Table: ${table}\n`;
        output += `-- ==========================================\n\n`;
        
        const schema = await getTableSchema(table);
        output += schema + '\n\n';
        
        const data = await getTableData(table);
        output += data + '\n\n';
      }
      
      output += '-- Re-enable foreign key checks\nSET session_replication_role = DEFAULT;\n';
      
      const filename = `myjantes-export-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.sql`;
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(output);
      
    } catch (error: any) {
      console.error("Database export error:", error);
      res.status(500).json({ message: "Erreur lors de l'export de la base de données", error: error.message });
    }
  });

  // WebSocket authentication tokens (short-lived, single-use)
  const wsAuthTokens = new Map<string, { userId: string; expiresAt: number }>();
  
  // Generate a WebSocket auth token for the current user
  app.post("/api/ws/auth-token", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 30000; // 30 seconds validity
      
      wsAuthTokens.set(token, { userId, expiresAt });
      
      // Cleanup expired tokens
      Array.from(wsAuthTokens.entries()).forEach(([t, data]) => {
        if (data.expiresAt < Date.now()) {
          wsAuthTokens.delete(t);
        }
      });
      
      res.json({ token });
    } catch (error: any) {
      console.error("Error generating WS auth token:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup (Reference: javascript_websocket blueprint)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('WebSocket client connected');
    let authenticatedUserId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Secure authentication with server-issued token
        if (data.type === 'authenticate' && data.token) {
          const tokenData = wsAuthTokens.get(data.token);
          
          if (tokenData && tokenData.expiresAt > Date.now()) {
            authenticatedUserId = tokenData.userId;
            wsClients.set(tokenData.userId, ws);
            wsAuthTokens.delete(data.token); // Single-use token
            console.log(`User ${tokenData.userId} authenticated via WebSocket`);
            ws.send(JSON.stringify({ type: 'authenticated', success: true }));
          } else {
            console.log('WebSocket authentication failed: invalid or expired token');
            ws.send(JSON.stringify({ type: 'authenticated', success: false, error: 'Invalid token' }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove client from map
      for (const [userId, client] of Array.from(wsClients.entries())) {
        if (client === ws) {
          wsClients.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return httpServer;
}
