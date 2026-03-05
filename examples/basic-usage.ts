// Basic usage example — run with: npx tsx examples/basic-usage.ts

import { LexwareClient, isSuccess } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({
  apiKey: process.env.LEXWARE_API_KEY!,
});

// --- Create an invoice ---
const createResult = await client.invoices.create(
  {
    voucherDate: '2025-03-01',
    address: { name: 'Acme Corp', street: 'Main St 1', city: 'Berlin', zip: '10115', countryCode: 'DE' },
    lineItems: [
      {
        type: 'custom',
        name: 'Web Development',
        quantity: 10,
        unitName: 'hours',
        unitPrice: { currency: 'EUR', netAmount: 120, taxRatePercentage: 19 },
      },
    ],
    totalPrice: { currency: 'EUR' },
    taxConditions: { taxType: 'net' },
    shippingConditions: { shippingType: 'service', shippingDate: '2025-03-01' },
  },
  { finalize: true },
);

if (!isSuccess(createResult)) {
  console.error('Failed to create invoice:', createResult.error);
  process.exit(1);
}

console.log('Created invoice:', createResult.data.id);

// --- Get the invoice back ---
const getResult = await client.invoices.get(createResult.data.id);

if (isSuccess(getResult)) {
  console.log('Invoice status:', getResult.data.voucherStatus);
  console.log('Total:', getResult.data.totalPrice.totalGrossAmount, 'EUR');
}

// --- Error handling ---
const notFound = await client.invoices.get('nonexistent-id');

if (!notFound.success) {
  // Errors are typed — no exceptions to catch
  console.log('Error code:', notFound.error.code); // 'NOT_FOUND'
  console.log('Error message:', notFound.error.message);
}

// --- List contacts ---
const contacts = await client.contacts.list({ customer: true, size: 5 });

if (isSuccess(contacts)) {
  for (const contact of contacts.data.content) {
    console.log(contact.company?.name ?? contact.person?.lastName);
  }
}
