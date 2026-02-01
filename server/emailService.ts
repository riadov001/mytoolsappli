// Reference: Resend integration for sending transactional emails
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';

const FROM_EMAIL = 'MY JANTES <contact@pointdepart.com>';

async function getFileBuffer(filePath: string): Promise<Buffer | null> {
  try {
    // If it's a local file we read it
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
    
    // Use @replit/object-storage Client
    const { Client } = await import('@replit/object-storage');
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      console.error('DEFAULT_OBJECT_STORAGE_BUCKET_ID not set');
      return null;
    }
    
    const client = new Client({ bucketId });
    const result = await client.downloadAsBytes(filePath);
    
    if (result.ok) {
      return Buffer.isBuffer(result.value) ? result.value : Buffer.from(result.value as unknown as Uint8Array);
    }
    return null;
  } catch (error) {
    console.error(`Error getting file buffer for ${filePath}:`, error);
    return null;
  }
}

export async function getResendClient() {
  const apiKey = process.env.Resend;
  
  if (!apiKey) {
    throw new Error('Resend API key not configured. Please add the API key in the secret named "Resend".');
  }
  
  return {
    client: new Resend(apiKey),
    fromEmail: FROM_EMAIL
  };
}

interface Attachment {
  filename: string;
  content: Buffer | string;
}

interface EmailData {
  to: string;
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailPayload: any = {
      from: fromEmail || 'MY JANTES <contact@pointdepart.com>',
      to: data.to,
      bcc: ['contact@pointdepart.com', 'contact@myjantes.com'],
      subject: data.subject,
      html: data.html,
      text: data.text,
    };
    
    if (data.cc && data.cc.length > 0) {
      emailPayload.cc = data.cc;
    }
    
