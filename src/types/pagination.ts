/** Query parameters for paginated list endpoints. */
export type PaginationParams = {
  page?: number;
  size?: number;
  sort?: string;
};

/** Sort metadata returned in a paginated response. */
export type SortInfo = {
  property: string;
  direction: 'ASC' | 'DESC';
  ignoreCase: boolean;
  nullHandling: string;
  ascending: boolean;
};

/** A single page of results from a paginated API response. */
export type Page<T> = {
  content: T[];
  first: boolean;
  last: boolean;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  size: number;
  number: number;
  sort?: SortInfo[];
};
