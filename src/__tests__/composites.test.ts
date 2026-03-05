import { describe, it, expect } from 'vitest';
import { LexwareClient } from '../client.js';
import { createMockFetch } from './helpers/mock-fetch.js';

function createTestClient(responses: Parameters<typeof createMockFetch>[0]) {
  const mock = createMockFetch(responses);
  const client = new LexwareClient({
    apiKey: 'test-key',
    fetch: mock.fetch,
    rateLimitPerSecond: 100,
    maxRetries: 0,
  });
  return { client, mock };
}

describe('CompositesResource', () => {
  describe('createAndFinalizeInvoice', () => {
    it('creates, finalizes, and renders the document', async () => {
      const { client, mock } = createTestClient([
        {
          status: 201,
          body: {
            id: 'inv-1',
            resourceUri: 'https://api.lexware.io/v1/invoices/inv-1',
            createdDate: '2025-03-01',
            updatedDate: '2025-03-01',
            version: 1,
          },
        },
        {
          status: 200,
          body: { documentFileId: 'doc-123' },
        },
      ]);

      const result = await client.composites.createAndFinalizeInvoice({
        voucherDate: '2025-03-01',
        address: { name: 'Test' },
        lineItems: [],
        totalPrice: { currency: 'EUR' },
        taxConditions: { taxType: 'net' },
        shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('inv-1');
        expect(result.data.documentFileId).toBe('doc-123');
      }

      // First call: POST /invoices?finalize=true
      expect(mock.calls[0]?.init?.method).toBe('POST');
      expect(mock.calls[0]?.url).toContain('finalize=true');

      // Second call: GET /invoices/inv-1/document
      expect(mock.calls[1]?.init?.method).toBe('GET');
      expect(mock.calls[1]?.url).toContain('/invoices/inv-1/document');
    });

    it('returns failure if create fails', async () => {
      const { client } = createTestClient({
        status: 400,
        body: { message: 'Invalid invoice' },
      });

      const result = await client.composites.createAndFinalizeInvoice({
        voucherDate: '2025-03-01',
        address: { name: 'Test' },
        lineItems: [],
        totalPrice: { currency: 'EUR' },
        taxConditions: { taxType: 'net' },
        shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BAD_REQUEST');
      }
    });
  });

  describe('getInvoiceWithContact', () => {
    it('fetches invoice and its linked contact', async () => {
      const { client } = createTestClient([
        {
          status: 200,
          body: {
            id: 'inv-1',
            address: { contactId: 'contact-1', name: 'Acme' },
            voucherStatus: 'open',
          },
        },
        {
          status: 200,
          body: {
            id: 'contact-1',
            company: { name: 'Acme GmbH' },
            roles: { customer: {} },
          },
        },
      ]);

      const result = await client.composites.getInvoiceWithContact('inv-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.invoice.id).toBe('inv-1');
        expect(result.data.contact?.id).toBe('contact-1');
      }
    });

    it('returns null contact when no contactId', async () => {
      const { client } = createTestClient({
        status: 200,
        body: {
          id: 'inv-1',
          address: { name: 'Acme' },
          voucherStatus: 'open',
        },
      });

      const result = await client.composites.getInvoiceWithContact('inv-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contact).toBeNull();
      }
    });
  });

  describe('getContactWithInvoices', () => {
    it('fetches contact and their invoices from voucherlist', async () => {
      const { client } = createTestClient([
        // GET /contacts/contact-1
        {
          status: 200,
          body: {
            id: 'contact-1',
            company: { name: 'Acme GmbH' },
            roles: { customer: {} },
          },
        },
        // GET /voucherlist (single page)
        {
          status: 200,
          body: {
            content: [
              { id: 'inv-1', voucherNumber: 'RE-001', totalAmount: 1000 },
              { id: 'inv-2', voucherNumber: 'RE-002', totalAmount: 2000 },
            ],
            last: true,
            first: true,
            totalPages: 1,
            totalElements: 2,
            numberOfElements: 2,
            size: 250,
            number: 0,
          },
        },
      ]);

      const result = await client.composites.getContactWithInvoices('contact-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contact.id).toBe('contact-1');
        expect(result.data.invoices).toHaveLength(2);
      }
    });
  });

  describe('getOutstandingInvoices', () => {
    it('fetches open and overdue invoices with payments', async () => {
      const { client } = createTestClient([
        // GET /voucherlist for 'open' status
        {
          status: 200,
          body: {
            content: [{ id: 'inv-1', voucherNumber: 'RE-001', totalAmount: 500 }],
            last: true,
            first: true,
            totalPages: 1,
            totalElements: 1,
            numberOfElements: 1,
            size: 250,
            number: 0,
          },
        },
        // GET /payments/inv-1
        {
          status: 200,
          body: { openAmount: 500, paymentStatus: 'openRevenue', voucherId: 'inv-1' },
        },
        // GET /voucherlist for 'overdue' status
        {
          status: 200,
          body: {
            content: [],
            last: true,
            first: true,
            totalPages: 0,
            totalElements: 0,
            numberOfElements: 0,
            size: 250,
            number: 0,
          },
        },
      ]);

      const result = await client.composites.getOutstandingInvoices();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.invoice.id).toBe('inv-1');
        expect(result.data[0]?.payment?.openAmount).toBe(500);
      }
    });
  });

  describe('createInvoiceFromArticles', () => {
    it('fetches articles and creates an invoice from them', async () => {
      const { client, mock } = createTestClient([
        // GET /articles/art-1
        {
          status: 200,
          body: {
            id: 'art-1',
            title: 'Web Design',
            type: 'SERVICE',
            unitName: 'hours',
            price: { netPrice: 120, grossPrice: 142.8, taxRate: 19, currency: 'EUR', leadingPrice: 'net' },
          },
        },
        // GET /articles/art-2
        {
          status: 200,
          body: {
            id: 'art-2',
            title: 'Hosting',
            type: 'PRODUCT',
            unitName: 'months',
            price: { netPrice: 50, grossPrice: 59.5, taxRate: 19, currency: 'EUR', leadingPrice: 'net' },
          },
        },
        // POST /invoices
        {
          status: 201,
          body: { id: 'inv-new', resourceUri: 'https://api.lexware.io/v1/invoices/inv-new' },
        },
      ]);

      const result = await client.composites.createInvoiceFromArticles({
        voucherDate: '2025-03-01',
        address: { name: 'Client' },
        articles: [
          { articleId: 'art-1', quantity: 10 },
          { articleId: 'art-2', quantity: 12, discountPercentage: 5 },
        ],
        taxConditions: { taxType: 'net' },
        shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('inv-new');
      }

      // Verify the invoice body has correct line items
      const invoiceBody = JSON.parse(mock.calls[2]?.init?.body as string);
      expect(invoiceBody.lineItems).toHaveLength(2);
      expect(invoiceBody.lineItems[0].name).toBe('Web Design');
      expect(invoiceBody.lineItems[0].type).toBe('service');
      expect(invoiceBody.lineItems[0].quantity).toBe(10);
      expect(invoiceBody.lineItems[1].name).toBe('Hosting');
      expect(invoiceBody.lineItems[1].type).toBe('custom');
      expect(invoiceBody.lineItems[1].discountPercentage).toBe(5);
    });

    it('returns failure if an article fetch fails', async () => {
      const { client } = createTestClient({
        status: 404,
        body: { message: 'Article not found' },
      });

      const result = await client.composites.createInvoiceFromArticles({
        voucherDate: '2025-03-01',
        address: { name: 'Client' },
        articles: [{ articleId: 'nonexistent', quantity: 1 }],
        taxConditions: { taxType: 'net' },
        shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('getRevenueByContact', () => {
    it('aggregates revenue from paid invoices', async () => {
      const { client } = createTestClient([
        // GET /contacts/contact-1
        {
          status: 200,
          body: {
            id: 'contact-1',
            company: { name: 'Acme GmbH' },
            roles: { customer: {} },
          },
        },
        // GET /voucherlist (paid invoices)
        {
          status: 200,
          body: {
            content: [
              { id: 'inv-1', totalAmount: 1000 },
              { id: 'inv-2', totalAmount: 2500 },
              { id: 'inv-3', totalAmount: 750 },
            ],
            last: true,
            first: true,
            totalPages: 1,
            totalElements: 3,
            numberOfElements: 3,
            size: 250,
            number: 0,
          },
        },
      ]);

      const result = await client.composites.getRevenueByContact('contact-1', {
        from: '2024-01-01',
        to: '2024-12-31',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contact.id).toBe('contact-1');
        expect(result.data.totalRevenue).toBe(4250);
        expect(result.data.invoiceCount).toBe(3);
        expect(result.data.invoices).toHaveLength(3);
      }
    });
  });
});
