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
  Currency,
  DocumentFileId,
  VoucherFile,
  VoucherStatus,
} from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A Lexware order confirmation with all details including line items, pricing, and status. */
export type OrderConfirmation = {
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

/** Parameters for creating a new order confirmation. */
export type OrderConfirmationCreateParams = {
  voucherDate: string;
  address: Address;
  lineItems: (Omit<LineItem, 'id' | 'lineItemAmount'> | TextLineItem)[];
  totalPrice: { currency: Currency };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  paymentConditions?: PaymentConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
};

/** Filter options for listing order confirmations. */
export type OrderConfirmationListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware order confirmations. */
export class OrderConfirmationsResource {
  constructor(private http: HttpClient) {}

  /** Create a new order confirmation, optionally finalizing it immediately. */
  async create(
    orderConfirmation: OrderConfirmationCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/order-confirmations', orderConfirmation, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single order confirmation by ID. */
  async get(id: string): Promise<LexwareResult<OrderConfirmation>> {
    return this.http.get(`/order-confirmations/${encodeURIComponent(id)}`);
  }

  /** List order confirmations with optional filtering and pagination. */
  async list(
    filter?: OrderConfirmationListFilter,
  ): Promise<LexwareResult<Page<OrderConfirmation>>> {
    return this.http.get('/order-confirmations', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for an order confirmation. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/order-confirmations/${encodeURIComponent(id)}/document`);
  }

  /** Download the order confirmation PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/order-confirmations/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching order confirmations. */
  async *listAll(
    filter?: Omit<OrderConfirmationListFilter, 'page'>,
  ): AsyncGenerator<OrderConfirmation> {
    yield* this.http.paginate<OrderConfirmation>(
      '/order-confirmations',
      filter as Record<string, unknown>,
    );
  }
}
