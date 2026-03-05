// Pagination example — run with: npx tsx examples/pagination.ts

import { LexwareClient, isSuccess } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({
  apiKey: process.env.LEXWARE_API_KEY!,
});

// --- Manual pagination with list() ---
const page1 = await client.contacts.list({ page: 0, size: 25, customer: true });

if (isSuccess(page1)) {
  console.log(`Page 1: ${page1.data.numberOfElements} of ${page1.data.totalElements} contacts`);
  console.log(`Total pages: ${page1.data.totalPages}`);
}

// --- Automatic pagination with listAll() ---
// listAll() returns an async iterator that handles pagination automatically.
// It fetches pages in the background as you iterate.

let count = 0;
for await (const contact of client.contacts.listAll({ customer: true })) {
  console.log(`#${++count}: ${contact.company?.name ?? contact.person?.lastName}`);
}
console.log(`Total contacts iterated: ${count}`);

// --- Filtered pagination ---
// List all open invoices using the voucherlist (cross-type search)
for await (const item of client.voucherlist.listAll({
  voucherType: 'invoice',
  voucherStatus: 'open',
  voucherDateFrom: '2025-01-01',
  voucherDateTo: '2025-12-31',
})) {
  console.log(`${item.voucherNumber}: ${item.contactName} — ${item.totalAmount} EUR`);
}

// --- Early exit from pagination ---
// You can break out of the loop at any time — no wasted API calls
for await (const article of client.articles.listAll({ type: 'SERVICE' })) {
  console.log(article.title);
  if (article.title === 'Target Article') break; // stops fetching further pages
}
