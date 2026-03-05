import type { LexwareError } from '../errors.js';

/** Successful API result containing the response data. */
export type LexwareSuccess<T> = {
  readonly success: true;
  readonly data: T;
};

/** Failed API result containing error details. */
export type LexwareFailure = {
  readonly success: false;
  readonly error: LexwareError;
};

/** Discriminated union representing either a successful or failed API result. */
export type LexwareResult<T> = LexwareSuccess<T> | LexwareFailure;

/** Creates a successful result wrapping the given data. */
export function ok<T>(data: T): LexwareSuccess<T> {
  return { success: true, data };
}

/** Creates a failed result wrapping the given error. */
export function fail(error: LexwareError): LexwareFailure {
  return { success: false, error };
}
