import type {
  Address,
  LineItem,
  TextLineItem,
  TotalPrice,
  TaxAmount,
  TaxConditions,
  PaymentConditions,
  ShippingConditions,
  ResourceResponse,
  XRechnungInfo,
  Currency,
  DocumentFileId,
  VoucherFile,
  VoucherStatus,
} from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A Lexware quotation with all details including line items, pricing, and status. */
export type Quotation = {
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
  expirationDate?: string;
  address: Address;
  xRechnung?: XRechnungInfo | null;
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

/** Parameters for creating a new quotation. */
export type QuotationCreateParams = {
  voucherDate: string;
  expirationDate?: string;
  address: Address;
  lineItems: (Omit<LineItem, 'id' | 'lineItemAmount'> | TextLineItem)[];
  totalPrice: { currency: Currency };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  paymentConditions?: PaymentConditions;
  language?: string;
  xRechnung?: XRechnungInfo;
  title?: string;
  introduction?: string;
  remark?: string;
};

/** Filter options for listing quotations. */
export type QuotationListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware quotations. */
export class QuotationsResource {
  constructor(private http: HttpClient) {}

  /** Create a new quotation, optionally finalizing it immediately. */
  async create(
    quotation: QuotationCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/quotations', quotation, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single quotation by ID. */
  async get(id: string): Promise<LexwareResult<Quotation>> {
    return this.http.get(`/quotations/${encodeURIComponent(id)}`);
  }

  /** List quotations with optional filtering and pagination. */
  async list(filter?: QuotationListFilter): Promise<LexwareResult<Page<Quotation>>> {
    return this.http.get('/quotations', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for a quotation. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/quotations/${encodeURIComponent(id)}/document`);
  }

  /** Download the quotation PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/quotations/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching quotations. */
  async *listAll(filter?: Omit<QuotationListFilter, 'page'>): AsyncGenerator<Quotation> {
    yield* this.http.paginate<Quotation>('/quotations', filter as Record<string, unknown>);
  }
}
