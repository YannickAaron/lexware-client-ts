import type { HttpClient } from '../http.js';
import type { ResourceResponse } from '../types/common.js';
import type { LexwareResult } from '../types/result.js';

/** Supported webhook event types for resource lifecycle notifications. */
export type EventType =
  | 'article.created'
  | 'article.changed'
  | 'article.deleted'
  | 'contact.created'
  | 'contact.changed'
  | 'contact.deleted'
  | 'credit-note.created'
  | 'credit-note.changed'
  | 'credit-note.deleted'
  | 'credit-note.status.changed'
  | 'delivery-note.created'
  | 'delivery-note.changed'
  | 'delivery-note.deleted'
  | 'delivery-note.status.changed'
  | 'down-payment-invoice.created'
  | 'down-payment-invoice.changed'
  | 'down-payment-invoice.deleted'
  | 'down-payment-invoice.status.changed'
  | 'dunning.created'
  | 'dunning.changed'
  | 'dunning.deleted'
  | 'dunning.status.changed'
  | 'invoice.created'
  | 'invoice.changed'
  | 'invoice.deleted'
  | 'invoice.status.changed'
  | 'order-confirmation.created'
  | 'order-confirmation.changed'
  | 'order-confirmation.deleted'
  | 'order-confirmation.status.changed'
  | 'payment.changed'
  | 'quotation.created'
  | 'quotation.changed'
  | 'quotation.deleted'
  | 'quotation.status.changed'
  | 'recurring-template.created'
  | 'recurring-template.changed'
  | 'recurring-template.deleted'
  | 'voucher.created'
  | 'voucher.changed'
  | 'voucher.deleted'
  | 'voucher.status.changed';

/** A registered webhook subscription for a specific event type. */
export type EventSubscription = {
  subscriptionId: string;
  organizationId: string;
  createdDate: string;
  eventType: EventType;
  callbackUrl: string;
};

/** Parameters for creating a new event subscription. */
export type EventSubscriptionCreateParams = {
  eventType: EventType;
  callbackUrl: string;
};

/** Resource for managing webhook event subscriptions. */
export class EventSubscriptionsResource {
  constructor(private http: HttpClient) {}

  /** Create a new event subscription for a given event type and callback URL. */
  async create(
    subscription: EventSubscriptionCreateParams,
  ): Promise<LexwareResult<ResourceResponse>> {
    return this.http.post('/event-subscriptions', subscription);
  }

  /** Retrieve a single event subscription by its ID. */
  async get(id: string): Promise<LexwareResult<EventSubscription>> {
    return this.http.get(`/event-subscriptions/${encodeURIComponent(id)}`);
  }

  /** List all registered event subscriptions. */
  async list(): Promise<LexwareResult<{ content: EventSubscription[] }>> {
    return this.http.get('/event-subscriptions');
  }

  /** Delete an event subscription by its ID. */
  async delete(id: string): Promise<LexwareResult<void>> {
    return this.http.delete(`/event-subscriptions/${encodeURIComponent(id)}`);
  }
}
