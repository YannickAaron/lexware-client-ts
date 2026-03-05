import { describe, expect, it } from 'vitest';
import { LexwareClient } from '../client.js';
import { createMockFetch } from './helpers/mock-fetch.js';

function createTestClient() {
  const mock = createMockFetch({ status: 200, body: {} });
  const client = new LexwareClient({
    apiKey: 'test-key',
    fetch: mock.fetch,
    rateLimitPerSecond: 100,
  });
  return { client, mock };
}

describe('LexwareClient', () => {
  it('exposes all resource namespaces', () => {
    const { client } = createTestClient();

    expect(client.articles).toBeDefined();
    expect(client.contacts).toBeDefined();
    expect(client.invoices).toBeDefined();
    expect(client.creditNotes).toBeDefined();
    expect(client.deliveryNotes).toBeDefined();
    expect(client.quotations).toBeDefined();
    expect(client.orderConfirmations).toBeDefined();
    expect(client.dunnings).toBeDefined();
    expect(client.downPaymentInvoices).toBeDefined();
    expect(client.vouchers).toBeDefined();
    expect(client.voucherlist).toBeDefined();
    expect(client.recurringTemplates).toBeDefined();
    expect(client.payments).toBeDefined();
    expect(client.countries).toBeDefined();
    expect(client.paymentConditions).toBeDefined();
    expect(client.postingCategories).toBeDefined();
    expect(client.printLayouts).toBeDefined();
    expect(client.profile).toBeDefined();
    expect(client.files).toBeDefined();
    expect(client.eventSubscriptions).toBeDefined();
  });

  it('returns same instance on repeated access (lazy singleton)', () => {
    const { client } = createTestClient();

    const invoices1 = client.invoices;
    const invoices2 = client.invoices;

    expect(invoices1).toBe(invoices2);
  });

  describe('verifyApiKey', () => {
    it('returns success with org info for valid key', async () => {
      const mock = createMockFetch({
        status: 200,
        body: {
          organizationId: 'org-123',
          companyName: 'Acme GmbH',
          taxType: 'net',
          smallBusiness: false,
        },
      });
      const client = new LexwareClient({
        apiKey: 'valid-key',
        fetch: mock.fetch,
        rateLimitPerSecond: 100,
        maxRetries: 0,
      });

      const status = await client.verifyApiKey();

      expect(status.success).toBe(true);
      if (status.success) {
        expect(status.organizationId).toBe('org-123');
        expect(status.companyName).toBe('Acme GmbH');
      }
    });

    it('returns failure for invalid key', async () => {
      const mock = createMockFetch({
        status: 401,
        body: { message: 'Unauthorized' },
      });
      const client = new LexwareClient({
        apiKey: 'bad-key',
        fetch: mock.fetch,
        rateLimitPerSecond: 100,
        maxRetries: 0,
      });

      const status = await client.verifyApiKey();

      expect(status.success).toBe(false);
      if (!status.success) {
        expect(status.error).toBeDefined();
      }
    });
  });
});
