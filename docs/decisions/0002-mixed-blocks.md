# 0002 — Mixed blocks: 1:1 or group, first booking decides

- Status: Accepted (2026-10-07, product owner)

## Context
Coaches want flexibility to run group classes inside their available time without carving out fixed class slots.

## Decision
- Each availability window (`AvailabilityRule` or `AvailabilityOverride`) has an optional `serviceIds` list. `null` means every active service.
- Within a window, both 1:1 and group services are offered.
- The first booking for a time range creates the `Appointment` that occupies that range (plus buffers).
  - If the first booking is for a group service, the appointment takes that service's capacity. Other clients see a "join" slot until it's full.
  - If it's for a 1:1 service, the range becomes unavailable to everyone else.
- The rest of the window stays open to any allowed service.
- A race between a 1:1 booking and the first group booking for the same range is settled by the exclusion constraint.

## Consequences
The slot engine filters windows by service and emits `new` and `join` slots. No new table is needed.
