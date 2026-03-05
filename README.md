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

### `client.invoices` — Sales Invoices

Create, retrieve, and manage sales invoices. Supports draft and finalized states, PDF rendering, and XRechnung (German e-invoicing standard).

| Method | Signature | Description |
|---|---|---|
| `create` | `(invoice: InvoiceCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new invoice. Pass `{ finalize: true }` to finalize immediately. |
| `get` | `(id: string) => LexwareResult<Invoice>` | Retrieve a single invoice by ID. |
| `list` | `(filter?: InvoiceListFilter) => LexwareResult<Page<Invoice>>` | List invoices with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Invoice>` | Auto-paginating iterator over all invoices. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering for a finalized invoice. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>InvoiceCreateParams</summary>

```typescript
{
  voucherDate: string;                    // ISO date
  address: Address;                       // { contactId?, name?, street?, city?, zip?, countryCode? }
  lineItems: (LineItem | TextLineItem)[]; // Line items (custom, material, service, or text)
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;           // { taxType: 'net' | 'gross' | 'vatfree' | ... }
  shippingConditions: ShippingConditions; // { shippingType, shippingDate?, shippingEndDate? }
  language?: string;
  xRechnung?: XRechnungInfo;             // { buyerReference, vendorNumberAtCustomer? }
  paymentConditions?: PaymentConditions;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>InvoiceListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number; sort?: string }
```
</details>

<details>
<summary>Invoice (response)</summary>

```typescript
{
  id: string;
  organizationId: string;
  version: number;
  voucherStatus: VoucherStatus;  // 'draft' | 'open' | 'paid' | 'voided' | 'overdue' | ...
  voucherNumber: string;
  voucherDate: string;
  dueDate?: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: TotalPrice;       // { currency, totalNetAmount, totalGrossAmount, totalTaxAmount }
  taxAmounts?: TaxAmount[];
  taxConditions: TaxConditions;
  paymentConditions?: PaymentConditions;
  shippingConditions?: ShippingConditions;
  xRechnung?: XRechnungInfo;
  closingInvoice?: boolean;
  downPaymentDeductions?: DownPaymentDeduction[];
  recurringTemplateId?: string;
  title?: string;
  introduction?: string;
  remark?: string;
  files?: VoucherFile;
  // ... timestamps, language, archived
}
```
</details>

---

### `client.contacts` — Contacts (Customers & Vendors)

Manage business contacts including customers and vendors. Contacts can have companies, persons, multiple addresses, email addresses, and phone numbers.

| Method | Signature | Description |
|---|---|---|
| `create` | `(contact: ContactCreateParams) => LexwareResult<ResourceResponse>` | Create a new contact. |
| `get` | `(id: string) => LexwareResult<Contact>` | Retrieve a single contact by ID. |
| `update` | `(id: string, contact: ContactCreateParams) => LexwareResult<ResourceResponse>` | Update an existing contact (full replace). |
| `list` | `(filter?: ContactListFilter) => LexwareResult<Page<Contact>>` | List contacts with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Contact>` | Auto-paginating iterator over all contacts. |

<details>
<summary>ContactCreateParams</summary>

```typescript
{
  version: number;
  roles: { customer?: { number?: number }; vendor?: { number?: number } };
  company?: {
    name: string;
    taxNumber?: string;
    vatRegistrationId?: string;
    allowTaxFreeInvoices?: boolean;
    contactPersons?: { salutation?: string; firstName?: string; lastName: string }[];
  };
  person?: { salutation?: string; firstName?: string; lastName: string };
  addresses?: {
    billing?: Address[];
    shipping?: Address[];
  };
  xRechnung?: { buyerReference?: string; vendorNumberAtCustomer?: string };
  emailAddresses?: { business?: string[]; office?: string[]; private?: string[]; other?: string[] };
  phoneNumbers?: { business?: string[]; office?: string[]; mobile?: string[]; private?: string[]; fax?: string[]; other?: string[] };
  note?: string;
}
```
</details>

<details>
<summary>ContactListFilter</summary>

```typescript
{ email?: string; name?: string; number?: number; customer?: boolean; vendor?: boolean; page?: number; size?: number }
```
</details>

---

### `client.articles` — Articles (Products & Services)

Manage your product and service catalog. Articles can be referenced when creating invoices.

| Method | Signature | Description |
|---|---|---|
| `create` | `(article: ArticleCreateParams) => LexwareResult<ResourceResponse>` | Create a new article. |
| `get` | `(id: string) => LexwareResult<Article>` | Retrieve a single article by ID. |
| `update` | `(id: string, article: ArticleCreateParams) => LexwareResult<ResourceResponse>` | Update an existing article (full replace). |
| `delete` | `(id: string) => LexwareResult<void>` | Delete an article. |
| `list` | `(filter?: ArticleListFilter) => LexwareResult<Page<Article>>` | List articles with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Article>` | Auto-paginating iterator over all articles. |

