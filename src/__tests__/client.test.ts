import { describe, it, expect } from 'vitest';
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
});
