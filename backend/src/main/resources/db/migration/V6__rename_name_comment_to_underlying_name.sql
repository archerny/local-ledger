-- V6: 更新 trade_records 表 name 字段注释，明确其语义为底层证券名称
-- 原因：name 字段实际用于存储底层证券名称，而非当前证券名称，需消除歧义

COMMENT ON COLUMN trade_records.name IS '底层证券名称，如 苹果公司、贵州茅台、特斯拉';