-- V17: Add dividend_currency column to events_dividend_in_kind
-- The dividend symbol may have a different currency from the held symbol,
-- e.g. holding HKD-denominated Tencent shares but receiving USD-denominated JD shares.

ALTER TABLE events_dividend_in_kind
    ADD COLUMN dividend_currency currency_enum;

COMMENT ON COLUMN events_dividend_in_kind.dividend_currency IS 'Currency of the dividend symbol (may differ from the held symbol currency)';
