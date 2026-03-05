import type { Currency } from '../types/common.js';
import type { Page, PaginationParams } from '../types/pagination.js';
import type { LexwareResult } from '../types/result.js';
import type { HttpClient } from '../http.js';
import type { ResourceResponse } from '../types/common.js';

/** The type of article: either a physical product or a service. */
export type ArticleType = 'PRODUCT' | 'SERVICE';

/** Pricing details for an article including net, gross, tax rate, and currency. */
export type ArticlePrice = {
  netPrice: number;
  grossPrice: number;
  leadingPrice: 'net' | 'gross';
  taxRate: number;
  currency: Currency;
};

/** A Lexware article (product or service) with pricing and metadata. */
export type Article = {
  id: string;
  organizationId: string;
  createdDate: string;
  updatedDate: string;
  version: number;
  archived: boolean;
  title: string;
  description?: string;
  type: ArticleType;
  articleNumber?: string;
  gtin?: string;
  note?: string;
  unitName?: string;
  price: ArticlePrice;
};

/** Parameters for creating or updating an article. */
export type ArticleCreateParams = {
  title: string;
  type: ArticleType;
  unitName?: string;
  price: ArticlePrice;
  description?: string;
  articleNumber?: string;
  gtin?: string;
  note?: string;
};

/** Filter options for listing articles. */
export type ArticleListFilter = PaginationParams & {
  articleNumber?: string;
  gtin?: string;
  type?: ArticleType;
};

/** Resource for managing Lexware articles (products and services). */
export class ArticlesResource {
  constructor(private http: HttpClient) {}

  /** Create a new article. */
  async create(article: ArticleCreateParams): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/articles', article);
  }

  /** Retrieve a single article by ID. */
  async get(id: string): Promise<LexwareResult<Article>> {
    return this.http.get(`/articles/${encodeURIComponent(id)}`);
  }

  /** Update an existing article by ID. */
  async update(id: string, article: ArticleCreateParams): Promise<LexwareResult<ResourceResponse>> {
    return this.http.put(`/articles/${encodeURIComponent(id)}`, article);
  }

  /** Delete an article by ID. */
  async delete(id: string): Promise<LexwareResult<void>> {
    return this.http.delete(`/articles/${encodeURIComponent(id)}`);
  }

  /** List articles with optional filtering and pagination. */
  async list(filter?: ArticleListFilter): Promise<LexwareResult<Page<Article>>> {
    return this.http.get('/articles', { params: filter as Record<string, unknown> });
  }

  /** Async iterator that automatically paginates through all matching articles. */
  async *listAll(filter?: Omit<ArticleListFilter, 'page'>): AsyncGenerator<Article> {
    yield* this.http.paginate<Article>('/articles', filter as Record<string, unknown>);
  }
}