    if (data.attachments && data.attachments.length > 0) {
      emailPayload.attachments = data.attachments.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' ? Buffer.from(att.content, 'base64') : att.content,
      }));
    }
    
    const result = await client.emails.send(emailPayload);

    if (result.error) {
      console.error('Resend error:', result.error);
      // If domain is not verified, suggest fallback
      if (result.error.message?.includes('not verified') || result.error.message?.includes('not found')) {
        console.warn(`Domain "${fromEmail}" not verified in Resend. To fix this, verify the domain in your Resend dashboard (https://resend.com/domains)`);
      }
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export function generateQuoteApprovedEmailHtml(data: {
  clientName: string;
  quoteNumber: string;
  quoteDate: string;
  amount: string;
  companyName: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; total: string }>;
}): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.total}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Devis Validé ${data.quoteNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">Devis Validé - N° ${data.quoteNumber}</h2>
        
        <p>Bonjour ${data.clientName},</p>
        
        <p>Bonne nouvelle ! Votre devis du ${data.quoteDate} a été validé.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
          <p style="font-size: 18px; font-weight: bold; color: #16a34a; margin: 0;">Total TTC: ${data.amount}</p>
        </div>
        
        <p style="margin-top: 30px;">Nous allons maintenant préparer votre facture. Vous serez notifié dès qu'elle sera disponible.</p>
        
        <p>N'hésitez pas à nous contacter pour toute question.</p>
        
        <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateQuoteEmailHtml(data: {
  clientName: string;
  quoteNumber: string;
  quoteDate: string;
  amount: string;
  companyName: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; total: string }>;
}): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.total}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Devis ${data.quoteNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #dc2626; margin-top: 0;">Votre devis - N° ${data.quoteNumber}</h2>
        
        <p>Bonjour ${data.clientName},</p>
        
        <p>Veuillez trouver ci-joint votre devis du ${data.quoteDate}.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
          <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0;">Total TTC: ${data.amount}</p>
        </div>
        
        <p style="margin-top: 30px;">N'hésitez pas à nous contacter pour toute question ou demande de modification.</p>
        
        <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateInvoiceEmailHtml(data: {
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  companyName: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; total: string }>;
}): string {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unitPrice}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.total}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Facture ${data.invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #dc2626; margin-top: 0;">Facture - N° ${data.invoiceNumber}</h2>
        
        <p>Bonjour ${data.clientName},</p>
        
        <p>Veuillez trouver ci-joint votre facture du ${data.invoiceDate}.</p>
        <p style="color: #666; font-size: 14px;">Date d'échéance: <strong>${data.dueDate}</strong></p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qté</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unit.</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
          <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0;">Total TTC: ${data.amount}</p>
        </div>
        
        <p style="margin-top: 30px;">Merci pour votre confiance. N'hésitez pas à nous contacter pour toute question.</p>
        
        <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateInvoicePaidEmailHtml(data: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  paymentDate: string;
  companyName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Paiement reçu - ${data.invoiceNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">✓ Paiement reçu</h2>
        
        <p>Bonjour ${data.clientName},</p>
        
        <p>Nous confirmons la réception de votre paiement pour la facture <strong>${data.invoiceNumber}</strong>.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0;">
            <strong>Montant payé:</strong> ${data.amount}<br>
            <strong>Date de paiement:</strong> ${data.paymentDate}
          </p>
        </div>
        
        <p>Merci beaucoup pour votre confiance et votre rapidité.</p>
        
        <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateReservationConfirmedEmailHtml(data: {
  clientName: string;
  reservationDate: string;
  reservationTime: string;
  serviceName: string;
  companyName: string;
  notes?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Réservation confirmée</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">✓ Réservation confirmée</h2>
        
        <p>Bonjour ${data.clientName},</p>
        
        <p>Votre réservation a été confirmée !</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0;">
            <strong>Service:</strong> ${data.serviceName}<br>
            <strong>Date:</strong> ${data.reservationDate}<br>
            <strong>Heure:</strong> ${data.reservationTime}
          </p>
          ${data.notes ? `<p style="margin-top: 10px; color: #666;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
        
        <p>À bientôt pour votre service !</p>
        
        <p>Cordialement,<br><strong>L'équipe ${data.companyName}</strong></p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé automatiquement depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

const COMPANY_INFO = {
  name: 'MY JANTES',
  tagline: 'SPÉCIALISTE JANTES ET PNEUS',
  address: '46 rue de la convention',
  city: '62800 Lievin',
  phone: '0321408053',
  email: 'contact@myjantes.com',
  website: 'www.myjantes.fr',
  bankName: 'SG WATTIGNIES (02958)',
  iban: 'FR76 3000 3029 5800 0201 6936 525',
  swift: 'SOGEFRPP',
  tva: 'FR73913678199',
};

// Template for voice dictation emails - same design as other emails
export function generateVoiceDictationEmailHtml(data: {
  clientName: string;
  documentNumber: string;
  documentType: 'quote' | 'invoice';
  emailBody: string;
  companyName: string;
  attachmentNames?: string[];
}): string {
  const documentLabel = data.documentType === 'quote' ? 'Devis' : 'Facture';
  const attachmentSection = data.attachmentNames && data.attachmentNames.length > 0
    ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0; font-weight: bold; color: #333;">Pièces jointes :</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666;">
          ${data.attachmentNames.map(name => `<li>${name}</li>`).join('')}
        </ul>
      </div>`
    : '';

  // Convert newlines to <br> and preserve paragraph structure
  const formattedBody = data.emailBody
    .split('\n\n').map(paragraph => `<p style="margin: 0 0 15px 0;">${paragraph.replace(/\n/g, '<br>')}</p>`).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${documentLabel} ${data.documentNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${data.companyName}</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Votre spécialiste jantes</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #dc2626; margin-top: 0;">${documentLabel} N° ${data.documentNumber}</h2>
        
        <div style="color: #333;">
          ${formattedBody}
        </div>
        
        ${attachmentSection}
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>Ce message a été envoyé depuis ${data.companyName}.</p>
      </div>
    </body>
    </html>
  `;
}

// Load logo as base64 for server
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), 'attached_assets', 'cropped-Logo-2-1-768x543_(3)_1767977972324.png');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('Could not load logo:', error);
    return '';
  }
}

// Exact same logic as client generateQuotePDF
export function generateQuotePDF(data: {
  quoteNumber: string;
  quoteDate: string;
  clientName: string;
  status?: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; total: string }>;
  amount: string;
  companyName: string;
}): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add logo (LEFT side) - EXACT SAME AS CLIENT
  try {
    const logoBase64 = getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 20, 10, 40, 20);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }
  
  // Document title (CENTER) - EXACT SAME AS CLIENT
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const quoteNumber = `DV-${new Date().getFullYear()}-${data.quoteNumber.substring(0, 6)}`;
  doc.text(`DEVIS - ${quoteNumber}`, pageWidth / 2, 20, { align: 'center' });
  
  // Dates and operation type (RIGHT side) - EXACT SAME AS CLIENT
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const billingDate = data.quoteDate;
  doc.text(`Date de facturation: ${billingDate}`, pageWidth - 20, 28, { align: 'right' });
  doc.text('Type d\'opération: Opération interne', pageWidth - 20, 40, { align: 'right' });
  
  // Add status if provided (RED)
  if (data.status) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Statut: ${data.status}`, pageWidth - 20, 34, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  
  // Company info (LEFT side, below logo) - EXACT SAME AS CLIENT
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 20, 50);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 20, 56);
  doc.text(COMPANY_INFO.city, 20, 61);
  doc.text(COMPANY_INFO.phone, 20, 66);
  doc.text(COMPANY_INFO.email, 20, 71);
  doc.text(COMPANY_INFO.website, 20, 76);
  
  // Client info (RIGHT side) - EXACT SAME AS CLIENT
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const clientName = data.clientName || 'Client';
  doc.text(clientName.toUpperCase(), pageWidth - 20, 50, { align: 'right' });
  
  // Table with professional styling
  const tableData = data.items.map(item => ({
    description: item.description,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice,
    vat: '20%',
    amount: item.total,
  }));
  
  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableData.map(item => [
      item.description,
      item.quantity,
      `${item.unitPrice} €`,
      `${item.amount} €`,
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [220, 38, 38], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: [220, 38, 38],
      lineWidth: 0.5,
    },
    bodyStyles: { 
      fontSize: 9, 
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246],
    },
    columnStyles: {
      0: { cellWidth: 105, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.5,
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  let totalHT = 0;
  let totalTTC = 0;
  data.items.forEach(item => {
    const priceValue = parseFloat(item.unitPrice.replace(' €', '').replace(/,/g, '.'));
    const totalValue = parseFloat(item.total.replace(' €', '').replace(/,/g, '.'));
    totalHT += priceValue;
    totalTTC += totalValue;
  });
  const totalVAT = totalTTC - totalHT;
  const vatRate = 20;
  
  const totalsBoxX = 115;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT', totalsBoxX, finalY);
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - 20, finalY, { align: 'right' });
  
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsBoxX, finalY + 3, pageWidth - 20, finalY + 3);
  
  doc.text(`TVA (${vatRate}%)`, totalsBoxX, finalY + 10);
  doc.text(`${totalVAT.toFixed(2)} €`, pageWidth - 20, finalY + 10, { align: 'right' });
  
  doc.line(totalsBoxX, finalY + 13, pageWidth - 20, finalY + 13);
  
  // Total TTC with highlight
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(totalsBoxX - 5, finalY + 16, 80, 12, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Total TTC', totalsBoxX, finalY + 24);
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - 20, finalY + 24, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, pageHeight - 28, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${COMPANY_INFO.bankName}  |  IBAN: ${COMPANY_INFO.iban}  |  BIC: ${COMPANY_INFO.swift}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`SIRET: 913 678 199 00021  •  TVA: ${COMPANY_INFO.tva}`, pageWidth / 2, pageHeight - 16, { align: 'center' });
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}  •  ${COMPANY_INFO.phone}  •  ${COMPANY_INFO.website}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
  
  return Buffer.from(doc.output('arraybuffer'));
}

// Invoice PDF generator
export function generateInvoicePDF(data: {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  status?: string;
  items: Array<{ description: string; quantity: number; unitPrice: string; total: string }>;
  amount: string;
  companyName: string;
}): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add logo (LEFT side) - EXACT SAME AS CLIENT
  try {
    const logoBase64 = getLogoBase64();
    doc.addImage(logoBase64, 'PNG', 20, 10, 40, 20);
  } catch (error) {
    console.error('Failed to load logo:', error);
  }
  
  // Document title (CENTER) - EXACT SAME AS CLIENT
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURE - ${data.invoiceNumber}`, pageWidth / 2, 20, { align: 'center' });
  
  // Dates and operation type (RIGHT side) - EXACT SAME AS CLIENT
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const billingDate = data.invoiceDate;
  const dueDate = data.dueDate;
  doc.text(`Date de facturation: ${billingDate}`, pageWidth - 20, 28, { align: 'right' });
  doc.text(`Échéance: ${dueDate}`, pageWidth - 20, 34, { align: 'right' });
  doc.text('Type d\'opération: Opération interne', pageWidth - 20, 40, { align: 'right' });
  
  // Add status if provided (RED)
  if (data.status) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Statut: ${data.status}`, pageWidth - 20, 46, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  
  // Company info (LEFT side, below logo) - EXACT SAME AS CLIENT
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, 20, 50);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_INFO.address, 20, 56);
  doc.text(COMPANY_INFO.city, 20, 61);
  doc.text(COMPANY_INFO.phone, 20, 66);
  doc.text(COMPANY_INFO.email, 20, 71);
  doc.text(COMPANY_INFO.website, 20, 76);
  
  // Client info (RIGHT side) - EXACT SAME AS CLIENT
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const clientName = data.clientName || 'Client';
  doc.text(clientName.toUpperCase(), pageWidth - 20, 50, { align: 'right' });
  
  // Table with professional styling
  const tableData = data.items.map(item => ({
    description: item.description,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice,
    vat: '20%',
    amount: item.total,
  }));
  
  autoTable(doc, {
    startY: 90,
    head: [['Description', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableData.map(item => [
      item.description,
      item.quantity,
      `${item.unitPrice} €`,
      `${item.amount} €`,
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [220, 38, 38], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: [220, 38, 38],
      lineWidth: 0.5,
    },
    bodyStyles: { 
      fontSize: 9, 
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: [243, 244, 246],
    },
    columnStyles: {
      0: { cellWidth: 105, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.5,
  });
  
  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  let totalHT = 0;
  let totalTTC = 0;
  data.items.forEach(item => {
    const priceValue = parseFloat(item.unitPrice.replace(' €', '').replace(/,/g, '.'));
    const totalValue = parseFloat(item.total.replace(' €', '').replace(/,/g, '.'));
    totalHT += priceValue;
    totalTTC += totalValue;
  });
  const totalVAT = totalTTC - totalHT;
  const vatRate = 20;
  
  const totalsBoxX = 115;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Total HT', totalsBoxX, finalY);
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - 20, finalY, { align: 'right' });
  
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsBoxX, finalY + 3, pageWidth - 20, finalY + 3);
  
  doc.text(`TVA (${vatRate}%)`, totalsBoxX, finalY + 10);
  doc.text(`${totalVAT.toFixed(2)} €`, pageWidth - 20, finalY + 10, { align: 'right' });
  
  doc.line(totalsBoxX, finalY + 13, pageWidth - 20, finalY + 13);
  
  // Total TTC with highlight
  doc.setFillColor(220, 38, 38);
  doc.roundedRect(totalsBoxX - 5, finalY + 16, 80, 12, 2, 2, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Total TTC', totalsBoxX, finalY + 24);
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - 20, finalY + 24, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setDrawColor(229, 231, 235);
  doc.line(20, pageHeight - 35, pageWidth - 20, pageHeight - 35);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, pageHeight - 28, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`${COMPANY_INFO.bankName}  |  IBAN: ${COMPANY_INFO.iban}  |  BIC: ${COMPANY_INFO.swift}`, pageWidth / 2, pageHeight - 22, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`SIRET: 913 678 199 00021  •  TVA: ${COMPANY_INFO.tva}`, pageWidth / 2, pageHeight - 16, { align: 'center' });
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}  •  ${COMPANY_INFO.phone}  •  ${COMPANY_INFO.website}`, pageWidth / 2, pageHeight - 11, { align: 'center' });
  
  return Buffer.from(doc.output('arraybuffer'));
}
