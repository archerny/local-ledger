-- ============================================
-- V2: 出入金记录表增加银行字段
-- 创建时间: 2024-01-16
-- 说明: 为 cash_flow_records 表增加 bank 字段，
--       用于记录出入金关联的银行
-- ============================================

-- 增加 bank 字段（允许为空，兼容历史数据）
ALTER TABLE cash_flow_records
    ADD COLUMN IF NOT EXISTS bank VARCHAR(100);

-- 添加列注释
COMMENT ON COLUMN cash_flow_records.bank IS '出入金关联的银行';
