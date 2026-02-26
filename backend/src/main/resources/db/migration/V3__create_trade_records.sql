-- ============================================
-- 交易记录管理 - 数据库表结构
-- 创建时间: 2026-02-26
-- 说明: 策略表 + 交易记录表，记录股票、ETF、期权等证券交易
-- 注意: 本脚本支持幂等执行（可重复执行N次）
-- ============================================

-- ============================================
-- 1. 创建枚举类型（如果不存在）
-- ============================================

-- 创建证券类型枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type_enum') THEN
        CREATE TYPE asset_type_enum AS ENUM ('STOCK', 'ETF', 'OPTION_CALL', 'OPTION_PUT');
    END IF;
END
$$;

-- 创建交易类型枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trade_type_enum') THEN
        CREATE TYPE trade_type_enum AS ENUM ('BUY', 'SELL', 'OPTION_EXPIRE', 'EXERCISE_BUY', 'EXERCISE_SELL', 'EARLY_EXERCISE');
    END IF;
END
$$;

-- ============================================
-- 2. 创建策略表（必须先创建，因为交易记录表需要引用）
-- ============================================
CREATE TABLE IF NOT EXISTS strategies (
    id BIGSERIAL PRIMARY KEY,
    strategy_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加策略表注释
COMMENT ON TABLE strategies IS '投资策略表';
COMMENT ON COLUMN strategies.id IS '主键ID';
COMMENT ON COLUMN strategies.strategy_name IS '策略名称';
COMMENT ON COLUMN strategies.description IS '策略描述';
COMMENT ON COLUMN strategies.is_deleted IS '软删除标记';
COMMENT ON COLUMN strategies.created_at IS '创建时间';
COMMENT ON COLUMN strategies.updated_at IS '更新时间';

-- ============================================
-- 3. 创建交易记录表
-- ============================================
CREATE TABLE IF NOT EXISTS trade_records (
    id BIGSERIAL PRIMARY KEY,
    trade_date DATE NOT NULL,
    broker_id BIGINT NOT NULL,
    asset_type asset_type_enum NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(200),
    underlying_symbol VARCHAR(50),
    trade_type trade_type_enum NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(15,4) NOT NULL CHECK (price >= 0),
    amount DECIMAL(18,2) NOT NULL CHECK (amount >= 0),
    fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
    currency currency_enum NOT NULL DEFAULT 'CNY',
    strategy_id BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束
    CONSTRAINT fk_trade_broker FOREIGN KEY (broker_id)
        REFERENCES brokers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    -- 策略外键约束（可空，策略删除时置空）
    CONSTRAINT fk_trade_strategy FOREIGN KEY (strategy_id)
        REFERENCES strategies(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ============================================
-- 4. 创建索引
-- ============================================

-- 交易日期索引（支持按日期排序和查询）
CREATE INDEX IF NOT EXISTS idx_trade_records_date ON trade_records(trade_date DESC);

-- 券商外键索引（支持按券商筛选）
CREATE INDEX IF NOT EXISTS idx_trade_records_broker_id ON trade_records(broker_id);

-- 证券代码索引（支持按代码查询）
CREATE INDEX IF NOT EXISTS idx_trade_records_symbol ON trade_records(symbol);

-- 底层证券代码索引（支持按底层证券筛选）
CREATE INDEX IF NOT EXISTS idx_trade_records_underlying_symbol ON trade_records(underlying_symbol);

-- 所属策略索引（支持按策略筛选）
CREATE INDEX IF NOT EXISTS idx_trade_records_strategy_id ON trade_records(strategy_id);

-- ============================================
-- 5. 添加表注释
-- ============================================
COMMENT ON TABLE trade_records IS '交易记录表';
COMMENT ON COLUMN trade_records.id IS '主键ID';
COMMENT ON COLUMN trade_records.trade_date IS '交易日期';
COMMENT ON COLUMN trade_records.broker_id IS '券商ID（外键关联brokers表）';
COMMENT ON COLUMN trade_records.asset_type IS '证券类型：STOCK-股票，ETF-ETF基金，OPTION_CALL-看涨期权，OPTION_PUT-看跌期权';
COMMENT ON COLUMN trade_records.symbol IS '证券代码，如 AAPL、600519、TSLA 240119C210';
COMMENT ON COLUMN trade_records.name IS '证券名称，如 苹果公司、贵州茅台、特斯拉看涨期权';
COMMENT ON COLUMN trade_records.underlying_symbol IS '底层证券代码，期权时填写对应标的代码，如 TSLA、AAPL；股票和ETF可为空';
COMMENT ON COLUMN trade_records.trade_type IS '交易类型：BUY-买入，SELL-卖出，OPTION_EXPIRE-期权到期，EXERCISE_BUY-行权买入，EXERCISE_SELL-行权卖出，EARLY_EXERCISE-提前行权';
COMMENT ON COLUMN trade_records.quantity IS '交易数量';
COMMENT ON COLUMN trade_records.price IS '成交价格（精度4位小数）';
COMMENT ON COLUMN trade_records.amount IS '成交金额（精度2位小数）';
COMMENT ON COLUMN trade_records.fee IS '交易费用（精度2位小数）';
COMMENT ON COLUMN trade_records.currency IS '币种：CNY-人民币，HKD-港币，USD-美元';
COMMENT ON COLUMN trade_records.strategy_id IS '所属策略ID（外键关联strategies表，可空）';
COMMENT ON COLUMN trade_records.is_deleted IS '软删除标记';
COMMENT ON COLUMN trade_records.created_at IS '创建时间';
COMMENT ON COLUMN trade_records.updated_at IS '更新时间';

-- ============================================
-- 6. 创建更新时间触发器
-- ============================================

-- 为策略表添加触发器
DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为交易记录表添加触发器
DROP TRIGGER IF EXISTS update_trade_records_updated_at ON trade_records;
CREATE TRIGGER update_trade_records_updated_at
    BEFORE UPDATE ON trade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
