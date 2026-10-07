# 0004 — Cancellation window & late-cancel defaults

- Status: Accepted (2026-10-07, product owner)

## Decision
- The default cancellation window is **30 minutes** before the session starts (`cancellationWindowMin = 30`). The default late-cancel policy is `FORFEIT`.
- If a client cancels within 30 minutes of the start, the booking becomes `late_cancel`. A credit-paid booking forfeits its credit, and a paid booking is not refunded, unless the coach chose `FEE` or `WAIVE`.
- If the coach cancels at any time, including within 30 minutes of the start, the booking becomes `cancelled_by_coach` and **nothing is forfeited**: the credit is returned, the payment is refunded in full, or the open charge is voided. A coach cancellation inside the window is counted in the coach's reliability stats.
- A credit can't be split, so `FEE` behaves like `FORFEIT` for credit-paid bookings.
- Coaches can change both the window and the policy.

Full outcome table: PLAN §2.2.
