import type { HttpClient } from '../http.js';
import type { PaginationParams } from '../types/pagination.js';
import type { Page } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';

/** Supported voucher types for voucherlist queries. */
export type VoucherlistVoucherType =
  | 'salesinvoice'
  | 'salescreditnote'
  | 'purchaseinvoice'
  | 'purchasecreditnote'
  | 'invoice'
  | 'creditnote'
  | 'downpaymentinvoice'
  | 'orderconfirmation'
  | 'quotation';

/** Possible statuses of a voucher in the voucherlist. */
export type VoucherlistVoucherStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'paidoff'
  | 'voided'
  | 'overdue'
  | 'accepted'
  | 'rejected';

/** Aggregated voucher list item across all voucher types. */
export type VoucherlistItem = {
  id: string;
  voucherType: VoucherlistVoucherType;
  voucherStatus: VoucherlistVoucherStatus;
  voucherNumber: string;
  voucherDate: string;
  createdDate: string;
  updatedDate: string;
  dueDate?: string;
  contactId?: string;
  contactName: string;
  totalAmount: number;
  openAmount?: number;
  currency: string;
  archived: boolean;
};

/** Filter options for querying the voucherlist. Requires a voucherType. */
export type VoucherlistFilter = PaginationParams & {
  voucherType: VoucherlistVoucherType;
  voucherStatus?: VoucherlistVoucherStatus;
  archived?: boolean;
  contactId?: string;
  voucherDateFrom?: string;
  voucherDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  updatedDateFrom?: string;
  updatedDateTo?: string;
};

/** Resource for querying the cross-voucher-type voucherlist. */
export class VoucherlistResource {
  constructor(private http: HttpClient) {}

  /** List voucherlist items with required type filter and optional status/date filters. */
  async list(filter: VoucherlistFilter): Promise<LexwareResult<Page<VoucherlistItem>>> {
    return this.http.get('/voucherlist', { params: filter as Record<string, unknown> });
  }

  /** Async iterator that paginates through all matching voucherlist items. */
  async *listAll(filter: Omit<VoucherlistFilter, 'page'>): AsyncGenerator<VoucherlistItem> {
    yield* this.http.paginate<VoucherlistItem>('/voucherlist', filter as Record<string, unknown>);
  }
}
