import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  it('allows immediate requests up to bucket size', async () => {
    const limiter = new RateLimiter(2);

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  });

  it('delays requests that exceed the rate limit', async () => {
    const limiter = new RateLimiter(2);

    // Exhaust tokens
    await limiter.acquire();
    await limiter.acquire();

    // Third request should be delayed
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // Should wait ~500ms for 2 req/sec (1 token = 500ms)
    expect(elapsed).toBeGreaterThanOrEqual(400);
    expect(elapsed).toBeLessThan(1500);
  });

  it('refills tokens over time', async () => {
    const limiter = new RateLimiter(2);

    // Exhaust tokens
    await limiter.acquire();
    await limiter.acquire();

    // Wait for refill
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Should now be able to acquire immediately
    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100);
  });
});
