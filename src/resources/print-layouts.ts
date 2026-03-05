import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A print layout template available for rendering voucher documents. */
export type PrintLayout = {
  id: string;
  name: string;
  default: boolean;
};

/** Resource for retrieving available print layouts. */
export class PrintLayoutsResource {
  constructor(private http: HttpClient) {}

  /** List all print layouts available for the organization. */
  async list(): Promise<LexwareResult<PrintLayout[]>> {
    return this.http.get('/print-layouts');
  }
}
