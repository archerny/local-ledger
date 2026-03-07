-- ============================================
-- 市场异动事件 - 数据库表结构
-- 创建时间: 2026-03-08
-- 说明: 记录市场上的非正常行为数据，用于追溯交易记录中不可解释的情况
--       包含：代码变更、拆股、实物分红 三类事件
-- 注意: 本脚本支持幂等执行（可重复执行N次）
-- ============================================

-- ============================================
-- 1. 代码变更事件表（events_symbol_change）
--    记录股票代码变更，如 FB → META
-- ============================================
CREATE TABLE IF NOT EXISTS events_symbol_change (
    id              BIGSERIAL PRIMARY KEY,
    symbol          VARCHAR(50) NOT NULL,
    symbol_name     VARCHAR(200),
    currency        currency_enum,
    event_date      DATE NOT NULL,
    old_symbol      VARCHAR(50) NOT NULL,
    new_symbol      VARCHAR(50) NOT NULL,
    description     VARCHAR(500),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 代码变更表索引
CREATE INDEX IF NOT EXISTS idx_esc_symbol ON events_symbol_change(symbol);
CREATE INDEX IF NOT EXISTS idx_esc_event_date ON events_symbol_change(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_esc_old_symbol ON events_symbol_change(old_symbol);
CREATE INDEX IF NOT EXISTS idx_esc_new_symbol ON events_symbol_change(new_symbol);

-- 代码变更表注释
COMMENT ON TABLE events_symbol_change IS '代码变更事件表';
COMMENT ON COLUMN events_symbol_change.id IS '主键ID';
COMMENT ON COLUMN events_symbol_change.symbol IS '涉及的证券代码（通常为变更后的代码）';
COMMENT ON COLUMN events_symbol_change.symbol_name IS '证券名称';
COMMENT ON COLUMN events_symbol_change.currency IS '所属市场币种：CNY-人民币，HKD-港币，USD-美元';
COMMENT ON COLUMN events_symbol_change.event_date IS '事件生效日期';
COMMENT ON COLUMN events_symbol_change.old_symbol IS '变更前代码';
COMMENT ON COLUMN events_symbol_change.new_symbol IS '变更后代码';
COMMENT ON COLUMN events_symbol_change.description IS '事件描述/备注';
COMMENT ON COLUMN events_symbol_change.is_deleted IS '软删除标记';
COMMENT ON COLUMN events_symbol_change.created_at IS '创建时间';
COMMENT ON COLUMN events_symbol_change.updated_at IS '更新时间';

-- 代码变更表更新时间触发器
DROP TRIGGER IF EXISTS update_events_symbol_change_updated_at ON events_symbol_change;
CREATE TRIGGER update_events_symbol_change_updated_at
    BEFORE UPDATE ON events_symbol_change
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 拆股事件表（events_stock_split）
--    记录股票拆分，如 TSLA 1拆3
-- ============================================
CREATE TABLE IF NOT EXISTS events_stock_split (
    id              BIGSERIAL PRIMARY KEY,
    symbol          VARCHAR(50) NOT NULL,
    symbol_name     VARCHAR(200),
    currency        currency_enum,
    event_date      DATE NOT NULL,
    ratio_from      INTEGER NOT NULL,
    ratio_to        INTEGER NOT NULL,
    description     VARCHAR(500),
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 拆股事件表索引
CREATE INDEX IF NOT EXISTS idx_ess_symbol ON events_stock_split(symbol);
CREATE INDEX IF NOT EXISTS idx_ess_event_date ON events_stock_split(event_date DESC);

-- 拆股事件表注释
COMMENT ON TABLE events_stock_split IS '拆股事件表';
COMMENT ON COLUMN events_stock_split.id IS '主键ID';
COMMENT ON COLUMN events_stock_split.symbol IS '涉及的证券代码';
COMMENT ON COLUMN events_stock_split.symbol_name IS '证券名称';
COMMENT ON COLUMN events_stock_split.currency IS '所属市场币种：CNY-人民币，HKD-港币，USD-美元';
COMMENT ON COLUMN events_stock_split.event_date IS '事件生效日期';
COMMENT ON COLUMN events_stock_split.ratio_from IS '拆分前股数（如1拆3，此处为1）';
COMMENT ON COLUMN events_stock_split.ratio_to IS '拆分后股数（如1拆3，此处为3）';
COMMENT ON COLUMN events_stock_split.description IS '事件描述/备注';
COMMENT ON COLUMN events_stock_split.is_deleted IS '软删除标记';
COMMENT ON COLUMN events_stock_split.created_at IS '创建时间';
COMMENT ON COLUMN events_stock_split.updated_at IS '更新时间';

-- 拆股事件表更新时间触发器
DROP TRIGGER IF EXISTS update_events_stock_split_updated_at ON events_stock_split;
CREATE TRIGGER update_events_stock_split_updated_at
    BEFORE UPDATE ON events_stock_split
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 实物分红事件表（events_dividend_in_kind）
--    记录以股代息等实物分红，如每持有1股A获得0.5股B
-- ============================================
CREATE TABLE IF NOT EXISTS events_dividend_in_kind (
    id                      BIGSERIAL PRIMARY KEY,
    symbol                  VARCHAR(50) NOT NULL,
    symbol_name             VARCHAR(200),
    currency                currency_enum,
    event_date              DATE NOT NULL,
    dividend_symbol         VARCHAR(50) NOT NULL,
    dividend_symbol_name    VARCHAR(200),
    dividend_qty_per_share  DECIMAL(15,6) NOT NULL,
    description             VARCHAR(500),
    is_deleted              BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 实物分红事件表索引
CREATE INDEX IF NOT EXISTS idx_edik_symbol ON events_dividend_in_kind(symbol);
CREATE INDEX IF NOT EXISTS idx_edik_event_date ON events_dividend_in_kind(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_edik_dividend_symbol ON events_dividend_in_kind(dividend_symbol);

-- 实物分红事件表注释
COMMENT ON TABLE events_dividend_in_kind IS '实物分红事件表';
COMMENT ON COLUMN events_dividend_in_kind.id IS '主键ID';
COMMENT ON COLUMN events_dividend_in_kind.symbol IS '涉及的证券代码';
COMMENT ON COLUMN events_dividend_in_kind.symbol_name IS '证券名称';
COMMENT ON COLUMN events_dividend_in_kind.currency IS '所属市场币种：CNY-人民币，HKD-港币，USD-美元';
COMMENT ON COLUMN events_dividend_in_kind.event_date IS '事件生效日期';
COMMENT ON COLUMN events_dividend_in_kind.dividend_symbol IS '分红获得的证券代码';
COMMENT ON COLUMN events_dividend_in_kind.dividend_symbol_name IS '分红证券名称';
COMMENT ON COLUMN events_dividend_in_kind.dividend_qty_per_share IS '每股获得的分红数量';
COMMENT ON COLUMN events_dividend_in_kind.description IS '事件描述/备注';
COMMENT ON COLUMN events_dividend_in_kind.is_deleted IS '软删除标记';
COMMENT ON COLUMN events_dividend_in_kind.created_at IS '创建时间';
COMMENT ON COLUMN events_dividend_in_kind.updated_at IS '更新时间';

-- 实物分红事件表更新时间触发器
DROP TRIGGER IF EXISTS update_events_dividend_in_kind_updated_at ON events_dividend_in_kind;
CREATE TRIGGER update_events_dividend_in_kind_updated_at
    BEFORE UPDATE ON events_dividend_in_kind
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
