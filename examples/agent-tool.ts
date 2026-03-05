// Example: Using the Lexware client as a LangGraph/LangChain tool
// Run with: npx tsx examples/agent-tool.ts

import { LexwareClient, isSuccess, type Invoice, type Contact } from '@yannickaaron/lexware-client-ts';

const client = new LexwareClient({
  apiKey: process.env.LEXWARE_API_KEY!,
});

// The LexwareResult type is a plain JSON-serializable object — perfect for agent tools.
// No exceptions, no classes — just { success: true, data: T } | { success: false, error: E }

// --- Tool definition for LangGraph ---
// Each tool function returns a plain object that can be serialized directly.

async function getInvoiceTool(invoiceId: string) {
  const result = await client.invoices.get(invoiceId);
  if (!result.success) {
    return { error: result.error.message, code: result.error.code };
  }
  return {
    id: result.data.id,
    number: result.data.voucherNumber,
    status: result.data.voucherStatus,
    total: result.data.totalPrice.totalGrossAmount,
    customer: result.data.address.name,
    date: result.data.voucherDate,
    dueDate: result.data.dueDate,
  };
}

async function searchContactsTool(query: string) {
  const result = await client.contacts.list({ name: query, size: 5 });
  if (!result.success) {
    return { error: result.error.message };
  }
  return result.data.content.map((c) => ({
    id: c.id,
    name: c.company?.name ?? `${c.person?.firstName} ${c.person?.lastName}`,
    isCustomer: !!c.roles.customer,
    isVendor: !!c.roles.vendor,
  }));
}

async function getOutstandingInvoicesTool() {
  const result = await client.composites.getOutstandingInvoices();
  if (!result.success) {
    return { error: result.error.message };
  }
  return result.data.map(({ invoice, payment }) => ({
    id: invoice.id,
    number: invoice.voucherNumber,
    customer: invoice.contactName,
    total: invoice.totalAmount,
    open: payment?.openAmount ?? invoice.totalAmount,
    dueDate: invoice.dueDate,
    status: invoice.voucherStatus,
  }));
}

async function getContactRevenueTool(contactId: string, year: number) {
  const result = await client.composites.getRevenueByContact(contactId, {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  });
  if (!result.success) {
    return { error: result.error.message };
  }
  return {
    contact: result.data.contact.company?.name,
    totalRevenue: result.data.totalRevenue,
    invoiceCount: result.data.invoiceCount,
  };
}

// --- Usage in a Next.js Server Action ---
// These functions can also be called directly from Next.js server actions:
//
// 'use server'
// export async function getInvoice(id: string) {
//   const result = await client.invoices.get(id);
//   if (!result.success) throw new Error(result.error.message);
//   return result.data;
// }

// --- Demo ---
console.log('=== Invoice Tool ===');
console.log(await getInvoiceTool('some-invoice-id'));

console.log('\n=== Contact Search Tool ===');
console.log(await searchContactsTool('Acme'));

console.log('\n=== Outstanding Invoices Tool ===');
console.log(await getOutstandingInvoicesTool());
