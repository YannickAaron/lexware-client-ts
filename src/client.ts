import { CompositesResource } from './composites.js';
import { HttpClient } from './http.js';
import { ArticlesResource } from './resources/articles.js';
import { ContactsResource } from './resources/contacts.js';
import { CountriesResource } from './resources/countries.js';
import { CreditNotesResource } from './resources/credit-notes.js';
import { DeliveryNotesResource } from './resources/delivery-notes.js';
import { DownPaymentInvoicesResource } from './resources/down-payment-invoices.js';
import { DunningsResource } from './resources/dunnings.js';
import { EventSubscriptionsResource } from './resources/event-subscriptions.js';
import { FilesResource } from './resources/files.js';
import { InvoicesResource } from './resources/invoices.js';
import { OrderConfirmationsResource } from './resources/order-confirmations.js';
import { PaymentConditionsResource } from './resources/payment-conditions.js';
import { PaymentsResource } from './resources/payments.js';
import { PostingCategoriesResource } from './resources/posting-categories.js';
import { PrintLayoutsResource } from './resources/print-layouts.js';
import { ProfileResource } from './resources/profile.js';
import { QuotationsResource } from './resources/quotations.js';
import { RecurringTemplatesResource } from './resources/recurring-templates.js';
import { VoucherlistResource } from './resources/voucherlist.js';
import { VouchersResource } from './resources/vouchers.js';
import type { LexwareResult } from './types/result.js';

/** Result of verifying the API key connection. */
export type ConnectionStatus =
  | {
      success: true;
      organizationId: string;
      companyName: string;
    }
  | {
      success: false;
      error: string;
    };

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

  /**
   * Verify that the API key is valid by making a lightweight request to the profile endpoint.
   * Returns the organization ID and company name on success, or an error message on failure.
   *
   * @example
   * ```typescript
   * const status = await client.verifyApiKey();
   * if (status.success) {
   *   console.log(`Connected to ${status.companyName} (${status.organizationId})`);
   * } else {
   *   console.error('Invalid API key:', status.error);
   * }
   * ```
   */
  async verifyApiKey(): Promise<ConnectionStatus> {
    const result: LexwareResult<{ organizationId: string; companyName: string }> =
      await this.profile.get();
    if (result.success) {
      return {
        success: true,
        organizationId: result.data.organizationId,
        companyName: result.data.companyName,
      };
    }
    return {
      success: false,
      error: result.error.message,
    };
  }

  /** Articles resource for managing products and services. */
  get articles(): ArticlesResource {
    this._articles ??= new ArticlesResource(this.http);
    return this._articles;
  }

  /** Contacts resource for managing customers and vendors. */
  get contacts(): ContactsResource {
    this._contacts ??= new ContactsResource(this.http);
    return this._contacts;
  }

  /** Invoices resource for creating, retrieving, and managing invoices. */
  get invoices(): InvoicesResource {
    this._invoices ??= new InvoicesResource(this.http);
    return this._invoices;
  }

  /** Credit notes resource for creating and managing credit notes. */
  get creditNotes(): CreditNotesResource {
    this._creditNotes ??= new CreditNotesResource(this.http);
    return this._creditNotes;
  }

  /** Delivery notes resource for creating and managing delivery notes. */
  get deliveryNotes(): DeliveryNotesResource {
    this._deliveryNotes ??= new DeliveryNotesResource(this.http);
    return this._deliveryNotes;
  }

  /** Quotations resource for creating and managing quotes. */
  get quotations(): QuotationsResource {
    this._quotations ??= new QuotationsResource(this.http);
    return this._quotations;
  }

  /** Order confirmations resource for creating and managing order confirmations. */
  get orderConfirmations(): OrderConfirmationsResource {
    this._orderConfirmations ??= new OrderConfirmationsResource(this.http);
    return this._orderConfirmations;
  }

  /** Dunnings resource for creating and managing payment reminders. */
  get dunnings(): DunningsResource {
    this._dunnings ??= new DunningsResource(this.http);
    return this._dunnings;
  }

  /** Down payment invoices resource for managing advance payment invoices. */
  get downPaymentInvoices(): DownPaymentInvoicesResource {
    this._downPaymentInvoices ??= new DownPaymentInvoicesResource(this.http);
    return this._downPaymentInvoices;
  }

  /** Vouchers resource for creating and managing vouchers. */
  get vouchers(): VouchersResource {
    this._vouchers ??= new VouchersResource(this.http);
    return this._vouchers;
  }

  /** Voucherlist resource for querying and filtering across all voucher types. */
  get voucherlist(): VoucherlistResource {
    this._voucherlist ??= new VoucherlistResource(this.http);
    return this._voucherlist;
  }

  /** Recurring templates resource for managing recurring invoice templates. */
  get recurringTemplates(): RecurringTemplatesResource {
    this._recurringTemplates ??= new RecurringTemplatesResource(this.http);
    return this._recurringTemplates;
  }

  /** Payments resource for managing payment records. */
  get payments(): PaymentsResource {
    this._payments ??= new PaymentsResource(this.http);
    return this._payments;
  }

  /** Countries resource for retrieving available countries. */
  get countries(): CountriesResource {
    this._countries ??= new CountriesResource(this.http);
    return this._countries;
  }

  /** Payment conditions resource for retrieving available payment terms. */
  get paymentConditions(): PaymentConditionsResource {
    this._paymentConditions ??= new PaymentConditionsResource(this.http);
    return this._paymentConditions;
  }

  /** Posting categories resource for retrieving available booking categories. */
  get postingCategories(): PostingCategoriesResource {
    this._postingCategories ??= new PostingCategoriesResource(this.http);
    return this._postingCategories;
  }

  /** Print layouts resource for retrieving available document print layouts. */
  get printLayouts(): PrintLayoutsResource {
    this._printLayouts ??= new PrintLayoutsResource(this.http);
    return this._printLayouts;
  }

  /** Profile resource for retrieving the authenticated user's organization profile. */
  get profile(): ProfileResource {
    this._profile ??= new ProfileResource(this.http);
    return this._profile;
  }

  /** Files resource for uploading and downloading file attachments. */
  get files(): FilesResource {
    this._files ??= new FilesResource(this.http);
    return this._files;
  }

  /** Event subscriptions resource for managing webhook subscriptions. */
  get eventSubscriptions(): EventSubscriptionsResource {
    this._eventSubscriptions ??= new EventSubscriptionsResource(this.http);
    return this._eventSubscriptions;
  }

  /** Smart composite endpoints that combine multiple API calls. */
  get composites(): CompositesResource {
    this._composites ??= new CompositesResource(this);
    return this._composites;
  }
}
