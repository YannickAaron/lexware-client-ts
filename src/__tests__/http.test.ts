import { describe, expect, it } from 'vitest';
import { HttpClient } from '../http.js';
import { createMockFetch } from './helpers/mock-fetch.js';

function createClient(
  responses: Parameters<typeof createMockFetch>[0],
  config?: Partial<{ maxRetries: number; timeout: number }>,
) {
  const mock = createMockFetch(responses);
  const http = new HttpClient({
    baseUrl: 'https://api.lexware.io/v1',
    apiKey: 'test-api-key',
    maxRetries: config?.maxRetries ?? 0,
    rateLimitPerSecond: 100,
    timeout: config?.timeout ?? 30000,
    fetch: mock.fetch,
  });
  return { http, mock };
}

describe('HttpClient', () => {
  describe('authentication', () => {
    it('sends Authorization header with Bearer token', async () => {
      const { http, mock } = createClient({ status: 200, body: { id: '1' } });

      await http.get('/invoices/1');

      expect(mock.calls[0]?.init?.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      );
    });
  });

  describe('URL building', () => {
    it('builds full URL from base and path', async () => {
      const { http, mock } = createClient({ status: 200, body: {} });

      await http.get('/invoices/123');

      expect(mock.calls[0]?.url).toBe('https://api.lexware.io/v1/invoices/123');
    });

    it('appends query parameters', async () => {
      const { http, mock } = createClient({ status: 200, body: {} });

      await http.get('/invoices', { params: { page: 0, size: 25 } });

      const call = mock.calls[0];
      const url = new URL(call?.url ?? '');
      expect(url.searchParams.get('page')).toBe('0');
      expect(url.searchParams.get('size')).toBe('25');
    });

    it('omits undefined and null params', async () => {
      const { http, mock } = createClient({ status: 200, body: {} });

      await http.get('/invoices', { params: { page: 0, filter: undefined, name: null } });

      const call = mock.calls[0];
      const url = new URL(call?.url ?? '');
      expect(url.searchParams.get('page')).toBe('0');
      expect(url.searchParams.has('filter')).toBe(false);
      expect(url.searchParams.has('name')).toBe(false);
    });
  });

  describe('successful responses', () => {
    it('returns success with parsed data on 200', async () => {
      const { http } = createClient({ status: 200, body: { id: '123', name: 'Test' } });

      const result = await http.get<{ id: string; name: string }>('/test');

      expect(result).toEqual({
        success: true,
        data: { id: '123', name: 'Test' },
      });
    });

    it('returns success with undefined data on 204', async () => {
      const { http } = createClient({ status: 204 });

      const result = await http.delete('/test/123');

      expect(result).toEqual({ success: true, data: undefined });
    });

    it('sends JSON body for POST requests', async () => {
      const { http, mock } = createClient({ status: 201, body: { id: 'new' } });

      await http.post('/invoices', { name: 'Invoice 1' });

      const body = mock.calls[0]?.init?.body;
      expect(body).toBe(JSON.stringify({ name: 'Invoice 1' }));
    });

    it('sends JSON body for PUT requests', async () => {
      const { http, mock } = createClient({ status: 200, body: { id: '1' } });

      await http.put('/invoices/1', { name: 'Updated' });

      const body = mock.calls[0]?.init?.body;
      expect(body).toBe(JSON.stringify({ name: 'Updated' }));
    });
  });

  describe('error responses', () => {
    it('returns failure with correct error code for 400', async () => {
      const { http } = createClient({
        status: 400,
        body: { message: 'Validation failed', details: [{ field: 'name', message: 'required' }] },
      });

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('BAD_REQUEST');
        expect(result.error.status).toBe(400);
        expect(result.error.message).toBe('Validation failed');
        expect(result.error.details).toEqual([{ field: 'name', message: 'required' }]);
      }
    });

    it('returns failure with correct error code for 401', async () => {
      const { http } = createClient({
        status: 401,
        body: { message: 'Unauthorized' },
      });

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('returns failure with correct error code for 404', async () => {
      const { http } = createClient({
        status: 404,
        body: { message: 'Not found' },
      });

      const result = await http.get('/test/nonexistent');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.status).toBe(404);
      }
    });

    it('returns failure with correct error code for 409', async () => {
      const { http } = createClient({
        status: 409,
        body: { message: 'Conflict' },
      });

      const result = await http.put('/test/1', {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFLICT');
      }
    });

    it('handles non-JSON error bodies gracefully', async () => {
      const mock = createMockFetch({ status: 500, body: undefined });
      // Override to return non-JSON
      const customFetch = async (input: string | URL | Request, init?: RequestInit) => {
        return new Response('Internal Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'text/plain' },
        });
      };

      const http = new HttpClient({
        baseUrl: 'https://api.lexware.io/v1',
        apiKey: 'test',
        maxRetries: 0,
        rateLimitPerSecond: 100,
        timeout: 30000,
        fetch: customFetch as typeof globalThis.fetch,
      });

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_SERVER');
        expect(result.error.message).toContain('500');
      }
    });
  });

  describe('retries', () => {
    it('retries on 429 and succeeds', async () => {
      const { http, mock } = createClient(
        [
          { status: 429, body: { message: 'Rate limited' }, headers: { 'Retry-After': '0' } },
          { status: 200, body: { id: '1' } },
        ],
        { maxRetries: 1 },
      );

      const result = await http.get('/test');

      expect(result.success).toBe(true);
      expect(mock.calls).toHaveLength(2);
    });

    it('retries on 500 and succeeds', async () => {
      const { http, mock } = createClient(
        [
          { status: 500, body: { message: 'Server error' } },
          { status: 200, body: { id: '1' } },
        ],
        { maxRetries: 1 },
      );

      const result = await http.get('/test');

      expect(result.success).toBe(true);
      expect(mock.calls).toHaveLength(2);
    });

    it('stops retrying after maxRetries', async () => {
      const { http, mock } = createClient(
        { status: 500, body: { message: 'Server error' } },
        { maxRetries: 2 },
      );

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      // 1 initial + 2 retries = 3
      expect(mock.calls).toHaveLength(3);
    });

    it('does not retry on 400', async () => {
      const { http, mock } = createClient(
        { status: 400, body: { message: 'Bad request' } },
        { maxRetries: 3 },
      );

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      expect(mock.calls).toHaveLength(1);
    });

    it('does not retry on 401', async () => {
      const { http, mock } = createClient(
        { status: 401, body: { message: 'Unauthorized' } },
        { maxRetries: 3 },
      );

      const result = await http.get('/test');

      expect(result.success).toBe(false);
      expect(mock.calls).toHaveLength(1);
    });
  });

  describe('pagination', () => {
    it('iterates through multiple pages', async () => {
      const { http } = createClient([
        {
          status: 200,
          body: {
            content: [{ id: '1' }, { id: '2' }],
            last: false,
            totalPages: 2,
            totalElements: 4,
            numberOfElements: 2,
            size: 250,
            number: 0,
            first: true,
          },
        },
        {
          status: 200,
          body: {
            content: [{ id: '3' }, { id: '4' }],
            last: true,
            totalPages: 2,
            totalElements: 4,
            numberOfElements: 2,
            size: 250,
            number: 1,
            first: false,
          },
        },
      ]);

      const items: Array<{ id: string }> = [];
      for await (const item of http.paginate<{ id: string }>('/test')) {
        items.push(item);
      }

      expect(items).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
    });

    it('handles single page results', async () => {
      const { http } = createClient({
        status: 200,
        body: {
          content: [{ id: '1' }],
          last: true,
          totalPages: 1,
          totalElements: 1,
          numberOfElements: 1,
          size: 250,
          number: 0,
          first: true,
        },
      });

      const items: Array<{ id: string }> = [];
      for await (const item of http.paginate<{ id: string }>('/test')) {
        items.push(item);
      }

      expect(items).toEqual([{ id: '1' }]);
    });

    it('handles empty results', async () => {
      const { http } = createClient({
        status: 200,
        body: {
          content: [],
          last: true,
          totalPages: 0,
          totalElements: 0,
          numberOfElements: 0,
          size: 250,
          number: 0,
          first: true,
        },
      });

      const items: Array<{ id: string }> = [];
      for await (const item of http.paginate<{ id: string }>('/test')) {
        items.push(item);
      }

      expect(items).toEqual([]);
    });

    it('throws on pagination error', async () => {
      const { http } = createClient({
        status: 401,
        body: { message: 'Unauthorized' },
      });

      const items: unknown[] = [];
      await expect(async () => {
        for await (const item of http.paginate('/test')) {
          items.push(item);
        }
      }).rejects.toThrow('Pagination failed');
    });
  });
});
