-- 从交易类型枚举中移除 EARLY_EXERCISE（提前行权）

-- PostgreSQL 不支持直接从 ENUM 中删除值，需要重建枚举类型
-- 1. 将列临时改为 VARCHAR
ALTER TABLE trade_records ALTER COLUMN trade_type TYPE VARCHAR(50);

-- 2. 删除旧的枚举类型
DROP TYPE IF EXISTS trade_type_enum;

-- 3. 重新创建不含 EARLY_EXERCISE 的枚举类型
CREATE TYPE trade_type_enum AS ENUM ('BUY', 'SELL', 'OPTION_EXPIRE', 'EXERCISE_BUY', 'EXERCISE_SELL');

-- 4. 将列类型改回枚举（如果存在 EARLY_EXERCISE 的数据，先清理）
UPDATE trade_records SET trade_type = 'BUY' WHERE trade_type = 'EARLY_EXERCISE';
ALTER TABLE trade_records ALTER COLUMN trade_type TYPE trade_type_enum USING trade_type::trade_type_enum;

-- 5. 更新字段注释
COMMENT ON COLUMN trade_records.trade_type IS '交易类型：BUY-买入，SELL-卖出，OPTION_EXPIRE-期权到期，EXERCISE_BUY-行权买股，EXERCISE_SELL-行权卖股';
