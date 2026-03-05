export type MockResponse = {
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export function createMockFetch(responses: MockResponse | MockResponse[]) {
  const queue = Array.isArray(responses) ? [...responses] : [responses];
  let callIndex = 0;

  const calls: Array<{ url: string; init?: RequestInit }> = [];

  const mockFetch = async (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });

    const resp = queue[Math.min(callIndex++, queue.length - 1)] as MockResponse;

    const body = resp.body !== undefined ? JSON.stringify(resp.body) : null;

    return new Response(body, {
      status: resp.status,
      statusText: getStatusText(resp.status),
      headers: {
        'Content-Type': 'application/json',
        ...resp.headers,
      },
    });
  };

  return { fetch: mockFetch as typeof globalThis.fetch, calls };
}

function getStatusText(status: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return map[status] ?? 'Unknown';
}
