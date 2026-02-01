import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Quote, Invoice, InvoiceItem, QuoteItem, ApplicationSettings } from '@shared/schema';
import defaultLogoImage from '@assets/cropped-Logo-2-1-768x543_(3)_1767977972324.png';

interface PDFData {
  type: 'quote' | 'invoice';
  number: string;
  date: string;
  dueDate?: string;
  operationType: string;
  items: Array<{
    description: string;
    date: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vat: number;
    amount: number;
  }>;
  clientInfo: {
    name: string;
    email: string;
    address?: string;
  };
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  notes?: string;
}

interface CompanyInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  iban: string;
  swift: string;
  siret: string;
  tva: string;
  logo?: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'MY JANTES',
  tagline: 'SPÉCIALISTE JANTES ET PNEUS',
  address: '46 rue de la convention',
  city: '62800 Lievin',
  phone: '03 21 40 80 53',
  email: 'contact@myjantes.com',
  website: 'www.myjantes.fr',
  bankName: 'SG WATTIGNIES (02958)',
  iban: 'FR76 3000 3029 5800 0201 6936 525',
  swift: 'SOGEFRPP',
  siret: '913 678 199 00021',
  tva: 'FR73 913 678 199',
};

function getCompanyInfoFromSettings(settings?: ApplicationSettings | null): CompanyInfo {
  if (!settings) {
    return DEFAULT_COMPANY_INFO;
  }
  return {
    name: settings.companyName || DEFAULT_COMPANY_INFO.name,
    tagline: settings.companyTagline || DEFAULT_COMPANY_INFO.tagline,
    address: settings.companyAddress || DEFAULT_COMPANY_INFO.address,
    city: settings.companyCity || DEFAULT_COMPANY_INFO.city,
    phone: settings.companyPhone || DEFAULT_COMPANY_INFO.phone,
    email: settings.companyEmail || DEFAULT_COMPANY_INFO.email,
    website: settings.companyWebsite || DEFAULT_COMPANY_INFO.website,
    bankName: DEFAULT_COMPANY_INFO.bankName,
    iban: settings.companyIban || DEFAULT_COMPANY_INFO.iban,
    swift: settings.companySwift || DEFAULT_COMPANY_INFO.swift,
    siret: settings.companySiret || DEFAULT_COMPANY_INFO.siret,
    tva: settings.companyTvaNumber || DEFAULT_COMPANY_INFO.tva,
    logo: settings.companyLogo || undefined,
  };
}

const COLORS = {
  primary: [220, 38, 38] as [number, number, number],
  primaryLight: [254, 242, 242] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
};

async function getLogoBase64(customLogo?: string): Promise<string> {
  if (customLogo) {
    if (customLogo.startsWith('data:image')) {
      return customLogo;
    }
    try {
      const response = await fetch(customLogo);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch custom logo:', error);
    }
  }
  
  try {
    const response = await fetch(defaultLogoImage);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch default logo:', error);
    throw error;
  }
}

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor?: [number, number, number], strokeColor?: [number, number, number]) {
  if (fillColor) {
    doc.setFillColor(...fillColor);
  }
  if (strokeColor) {
    doc.setDrawColor(...strokeColor);
    doc.setLineWidth(0.3);
  }
  doc.roundedRect(x, y, w, h, r, r, fillColor && strokeColor ? 'FD' : fillColor ? 'F' : 'S');
}