<details>
<summary>ArticleCreateParams</summary>

```typescript
{
  title: string;
  type: 'PRODUCT' | 'SERVICE';
  price: {
    netPrice: number;
    grossPrice: number;
    leadingPrice: 'net' | 'gross';
    taxRate: number;
    currency: 'EUR';
  };
  unitName?: string;
  description?: string;
  articleNumber?: string;
  gtin?: string;
  note?: string;
}
```
</details>

<details>
<summary>ArticleListFilter</summary>

```typescript
{ articleNumber?: string; gtin?: string; type?: 'PRODUCT' | 'SERVICE'; page?: number; size?: number }
```
</details>

---

### `client.creditNotes` — Credit Notes

Create and manage credit notes. Supports draft and finalized states with PDF rendering.

| Method | Signature | Description |
|---|---|---|
| `create` | `(creditNote: CreditNoteCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new credit note. |
| `get` | `(id: string) => LexwareResult<CreditNote>` | Retrieve a single credit note by ID. |
| `list` | `(filter?: CreditNoteListFilter) => LexwareResult<Page<CreditNote>>` | List credit notes with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<CreditNote>` | Auto-paginating iterator over all credit notes. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>CreditNoteCreateParams</summary>

```typescript
{
  voucherDate: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>CreditNoteListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.quotations` — Quotations / Offers

Create and manage quotations (Angebote). Supports expiration dates and PDF rendering.

| Method | Signature | Description |
|---|---|---|
| `create` | `(quotation: QuotationCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new quotation. |
| `get` | `(id: string) => LexwareResult<Quotation>` | Retrieve a single quotation by ID. |
| `list` | `(filter?: QuotationListFilter) => LexwareResult<Page<Quotation>>` | List quotations with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Quotation>` | Auto-paginating iterator over all quotations. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>QuotationCreateParams</summary>

```typescript
{
  voucherDate: string;
  expirationDate?: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  paymentConditions?: PaymentConditions;
  xRechnung?: XRechnungInfo;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>QuotationListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.orderConfirmations` — Order Confirmations

Create and manage order confirmations (Auftragsbestaetigungen). Supports PDF rendering.

| Method | Signature | Description |
|---|---|---|
| `create` | `(orderConfirmation: OrderConfirmationCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new order confirmation. |
| `get` | `(id: string) => LexwareResult<OrderConfirmation>` | Retrieve a single order confirmation by ID. |
| `list` | `(filter?: OrderConfirmationListFilter) => LexwareResult<Page<OrderConfirmation>>` | List order confirmations with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<OrderConfirmation>` | Auto-paginating iterator over all order confirmations. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>OrderConfirmationCreateParams</summary>

```typescript
{
  voucherDate: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  paymentConditions?: PaymentConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>OrderConfirmationListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.deliveryNotes` — Delivery Notes

Create and manage delivery notes (Lieferscheine). Supports PDF rendering.

| Method | Signature | Description |
|---|---|---|
| `create` | `(deliveryNote: DeliveryNoteCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new delivery note. |
| `get` | `(id: string) => LexwareResult<DeliveryNote>` | Retrieve a single delivery note by ID. |
| `list` | `(filter?: DeliveryNoteListFilter) => LexwareResult<Page<DeliveryNote>>` | List delivery notes with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<DeliveryNote>` | Auto-paginating iterator over all delivery notes. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>DeliveryNoteCreateParams</summary>

```typescript
{
  voucherDate: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>DeliveryNoteListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.dunnings` — Payment Reminders

Create and manage dunning letters / payment reminders (Mahnungen). Supports PDF rendering.

| Method | Signature | Description |
|---|---|---|
| `create` | `(dunning: DunningCreateParams, options?: { finalize?: boolean }) => LexwareResult<ResourceResponse>` | Create a new dunning. |
| `get` | `(id: string) => LexwareResult<Dunning>` | Retrieve a single dunning by ID. |
| `list` | `(filter?: DunningListFilter) => LexwareResult<Page<Dunning>>` | List dunnings with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Dunning>` | Auto-paginating iterator over all dunnings. |
| `renderDocument` | `(id: string) => LexwareResult<DocumentFileId>` | Trigger PDF rendering. Returns `documentFileId`. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>DunningCreateParams</summary>

```typescript
{
  voucherDate: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: { currency: 'EUR' };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
}
```
</details>

<details>
<summary>DunningListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.downPaymentInvoices` — Down Payment Invoices

