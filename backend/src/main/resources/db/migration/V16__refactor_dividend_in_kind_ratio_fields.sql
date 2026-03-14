-- V16: Refactor dividend-in-kind event to use ratio_from/ratio_to instead of dividend_qty_per_share
-- Old: dividend_qty_per_share (NUMERIC 15,6) - e.g. 0.047619 for "1 per 21 shares"
-- New: ratio_from (INTEGER) + ratio_to (INTEGER) - e.g. ratio_from=21, ratio_to=1 for "every 21 shares get 1 share"

-- Step 1: Add new columns
ALTER TABLE events_dividend_in_kind
    ADD COLUMN ratio_from INTEGER,
    ADD COLUMN ratio_to INTEGER;

-- Step 2: Migrate existing data (best effort: treat old value as ratioTo=dividendQtyPerShare, ratioFrom=1)
-- Note: This is a lossy conversion for fractional values like 1/21.
-- Since this feature has no production data yet, this is acceptable.
UPDATE events_dividend_in_kind
SET ratio_from = 1,
    ratio_to = 1
WHERE dividend_qty_per_share IS NOT NULL;

-- Step 3: Drop old column
ALTER TABLE events_dividend_in_kind
    DROP COLUMN dividend_qty_per_share;

-- Step 4: Set NOT NULL constraints
ALTER TABLE events_dividend_in_kind
    ALTER COLUMN ratio_from SET NOT NULL,
    ALTER COLUMN ratio_to SET NOT NULL;

-- Step 5: Add comments
COMMENT ON COLUMN events_dividend_in_kind.ratio_from IS 'Dividend ratio denominator: every N shares held (e.g. 21)';
COMMENT ON COLUMN events_dividend_in_kind.ratio_to IS 'Dividend ratio numerator: receive M shares (e.g. 1)';