function formatClientInfo(clientInfo: any): { name: string; details: string[] } {
  let name = '';
  const details: string[] = [];
  
  if (clientInfo?.firstName && clientInfo?.lastName) {
    name = `${clientInfo.firstName} ${clientInfo.lastName}`;
  }
  
  if (clientInfo?.companyName) {
    name = clientInfo.companyName + (name ? ` (${name})` : '');
  }
  
  if (!name) {
    name = clientInfo?.name || clientInfo?.email?.split('@')[0] || 'Client';
  }
  
  if (clientInfo?.siret) {
    details.push(`SIRET: ${clientInfo.siret}`);
  }
  if (clientInfo?.tvaNumber) {
    details.push(`TVA: ${clientInfo.tvaNumber}`);
  }
  if (clientInfo?.email) {
    details.push(clientInfo.email);
  }
  if (clientInfo?.phone) {
    details.push(`Tél: ${clientInfo.phone}`);
  }
  
  const address = clientInfo?.companyAddress || clientInfo?.address;
  if (address) {
    details.push(address);
  }
  
  if (clientInfo?.postalCode || clientInfo?.city) {
    const location = [clientInfo?.postalCode, clientInfo?.city].filter(Boolean).join(' ');
    if (location) {
      details.push(location);
    }
  }
  
  return { name, details };
}

