# 0006 — Review periods

- Status: Accepted (2026-10-07, product owner)

## Decision
A client may leave one review per *review period* with a coach. They must have at least one completed session in that period.

A period is determined in this order:
1. **Program.** If the client is assigned a program, the period is that program's duration. A 10-day program allows 1 review in 10 days; a 20-day program allows 1 in 20 days. Key: `program:<id>`.
2. **Package.** Otherwise, a package purchase is a period, running until the package is used up or expires. Key: `package:<purchaseId>`.
3. **Single sessions.** Otherwise, a rolling 30-day window starts at the first completed session not covered by 1 or 2. Key: `window:<start date>`.

If more than one applies, the program wins over the package. The database enforces `UNIQUE(coachId, clientId, periodKey)`. The rule lives in `src/server/domain/reviews`. A coach's rating aggregates reviews from all periods.
