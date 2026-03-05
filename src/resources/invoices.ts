import type { HttpClient } from '../http.js';
import type {
  Address,
  Currency,
  DocumentFileId,
  DownPaymentDeduction,
  LineItem,
  PaymentConditions,
  ResourceResponse,
  ShippingConditions,
  TaxAmount,
  TaxConditions,
  TextLineItem,
  TotalPrice,
  VoucherFile,
  VoucherStatus,
  XRechnungInfo,
} from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';

/** A Lexware invoice with all details including line items, pricing, and status. */
export type Invoice = {
  id: string;
  organizationId: string;
  createdDate: string;
  updatedDate: string;
  version: number;
  language: string;
  archived: boolean;
  voucherStatus: VoucherStatus;
  voucherNumber: string;
  voucherDate: string;
  dueDate?: string | null;
  address: Address;
  xRechnung?: XRechnungInfo | null;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: TotalPrice;
  taxAmounts?: TaxAmount[];
  taxConditions: TaxConditions;
  paymentConditions?: PaymentConditions;
  shippingConditions?: ShippingConditions;
  closingInvoice?: boolean;
  claimedGrossAmount?: number;
  downPaymentDeductions?: DownPaymentDeduction[];
  recurringTemplateId?: string | null;
  title?: string;
  introduction?: string;
  remark?: string;
  files?: VoucherFile;
};

/** Parameters for creating a new invoice. */
export type InvoiceCreateParams = {
  voucherDate: string;
  address: Address;
  lineItems: (Omit<LineItem, 'id' | 'lineItemAmount'> | TextLineItem)[];
  totalPrice: { currency: Currency };
  taxConditions: TaxConditions;
  shippingConditions: ShippingConditions;
  language?: string;
  xRechnung?: XRechnungInfo;
  paymentConditions?: PaymentConditions;
  title?: string;
  introduction?: string;
  remark?: string;
};

/** Filter options for listing invoices. */
export type InvoiceListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware invoices. */
export class InvoicesResource {
  constructor(private http: HttpClient) {}

  /** Create a new invoice, optionally finalizing it immediately. */
  async create(
    invoice: InvoiceCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/invoices', invoice, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single invoice by ID. */
  async get(id: string): Promise<LexwareResult<Invoice>> {
    return this.http.get(`/invoices/${encodeURIComponent(id)}`);
  }

  /** List invoices with optional filtering and pagination. */
  async list(filter?: InvoiceListFilter): Promise<LexwareResult<Page<Invoice>>> {
    return this.http.get('/invoices', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for an invoice. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/invoices/${encodeURIComponent(id)}/document`);
  }

  /** Download the invoice PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/invoices/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching invoices. */
  async *listAll(filter?: Omit<InvoiceListFilter, 'page'>): AsyncGenerator<Invoice> {
    yield* this.http.paginate<Invoice>('/invoices', filter as Record<string, unknown>);
  }
}
