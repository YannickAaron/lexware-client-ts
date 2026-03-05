// Main client
export { LexwareClient, type LexwareClientConfig } from './client.js';

// Result types
export {
  type LexwareResult,
  type LexwareSuccess,
  type LexwareFailure,
  ok,
  fail,
} from './types/result.js';

// Error types
export { type LexwareError, type ErrorCode, type ErrorDetail } from './errors.js';

// Pagination
export { type Page, type PaginationParams, type SortInfo } from './types/pagination.js';

// Common types
export {
  type TaxType,
  type VoucherStatus,
  type Currency,
  type Address,
  type LineItem,
  type TextLineItem,
  type UnitPrice,
  type TotalPrice,
  type TaxAmount,
  type TaxConditions,
  type PaymentConditions,
  type ShippingConditions,
  type ShippingType,
  type ResourceResponse,
  type XRechnungInfo,
  type DocumentFileId,
  type DownPaymentDeduction,
  type VoucherFile,
} from './types/common.js';

// Resource types
export {
  type Article,
  type ArticleCreateParams,
  type ArticleType,
  type ArticlePrice,
  type ArticleListFilter,
} from './resources/articles.js';

export {
  type Contact,
  type ContactCreateParams,
  type ContactListFilter,
  type ContactRole,
  type ContactPerson,
  type ContactCompany,
  type ContactAddress,
  type ContactEmailAddress,
  type ContactPhoneNumber,
} from './resources/contacts.js';

export {
  type Invoice,
  type InvoiceCreateParams,
  type InvoiceListFilter,
} from './resources/invoices.js';

export {
  type CreditNote,
  type CreditNoteCreateParams,
  type CreditNoteListFilter,
} from './resources/credit-notes.js';

export {
  type DeliveryNote,
  type DeliveryNoteCreateParams,
  type DeliveryNoteListFilter,
} from './resources/delivery-notes.js';

export {
  type Quotation,
  type QuotationCreateParams,
  type QuotationListFilter,
} from './resources/quotations.js';

export {
  type OrderConfirmation,
  type OrderConfirmationCreateParams,
  type OrderConfirmationListFilter,
} from './resources/order-confirmations.js';

export {
  type Dunning,
  type DunningCreateParams,
  type DunningListFilter,
} from './resources/dunnings.js';

export {
  type DownPaymentInvoice,
  type DownPaymentInvoiceListFilter,
} from './resources/down-payment-invoices.js';

export {
  type Voucher,
  type VoucherCreateParams,
  type VoucherListFilter,
  type VoucherType,
  type VoucherItem,
} from './resources/vouchers.js';

export {
  type VoucherlistItem,
  type VoucherlistFilter,
  type VoucherlistVoucherType,
  type VoucherlistVoucherStatus,
} from './resources/voucherlist.js';

export { type RecurringTemplate } from './resources/recurring-templates.js';

export { type Payment, type PaymentItem } from './resources/payments.js';

export { type Country } from './resources/countries.js';

export { type PaymentCondition } from './resources/payment-conditions.js';

export { type PostingCategory } from './resources/posting-categories.js';

export { type PrintLayout } from './resources/print-layouts.js';

export { type Profile } from './resources/profile.js';

export { type FileUploadResponse } from './resources/files.js';

export {
  type EventSubscription,
  type EventSubscriptionCreateParams,
  type EventType,
} from './resources/event-subscriptions.js';

// Type guards
export { isTextLineItem, isLineItem, isSuccess, isFailure } from './types/guards.js';

// Composite endpoints
export {
  CompositesResource,
  type CreateAndFinalizeResult,
  type InvoiceWithContact,
  type ContactWithInvoices,
  type OutstandingInvoice,
  type ArticleLineInput,
  type CreateInvoiceFromArticlesParams,
  type ContactRevenue,
} from './composites.js';
