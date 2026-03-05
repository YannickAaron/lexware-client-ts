import type { Currency, VoucherStatus } from '../types/common.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A single payment transaction within a voucher's payment history. */
export type PaymentItem = {
  paymentType: string;
  voucherType: string;
  currency: Currency;
  amount: number;
  date: string;
};

/** Payment status and history for a voucher. */
export type Payment = {
  openAmount: number;
  currency: Currency;
  paymentStatus: string;
  voucherId: string;
  voucherType: string;
  voucherStatus: VoucherStatus;
  paidDate?: string;
  paymentItems?: PaymentItem[];
};

/** Resource for retrieving payment information for vouchers. */
export class PaymentsResource {
  constructor(private http: HttpClient) {}

  /** Retrieve payment details for a voucher by its ID. */
  async get(id: string): Promise<LexwareResult<Payment>> {
    return this.http.get(`/payments/${encodeURIComponent(id)}`);
  }
}
