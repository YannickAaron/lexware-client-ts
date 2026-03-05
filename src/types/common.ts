/** Tax calculation method for line items and vouchers. */
export type TaxType =
  | 'net'
  | 'gross'
  | 'vatfree'
  | 'intraCommunitySupply'
  | 'constructionService13b'
  | 'externalService13b'
  | 'thirdPartyCountryService'
  | 'thirdPartyCountryDelivery'
  | 'photovoltaicEquipment';

/** Lifecycle status of a voucher (invoice, credit note, etc.). */
export type VoucherStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'paidoff'
  | 'voided'
  | 'overdue'
  | 'accepted'
  | 'rejected'
  | 'unchecked'
  | 'sepadebit'
  | 'closed';

/** Supported currency codes. Currently only EUR. */
export type Currency = 'EUR';

/** Postal address associated with a contact or voucher. */
export type Address = {
  contactId?: string;
  name?: string;
  supplement?: string;
  street?: string;
  city?: string;
  zip?: string;
  countryCode?: string;
  contactPerson?: string;
};

/** Price per unit with net/gross amounts and tax rate. */
export type UnitPrice = {
  currency: Currency;
  netAmount: number;
  grossAmount?: number;
  taxRatePercentage: number;
};

/** A billable line item (custom, material, or service) on a voucher. */
export type LineItem = {
  id?: string;
  type: 'custom' | 'material' | 'service';
  name: string;
  description?: string;
  quantity: number;
  unitName: string;
  unitPrice: UnitPrice;
  discountPercentage?: number;
  lineItemAmount?: number;
  subItems?: LineItem[];
};

/** A text-only line item used for descriptions or notes on a voucher. */
export type TextLineItem = {
  id?: string;
  type: 'text';
  name: string;
  description?: string;
};

/** Aggregated totals for a voucher including net, gross, tax, and discounts. */
export type TotalPrice = {
  currency: Currency;
  totalNetAmount?: number;
  totalGrossAmount?: number;
  totalTaxAmount?: number;
  totalDiscountAbsolute?: number;
  totalDiscountPercentage?: number;
};

/** Breakdown of tax for a single tax rate. */
export type TaxAmount = {
  taxRatePercentage: number;
  taxAmount: number;
  netAmount: number;
};

/** Tax treatment applied to a voucher. */
export type TaxConditions = {
  taxType: TaxType;
  taxTypeNote?: string;
};

/** Payment terms including due duration and optional early-payment discounts. */
export type PaymentConditions = {
  paymentTermLabel?: string;
  paymentTermLabelTemplate?: string;
  paymentTermDuration?: number;
  paymentDiscountConditions?: {
    discountPercentage: number;
    discountRange: number;
  };
};

/** Delivery or service fulfilment type for shipping conditions. */
export type ShippingType =
  | 'service'
  | 'serviceperiod'
  | 'delivery'
  | 'deliveryperiod'
  | 'none';

/** Shipping or service date range and type for a voucher. */
export type ShippingConditions = {
  shippingDate?: string;
  shippingEndDate?: string;
  shippingType: ShippingType;
};

/** Response returned after creating or updating a resource. */
export type ResourceResponse = {
  id: string;
  resourceUri: string;
  createdDate: string;
  updatedDate: string;
  version: number;
};

/** XRechnung (German e-invoicing) metadata for a voucher. */
export type XRechnungInfo = {
  buyerReference: string;
  vendorNumberAtCustomer?: string;
};

/** Reference to a rendered document file (e.g. PDF). */
export type DocumentFileId = {
  documentFileId: string;
};

/** A down payment that has been deducted from a final invoice. */
export type DownPaymentDeduction = {
  id: string;
  voucherType: string;
  title: string;
  voucherNumber: string;
  voucherDate: string;
  receivedGrossAmount: number;
  receivedTaxAmount: number;
  taxRatePercentage: number;
};

/** File attachment associated with a voucher. */
export type VoucherFile = {
  documentFileId?: string;
};
