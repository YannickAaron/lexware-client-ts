/** Machine-readable error code derived from the HTTP status. */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'PAYMENT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'NOT_ACCEPTABLE'
  | 'CONFLICT'
  | 'UNSUPPORTED_MEDIA'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

/** A single validation or field-level error detail from the API. */
export type ErrorDetail = {
  readonly violation?: string;
  readonly field?: string;
  readonly message?: string;
};

/** Structured error returned by the lexoffice API client. */
export type LexwareError = {
  readonly code: ErrorCode;
  readonly status: number;
  readonly message: string;
  readonly traceId?: string;
  readonly timestamp?: string;
  readonly path?: string;
  readonly details?: ErrorDetail[];
};

const statusCodeMap: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  406: 'NOT_ACCEPTABLE',
  409: 'CONFLICT',
  415: 'UNSUPPORTED_MEDIA',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

/** Maps an HTTP status code to the corresponding {@link ErrorCode}. */
export function mapStatusToErrorCode(status: number): ErrorCode {
  return statusCodeMap[status] ?? 'UNKNOWN';
}
