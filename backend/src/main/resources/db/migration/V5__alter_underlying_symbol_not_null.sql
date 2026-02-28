-- V5: 将 trade_records 表的 underlying_symbol 字段改为 NOT NULL
-- 原因：底层证券代码用于关联分析期权与正股收益，不应为空

-- 先将已有的 NULL 值填充为 symbol（即自身证券代码），确保数据一致性
UPDATE trade_records SET underlying_symbol = symbol WHERE underlying_symbol IS NULL;

-- 修改字段约束为 NOT NULL
ALTER TABLE trade_records ALTER COLUMN underlying_symbol SET NOT NULL;

-- 更新字段注释
COMMENT ON COLUMN trade_records.underlying_symbol IS '底层证券代码，用于关联分析期权与正股收益，如 TSLA、AAPL；股票和ETF填写自身代码';
