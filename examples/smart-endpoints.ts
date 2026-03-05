// Smart composite endpoints example — run with: npx tsx examples/smart-endpoints.ts

import { LexwareClient, isSuccess } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({
  apiKey: process.env.LEXWARE_API_KEY!,
});

// --- 1. Create and finalize an invoice in one call ---
// Creates the invoice, finalizes it, and renders the PDF document.
const result = await client.composites.createAndFinalizeInvoice({
  voucherDate: '2025-03-01',
  address: { contactId: 'your-contact-id' },
  lineItems: [
    {
      type: 'custom',
      name: 'Consulting',
      quantity: 5,
      unitName: 'hours',
      unitPrice: { currency: 'EUR', netAmount: 150, taxRatePercentage: 19 },
    },
  ],
  totalPrice: { currency: 'EUR' },
  taxConditions: { taxType: 'net' },
  shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
});

if (isSuccess(result)) {
  console.log('Invoice ID:', result.data.id);
  console.log('Document File ID:', result.data.documentFileId);
}

// --- 2. Get an invoice with its linked contact ---
const invoiceWithContact = await client.composites.getInvoiceWithContact('invoice-id');

if (isSuccess(invoiceWithContact)) {
  const { invoice, contact } = invoiceWithContact.data;
  console.log(`Invoice ${invoice.voucherNumber} for ${contact?.company?.name}`);
}

// --- 3. Get a contact with all their invoices ---
const contactData = await client.composites.getContactWithInvoices('contact-id', {
  voucherDateFrom: '2025-01-01',
  voucherDateTo: '2025-12-31',
});

if (isSuccess(contactData)) {
  const { contact, invoices } = contactData.data;
  console.log(`${contact.company?.name}: ${invoices.length} invoices`);
}

// --- 4. Get all outstanding invoices with payment info ---
const outstanding = await client.composites.getOutstandingInvoices();

if (isSuccess(outstanding)) {
  for (const { invoice, payment } of outstanding.data) {
    console.log(
      `${invoice.voucherNumber}: ${invoice.totalAmount} EUR — open: ${payment?.openAmount ?? 'N/A'}`,
    );
  }
}

// --- 5. Create an invoice from article IDs ---
// Fetches each article, builds line items, and creates the invoice automatically.
const fromArticles = await client.composites.createInvoiceFromArticles({
  voucherDate: '2025-03-01',
  address: { contactId: 'your-contact-id' },
  articles: [
    { articleId: 'article-id-1', quantity: 2 },
    { articleId: 'article-id-2', quantity: 1, discountPercentage: 10 },
  ],
  taxConditions: { taxType: 'net' },
  shippingConditions: { shippingType: 'delivery', shippingDate: '2025-03-15' },
  finalize: true,
});

if (isSuccess(fromArticles)) {
  console.log('Created invoice from articles:', fromArticles.data.id);
}

// --- 6. Get revenue summary for a contact ---
const revenue = await client.composites.getRevenueByContact('contact-id', {
  from: '2024-01-01',
  to: '2024-12-31',
});

if (isSuccess(revenue)) {
  const { contact, totalRevenue, invoiceCount } = revenue.data;
  console.log(`${contact.company?.name}: ${totalRevenue} EUR from ${invoiceCount} invoices`);
}
