// Main client
export { LexwareClient, type LexwareClientConfig, type ConnectionStatus } from './client.js';

// Result types
export {
  type LexwareResult,
  type LexwareSuccess,
  type LexwareFailure,
  ok,
  fail,
} from './types/result.js';

// Error types
export type { LexwareError, ErrorCode, ErrorDetail } from './errors.js';

// Pagination
export type { Page, PaginationParams, SortInfo } from './types/pagination.js';

// Common types
export type {
  TaxType,
  VoucherStatus,
  Currency,
  Address,
  LineItem,
  TextLineItem,
  UnitPrice,
  TotalPrice,
  TaxAmount,
  TaxConditions,
  PaymentConditions,
  ShippingConditions,
  ShippingType,
  ResourceResponse,
  XRechnungInfo,
  DocumentFileId,
  DownPaymentDeduction,
  VoucherFile,
} from './types/common.js';

// Resource types
export type {
  Article,
  ArticleCreateParams,
  ArticleType,
  ArticlePrice,
  ArticleListFilter,
} from './resources/articles.js';

export type {
  Contact,
  ContactCreateParams,
  ContactListFilter,
  ContactRole,
  ContactPerson,
  ContactCompany,
  ContactAddress,
  ContactEmailAddress,
  ContactPhoneNumber,
} from './resources/contacts.js';

export type {
  Invoice,
  InvoiceCreateParams,
  InvoiceListFilter,
} from './resources/invoices.js';

export type {
  CreditNote,
  CreditNoteCreateParams,
  CreditNoteListFilter,
} from './resources/credit-notes.js';

export type {
  DeliveryNote,
  DeliveryNoteCreateParams,
  DeliveryNoteListFilter,
} from './resources/delivery-notes.js';

export type {
  Quotation,
  QuotationCreateParams,
  QuotationListFilter,
} from './resources/quotations.js';

export type {
  OrderConfirmation,
  OrderConfirmationCreateParams,
  OrderConfirmationListFilter,
} from './resources/order-confirmations.js';

export type {
  Dunning,
  DunningCreateParams,
  DunningListFilter,
} from './resources/dunnings.js';

export type {
  DownPaymentInvoice,
  DownPaymentInvoiceListFilter,
} from './resources/down-payment-invoices.js';

export type {
  Voucher,
  VoucherCreateParams,
  VoucherListFilter,
  VoucherType,
  VoucherItem,
} from './resources/vouchers.js';

export type {
  VoucherlistItem,
  VoucherlistFilter,
  VoucherlistVoucherType,
  VoucherlistVoucherStatus,
} from './resources/voucherlist.js';

export type { RecurringTemplate } from './resources/recurring-templates.js';

export type { Payment, PaymentItem } from './resources/payments.js';

export type { Country } from './resources/countries.js';

export type { PaymentCondition } from './resources/payment-conditions.js';

export type { PostingCategory } from './resources/posting-categories.js';

export type { PrintLayout } from './resources/print-layouts.js';

export type { Profile } from './resources/profile.js';

export type { FileUploadResponse } from './resources/files.js';

export type {
  EventSubscription,
  EventSubscriptionCreateParams,
  EventType,
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
