import { RateLimiter } from './rate-limiter.js';
import { type LexwareError, mapStatusToErrorCode } from './errors.js';
import { type LexwareResult, ok, fail } from './types/result.js';
import type { Page } from './types/pagination.js';

/** Configuration for the HTTP client used internally by the Lexware API client. */
export type HttpClientConfig = {
  baseUrl: string;
  apiKey: string;
  maxRetries: number;
  rateLimitPerSecond: number;
  timeout: number;
  fetch?: typeof globalThis.fetch;
};

/** Optional parameters for HTTP requests such as query params, headers, and abort signal. */
export type RequestOptions = {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/** Rate-limited HTTP client with automatic retries and error handling. */
export class HttpClient {
  private readonly config: HttpClientConfig;
  private readonly rateLimiter: RateLimiter;
  private readonly fetchFn: typeof globalThis.fetch;

  constructor(config: HttpClientConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimitPerSecond);
    this.fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Sends a GET request and returns the parsed JSON response. */
  async get<T>(path: string, options?: RequestOptions): Promise<LexwareResult<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  /** Sends a POST request with a JSON body. */
  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<LexwareResult<T>> {
    return this.request<T>('POST', path, body, options);
  }

  /** Sends a PUT request with a JSON body. */
  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<LexwareResult<T>> {
    return this.request<T>('PUT', path, body, options);
  }

  /** Sends a DELETE request. */
  async delete<T = void>(path: string, options?: RequestOptions): Promise<LexwareResult<T>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  /** Sends a GET request and returns the response as a Blob. */
  async getBlob(path: string, options?: RequestOptions): Promise<LexwareResult<Blob>> {
    return this.requestBlob(path, options);
  }

  /** Sends a POST request with FormData (e.g. for file uploads). */
  async postFormData<T>(
    path: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<LexwareResult<T>> {
    return this.requestFormData<T>('POST', path, formData, options);
  }

  /** Auto-paginates a GET endpoint, yielding each item across all pages. */
  async *paginate<T>(path: string, params?: Record<string, unknown>): AsyncGenerator<T> {
    let page = 0;
    while (true) {
      const result = await this.get<Page<T>>(path, {
        params: { ...params, page, size: 250 },
      });
      if (!result.success) {
        throw new Error(`Pagination failed: ${result.error.code} - ${result.error.message}`);
      }
      for (const item of result.data.content) {
        yield item;
      }
      if (result.data.last) break;
      page++;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
    attempt = 0,
  ): Promise<LexwareResult<T>> {
    await this.rateLimiter.acquire();

    const url = this.buildUrl(path, options?.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (response.status === 204) {
          return ok(undefined as T);
        }
        const data = (await response.json()) as T;
        return ok(data);
      }

      if (this.isRetryable(response.status) && attempt < this.config.maxRetries) {
        const delay = this.getRetryDelay(response, attempt);
        await sleep(delay);
        return this.request<T>(method, path, body, options, attempt + 1);
      }

      const error = await this.parseErrorBody(response);
      return fail(error);
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < this.config.maxRetries) {
        await sleep(this.getBackoffDelay(attempt));
        return this.request<T>(method, path, body, options, attempt + 1);
      }

      return fail({
        code: 'NETWORK_ERROR',
        status: 0,
        message: err instanceof Error ? err.message : 'Unknown network error',
      });
    }
  }

  private async requestBlob(
    path: string,
    options?: RequestOptions,
    attempt = 0,
  ): Promise<LexwareResult<Blob>> {
    await this.rateLimiter.acquire();

    const url = this.buildUrl(path, options?.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: '*/*',
          ...options?.headers,
        },
        signal: options?.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        return ok(blob);
      }

      if (this.isRetryable(response.status) && attempt < this.config.maxRetries) {
        const delay = this.getRetryDelay(response, attempt);
        await sleep(delay);
        return this.requestBlob(path, options, attempt + 1);
      }

      const error = await this.parseErrorBody(response);
      return fail(error);
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < this.config.maxRetries) {
        await sleep(this.getBackoffDelay(attempt));
        return this.requestBlob(path, options, attempt + 1);
      }

      return fail({
        code: 'NETWORK_ERROR',
        status: 0,
        message: err instanceof Error ? err.message : 'Unknown network error',
      });
    }
  }

  private async requestFormData<T>(
    method: string,
    path: string,
    formData: FormData,
    options?: RequestOptions,
    attempt = 0,
  ): Promise<LexwareResult<T>> {
    await this.rateLimiter.acquire();

    const url = this.buildUrl(path, options?.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
          ...options?.headers,
        },
        body: formData,
        signal: options?.signal ?? controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        if (response.status === 204) {
          return ok(undefined as T);
        }
        const data = (await response.json()) as T;
        return ok(data);
      }

      if (this.isRetryable(response.status) && attempt < this.config.maxRetries) {
        const delay = this.getRetryDelay(response, attempt);
        await sleep(delay);
        return this.requestFormData<T>(method, path, formData, options, attempt + 1);
      }

      const error = await this.parseErrorBody(response);
      return fail(error);
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < this.config.maxRetries) {
        await sleep(this.getBackoffDelay(attempt));
        return this.requestFormData<T>(method, path, formData, options, attempt + 1);
      }

      return fail({
        code: 'NETWORK_ERROR',
        status: 0,
        message: err instanceof Error ? err.message : 'Unknown network error',
      });
    }
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const fullUrl = `${this.config.baseUrl}${path}`;
    const urlObj = new URL(fullUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.set(key, String(value));
        }
      }
    }
    return urlObj.toString();
  }

  private isRetryable(status: number): boolean {
    return [429, 500, 503, 504].includes(status);
  }

  private getRetryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = Number.parseInt(retryAfter, 10);
      if (!Number.isNaN(seconds)) return seconds * 1000;
    }
    return this.getBackoffDelay(attempt);
  }

  private getBackoffDelay(attempt: number): number {
    const base = 500 * 2 ** attempt;
    const jitter = Math.random() * base * 0.5;
    return base + jitter;
  }

  private async parseErrorBody(response: Response): Promise<LexwareError> {
    try {
      const body = (await response.json()) as Record<string, unknown>;
      return {
        code: mapStatusToErrorCode(response.status),
        status: response.status,
        message:
          typeof body.message === 'string'
            ? body.message
            : `HTTP ${response.status}: ${response.statusText}`,
        traceId: typeof body.traceId === 'string' ? body.traceId : undefined,
        timestamp: typeof body.timestamp === 'string' ? body.timestamp : undefined,
        path: typeof body.path === 'string' ? body.path : undefined,
        details: Array.isArray(body.details)
          ? (body.details as LexwareError['details'])
          : undefined,
      };
    } catch {
      return {
        code: mapStatusToErrorCode(response.status),
        status: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
