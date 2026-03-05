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

/** A Lexware credit note with all details including line items, pricing, and status. */
export type CreditNote = {
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

/** Parameters for creating a new credit note. */
export type CreditNoteCreateParams = {
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

/** Filter options for listing credit notes. */
export type CreditNoteListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware credit notes. */
export class CreditNotesResource {
  constructor(private http: HttpClient) {}

  /** Create a new credit note, optionally finalizing it immediately. */
  async create(
    creditNote: CreditNoteCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/credit-notes', creditNote, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single credit note by ID. */
  async get(id: string): Promise<LexwareResult<CreditNote>> {
    return this.http.get(`/credit-notes/${encodeURIComponent(id)}`);
  }

  /** List credit notes with optional filtering and pagination. */
  async list(filter?: CreditNoteListFilter): Promise<LexwareResult<Page<CreditNote>>> {
    return this.http.get('/credit-notes', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for a credit note. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/credit-notes/${encodeURIComponent(id)}/document`);
  }

  /** Download the credit note PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/credit-notes/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching credit notes. */
  async *listAll(filter?: Omit<CreditNoteListFilter, 'page'>): AsyncGenerator<CreditNote> {
    yield* this.http.paginate<CreditNote>('/credit-notes', filter as Record<string, unknown>);
  }
}
