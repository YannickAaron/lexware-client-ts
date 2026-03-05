import type { HttpClient } from '../http.js';
import type {
  Address,
  LineItem,
  PaymentConditions,
  ShippingConditions,
  TaxAmount,
  TaxConditions,
  TextLineItem,
  TotalPrice,
  VoucherFile,
  VoucherStatus,
} from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';

/** A Lexware down payment invoice with all details including line items, pricing, and status. */
export type DownPaymentInvoice = {
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
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: TotalPrice;
  taxAmounts?: TaxAmount[];
  taxConditions: TaxConditions;
  paymentConditions?: PaymentConditions;
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  files?: VoucherFile;
};

/** Filter options for listing down payment invoices. */
export type DownPaymentInvoiceListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware down payment invoices (read-only). */
export class DownPaymentInvoicesResource {
  constructor(private http: HttpClient) {}

  /** Retrieve a single down payment invoice by ID. */
  async get(id: string): Promise<LexwareResult<DownPaymentInvoice>> {
    return this.http.get(`/down-payment-invoices/${encodeURIComponent(id)}`);
  }

  /** List down payment invoices with optional filtering and pagination. */
  async list(
    filter?: DownPaymentInvoiceListFilter,
  ): Promise<LexwareResult<Page<DownPaymentInvoice>>> {
    return this.http.get('/down-payment-invoices', { params: filter as Record<string, unknown> });
  }

  /** Download the down payment invoice PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/down-payment-invoices/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching down payment invoices. */
  async *listAll(
    filter?: Omit<DownPaymentInvoiceListFilter, 'page'>,
  ): AsyncGenerator<DownPaymentInvoice> {
    yield* this.http.paginate<DownPaymentInvoice>(
      '/down-payment-invoices',
      filter as Record<string, unknown>,
    );
  }
}
