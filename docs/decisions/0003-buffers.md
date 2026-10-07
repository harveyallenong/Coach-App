# 0003 — Default buffers 5 + 5 min, additive

- Status: Accepted (2026-10-07, product owner)

## Decision
The coach defaults are `defaultBufferBeforeMin = 5` and `defaultBufferAfterMin = 5`. Each service can still override them, and coaches can change the defaults.

Buffers are additive: a session's buffered range may not overlap another session's buffered range. Two back-to-back sessions with default buffers therefore sit 10 minutes apart.

## Consequences
The rule is enforced entirely by the `appointment_no_overlap` exclusion constraint on the generated `occupied` range, so no trigger is needed.
