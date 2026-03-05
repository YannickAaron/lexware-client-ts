import type { LineItem, TextLineItem } from './common.js';
import type { LexwareFailure, LexwareResult, LexwareSuccess } from './result.js';

/** Type guard that checks if a line item is a text-only line item. */
export function isTextLineItem(item: LineItem | TextLineItem): item is TextLineItem {
  return item.type === 'text';
}

/** Type guard that checks if a line item is a priced line item (custom, material, or service). */
export function isLineItem(item: LineItem | TextLineItem): item is LineItem {
  return item.type !== 'text';
}

/** Type guard that checks if a result is successful. */
export function isSuccess<T>(result: LexwareResult<T>): result is LexwareSuccess<T> {
  return result.success === true;
}

/** Type guard that checks if a result is a failure. */
export function isFailure<T>(result: LexwareResult<T>): result is LexwareFailure {
  return result.success === false;
}
