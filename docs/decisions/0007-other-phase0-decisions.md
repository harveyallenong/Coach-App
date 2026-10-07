# 0007 — Other Phase-0 decisions

- Status: Accepted (2026-10-07, product owner approved the proposed defaults)

| # | Decision |
|---|---|
| Pay later | Coaches have an `allowPayLater` setting, on by default. A pay-later booking is `confirmed` with an open `Charge`. Coach-created bookings always allow pay later. |
| Recurring bookings | A series ignores `maxAdvanceDays` but still respects the minimum notice. Occurrences that conflict are skipped and reported. All occurrences are created up front. |
| Slot step | The default is 60 minutes. Coaches can choose 15, 30 or 60. |
| Vercel | With Docker, the worker runs in its own container and realtime uses SSE. On Vercel, the worker runs on a separate small host or Vercel Cron calls `/api/cron/[job]`, and realtime uses the Pusher adapter. |
| Data deletion | Personal content is hard-deleted. Bookings, payments and audit rows are anonymized and kept. Deletion has a 7-day grace period. |
| Memberships | A membership gives N credits per month or unlimited. Unused credits expire at the end of the period. Renewals are confirmed by the coach. |
| Location search | Search filters by city or area. Geo radius search is deferred. |
| Payment hold | A booking in `pending_payment` with no proof submitted expires after 15 minutes. |
| Auth.js | Use v5, pinned to an exact version. |
| Waitlist | The waitlist also applies to full group classes. |
| Seed | Two Asia/Manila coaches billing in PHP and one America/New_York coach billing in USD. The UI is in English. |
