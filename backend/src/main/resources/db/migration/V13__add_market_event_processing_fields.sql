-- ============================================
-- 市场事件处理 - 新增字段
-- 创建时间: 2026-03-13
-- 说明: 为市场事件表新增处理状态字段（processed, processed_at）
--       为实物分红事件表新增公允价格字段（fair_value_per_share）
-- ============================================

-- 1. 为三个市场事件表新增 processed 和 processed_at 字段

-- 代码变更事件表
ALTER TABLE events_symbol_change
    ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

COMMENT ON COLUMN events_symbol_change.processed IS '是否已处理（默认 false）';
COMMENT ON COLUMN events_symbol_change.processed_at IS '处理时间';

-- 拆股事件表
ALTER TABLE events_stock_split
    ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

COMMENT ON COLUMN events_stock_split.processed IS '是否已处理（默认 false）';
COMMENT ON COLUMN events_stock_split.processed_at IS '处理时间';

-- 实物分红事件表
ALTER TABLE events_dividend_in_kind
    ADD COLUMN IF NOT EXISTS processed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

COMMENT ON COLUMN events_dividend_in_kind.processed IS '是否已处理（默认 false）';
COMMENT ON COLUMN events_dividend_in_kind.processed_at IS '处理时间';

-- 2. 为实物分红事件表新增公允价格字段
ALTER TABLE events_dividend_in_kind
    ADD COLUMN IF NOT EXISTS fair_value_per_share DECIMAL(15,4);

COMMENT ON COLUMN events_dividend_in_kind.fair_value_per_share IS '每股公允价格，用于建立分红新持仓的成本基础';
