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

/** A Lexware dunning (payment reminder) with all details including line items, pricing, and status. */
export type Dunning = {
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

/** Parameters for creating a new dunning. */
export type DunningCreateParams = {
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

/** Filter options for listing dunnings. */
export type DunningListFilter = PaginationParams & {
  voucherStatus?: VoucherStatus;
  archived?: boolean;
};

/** Resource for managing Lexware dunnings (payment reminders). */
export class DunningsResource {
  constructor(private http: HttpClient) {}

  /** Create a new dunning, optionally finalizing it immediately. */
  async create(
    dunning: DunningCreateParams,
    options?: { finalize?: boolean },
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/dunnings', dunning, {
      params: options?.finalize ? { finalize: true } : undefined,
    });
  }

  /** Retrieve a single dunning by ID. */
  async get(id: string): Promise<LexwareResult<Dunning>> {
    return this.http.get(`/dunnings/${encodeURIComponent(id)}`);
  }

  /** List dunnings with optional filtering and pagination. */
  async list(filter?: DunningListFilter): Promise<LexwareResult<Page<Dunning>>> {
    return this.http.get('/dunnings', { params: filter as Record<string, unknown> });
  }

  /** Trigger PDF document rendering for a dunning. Returns the document file ID. */
  async renderDocument(id: string): Promise<LexwareResult<DocumentFileId>> {
    return this.http.get(`/dunnings/${encodeURIComponent(id)}/document`);
  }

  /** Download the dunning PDF file as a Blob. */
  async downloadFile(id: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/dunnings/${encodeURIComponent(id)}/file`);
  }

  /** Async iterator that automatically paginates through all matching dunnings. */
  async *listAll(filter?: Omit<DunningListFilter, 'page'>): AsyncGenerator<Dunning> {
    yield* this.http.paginate<Dunning>('/dunnings', filter as Record<string, unknown>);
  }
}
