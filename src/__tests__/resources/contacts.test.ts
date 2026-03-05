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

describe('ContactsResource', () => {
  describe('create', () => {
    it('sends POST to /contacts', async () => {
      const { client, mock } = createTestClient({
        status: 201,
        body: { id: 'contact-1', resourceUri: 'https://api.lexware.io/v1/contacts/contact-1' },
      });

      const result = await client.contacts.create({
        version: 0,
        roles: { customer: {} },
        company: { name: 'Test GmbH' },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('contact-1');
      }
      expect(mock.calls[0]?.init?.method).toBe('POST');
      expect(mock.calls[0]?.url).toContain('/contacts');
    });
  });

  describe('get', () => {
    it('retrieves a contact by ID', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: {
          id: 'contact-1',
          version: 0,
          roles: { customer: { number: 10001 } },
          company: { name: 'Test GmbH' },
        },
      });

      const result = await client.contacts.get('contact-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company?.name).toBe('Test GmbH');
      }
      expect(mock.calls[0]?.url).toContain('/contacts/contact-1');
    });
  });

  describe('update', () => {
    it('sends PUT to /contacts/{id}', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: { id: 'contact-1', version: 1 },
      });

      const result = await client.contacts.update('contact-1', {
        version: 0,
        roles: { customer: {} },
        company: { name: 'Updated GmbH' },
      });

      expect(result.success).toBe(true);
      expect(mock.calls[0]?.init?.method).toBe('PUT');
      expect(mock.calls[0]?.url).toContain('/contacts/contact-1');
    });
  });

  describe('list', () => {
    it('lists contacts with filter', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: {
          content: [{ id: 'c-1' }, { id: 'c-2' }],
          totalElements: 2,
          totalPages: 1,
          last: true,
          first: true,
          size: 25,
          number: 0,
          numberOfElements: 2,
        },
      });

      const result = await client.contacts.list({ customer: true, page: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toHaveLength(2);
      }
      const call = mock.calls[0];
      const url = new URL(call?.url ?? '');
      expect(url.searchParams.get('customer')).toBe('true');
    });
  });

  describe('listAll', () => {
    it('iterates all contacts', async () => {
      const { client } = createTestClient({
        status: 200,
        body: {
          content: [{ id: 'c-1' }, { id: 'c-2' }],
          last: true,
          totalPages: 1,
          totalElements: 2,
          numberOfElements: 2,
          size: 250,
          number: 0,
          first: true,
        },
      });

      const contacts: unknown[] = [];
      for await (const c of client.contacts.listAll()) {
        contacts.push(c);
      }

      expect(contacts).toHaveLength(2);
    });
  });
});
