import type {
  Address,
  LineItem,
  TextLineItem,
  TotalPrice,
  TaxConditions,
  PaymentConditions,
  ShippingConditions,
} from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A recurring invoice template with schedule and content details. */
export type RecurringTemplate = {
  id: string;
  organizationId: string;
  createdDate: string;
  updatedDate: string;
  version: number;
  language: string;
  archived: boolean;
  templateName?: string;
  address: Address;
  lineItems: (LineItem | TextLineItem)[];
  totalPrice: TotalPrice;
  taxConditions: TaxConditions;
  paymentConditions?: PaymentConditions;
  shippingConditions?: ShippingConditions;
  title?: string;
  introduction?: string;
  remark?: string;
  nextExecutionDate?: string;
  lastExecutionDate?: string;
  executionInterval?: string;
  executionStatus?: string;
};

/** Resource for retrieving recurring invoice templates. */
export class RecurringTemplatesResource {
  constructor(private http: HttpClient) {}

  /** Retrieve a single recurring template by its ID. */
  async get(id: string): Promise<LexwareResult<RecurringTemplate>> {
    return this.http.get(`/recurring-templates/${encodeURIComponent(id)}`);
  }

  /** List recurring templates with optional pagination. */
  async list(params?: PaginationParams): Promise<LexwareResult<Page<RecurringTemplate>>> {
    return this.http.get('/recurring-templates', { params: params as Record<string, unknown> });
  }

  /** Async iterator that paginates through all recurring templates. */
  async *listAll(params?: Omit<PaginationParams, 'page'>): AsyncGenerator<RecurringTemplate> {
    yield* this.http.paginate<RecurringTemplate>(
      '/recurring-templates',
      params as Record<string, unknown>,
    );
  }
}
