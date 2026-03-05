import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';

/** The organization profile including company info and tax settings. */
export type Profile = {
  organizationId: string;
  companyName: string;
  created?: {
    userId: string;
    userName: string;
    userEmail: string;
    date: string;
  };
  connectionId?: string;
  taxType?: string;
  smallBusiness?: boolean;
};

/** Resource for retrieving the organization's profile. */
export class ProfileResource {
  constructor(private http: HttpClient) {}

  /** Retrieve the organization's profile information. */
  async get(): Promise<LexwareResult<Profile>> {
    return this.http.get('/profile');
  }
}
