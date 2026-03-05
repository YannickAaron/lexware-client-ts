import type { LexwareClient } from './client.js';
import type { Article } from './resources/articles.js';
import type { Contact } from './resources/contacts.js';
import type { Invoice } from './resources/invoices.js';
import type { Payment } from './resources/payments.js';
import type { VoucherlistItem } from './resources/voucherlist.js';
import type {
  Address,
  Currency,
  PaymentConditions,
  ResourceResponse,
  ShippingConditions,
  TaxConditions,
  XRechnungInfo,
} from './types/common.js';
import type { LexwareResult } from './types/result.js';

/** Result of creating and finalizing an invoice in one step. */
export type CreateAndFinalizeResult = ResourceResponse & {
  documentFileId: string;
};

/** An invoice bundled with its linked contact. */
export type InvoiceWithContact = {
  invoice: Invoice;
  contact: Contact | null;
};

/** A contact bundled with their invoices from the voucherlist. */
export type ContactWithInvoices = {
  contact: Contact;
  invoices: VoucherlistItem[];
};

/** An outstanding invoice with its payment information. */
export type OutstandingInvoice = {
  invoice: VoucherlistItem;
  payment: Payment | null;
};

/** Article reference used when creating an invoice from articles. */
export type ArticleLineInput = {
  articleId: string;
  quantity: number;
  discountPercentage?: number;
};

/** Parameters for creating an invoice from article IDs. */
export type CreateInvoiceFromArticlesParams = {
  address: Address;
  articles: ArticleLineInput[];
  taxConditions: TaxConditions;
  shippingConditions: ShippingConditions;
  voucherDate: string;
  currency?: Currency;
  paymentConditions?: PaymentConditions;
  xRechnung?: XRechnungInfo;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
  finalize?: boolean;
};

/** Revenue summary for a contact. */
export type ContactRevenue = {
  contact: Contact;
  totalRevenue: number;
  invoiceCount: number;
  invoices: VoucherlistItem[];
};

/**
 * Smart composite endpoints that combine multiple API calls into
 * convenient single-call workflows.
 */
export class CompositesResource {
  constructor(private client: LexwareClient) {}

  /**
   * Create an invoice, finalize it, and render the document in one call.
   * Returns the resource response with the document file ID attached.
   */
  async createAndFinalizeInvoice(
    params: Omit<import('./resources/invoices.js').InvoiceCreateParams, never>,
  ): Promise<LexwareResult<CreateAndFinalizeResult>> {
    const createResult = await this.client.invoices.create(params, { finalize: true });
    if (!createResult.success) return createResult;

    const docResult = await this.client.invoices.renderDocument(createResult.data.id);
    if (!docResult.success) return docResult;

    return {
      success: true,
      data: {
        ...createResult.data,
        documentFileId: docResult.data.documentFileId,
      },
    };
  }

  /**
   * Fetch an invoice along with the contact linked via `address.contactId`.
   * Returns `null` for contact if the invoice has no linked contact.
   */
  async getInvoiceWithContact(invoiceId: string): Promise<LexwareResult<InvoiceWithContact>> {
    const invoiceResult = await this.client.invoices.get(invoiceId);
    if (!invoiceResult.success) return invoiceResult;

    const contactId = invoiceResult.data.address.contactId;
    let contact: Contact | null = null;

    if (contactId) {
      const contactResult = await this.client.contacts.get(contactId);
      if (contactResult.success) {
        contact = contactResult.data;
      }
    }

    return {
      success: true,
      data: { invoice: invoiceResult.data, contact },
    };
  }

  /**
   * Fetch a contact and all their invoices from the voucherlist.
   * Optionally filter by date range.
   */
  async getContactWithInvoices(
    contactId: string,
    filter?: { voucherDateFrom?: string; voucherDateTo?: string },
  ): Promise<LexwareResult<ContactWithInvoices>> {
    const contactResult = await this.client.contacts.get(contactId);
    if (!contactResult.success) return contactResult;

    const invoices: VoucherlistItem[] = [];
    for await (const item of this.client.voucherlist.listAll({
      voucherType: 'invoice',
      contactId,
      ...filter,
    })) {
      invoices.push(item);
    }

    return {
      success: true,
      data: { contact: contactResult.data, invoices },
    };
  }

  /**
   * Fetch all open and overdue invoices with their payment information.
   * Useful for accounts receivable overviews.
   */
  async getOutstandingInvoices(): Promise<LexwareResult<OutstandingInvoice[]>> {
    const results: OutstandingInvoice[] = [];

    for (const status of ['open', 'overdue'] as const) {
      for await (const item of this.client.voucherlist.listAll({
        voucherType: 'invoice',
        voucherStatus: status,
      })) {
        let payment: Payment | null = null;
        const paymentResult = await this.client.payments.get(item.id);
        if (paymentResult.success) {
          payment = paymentResult.data;
        }
        results.push({ invoice: item, payment });
      }
    }

    return { success: true, data: results };
  }

  /**
   * Create an invoice directly from article IDs. Fetches each article,
   * builds line items from them, and creates the invoice.
   */
  async createInvoiceFromArticles(
    params: CreateInvoiceFromArticlesParams,
  ): Promise<LexwareResult<ResourceResponse>> {
    const lineItems: import('./types/common.js').LineItem[] = [];

    for (const input of params.articles) {
      const articleResult = await this.client.articles.get(input.articleId);
      if (!articleResult.success) return articleResult as LexwareResult<ResourceResponse>;

      const article: Article = articleResult.data;
      lineItems.push({
        type: article.type === 'SERVICE' ? 'service' : 'custom',
        name: article.title,
        description: article.description,
        quantity: input.quantity,
        unitName: article.unitName ?? 'piece',
        unitPrice: {
          currency: params.currency ?? 'EUR',
          netAmount: article.price.netPrice,
          grossAmount: article.price.grossPrice,
          taxRatePercentage: article.price.taxRate,
        },
        discountPercentage: input.discountPercentage,
      });
    }

    return this.client.invoices.create(
      {
        voucherDate: params.voucherDate,
        address: params.address,
        lineItems,
        totalPrice: { currency: params.currency ?? 'EUR' },
        taxConditions: params.taxConditions,
        shippingConditions: params.shippingConditions,
        paymentConditions: params.paymentConditions,
        xRechnung: params.xRechnung,
        language: params.language,
        title: params.title,
        introduction: params.introduction,
        remark: params.remark,
      },
      { finalize: params.finalize },
    );
  }

  /**
   * Aggregate revenue for a contact from their paid invoices.
   * Optionally filter by date range.
   */
  async getRevenueByContact(
    contactId: string,
    filter?: { from?: string; to?: string },
  ): Promise<LexwareResult<ContactRevenue>> {
    const contactResult = await this.client.contacts.get(contactId);
    if (!contactResult.success) return contactResult;

    const invoices: VoucherlistItem[] = [];
    for await (const item of this.client.voucherlist.listAll({
      voucherType: 'invoice',
      voucherStatus: 'paid',
      contactId,
      voucherDateFrom: filter?.from,
      voucherDateTo: filter?.to,
    })) {
      invoices.push(item);
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    return {
      success: true,
      data: {
        contact: contactResult.data,
        totalRevenue,
        invoiceCount: invoices.length,
        invoices,
      },
    };
  }
}