Retrieve and list down payment invoices (Abschlagsrechnungen). These are read-only — created through the Lexware UI.

| Method | Signature | Description |
|---|---|---|
| `get` | `(id: string) => LexwareResult<DownPaymentInvoice>` | Retrieve a single down payment invoice by ID. |
| `list` | `(filter?: DownPaymentInvoiceListFilter) => LexwareResult<Page<DownPaymentInvoice>>` | List down payment invoices. |
| `listAll` | `(filter?) => AsyncGenerator<DownPaymentInvoice>` | Auto-paginating iterator over all down payment invoices. |
| `downloadFile` | `(id: string) => LexwareResult<Blob>` | Download the rendered PDF as a Blob. |

<details>
<summary>DownPaymentInvoiceListFilter</summary>

```typescript
{ voucherStatus?: VoucherStatus; archived?: boolean; page?: number; size?: number }
```
</details>

---

### `client.vouchers` — Bookkeeping Vouchers

Create and manage bookkeeping vouchers for purchases and sales. Supports file attachments for receipts.

| Method | Signature | Description |
|---|---|---|
| `create` | `(voucher: VoucherCreateParams) => LexwareResult<ResourceResponse>` | Create a new voucher. |
| `get` | `(id: string) => LexwareResult<Voucher>` | Retrieve a single voucher by ID. |
| `update` | `(id: string, voucher: VoucherCreateParams) => LexwareResult<ResourceResponse>` | Update an existing voucher (full replace). |
| `list` | `(filter?: VoucherListFilter) => LexwareResult<Page<Voucher>>` | List vouchers with optional filters. |
| `listAll` | `(filter?) => AsyncGenerator<Voucher>` | Auto-paginating iterator over all vouchers. |
| `uploadFile` | `(id: string, formData: FormData) => LexwareResult<{ id: string }>` | Upload a receipt/attachment to a voucher. |

<details>
<summary>VoucherCreateParams</summary>

```typescript
{
  type: 'salesinvoice' | 'salescreditnote' | 'purchaseinvoice' | 'purchasecreditnote' | 'invoice' | 'creditnote' | 'orderconfirmation' | 'quotation';
  voucherNumber: string;
  voucherDate: string;
  totalGrossAmount: number;
  totalTaxAmount: number;
  taxType: TaxType;
  voucherItems: { amount: number; taxAmount: number; taxRatePercent: number; categoryId: string }[];
  version: number;
  shippingDate?: string;
  dueDate?: string;
  useCollectiveContact?: boolean;
  remark?: string;
}
```
</details>

<details>
<summary>VoucherListFilter</summary>

```typescript
{ voucherNumber?: string; page?: number; size?: number }
```
</details>

---

### `client.voucherlist` — Cross-Type Voucher Search

Search across all voucher types (invoices, credit notes, quotations, etc.) with powerful filters. Ideal for building dashboards and reports.

| Method | Signature | Description |
|---|---|---|
| `list` | `(filter: VoucherlistFilter) => LexwareResult<Page<VoucherlistItem>>` | Search vouchers with filters. `voucherType` is required. |
| `listAll` | `(filter) => AsyncGenerator<VoucherlistItem>` | Auto-paginating iterator over all matching vouchers. |

<details>
<summary>VoucherlistFilter</summary>

```typescript
{
  voucherType: 'salesinvoice' | 'salescreditnote' | 'purchaseinvoice' | 'purchasecreditnote' | 'invoice' | 'creditnote' | 'downpaymentinvoice' | 'orderconfirmation' | 'quotation';  // required
  voucherStatus?: 'draft' | 'open' | 'paid' | 'paidoff' | 'voided' | 'overdue' | 'accepted' | 'rejected';
  archived?: boolean;
  contactId?: string;
  voucherDateFrom?: string;        // ISO date
  voucherDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
  page?: number;
  size?: number;
}
```
</details>

<details>
<summary>VoucherlistItem (response)</summary>

```typescript
{
  id: string;
  voucherType: string;
  voucherStatus: string;
  voucherNumber: string;
  voucherDate: string;
  createdDate: string;
  updatedDate: string;
  dueDate?: string;
  contactId?: string;
  contactName: string;
  totalAmount: number;
  openAmount?: number;
  currency: string;
  archived: boolean;
}
```
</details>

