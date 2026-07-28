type AnalyticsEvent =
  | "landing_page_view"
  | "signup_started"
  | "signup_completed"
  | "first_message_sent"
  | "plan_viewed"
  | "checkout_started"
  | "payment_completed"
  | "payment_failed"
  | "referral_link_shared"
  | "referral_converted"
  | "document_uploaded"
  | "content_generated"
  | "code_generated"
  | "onboarding_completed"
  | "account_deleted";

interface QueuedEvent {
  event: AnalyticsEvent;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

const queue: QueuedEvent[] = [];

export function trackEvent(
  event: AnalyticsEvent,
  metadata?: Record<string, unknown>
): void {
  queue.push({ event, metadata, timestamp: new Date().toISOString() });
  if (import.meta.env.DEV) {
    console.log("[Analytics]", event, metadata ?? "");
  }
}

export function getEventQueue(): QueuedEvent[] {
  return [...queue];
}

export function clearEventQueue(): void {
  queue.length = 0;
}
