import { HttpClient } from './http.js';
import { ArticlesResource } from './resources/articles.js';
import { ContactsResource } from './resources/contacts.js';
import { InvoicesResource } from './resources/invoices.js';
import { CreditNotesResource } from './resources/credit-notes.js';
import { DeliveryNotesResource } from './resources/delivery-notes.js';
import { QuotationsResource } from './resources/quotations.js';
import { OrderConfirmationsResource } from './resources/order-confirmations.js';
import { DunningsResource } from './resources/dunnings.js';
import { DownPaymentInvoicesResource } from './resources/down-payment-invoices.js';
import { VouchersResource } from './resources/vouchers.js';
import { VoucherlistResource } from './resources/voucherlist.js';
import { RecurringTemplatesResource } from './resources/recurring-templates.js';
import { PaymentsResource } from './resources/payments.js';
import { CountriesResource } from './resources/countries.js';
import { PaymentConditionsResource } from './resources/payment-conditions.js';
import { PostingCategoriesResource } from './resources/posting-categories.js';
import { PrintLayoutsResource } from './resources/print-layouts.js';
import { ProfileResource } from './resources/profile.js';
import { FilesResource } from './resources/files.js';
import { EventSubscriptionsResource } from './resources/event-subscriptions.js';
import { CompositesResource } from './composites.js';

/** Configuration for the Lexware API client. */
export type LexwareClientConfig = {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  rateLimitPerSecond?: number;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
};

/** Lexware API client providing access to all API resources. */
export class LexwareClient {
  private readonly http: HttpClient;

  private _articles?: ArticlesResource;
  private _contacts?: ContactsResource;
  private _invoices?: InvoicesResource;
  private _creditNotes?: CreditNotesResource;
  private _deliveryNotes?: DeliveryNotesResource;
  private _quotations?: QuotationsResource;
  private _orderConfirmations?: OrderConfirmationsResource;
  private _dunnings?: DunningsResource;
  private _downPaymentInvoices?: DownPaymentInvoicesResource;
  private _vouchers?: VouchersResource;
  private _voucherlist?: VoucherlistResource;
  private _recurringTemplates?: RecurringTemplatesResource;
  private _payments?: PaymentsResource;
  private _countries?: CountriesResource;
  private _paymentConditions?: PaymentConditionsResource;
  private _postingCategories?: PostingCategoriesResource;
  private _printLayouts?: PrintLayoutsResource;
  private _profile?: ProfileResource;
  private _files?: FilesResource;
  private _eventSubscriptions?: EventSubscriptionsResource;
  private _composites?: CompositesResource;

  constructor(config: LexwareClientConfig) {
    this.http = new HttpClient({
      baseUrl: config.baseUrl ?? 'https://api.lexware.io/v1',
      apiKey: config.apiKey,
      maxRetries: config.maxRetries ?? 3,
      rateLimitPerSecond: config.rateLimitPerSecond ?? 2,
      timeout: config.timeout ?? 30_000,
      fetch: config.fetch,
    });
  }

  /** Articles resource for managing products and services. */
  get articles(): ArticlesResource {
    return (this._articles ??= new ArticlesResource(this.http));
  }

  /** Contacts resource for managing customers and vendors. */
  get contacts(): ContactsResource {
    return (this._contacts ??= new ContactsResource(this.http));
  }

  /** Invoices resource for creating, retrieving, and managing invoices. */
  get invoices(): InvoicesResource {
    return (this._invoices ??= new InvoicesResource(this.http));
  }

  /** Credit notes resource for creating and managing credit notes. */
  get creditNotes(): CreditNotesResource {
    return (this._creditNotes ??= new CreditNotesResource(this.http));
  }

  /** Delivery notes resource for creating and managing delivery notes. */
  get deliveryNotes(): DeliveryNotesResource {
    return (this._deliveryNotes ??= new DeliveryNotesResource(this.http));
  }

  /** Quotations resource for creating and managing quotes. */
  get quotations(): QuotationsResource {
    return (this._quotations ??= new QuotationsResource(this.http));
  }

  /** Order confirmations resource for creating and managing order confirmations. */
  get orderConfirmations(): OrderConfirmationsResource {
    return (this._orderConfirmations ??= new OrderConfirmationsResource(this.http));
  }

  /** Dunnings resource for creating and managing payment reminders. */
  get dunnings(): DunningsResource {
    return (this._dunnings ??= new DunningsResource(this.http));
  }

  /** Down payment invoices resource for managing advance payment invoices. */
  get downPaymentInvoices(): DownPaymentInvoicesResource {
    return (this._downPaymentInvoices ??= new DownPaymentInvoicesResource(this.http));
  }

  /** Vouchers resource for creating and managing vouchers. */
  get vouchers(): VouchersResource {
    return (this._vouchers ??= new VouchersResource(this.http));
  }

  /** Voucherlist resource for querying and filtering across all voucher types. */
  get voucherlist(): VoucherlistResource {
    return (this._voucherlist ??= new VoucherlistResource(this.http));
  }

  /** Recurring templates resource for managing recurring invoice templates. */
  get recurringTemplates(): RecurringTemplatesResource {
    return (this._recurringTemplates ??= new RecurringTemplatesResource(this.http));
  }

  /** Payments resource for managing payment records. */
  get payments(): PaymentsResource {
    return (this._payments ??= new PaymentsResource(this.http));
  }

  /** Countries resource for retrieving available countries. */
  get countries(): CountriesResource {
    return (this._countries ??= new CountriesResource(this.http));
  }

  /** Payment conditions resource for retrieving available payment terms. */
  get paymentConditions(): PaymentConditionsResource {
    return (this._paymentConditions ??= new PaymentConditionsResource(this.http));
  }

  /** Posting categories resource for retrieving available booking categories. */
  get postingCategories(): PostingCategoriesResource {
    return (this._postingCategories ??= new PostingCategoriesResource(this.http));
  }

  /** Print layouts resource for retrieving available document print layouts. */
  get printLayouts(): PrintLayoutsResource {
    return (this._printLayouts ??= new PrintLayoutsResource(this.http));
  }

  /** Profile resource for retrieving the authenticated user's organization profile. */
  get profile(): ProfileResource {
    return (this._profile ??= new ProfileResource(this.http));
  }

  /** Files resource for uploading and downloading file attachments. */
  get files(): FilesResource {
    return (this._files ??= new FilesResource(this.http));
  }

  /** Event subscriptions resource for managing webhook subscriptions. */
  get eventSubscriptions(): EventSubscriptionsResource {
    return (this._eventSubscriptions ??= new EventSubscriptionsResource(this.http));
  }

  /** Smart composite endpoints that combine multiple API calls. */
  get composites(): CompositesResource {
    return (this._composites ??= new CompositesResource(this));
  }
}