---

### `client.recurringTemplates` — Recurring Invoice Templates

Retrieve recurring invoice templates. Templates are created and managed through the Lexware UI.

| Method | Signature | Description |
|---|---|---|
| `get` | `(id: string) => LexwareResult<RecurringTemplate>` | Retrieve a single recurring template by ID. |
| `list` | `(params?: PaginationParams) => LexwareResult<Page<RecurringTemplate>>` | List recurring templates. |
| `listAll` | `(params?) => AsyncGenerator<RecurringTemplate>` | Auto-paginating iterator over all templates. |

<details>
<summary>RecurringTemplate (response)</summary>

```typescript
{
  id: string;
  organizationId: string;
  version: number;
  templateName?: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: TotalPrice;
  taxConditions: TaxConditions;
  paymentConditions?: PaymentConditions;
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  nextExecutionDate?: string;
  lastExecutionDate?: string;
  executionInterval?: string;
  executionStatus?: string;
  // ... timestamps, language, archived
}
```
</details>

---

### `client.payments` — Payment Status

Retrieve payment information for invoices and credit notes — open amounts, payment status, and individual payment items.

| Method | Signature | Description |
|---|---|---|
| `get` | `(id: string) => LexwareResult<Payment>` | Get payment status for a voucher by its ID. |

<details>
<summary>Payment (response)</summary>

```typescript
{
  openAmount: number;
  currency: 'EUR';
  paymentStatus: string;       // e.g. 'openRevenue', 'balanced'
  voucherId: string;
  voucherType: string;
  voucherStatus: VoucherStatus;
  paidDate?: string;
  paymentItems?: {
    paymentType: string;
    voucherType: string;
    currency: 'EUR';
    amount: number;
    date: string;
  }[];
}
```
</details>

---

### `client.files` — File Management

Upload and download files (receipts, documents, attachments).

| Method | Signature | Description |
|---|---|---|
| `upload` | `(formData: FormData) => LexwareResult<{ id: string }>` | Upload a file. Returns the file ID. |
| `download` | `(documentFileId: string) => LexwareResult<Blob>` | Download a file by its document file ID. |

---

### `client.eventSubscriptions` — Webhook Subscriptions

Register webhook URLs to receive real-time notifications when resources change (created, updated, deleted, status changed).

| Method | Signature | Description |
|---|---|---|
| `create` | `(subscription: EventSubscriptionCreateParams) => LexwareResult<ResourceResponse>` | Create a new webhook subscription. |
| `get` | `(id: string) => LexwareResult<EventSubscription>` | Retrieve a subscription by ID. |
| `list` | `() => LexwareResult<{ content: EventSubscription[] }>` | List all active subscriptions. |
| `delete` | `(id: string) => LexwareResult<void>` | Delete a subscription. |

<details>
<summary>EventSubscriptionCreateParams</summary>

```typescript
{
  eventType: EventType;   // e.g. 'invoice.created', 'contact.changed', 'payment.changed'
  callbackUrl: string;    // Your webhook endpoint URL
}
```
</details>

<details>
<summary>Supported Event Types</summary>

`article.created` · `article.changed` · `article.deleted` · `contact.created` · `contact.changed` · `contact.deleted` · `credit-note.created` · `credit-note.changed` · `credit-note.deleted` · `credit-note.status.changed` · `delivery-note.created` · `delivery-note.changed` · `delivery-note.deleted` · `delivery-note.status.changed` · `down-payment-invoice.created` · `down-payment-invoice.changed` · `down-payment-invoice.deleted` · `down-payment-invoice.status.changed` · `dunning.created` · `dunning.changed` · `dunning.deleted` · `dunning.status.changed` · `invoice.created` · `invoice.changed` · `invoice.deleted` · `invoice.status.changed` · `order-confirmation.created` · `order-confirmation.changed` · `order-confirmation.deleted` · `order-confirmation.status.changed` · `payment.changed` · `quotation.created` · `quotation.changed` · `quotation.deleted` · `quotation.status.changed` · `recurring-template.created` · `recurring-template.changed` · `recurring-template.deleted` · `voucher.created` · `voucher.changed` · `voucher.deleted` · `voucher.status.changed`
</details>

---

### `client.countries` — Country List

Retrieve the list of countries supported by Lexware with their tax classifications.

| Method | Signature | Description |
|---|---|---|
| `list` | `() => LexwareResult<Country[]>` | Get all supported countries. |

<details>
<summary>Country (response)</summary>

```typescript
{ countryCode: string; countryNameDE: string; countryNameEN: string; taxClassification: string }
```
</details>

