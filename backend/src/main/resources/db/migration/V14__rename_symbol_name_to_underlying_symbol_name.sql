-- ============================================
-- 市场事件表 - 重命名 symbol_name 为 underlying_symbol_name
-- 创建时间: 2026-03-13
-- 说明: 统一"底层证券名称"语义，将 symbol_name 重命名为 underlying_symbol_name
-- ============================================

-- 1. 代码变更事件表
ALTER TABLE events_symbol_change
    RENAME COLUMN symbol_name TO underlying_symbol_name;

COMMENT ON COLUMN events_symbol_change.underlying_symbol_name IS '底层证券名称';

-- 2. 拆股事件表
ALTER TABLE events_stock_split
    RENAME COLUMN symbol_name TO underlying_symbol_name;

COMMENT ON COLUMN events_stock_split.underlying_symbol_name IS '底层证券名称';

-- 3. 实物分红事件表
ALTER TABLE events_dividend_in_kind
    RENAME COLUMN symbol_name TO underlying_symbol_name;

COMMENT ON COLUMN events_dividend_in_kind.underlying_symbol_name IS '底层证券名称';
