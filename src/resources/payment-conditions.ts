import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A payment condition defining term duration and optional discount rules. */
export type PaymentCondition = {
  id: string;
  organizationId: string;
  paymentTermLabelTemplate: string;
  paymentTermDuration: number;
  paymentDiscountConditions?: {
    discountPercentage: number;
    discountRange: number;
  };
};

/** Resource for retrieving the organization's payment conditions. */
export class PaymentConditionsResource {
  constructor(private http: HttpClient) {}

  /** List all payment conditions configured for the organization. */
  async list(): Promise<LexwareResult<PaymentCondition[]>> {
    return this.http.get('/payment-conditions');
  }
}
