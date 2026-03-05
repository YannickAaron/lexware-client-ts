import type { HttpClient } from '../http.js';
import type { Address } from '../types/common.js';
import type { ResourceResponse } from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';

/** A contact's role as customer or vendor with an optional number. */
export type ContactRole = {
  number?: number;
};

/** A person associated with a contact or company. */
export type ContactPerson = {
  salutation?: string;
  firstName?: string;
  lastName: string;
};

/** A company entity with tax info and associated contact persons. */
export type ContactCompany = {
  name: string;
  taxNumber?: string;
  vatRegistrationId?: string;
  allowTaxFreeInvoices?: boolean;
  contactPersons?: ContactPerson[];
};

/** A contact address extending the base address with an optional supplement. */
export type ContactAddress = Address & {
  supplement?: string;
};

/** Email addresses for a contact grouped by category. */
export type ContactEmailAddress = {
  business?: string[];
  office?: string[];
  private?: string[];
  other?: string[];
};

/** Phone numbers for a contact grouped by category. */
export type ContactPhoneNumber = {
  business?: string[];
  office?: string[];
  mobile?: string[];
  private?: string[];
  fax?: string[];
  other?: string[];
};

/** A Lexware contact representing a customer, vendor, or both. */
export type Contact = {
  id: string;
  organizationId: string;
  version: number;
  roles: {
    customer?: ContactRole;
    vendor?: ContactRole;
  };
  company?: ContactCompany;
  person?: ContactPerson;
  addresses?: {
    billing?: ContactAddress[];
    shipping?: ContactAddress[];
  };
  xRechnung?: {
    buyerReference?: string;
    vendorNumberAtCustomer?: string;
  };
  emailAddresses?: ContactEmailAddress;
  phoneNumbers?: ContactPhoneNumber;
  note?: string;
  archived?: boolean;
};

/** Parameters for creating or updating a contact. */
export type ContactCreateParams = {
  version: number;
  roles: {
    customer?: ContactRole;
    vendor?: ContactRole;
  };
  company?: ContactCompany;
  person?: ContactPerson;
  addresses?: {
    billing?: ContactAddress[];
    shipping?: ContactAddress[];
  };
  xRechnung?: {
    buyerReference?: string;
    vendorNumberAtCustomer?: string;
  };
  emailAddresses?: ContactEmailAddress;
  phoneNumbers?: ContactPhoneNumber;
  note?: string;
};

/** Filter options for listing contacts. */
export type ContactListFilter = PaginationParams & {
  email?: string;
  name?: string;
  number?: number;
  customer?: boolean;
  vendor?: boolean;
};

/** Resource for managing Lexware contacts (customers and vendors). */
export class ContactsResource {
  constructor(private http: HttpClient) {}

  /** Create a new contact. */
  async create(contact: ContactCreateParams): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/contacts', contact);
  }

  /** Retrieve a single contact by ID. */
  async get(id: string): Promise<LexwareResult<Contact>> {
    return this.http.get(`/contacts/${encodeURIComponent(id)}`);
  }

  /** Update an existing contact by ID. */
  async update(id: string, contact: ContactCreateParams): Promise<LexwareResult<ResourceResponse>> {
    return this.http.put(`/contacts/${encodeURIComponent(id)}`, contact);
  }

  /** List contacts with optional filtering and pagination. */
  async list(filter?: ContactListFilter): Promise<LexwareResult<Page<Contact>>> {
    return this.http.get('/contacts', { params: filter as Record<string, unknown> });
  }

  /** Async iterator that automatically paginates through all matching contacts. */
  async *listAll(filter?: Omit<ContactListFilter, 'page'>): AsyncGenerator<Contact> {
    yield* this.http.paginate<Contact>('/contacts', filter as Record<string, unknown>);
  }
}
