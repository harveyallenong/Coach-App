-- Hand-written integrity rules Prisma can't express. See docs/PLAN.md §1.3.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Occupied range = session ± buffers, kept consistent with its inputs.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_time_order_chk" CHECK ("startAt" < "endAt"),
  ADD CONSTRAINT "Appointment_buffers_chk" CHECK ("bufferBeforeMin" >= 0 AND "bufferAfterMin" >= 0),
  ADD CONSTRAINT "Appointment_capacity_chk" CHECK ("capacity" >= 1),
  ADD CONSTRAINT "Appointment_occupied_chk" CHECK (
    "occupiedStart" = "startAt" - make_interval(mins => "bufferBeforeMin")
    AND "occupiedEnd" = "endAt" + make_interval(mins => "bufferAfterMin")
  );

-- No double-booking: SCHEDULED appointments of one coach may not overlap,
-- buffers included (buffers are additive — ADR 0003).
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap" EXCLUDE USING gist (
    "coachId" WITH =,
    tstzrange("occupiedStart", "occupiedEnd", '[)') WITH &&
  ) WHERE ("status" = 'SCHEDULED');

-- A client holds at most one active seat per appointment.
CREATE UNIQUE INDEX "Booking_active_seat_uq" ON "Booking" ("appointmentId", "clientId")
  WHERE "status" IN ('REQUESTED', 'PENDING_PAYMENT', 'CONFIRMED');

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_duration_chk" CHECK ("durationMin" > 0),
  ADD CONSTRAINT "Service_capacity_chk" CHECK ("capacity" >= 1),
  ADD CONSTRAINT "Service_price_chk" CHECK ("priceMinor" >= 0);

ALTER TABLE "AvailabilityRule"
  ADD CONSTRAINT "AvailabilityRule_weekday_chk" CHECK ("weekday" BETWEEN 1 AND 7),
  ADD CONSTRAINT "AvailabilityRule_minutes_chk" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "AvailabilityOverride"
  ADD CONSTRAINT "AvailabilityOverride_minutes_chk" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "TimeBlock"
  ADD CONSTRAINT "TimeBlock_time_order_chk" CHECK ("startAt" < "endAt");

ALTER TABLE "CoachProfile"
  ADD CONSTRAINT "CoachProfile_policy_chk" CHECK (
    "lateCancelFeePct" BETWEEN 0 AND 100
    AND "cancellationWindowMin" >= 0
    AND "minNoticeMin" >= 0
    AND "maxAdvanceDays" >= 1
    AND "slotStepMin" IN (15, 30, 60)
    AND "defaultBufferBeforeMin" >= 0
    AND "defaultBufferAfterMin" >= 0
  );

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_chk" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_chk" CHECK ("amountMinor" > 0 AND "platformFeeMinor" >= 0);

ALTER TABLE "Charge"
  ADD CONSTRAINT "Charge_amount_chk" CHECK ("amountMinor" >= 0);

ALTER TABLE "Refund"
  ADD CONSTRAINT "Refund_amount_chk" CHECK ("amountMinor" > 0);
