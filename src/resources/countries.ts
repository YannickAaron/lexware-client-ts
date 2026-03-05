import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** A country with its code, localized names, and tax classification. */
export type Country = {
  countryCode: string;
  countryNameDE: string;
  countryNameEN: string;
  taxClassification: string;
};

/** Resource for retrieving the list of supported countries. */
export class CountriesResource {
  constructor(private http: HttpClient) {}

  /** List all available countries with their tax classifications. */
  async list(): Promise<LexwareResult<Country[]>> {
    return this.http.get('/countries');
  }
}
