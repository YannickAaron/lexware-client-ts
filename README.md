# @yannickaaron/lexware-client-ts

Modern, type-safe TypeScript client for the [Lexware API](https://developers.lexware.io/docs/).

- **Zero dependencies** — uses native `fetch`, works in Node.js 18+, Next.js, and edge runtimes
- **Fully typed** — discriminated union results, typed error codes, autocomplete everywhere
- **Built-in rate limiting** — token bucket respects the API's 2 req/sec limit
- **Automatic retries** — exponential backoff on 429/500/503/504 with Retry-After support
- **Async pagination** — `for await...of` iterators for effortless page traversal
- **Smart endpoints** — composite methods that combine multiple API calls into one
- **Agent-friendly** — results are plain JSON objects, perfect for LangGraph/LangChain tools

## Install

```bash
npm install @yannickaaron/lexware-client-ts
```

## Quick Start

```typescript
import { LexwareClient } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({
  apiKey: process.env.LEXWARE_API_KEY!,
});

// Create an invoice
const result = await client.invoices.create({
  voucherDate: '2025-03-01',
  address: { name: 'Acme GmbH', countryCode: 'DE' },
  lineItems: [{
    type: 'custom',
    name: 'Consulting',
    quantity: 10,
    unitName: 'hours',
    unitPrice: { currency: 'EUR', netAmount: 150, taxRatePercentage: 19 },
  }],
  totalPrice: { currency: 'EUR' },
  taxConditions: { taxType: 'net' },
  shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
}, { finalize: true });

if (result.success) {
  console.log('Created invoice:', result.data.id);
} else {
  console.error('Error:', result.error.code, result.error.message);
}
```

## Result Type

Every method returns `LexwareResult<T>`, a discriminated union — **no exceptions to catch**:

```typescript
type LexwareResult<T> =
  | { success: true; data: T }
  | { success: false; error: LexwareError };
```

TypeScript narrows the type automatically:

```typescript
const result = await client.contacts.get('id');
if (result.success) {
  result.data.company?.name; // fully typed Contact
} else {
  result.error.code; // 'NOT_FOUND' | 'UNAUTHORIZED' | ...
  result.error.details; // field-level validation errors
}
```

### Type Guards

Convenience functions for checking results:

```typescript
import { isSuccess, isFailure, isTextLineItem } from '@yannickaaron/lexware-client-ts';

const result = await client.invoices.get('id');
if (isSuccess(result)) {
  // result.data is fully typed as Invoice
  for (const item of result.data.lineItems) {
    if (isTextLineItem(item)) {
      console.log('Text:', item.name);
    } else {
      console.log('Item:', item.name, item.quantity, item.unitPrice.netAmount);
    }
  }
}
```

## Error Handling

Errors are structured objects with typed error codes:

```typescript
const result = await client.invoices.create(invalidData);

if (!result.success) {
  switch (result.error.code) {
    case 'BAD_REQUEST':
      // Validation errors available in result.error.details
      for (const detail of result.error.details ?? []) {
        console.log(`${detail.field}: ${detail.message}`);
      }
      break;
    case 'UNAUTHORIZED':
      console.log('Check your API key');
      break;
    case 'RATE_LIMITED':
      console.log('Too many requests (auto-retry handles this)');
      break;
    case 'NOT_FOUND':
      console.log('Resource not found');
      break;
  }
}
```

**Error codes:** `BAD_REQUEST`, `UNAUTHORIZED`, `PAYMENT_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `NOT_ACCEPTABLE`, `CONFLICT`, `UNSUPPORTED_MEDIA`, `RATE_LIMITED`, `INTERNAL_SERVER`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`, `NETWORK_ERROR`, `UNKNOWN`

### Retry & Rate Limit Behavior

- **Rate limiting:** Built-in token bucket (default 2 req/sec) queues requests automatically
- **Retries:** On 429, 500, 503, 504 responses, retries up to 3 times with exponential backoff
- **Retry-After:** Respects the `Retry-After` header from the API
- **Network errors:** Retried with the same backoff strategy

## Pagination

### Single Page

```typescript
const page = await client.invoices.list({ page: 0, size: 25, voucherStatus: 'open' });
if (page.success) {
  console.log(`${page.data.numberOfElements} of ${page.data.totalElements} total`);
  for (const invoice of page.data.content) {
    console.log(invoice.voucherNumber);
  }
}
```

### Auto-Pagination

`listAll()` returns an async iterator that fetches pages in the background:

```typescript
for await (const invoice of client.invoices.listAll({ voucherStatus: 'open' })) {
  console.log(invoice.voucherNumber);
}

// Early exit — stops fetching when you break
for await (const contact of client.contacts.listAll({ customer: true })) {
  if (contact.company?.name === 'Target') break;
}
```

### Voucherlist (Cross-Type Search)

```typescript
for await (const item of client.voucherlist.listAll({
  voucherType: 'invoice',
  voucherStatus: 'overdue',
  voucherDateFrom: '2025-01-01',
  voucherDateTo: '2025-12-31',
})) {
  console.log(`${item.voucherNumber}: ${item.contactName} — ${item.totalAmount} EUR`);
}
```

## Smart Composite Endpoints

`client.composites` provides high-level workflows that combine multiple API calls:

### Create & Finalize Invoice

Creates, finalizes, and renders the PDF in one call:

```typescript
const result = await client.composites.createAndFinalizeInvoice({
  voucherDate: '2025-03-01',
  address: { contactId: 'contact-id' },
  lineItems: [{ type: 'custom', name: 'Work', quantity: 1, unitName: 'hr',
    unitPrice: { currency: 'EUR', netAmount: 100, taxRatePercentage: 19 } }],
  totalPrice: { currency: 'EUR' },
  taxConditions: { taxType: 'net' },
  shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
});
// result.data = { id, resourceUri, documentFileId, ... }
```

### Invoice with Contact

```typescript
const result = await client.composites.getInvoiceWithContact('invoice-id');
// result.data = { invoice: Invoice, contact: Contact | null }
```

### Contact with Invoices

```typescript
const result = await client.composites.getContactWithInvoices('contact-id', {
  voucherDateFrom: '2025-01-01',
  voucherDateTo: '2025-12-31',
});
// result.data = { contact: Contact, invoices: VoucherlistItem[] }
```

### Outstanding Invoices

```typescript
const result = await client.composites.getOutstandingInvoices();
// result.data = [{ invoice: VoucherlistItem, payment: Payment | null }, ...]
```

### Create Invoice from Articles

Fetches articles by ID, builds line items, creates the invoice:

```typescript
const result = await client.composites.createInvoiceFromArticles({
  voucherDate: '2025-03-01',
  address: { contactId: 'contact-id' },
  articles: [
    { articleId: 'article-1', quantity: 2 },
    { articleId: 'article-2', quantity: 1, discountPercentage: 10 },
  ],
  taxConditions: { taxType: 'net' },
  shippingConditions: { shippingType: 'delivery', shippingDate: '2025-03-15' },
  finalize: true,
});
```

### Revenue by Contact

```typescript
const result = await client.composites.getRevenueByContact('contact-id', {
  from: '2024-01-01',
  to: '2024-12-31',
});
// result.data = { contact, totalRevenue: 15000, invoiceCount: 12, invoices: [...] }
```

## Available Resources

| Namespace | Methods |
|---|---|
| `client.articles` | create, get, update, delete, list, listAll |
| `client.contacts` | create, get, update, list, listAll |
| `client.invoices` | create, get, list, listAll, renderDocument, downloadFile |
| `client.creditNotes` | create, get, list, listAll, renderDocument, downloadFile |
| `client.deliveryNotes` | create, get, list, listAll, renderDocument, downloadFile |
| `client.quotations` | create, get, list, listAll, renderDocument, downloadFile |
| `client.orderConfirmations` | create, get, list, listAll, renderDocument, downloadFile |
| `client.dunnings` | create, get, list, listAll, renderDocument, downloadFile |
| `client.downPaymentInvoices` | get, list, listAll, downloadFile |
| `client.vouchers` | create, get, update, list, listAll, uploadFile |
| `client.voucherlist` | list, listAll |
| `client.recurringTemplates` | get, list, listAll |
| `client.payments` | get |
| `client.countries` | list |
| `client.paymentConditions` | list |
| `client.postingCategories` | list |
| `client.printLayouts` | list |
| `client.profile` | get |
| `client.files` | upload, download |
| `client.eventSubscriptions` | create, get, list, delete |
| `client.composites` | createAndFinalizeInvoice, getInvoiceWithContact, getContactWithInvoices, getOutstandingInvoices, createInvoiceFromArticles, getRevenueByContact |

## Configuration

```typescript
const client = new LexwareClient({
  apiKey: 'your-api-key',                    // required
  baseUrl: 'https://api.lexware.io/v1',      // default
  maxRetries: 3,                             // default, retries on 429/5xx
  rateLimitPerSecond: 2,                     // default, token bucket
  timeout: 30000,                            // default, ms per request
  fetch: customFetch,                        // optional, for testing or edge runtimes
});
```

## Usage with LangGraph / AI Agents

Results are plain JSON — no class instances, no prototype methods — making them ideal as tool responses:

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { LexwareClient } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({ apiKey: process.env.LEXWARE_API_KEY! });

const getInvoice = tool(async ({ id }) => {
  const result = await client.invoices.get(id);
  return JSON.stringify(result);
}, {
  name: 'get_invoice',
  description: 'Retrieve a Lexware invoice by ID',
  schema: z.object({ id: z.string() }),
});

const getOutstandingInvoices = tool(async () => {
  const result = await client.composites.getOutstandingInvoices();
  return JSON.stringify(result);
}, {
  name: 'get_outstanding_invoices',
  description: 'Get all open and overdue invoices with payment info',
  schema: z.object({}),
});
```

## Usage in Next.js

```typescript
// app/actions.ts
'use server';
import { LexwareClient } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({ apiKey: process.env.LEXWARE_API_KEY! });

export async function getInvoice(id: string) {
  const result = await client.invoices.get(id);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export async function getCustomerRevenue(contactId: string) {
  const result = await client.composites.getRevenueByContact(contactId, {
    from: '2024-01-01',
    to: '2024-12-31',
  });
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}
```

## Examples

See the [`examples/`](./examples) directory for complete runnable examples:

- **[basic-usage.ts](./examples/basic-usage.ts)** — Client init, create/get invoice, error handling
- **[pagination.ts](./examples/pagination.ts)** — list(), listAll(), filtering, early exit
- **[smart-endpoints.ts](./examples/smart-endpoints.ts)** — All 6 composite endpoints
- **[agent-tool.ts](./examples/agent-tool.ts)** — Wrapping as LangGraph tools + Next.js server actions

Run any example with:

```bash
LEXWARE_API_KEY=your-key npx tsx examples/basic-usage.ts
```

## License

MIT
