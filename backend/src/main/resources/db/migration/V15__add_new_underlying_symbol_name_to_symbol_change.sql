-- ============================================
-- 代码变更事件表 - 新增变更后底层证券名称字段
-- 创建时间: 2026-03-13
-- 说明: 代码变更涉及新旧两个证券，需要分别记录它们的底层证券名称
--       underlying_symbol_name = 旧的底层证券名称（后端自动填充）
--       new_underlying_symbol_name = 新的底层证券名称（用户手动填写）
-- ============================================

-- 新增 new_underlying_symbol_name 列
ALTER TABLE events_symbol_change
    ADD COLUMN IF NOT EXISTS new_underlying_symbol_name VARCHAR(200);

COMMENT ON COLUMN events_symbol_change.new_underlying_symbol_name IS '变更后底层证券名称';

-- 更新 symbol 列的注释，明确其语义为旧代码
COMMENT ON COLUMN events_symbol_change.symbol IS '涉及的证券代码（变更前的代码，即 old_symbol）';

-- 更新 underlying_symbol_name 列的注释，明确其语义为旧的证券名称
COMMENT ON COLUMN events_symbol_change.underlying_symbol_name IS '变更前底层证券名称（后端自动填充）';
