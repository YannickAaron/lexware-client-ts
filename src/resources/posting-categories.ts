import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A bookkeeping posting category used for classifying voucher line items. */
export type PostingCategory = {
  id: string;
  name: string;
  type: string;
  contactRequired: boolean;
  splitAllowed: boolean;
  groupName: string;
};

/** Resource for retrieving available posting categories. */
export class PostingCategoriesResource {
  constructor(private http: HttpClient) {}

  /** List all posting categories available for the organization. */
  async list(): Promise<LexwareResult<PostingCategory[]>> {
    return this.http.get('/posting-categories');
  }
}