---

### `client.paymentConditions` — Payment Terms

Retrieve configured payment terms (e.g. "30 days net", "2% discount within 10 days").

| Method | Signature | Description |
|---|---|---|
| `list` | `() => LexwareResult<PaymentCondition[]>` | Get all payment conditions. |

<details>
<summary>PaymentCondition (response)</summary>

```typescript
{
  id: string;
  organizationId: string;
  paymentTermLabelTemplate: string;
  paymentTermDuration: number;
  paymentDiscountConditions?: { discountPercentage: number; discountRange: number };
}
```
</details>

---

### `client.postingCategories` — Posting Categories

Retrieve available posting categories for bookkeeping vouchers.

| Method | Signature | Description |
|---|---|---|
| `list` | `() => LexwareResult<PostingCategory[]>` | Get all posting categories. |

<details>
<summary>PostingCategory (response)</summary>

```typescript
{ id: string; name: string; type: string; contactRequired: boolean; splitAllowed: boolean; groupName: string }
```
</details>

---

### `client.printLayouts` — Print Layouts

Retrieve available print layouts for documents.

| Method | Signature | Description |
|---|---|---|
| `list` | `() => LexwareResult<PrintLayout[]>` | Get all print layouts. |

<details>
<summary>PrintLayout (response)</summary>

```typescript
{ id: string; name: string; default: boolean }
```
</details>

---

### `client.profile` — Organization Profile

Retrieve information about the connected Lexware organization.

| Method | Signature | Description |
|---|---|---|
| `get` | `() => LexwareResult<Profile>` | Get the organization profile. |

<details>
<summary>Profile (response)</summary>

```typescript
{
  organizationId: string;
  companyName: string;
  created?: { userId: string; userName: string; userEmail: string; date: string };
  connectionId?: string;
  taxType?: string;
  smallBusiness?: boolean;
}
```
</details>

---

### `client.composites` — Smart Composite Endpoints

High-level workflows that combine multiple API calls into one. See [Smart Composite Endpoints](#smart-composite-endpoints) above for full usage examples.

| Method | Signature | Description |
|---|---|---|
| `createAndFinalizeInvoice` | `(params: InvoiceCreateParams) => LexwareResult<CreateAndFinalizeResult>` | Create, finalize, and render an invoice PDF in one call. |
| `getInvoiceWithContact` | `(invoiceId: string) => LexwareResult<InvoiceWithContact>` | Fetch an invoice with its linked contact. |
| `getContactWithInvoices` | `(contactId: string, filter?) => LexwareResult<ContactWithInvoices>` | Fetch a contact with all their invoices. |
| `getOutstandingInvoices` | `() => LexwareResult<OutstandingInvoice[]>` | Get all open/overdue invoices with payment info. |
| `createInvoiceFromArticles` | `(params: CreateInvoiceFromArticlesParams) => LexwareResult<ResourceResponse>` | Build an invoice from article IDs automatically. |
| `getRevenueByContact` | `(contactId: string, filter?) => LexwareResult<ContactRevenue>` | Aggregate revenue from paid invoices per contact. |

### Shared Types

These types are used across multiple resources:

```typescript
// Address — used in invoices, contacts, quotations, etc.
type Address = {
  contactId?: string;      // Link to an existing contact
  name?: string;
  supplement?: string;
  street?: string;
  city?: string;
  zip?: string;
  countryCode?: string;    // ISO 3166-1 alpha-2 (e.g. 'DE')
  contactPerson?: string;
};

// Line items — used in all document types
type LineItem = {
  type: 'custom' | 'material' | 'service';
  name: string;
  description?: string;
  quantity: number;
  unitName: string;
  unitPrice: { currency: 'EUR'; netAmount: number; grossAmount?: number; taxRatePercentage: number };
  discountPercentage?: number;
};

type TextLineItem = {
  type: 'text';
  name: string;
  description?: string;
};

// Voucher statuses
type VoucherStatus = 'draft' | 'open' | 'paid' | 'paidoff' | 'voided' | 'overdue'
  | 'accepted' | 'rejected' | 'unchecked' | 'sepadebit' | 'closed';

// Tax types
type TaxType = 'net' | 'gross' | 'vatfree' | 'intraCommunitySupply'
  | 'constructionService13b' | 'externalService13b' | 'thirdPartyCountryService'
  | 'thirdPartyCountryDelivery' | 'photovoltaicEquipment';

// Pagination response
type Page<T> = {
  content: T[];
  first: boolean;
  last: boolean;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
};
```

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
