-- V18: Make dividend_currency column NOT NULL
-- All existing data has been backfilled with the correct currency value.

ALTER TABLE events_dividend_in_kind
    ALTER COLUMN dividend_currency SET NOT NULL;
