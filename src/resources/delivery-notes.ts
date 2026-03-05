import type {
  Address,
  LineItem,
  TextLineItem,
  TotalPrice,
  TaxAmount,
  TaxConditions,
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

/** A Lexware delivery note with all details including line items, pricing, and status. */
export type DeliveryNote = {
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
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  files?: VoucherFile;
};

/** Parameters for creating a new delivery note. */
export type DeliveryNoteCreateParams = {
  voucherDate: string;
  address: Address;
  lineItems: (Omit<LineItem, 'id' | 'lineItemAmount'> | TextLineItem)[];
  totalPrice: { currency: Currency };
  taxConditions: TaxConditions;
  shippingConditions?: ShippingConditions;
  language?: string;
  title?: string;
  introduction?: string;
  remark?: string;
};

/** Filter options for listing delivery notes. */
export type DeliveryNoteListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware delivery notes. */
export class DeliveryNotesResource {
  constructor(private http: HttpClient) {}

  /** Create a new delivery note, optionally finalizing it immediately. */
  async create(
    deliveryNote: DeliveryNoteCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/delivery-notes', deliveryNote, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single delivery note by ID. */
  async get(id: string): Promise<LexwareResult<DeliveryNote>> {
    return this.http.get(`/delivery-notes/${encodeURIComponent(id)}`);
  }

  /** List delivery notes with optional filtering and pagination. */
  async list(filter?: DeliveryNoteListFilter): Promise<LexwareResult<Page<DeliveryNote>>> {
    return this.http.get('/delivery-notes', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for a delivery note. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/delivery-notes/${encodeURIComponent(id)}/document`);
  }

  /** Download the delivery note PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/delivery-notes/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching delivery notes. */
  async *listAll(filter?: Omit<DeliveryNoteListFilter, 'page'>): AsyncGenerator<DeliveryNote> {
    yield* this.http.paginate<DeliveryNote>(
      '/delivery-notes',
      filter as Record<string, unknown>,
    );
  }
}