export async function generateQuotePDF(quote: Quote, clientInfo: any, serviceInfo: any, quoteItems?: QuoteItem[], settings?: ApplicationSettings | null, returnDoc = false) {
  const COMPANY_INFO = getCompanyInfoFromSettings(settings);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const quoteNumber = quote.reference || `DEV-${new Date(quote.createdAt || Date.now()).toLocaleDateString('fr-FR', { month: '2-digit' })}-00001`;
  
  const billingDate = new Date(quote.createdAt || Date.now()).toLocaleDateString('fr-FR');
  const dueDate = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-FR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
  
  // === HEADER SECTION ===
  // Logo
  try {
    const logoBase64 = await getLogoBase64(COMPANY_INFO.logo);
    doc.addImage(logoBase64, 'PNG', margin, 12, 50, 25);
  } catch (error) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(COMPANY_INFO.name, margin, 25);
  }
  
  // Document title with styled box
  const titleBoxWidth = 75;
  const titleBoxX = pageWidth - margin - titleBoxWidth;
  drawRoundedRect(doc, titleBoxX, 12, titleBoxWidth, 28, 3, COLORS.primaryLight, COLORS.primary);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('DEVIS', titleBoxX + titleBoxWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`N° ${quoteNumber}`, titleBoxX + titleBoxWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(`${billingDate}`, titleBoxX + titleBoxWidth / 2, 37, { align: 'center' });
  
  // Separator line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);
  
  // === COMPANY AND CLIENT INFO ===
  const infoStartY = 52;
  const infoBoxHeight = 45;
  const infoBoxWidth = (contentWidth - 10) / 2;
  
  // Company info box
  drawRoundedRect(doc, margin, infoStartY, infoBoxWidth, infoBoxHeight, 3, COLORS.lightGray);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.gray);
  doc.text('ÉMETTEUR', margin + 5, infoStartY + 8);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(COMPANY_INFO.name, margin + 5, infoStartY + 17);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(COMPANY_INFO.address, margin + 5, infoStartY + 24);
  doc.text(COMPANY_INFO.city, margin + 5, infoStartY + 30);
  doc.text(`Tél: ${COMPANY_INFO.phone}`, margin + 5, infoStartY + 36);
  doc.text(COMPANY_INFO.email, margin + 5, infoStartY + 42);
  
  // Client info box
  const clientBoxX = margin + infoBoxWidth + 10;
  drawRoundedRect(doc, clientBoxX, infoStartY, infoBoxWidth, infoBoxHeight, 3, COLORS.white, COLORS.border);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.gray);
  doc.text('DESTINATAIRE', clientBoxX + 5, infoStartY + 8);
  
  const { name: clientName, details: clientDetails } = formatClientInfo(clientInfo);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  const truncatedName = clientName.length > 30 ? clientName.substring(0, 28) + '...' : clientName;
  doc.text(truncatedName.toUpperCase(), clientBoxX + 5, infoStartY + 17);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  let clientDetailY = infoStartY + 24;
  clientDetails.slice(0, 4).forEach((detail) => {
    const truncated = detail.length > 35 ? detail.substring(0, 33) + '...' : detail;
    doc.text(truncated, clientBoxX + 5, clientDetailY);
    clientDetailY += 6;
  });
  
  // Validity info - aligned with table edges
  const validityY = infoStartY + infoBoxHeight + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Date d'émission: ${billingDate}`, margin, validityY);
  doc.text(`Validité: ${dueDate}`, pageWidth - margin, validityY, { align: 'right' });
  
  // === TABLE SECTION ===
  let tableData: any[];
  
  if (quoteItems && quoteItems.length > 0) {
    tableData = quoteItems.map(item => ({
      description: item.description || '',
      quantity: item.quantity?.toString() || '1',
      unitPrice: parseFloat(item.unitPriceExcludingTax || '0').toFixed(2),
      vat: `${parseFloat(item.taxRate || '20').toFixed(0)}%`,
      amount: parseFloat(item.totalExcludingTax || '0').toFixed(2),
    }));
  } else {
    let description = serviceInfo?.description || serviceInfo?.name || 'Service automobile';
    
    if (quote.wheelCount || quote.diameter) {
      const wheelInfo = [];
      if (quote.wheelCount) wheelInfo.push(`${quote.wheelCount} jante${quote.wheelCount > 1 ? 's' : ''}`);
      if (quote.diameter) wheelInfo.push(`Ø ${quote.diameter}"`);
      description = `${description}\n${wheelInfo.join(' - ')}`;
    }
    
    if (quote.productDetails) {
      description = `${description}\n${quote.productDetails}`;
    }
    
    const priceHT = parseFloat(quote.priceExcludingTax || quote.quoteAmount || '0');
    const vatRate = parseFloat(quote.taxRate || '20');
    
    tableData = [{
      description,
      quantity: quote.wheelCount ? quote.wheelCount.toString() : '1',
      unitPrice: priceHT.toFixed(2),
      vat: `${vatRate.toFixed(0)}%`,
      amount: priceHT.toFixed(2),
    }];
  }
  
  autoTable(doc, {
    startY: validityY + 8,
    head: [['Désignation', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableData.map(item => [
      item.description,
      item.quantity,
      `${item.unitPrice} €`,
      `${item.amount} €`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.primary,
      lineWidth: 0.5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: COLORS.dark,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.border,
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 105, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
    },
    tableLineColor: COLORS.border,
    tableLineWidth: 0.5,
  });
  
  // === TOTALS SECTION ===
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let totalHT: number, totalVAT: number, totalTTC: number, vatRate: number;
  
  if (quoteItems && quoteItems.length > 0) {
    totalHT = quoteItems.reduce((sum, item) => sum + parseFloat(item.totalExcludingTax || '0'), 0);
    totalVAT = quoteItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || '0'), 0);
    totalTTC = quoteItems.reduce((sum, item) => sum + parseFloat(item.totalIncludingTax || '0'), 0);
    vatRate = quoteItems.length > 0 ? parseFloat(quoteItems[0].taxRate || '20') : 20;
  } else {
    const priceHT = parseFloat(quote.priceExcludingTax || quote.quoteAmount || '0');
    vatRate = parseFloat(quote.taxRate || '20');
    const vatAmount = parseFloat(quote.taxAmount || (priceHT * vatRate / 100).toFixed(2));
    totalHT = priceHT;
    totalVAT = vatAmount;
    totalTTC = totalHT + totalVAT;
  }
  
  const totalsBoxWidth = 90;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  
  doc.text('Total HT', totalsBoxX, finalY);
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, finalY, { align: 'right' });
  
  doc.setDrawColor(...COLORS.border);
  doc.line(totalsBoxX, finalY + 3, pageWidth - margin, finalY + 3);
  
  doc.text(`TVA (${vatRate.toFixed(0)}%)`, totalsBoxX, finalY + 10);
  doc.text(`${totalVAT.toFixed(2)} €`, pageWidth - margin, finalY + 10, { align: 'right' });
  
  doc.line(totalsBoxX, finalY + 13, pageWidth - margin, finalY + 13);
  
  // Total TTC with highlight - extended to right margin
  drawRoundedRect(doc, totalsBoxX - 5, finalY + 16, totalsBoxWidth + 5, 12, 2, COLORS.primary);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Total TTC', totalsBoxX, finalY + 24);
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - margin - 3, finalY + 24, { align: 'right' });
  
  // === FOOTER ===
  const footerY = pageHeight - 35;
  
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, footerY + 7, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(`${COMPANY_INFO.bankName}  |  IBAN: ${COMPANY_INFO.iban}  |  BIC: ${COMPANY_INFO.swift}`, pageWidth / 2, footerY + 13, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`SIRET: ${COMPANY_INFO.siret}  •  TVA Intracommunautaire: ${COMPANY_INFO.tva}`, pageWidth / 2, footerY + 19, { align: 'center' });
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}  •  ${COMPANY_INFO.phone}  •  ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 24, { align: 'center' });
  
  if (returnDoc) return doc;
  doc.save(`devis-${quoteNumber}.pdf`);
}

