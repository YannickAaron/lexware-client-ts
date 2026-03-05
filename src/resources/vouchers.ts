import type { TaxType, ResourceResponse } from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** The classification of a voucher (e.g., sales invoice, purchase credit note). */
export type VoucherType =
  | 'salesinvoice'
  | 'salescreditnote'
  | 'purchaseinvoice'
  | 'purchasecreditnote'
  | 'invoice'
  | 'creditnote'
  | 'orderconfirmation'
  | 'quotation';

/** A single line item within a voucher with amount, tax, and category. */
export type VoucherItem = {
  amount: number;
  taxAmount: number;
  taxRatePercent: number;
  categoryId: string;
};

/** A Lexware voucher representing a bookkeeping document with amounts and tax details. */
export type Voucher = {
  id: string;
  organizationId: string;
  type: VoucherType;
  voucherNumber: string;
  voucherDate: string;
  shippingDate?: string;
  dueDate?: string;
  totalGrossAmount: number;
  totalTaxAmount: number;
  taxType: TaxType;
  useCollectiveContact: boolean;
  remark?: string;
  voucherItems: VoucherItem[];
  files?: string[];
  createdDate: string;
  updatedDate: string;
  version: number;
};

/** Parameters for creating or updating a voucher. */
export type VoucherCreateParams = {
  type: VoucherType;
  voucherNumber: string;
  voucherDate: string;
  shippingDate?: string;
  dueDate?: string;
  totalGrossAmount: number;
  totalTaxAmount: number;
  taxType: TaxType;
  useCollectiveContact?: boolean;
  remark?: string;
  voucherItems: VoucherItem[];
  version: number;
};

/** Filter options for listing vouchers. */
export type VoucherListFilter = PaginationParams & {
  voucherNumber?: string;
};

/** Resource for managing Lexware vouchers (bookkeeping documents). */
export class VouchersResource {
  constructor(private http: HttpClient) {}

  /** Create a new voucher. */
  async create(voucher: VoucherCreateParams): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/vouchers', voucher);
  }

  /** Retrieve a single voucher by ID. */
  async get(id: string): Promise<LexwareResult<Voucher>> {
    return this.http.get(`/vouchers/${encodeURIComponent(id)}`);
  }

  /** Update an existing voucher by ID. */
  async update(
    id: string,
    voucher: VoucherCreateParams,
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.put(`/vouchers/${encodeURIComponent(id)}`, voucher);
  }

  /** List vouchers with optional filtering and pagination. */
  async list(filter?: VoucherListFilter): Promise<LexwareResult<Page<Voucher>>> {
    return this.http.get('/vouchers', { params: filter as Record<string, unknown> });
  }

  /** Upload a file attachment to a voucher. */
  async uploadFile(id: string, formData: FormData): Promise<LexwareResult<{ id: string }>> {
    return this.http.postFormData(`/vouchers/${encodeURIComponent(id)}/files`, formData);
  }

  /** Async iterator that automatically paginates through all matching vouchers. */
  async *listAll(filter?: Omit<VoucherListFilter, 'page'>): AsyncGenerator<Voucher> {
    yield* this.http.paginate<Voucher>('/vouchers', filter as Record<string, unknown>);
  }
}
