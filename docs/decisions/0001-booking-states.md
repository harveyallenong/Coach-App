# 0001 — Booking states

- Status: Accepted (2026-10-07, product owner)

## Context
The brief lists 7 booking states: `pending_payment`, `confirmed`, `completed`, `cancelled_by_client`, `cancelled_by_coach`, `late_cancel` and `no_show`. None of them covers a booking request in approval-required mode, or an unpaid hold that times out.

## Decision
Add three states: `requested`, `declined` and `expired`. Transitions are in PLAN §2.1 and are implemented in `src/server/domain/booking-state`.

## Consequences
Booking queries and the calendar colour scheme have to handle 10 states. The `requested` state only blocks a slot after the coach approves the request. Until then a request doesn't create a `SCHEDULED` appointment, so it never trips the overlap constraint.
