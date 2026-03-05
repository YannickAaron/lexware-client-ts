import type { HttpClient } from '../http.js';
import type { LexwareResult } from '../types/result.js';

/** Response returned after successfully uploading a file. */
export type FileUploadResponse = {
  id: string;
};

/** Resource for uploading and downloading files. */
export class FilesResource {
  constructor(private http: HttpClient) {}

  /** Upload a file using multipart form data. */
  async upload(formData: FormData): Promise<LexwareResult<FileUploadResponse>> {
    return this.http.postFormData('/files', formData);
  }

  /** Download a file by its document file ID. */
  async download(documentFileId: string): Promise<LexwareResult<Blob>> {
    return this.http.getBlob(`/files/${encodeURIComponent(documentFileId)}`);
  }
}