export async function generateInvoicePDF(invoice: Invoice, clientInfo: any, quoteInfo: any, serviceInfo: any, invoiceItems?: InvoiceItem[], settings?: ApplicationSettings | null, returnDoc = false) {
  const COMPANY_INFO = getCompanyInfoFromSettings(settings);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  const billingDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR');
  
  // === HEADER SECTION ===
  // Logo
  try {
    const logoBase64 = await getLogoBase64(COMPANY_INFO.logo);
    doc.addImage(logoBase64, 'PNG', margin, 12, 50, 25);
  } catch (error) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(COMPANY_INFO.name, margin, 25);
  }
  
  // Document title with styled box
  const titleBoxWidth = 75;
  const titleBoxX = pageWidth - margin - titleBoxWidth;
  drawRoundedRect(doc, titleBoxX, 12, titleBoxWidth, 28, 3, COLORS.primaryLight, COLORS.primary);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('FACTURE', titleBoxX + titleBoxWidth / 2, 22, { align: 'center' });
  
  const invoiceNumber = invoice.invoiceNumber || `DEV-${new Date(invoice.createdAt || Date.now()).toLocaleDateString('fr-FR', { month: '2-digit' })}-00001`;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`N° ${invoiceNumber}`, titleBoxX + titleBoxWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(`${billingDate}`, titleBoxX + titleBoxWidth / 2, 37, { align: 'center' });
  
  // Separator line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);
  
  // === COMPANY AND CLIENT INFO ===
  const infoStartY = 52;
  const infoBoxHeight = 45;
  const infoBoxWidth = (contentWidth - 10) / 2;
  
  // Company info box
  drawRoundedRect(doc, margin, infoStartY, infoBoxWidth, infoBoxHeight, 3, COLORS.lightGray);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.gray);
  doc.text('ÉMETTEUR', margin + 5, infoStartY + 8);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(COMPANY_INFO.name, margin + 5, infoStartY + 17);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(COMPANY_INFO.address, margin + 5, infoStartY + 24);
  doc.text(COMPANY_INFO.city, margin + 5, infoStartY + 30);
  doc.text(`Tél: ${COMPANY_INFO.phone}`, margin + 5, infoStartY + 36);
  doc.text(COMPANY_INFO.email, margin + 5, infoStartY + 42);
  
  // Client info box
  const clientBoxX = margin + infoBoxWidth + 10;
  drawRoundedRect(doc, clientBoxX, infoStartY, infoBoxWidth, infoBoxHeight, 3, COLORS.white, COLORS.border);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.gray);
  doc.text('DESTINATAIRE', clientBoxX + 5, infoStartY + 8);
  
  const { name: clientName, details: clientDetails } = formatClientInfo(clientInfo);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  const truncatedName = clientName.length > 30 ? clientName.substring(0, 28) + '...' : clientName;
  doc.text(truncatedName.toUpperCase(), clientBoxX + 5, infoStartY + 17);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  let clientDetailY = infoStartY + 24;
  clientDetails.slice(0, 4).forEach((detail) => {
    const truncated = detail.length > 35 ? detail.substring(0, 33) + '...' : detail;
    doc.text(truncated, clientBoxX + 5, clientDetailY);
    clientDetailY += 6;
  });
  
  // Invoice info - aligned with table edges
  const invoiceInfoY = infoStartY + infoBoxHeight + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Date d'émission: ${billingDate}`, margin, invoiceInfoY);
  doc.text(`Échéance: ${dueDate}`, pageWidth - margin, invoiceInfoY, { align: 'right' });
  
  // === TABLE SECTION ===
  let tableData: any[];
  
  if (invoiceItems && invoiceItems.length > 0) {
    tableData = invoiceItems.map(item => {
      let description = item.description || '';
      if (invoice.wheelCount && invoice.wheelCount > 1) {
        description = `${description} (× ${invoice.wheelCount} jantes)`;
      }
      return {
        description,
        quantity: item.quantity?.toString() || '1',
        unitPrice: parseFloat(item.unitPriceExcludingTax || '0').toFixed(2),
        vat: `${parseFloat(item.taxRate || '0').toFixed(0)}%`,
        amount: parseFloat(item.totalExcludingTax || '0').toFixed(2),
      };
    });
  } else {
    let description = serviceInfo?.description || serviceInfo?.name || 'Service automobile';
    
    if (invoice.wheelCount || invoice.diameter) {
      const wheelInfo = [];
      if (invoice.wheelCount) wheelInfo.push(`${invoice.wheelCount} jante${invoice.wheelCount > 1 ? 's' : ''}`);
      if (invoice.diameter) wheelInfo.push(`Ø ${invoice.diameter}"`);
      description = `${description}\n${wheelInfo.join(' - ')}`;
    }
    
    if (invoice.productDetails) {
      description = `${description}\n${invoice.productDetails}`;
    }
    
    const priceHT = parseFloat(invoice.priceExcludingTax || invoice.amount || '0');
    const vatRate = parseFloat(invoice.taxRate || '20');
    
    tableData = [{
      description,
      quantity: invoice.wheelCount ? invoice.wheelCount.toString() : '1',
      unitPrice: priceHT.toFixed(2),
      vat: `${vatRate.toFixed(0)}%`,
      amount: priceHT.toFixed(2),
    }];
  }
  
  autoTable(doc, {
    startY: invoiceInfoY + 8,
    head: [['Désignation', 'Qté', 'Prix unit. HT', 'Total HT']],
    body: tableData.map(item => [
      item.description,
      item.quantity,
      `${item.unitPrice} €`,
      `${item.amount} €`,
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.primary,
      lineWidth: 0.5,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: COLORS.dark,
      halign: 'center',
      valign: 'middle',
      lineColor: COLORS.border,
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 105, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
    },
    tableLineColor: COLORS.border,
    tableLineWidth: 0.5,
  });
  
  // === TOTALS SECTION ===
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let totalHT: number, totalVAT: number, totalTTC: number, vatRate: number;
  
  if (invoiceItems && invoiceItems.length > 0) {
    totalHT = invoiceItems.reduce((sum, item) => sum + parseFloat(item.totalExcludingTax || '0'), 0);
    totalVAT = invoiceItems.reduce((sum, item) => sum + parseFloat(item.taxAmount || '0'), 0);
    totalTTC = invoiceItems.reduce((sum, item) => sum + parseFloat(item.totalIncludingTax || '0'), 0);
    vatRate = invoiceItems.length > 0 ? parseFloat(invoiceItems[0].taxRate || '20') : 20;
  } else {
    const priceHT = parseFloat(invoice.priceExcludingTax || invoice.amount || '0');
    vatRate = parseFloat(invoice.taxRate || '20');
    const vatAmount = parseFloat(invoice.taxAmount || (priceHT * vatRate / 100).toFixed(2));
    totalHT = priceHT;
    totalVAT = vatAmount;
    totalTTC = totalHT + totalVAT;
  }
  
  const totalsBoxWidth = 90;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  
  doc.text('Total HT', totalsBoxX, finalY);
  doc.text(`${totalHT.toFixed(2)} €`, pageWidth - margin, finalY, { align: 'right' });
  
  doc.setDrawColor(...COLORS.border);
  doc.line(totalsBoxX, finalY + 3, pageWidth - margin, finalY + 3);
  
  doc.text(`TVA (${vatRate.toFixed(0)}%)`, totalsBoxX, finalY + 10);
  doc.text(`${totalVAT.toFixed(2)} €`, pageWidth - margin, finalY + 10, { align: 'right' });
  
  doc.line(totalsBoxX, finalY + 13, pageWidth - margin, finalY + 13);
  
  // Total TTC with highlight - extended to right margin
  drawRoundedRect(doc, totalsBoxX - 5, finalY + 16, totalsBoxWidth + 5, 12, 2, COLORS.primary);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('Total TTC', totalsBoxX, finalY + 24);
  doc.text(`${totalTTC.toFixed(2)} €`, pageWidth - margin - 3, finalY + 24, { align: 'right' });
  
  // === FOOTER ===
  const footerY = pageHeight - 35;
  
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('COORDONNÉES BANCAIRES', pageWidth / 2, footerY + 7, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);
  doc.text(`${COMPANY_INFO.bankName}  |  IBAN: ${COMPANY_INFO.iban}  |  BIC: ${COMPANY_INFO.swift}`, pageWidth / 2, footerY + 13, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`SIRET: ${COMPANY_INFO.siret}  •  TVA Intracommunautaire: ${COMPANY_INFO.tva}`, pageWidth / 2, footerY + 19, { align: 'center' });
  doc.text(`${COMPANY_INFO.address}, ${COMPANY_INFO.city}  •  ${COMPANY_INFO.phone}  •  ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 24, { align: 'center' });
  
  if (returnDoc) return doc;
  doc.save(`facture-${invoice.invoiceNumber}.pdf`);
}

export async function generateLabelsPDF(invoiceOrQuote: Invoice | Quote, type: 'invoice' | 'quote') {
  const doc = new jsPDF();
  
  const docNumber = type === 'invoice' 
    ? (invoiceOrQuote as Invoice).invoiceNumber
    : `DV-${new Date().getFullYear()}-${invoiceOrQuote.id.slice(0, 6).toUpperCase()}`;
  
  const labels = [
    { position: 'AVG', name: 'AVANT GAUCHE' },
    { position: 'AVD', name: 'AVANT DROITE' },
    { position: 'ARG', name: 'ARRIÈRE GAUCHE' },
    { position: 'ARD', name: 'ARRIÈRE DROITE' },
    { position: 'CLÉ', name: 'CLÉ VÉHICULE' }
  ];
  
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const labelHeight = pageHeight / 5;
  const qrSize = 45;
  
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const yPos = i * labelHeight;
    const centerY = yPos + labelHeight / 2;
    
    const qrData = `${docNumber}-${label.position}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
    });
    
    // Label background
    drawRoundedRect(doc, 12, yPos + 8, pageWidth - 24, labelHeight - 16, 4, COLORS.lightGray, COLORS.border);
    
    // QR code with border
    drawRoundedRect(doc, 18, centerY - qrSize / 2 - 2, qrSize + 4, qrSize + 4, 2, COLORS.white, COLORS.border);
    doc.addImage(qrCodeDataUrl, 'PNG', 20, centerY - qrSize / 2, qrSize, qrSize);
    
    // Position badge
    const badgeX = 80;
    drawRoundedRect(doc, badgeX, centerY - 12, 50, 24, 3, COLORS.primary);
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(label.position, badgeX + 25, centerY + 2, { align: 'center' });
    
    // Full name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(label.name, 145, centerY - 5, { align: 'center' });
    
    // Document number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text(docNumber, 145, centerY + 8, { align: 'center' });
  }
  
  const fileName = type === 'invoice' 
    ? `etiquettes-facture-${docNumber}.pdf`
    : `etiquettes-devis-${docNumber}.pdf`;
  doc.save(fileName);
}
