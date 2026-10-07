# 0005 — Direct-to-coach payments at launch (replaces the "Stripe default")

- Status: Accepted (2026-10-07, product owner). This changes a Project Decision in the brief (§1, Payments).

## Context
CoachBook targets coaches in the Philippines. Stripe doesn't onboard Philippine-registered merchants, so Stripe Connect payouts aren't viable. Coaches already collect payments over GCash, Maya and bank transfer.

## Decision
- The launch `PaymentProvider` adapter is `direct`.
  - Each coach stores GCash, Maya and bank details plus a QR Ph image.
  - The client pays the coach outside CoachBook, then submits a reference number and/or a proof screenshot. The screenshot goes to private storage.
  - The coach confirms or rejects the payment. Confirming moves the payment to `SUCCEEDED` and the booking to `confirmed`.
- The `manual` adapter lets a coach record cash, bank and e-wallet payments themselves.
- CoachBook never holds funds. The platform fee setting exists but is 0% and inactive. There are no platform payouts, so the earnings dashboard shows confirmed income, payments awaiting confirmation, outstanding balances and refunds owed.
- Refunds are recorded as `OWED`. The coach sends the money back and then records the reference number.
- **PayMongo** (cards, GCash, Maya, QR Ph) is planned as a later adapter on the same interface. The webhook route and `WebhookEvent` dedupe are built and tested now with the `fake` provider. A platform-collect model (PayMongo or Xendit sub-accounts plus `PayoutAccount`) gets its own ADR if it's ever needed.

## Consequences
- No payment secrets are needed for launch.
- The E2E "pay" step is a direct transfer that the coach confirms.
- Membership renewals are confirmed by the coach until automatic billing arrives.
