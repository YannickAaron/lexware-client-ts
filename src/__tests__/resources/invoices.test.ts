import { describe, expect, it } from 'vitest';
import { LexwareClient } from '../../client.js';
import { createMockFetch } from '../helpers/mock-fetch.js';

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

describe('InvoicesResource', () => {
  describe('create', () => {
    it('sends POST to /invoices', async () => {
      const { client, mock } = createTestClient({
        status: 201,
        body: { id: 'inv-1', resourceUri: 'https://api.lexware.io/v1/invoices/inv-1' },
      });

      const result = await client.invoices.create({
        voucherDate: '2024-01-15T00:00:00.000+01:00',
        address: { name: 'Test GmbH' },
        lineItems: [
          {
            type: 'custom',
            name: 'Item 1',
            quantity: 1,
            unitName: 'piece',
            unitPrice: { currency: 'EUR', netAmount: 100, taxRatePercentage: 19 },
          },
        ],
        totalPrice: { currency: 'EUR' },
        taxConditions: { taxType: 'net' },
        shippingConditions: { shippingType: 'service' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('inv-1');
      }
      expect(mock.calls[0]?.init?.method).toBe('POST');
      expect(mock.calls[0]?.url).toContain('/invoices');
    });

    it('adds finalize query param when requested', async () => {
      const { client, mock } = createTestClient({
        status: 201,
        body: { id: 'inv-1' },
      });

      await client.invoices.create(
        {
          voucherDate: '2024-01-15T00:00:00.000+01:00',
          address: { name: 'Test' },
          lineItems: [],
          totalPrice: { currency: 'EUR' },
          taxConditions: { taxType: 'net' },
          shippingConditions: { shippingType: 'service' },
        },
        { finalize: true },
      );

      const call = mock.calls[0];
      const url = new URL(call?.url ?? '');
      expect(url.searchParams.get('finalize')).toBe('true');
    });
  });

  describe('get', () => {
    it('sends GET to /invoices/{id}', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: {
          id: 'inv-1',
          voucherNumber: 'RE-001',
          voucherStatus: 'open',
        },
      });

      const result = await client.invoices.get('inv-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('inv-1');
        expect(result.data.voucherNumber).toBe('RE-001');
      }
      expect(mock.calls[0]?.url).toContain('/invoices/inv-1');
      expect(mock.calls[0]?.init?.method).toBe('GET');
    });

    it('returns failure for non-existent invoice', async () => {
      const { client } = createTestClient({
        status: 404,
        body: { message: 'Invoice not found' },
      });

      const result = await client.invoices.get('nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('list', () => {
    it('sends GET to /invoices with filter params', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: {
          content: [{ id: 'inv-1' }, { id: 'inv-2' }],
          totalElements: 2,
          totalPages: 1,
          last: true,
          first: true,
          size: 25,
          number: 0,
          numberOfElements: 2,
        },
      });

      const result = await client.invoices.list({ voucherStatus: 'open', page: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toHaveLength(2);
        expect(result.data.totalElements).toBe(2);
      }
      const call = mock.calls[0];
      const url = new URL(call?.url ?? '');
      expect(url.searchParams.get('voucherStatus')).toBe('open');
      expect(url.searchParams.get('page')).toBe('0');
    });
  });

  describe('renderDocument', () => {
    it('sends GET to /invoices/{id}/document', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: { documentFileId: 'file-123' },
      });

      const result = await client.invoices.renderDocument('inv-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.documentFileId).toBe('file-123');
      }
      expect(mock.calls[0]?.url).toContain('/invoices/inv-1/document');
    });
  });

  describe('listAll', () => {
    it('iterates through all pages', async () => {
      const { client } = createTestClient([
        {
          status: 200,
          body: {
            content: [{ id: 'inv-1' }],
            last: false,
            totalPages: 2,
            totalElements: 2,
            numberOfElements: 1,
            size: 250,
            number: 0,
            first: true,
          },
        },
        {
          status: 200,
          body: {
            content: [{ id: 'inv-2' }],
            last: true,
            totalPages: 2,
            totalElements: 2,
            numberOfElements: 1,
            size: 250,
            number: 1,
            first: false,
          },
        },
      ]);

      const invoices: Array<{ id: string }> = [];
      for await (const inv of client.invoices.listAll()) {
        invoices.push(inv as { id: string });
      }

      expect(invoices).toEqual([{ id: 'inv-1' }, { id: 'inv-2' }]);
    });
  });
});
