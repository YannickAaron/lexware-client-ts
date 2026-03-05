import { describe, it, expect } from 'vitest';
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

describe('ArticlesResource', () => {
  describe('create', () => {
    it('sends POST to /articles', async () => {
      const { client, mock } = createTestClient({
        status: 201,
        body: { id: 'art-1' },
      });

      const result = await client.articles.create({
        title: 'Widget',
        type: 'PRODUCT',
        price: {
          netPrice: 100,
          grossPrice: 119,
          leadingPrice: 'net',
          taxRate: 19,
          currency: 'EUR',
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('art-1');
      }
      expect(mock.calls[0]?.init?.method).toBe('POST');
    });
  });

  describe('get', () => {
    it('retrieves an article by ID', async () => {
      const { client } = createTestClient({
        status: 200,
        body: { id: 'art-1', title: 'Widget', type: 'PRODUCT' },
      });

      const result = await client.articles.get('art-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Widget');
        expect(result.data.type).toBe('PRODUCT');
      }
    });
  });

  describe('update', () => {
    it('sends PUT to /articles/{id}', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: { id: 'art-1', version: 1 },
      });

      await client.articles.update('art-1', {
        title: 'Updated Widget',
        type: 'PRODUCT',
        price: {
          netPrice: 150,
          grossPrice: 178.5,
          leadingPrice: 'net',
          taxRate: 19,
          currency: 'EUR',
        },
      });

      expect(mock.calls[0]?.init?.method).toBe('PUT');
      expect(mock.calls[0]?.url).toContain('/articles/art-1');
    });
  });

  describe('delete', () => {
    it('sends DELETE to /articles/{id}', async () => {
      const { client, mock } = createTestClient({ status: 204 });

      const result = await client.articles.delete('art-1');

      expect(result.success).toBe(true);
      expect(mock.calls[0]?.init?.method).toBe('DELETE');
      expect(mock.calls[0]?.url).toContain('/articles/art-1');
    });
  });

  describe('list', () => {
    it('lists articles with filters', async () => {
      const { client, mock } = createTestClient({
        status: 200,
        body: {
          content: [{ id: 'art-1' }],
          totalElements: 1,
          totalPages: 1,
          last: true,
          first: true,
          size: 25,
          number: 0,
          numberOfElements: 1,
        },
      });

      const result = await client.articles.list({ type: 'PRODUCT' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toHaveLength(1);
      }
      const url = new URL(mock.calls[0]!.url);
      expect(url.searchParams.get('type')).toBe('PRODUCT');
    });
  });

  describe('listAll', () => {
    it('iterates all articles', async () => {
      const { client } = createTestClient({
        status: 200,
        body: {
          content: [{ id: 'art-1' }, { id: 'art-2' }],
          last: true,
          totalPages: 1,
          totalElements: 2,
          numberOfElements: 2,
          size: 250,
          number: 0,
          first: true,
        },
      });

      const articles: unknown[] = [];
      for await (const a of client.articles.listAll()) {
        articles.push(a);
      }

      expect(articles).toHaveLength(2);
    });
  });
});
