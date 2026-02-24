-- ============================================
-- 出入金管理系统 - 数据库表结构
-- 创建时间: 2024-01-15
-- 说明: 使用枚举类型定义币种字段
-- 注意: 本脚本支持幂等执行（可重复执行N次）
-- ============================================

-- ============================================
-- 1. 创建枚举类型（如果不存在）
-- ============================================

-- 创建币种枚举类型
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_enum') THEN
        CREATE TYPE currency_enum AS ENUM ('CNY', 'HKD', 'USD');
    END IF;
END
$$;

-- 创建记录类型枚举
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type_enum') THEN
        CREATE TYPE record_type_enum AS ENUM ('DEPOSIT', 'WITHDRAWAL');
    END IF;
END
$$;

-- ============================================
-- 2. 创建券商表（必须先创建，因为出入金记录表需要引用）
-- ============================================
CREATE TABLE IF NOT EXISTS brokers (
    id BIGSERIAL PRIMARY KEY,
    broker_name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    email VARCHAR(100),
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建券商索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_broker_name ON brokers(broker_name);

-- 添加表注释
COMMENT ON TABLE brokers IS '券商表';
COMMENT ON COLUMN brokers.id IS '主键ID';
COMMENT ON COLUMN brokers.broker_name IS '券商名称';
COMMENT ON COLUMN brokers.country IS '所属国家/地区';
COMMENT ON COLUMN brokers.description IS '券商账户描述';
COMMENT ON COLUMN brokers.email IS '关联邮箱';
COMMENT ON COLUMN brokers.phone IS '关联电话';
COMMENT ON COLUMN brokers.is_active IS '是否启用';
COMMENT ON COLUMN brokers.created_at IS '创建时间';
COMMENT ON COLUMN brokers.updated_at IS '更新时间';

-- ============================================
-- 3. 插入初始券商数据（如果不存在则插入，已存在则跳过）
-- ============================================
INSERT INTO brokers (broker_name, country, description, is_active) 
VALUES 
('富途证券', 'HK', '港美股互联网券商', FALSE),
('老虎证券', 'NZ', '港美股互联网券商', TRUE),
('盈透证券', 'US', '美国本土综合券商', TRUE),
('嘉信证券', 'US', '美国本土综合券商', TRUE),
('第一证券', 'US', '美国本土华人券商', FALSE)
ON CONFLICT (broker_name) DO NOTHING;

-- ============================================
-- 4. 创建出入金记录表
-- ============================================
CREATE TABLE IF NOT EXISTS cash_flow_records (
    id BIGSERIAL PRIMARY KEY,
    record_date DATE NOT NULL,
    broker_id BIGINT NOT NULL,  -- 外键：关联券商表
    record_type record_type_enum NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency currency_enum NOT NULL DEFAULT 'CNY',
    description VARCHAR(500),
    created_by VARCHAR(50),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    CONSTRAINT fk_broker FOREIGN KEY (broker_id) 
        REFERENCES brokers(id) 
        ON DELETE RESTRICT  -- 防止删除有记录的券商
        ON UPDATE CASCADE   -- 券商ID更新时级联更新
);

-- 创建索引（最小化配置，适合小数据量场景）
-- 1. 日期索引（支持按日期排序和查询）
CREATE INDEX IF NOT EXISTS idx_record_date ON cash_flow_records(record_date DESC);

-- 2. 券商外键索引（支持按券商筛选，外键字段建议创建索引）
CREATE INDEX IF NOT EXISTS idx_broker_id ON cash_flow_records(broker_id);

-- 添加表注释
COMMENT ON TABLE cash_flow_records IS '出入金记录表';
COMMENT ON COLUMN cash_flow_records.id IS '主键ID';
COMMENT ON COLUMN cash_flow_records.record_date IS '出入金日期';
COMMENT ON COLUMN cash_flow_records.broker_id IS '券商ID（外键关联brokers表）';
COMMENT ON COLUMN cash_flow_records.record_type IS '记录类型：DEPOSIT-入金，WITHDRAWAL-出金';
COMMENT ON COLUMN cash_flow_records.amount IS '金额（精度2位小数）';
COMMENT ON COLUMN cash_flow_records.currency IS '币种：CNY-人民币，HKD-港币，USD-美元';
COMMENT ON COLUMN cash_flow_records.description IS '备注说明';
COMMENT ON COLUMN cash_flow_records.created_by IS '创建人';
COMMENT ON COLUMN cash_flow_records.is_deleted IS '软删除标记';
COMMENT ON COLUMN cash_flow_records.created_at IS '创建时间';
COMMENT ON COLUMN cash_flow_records.updated_at IS '更新时间';



-- ============================================
-- 5. 创建更新时间触发器
-- ============================================

-- 创建更新时间函数（CREATE OR REPLACE 天然幂等）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为出入金记录表添加触发器（先删再建，确保幂等）
DROP TRIGGER IF EXISTS update_cash_flow_records_updated_at ON cash_flow_records;
CREATE TRIGGER update_cash_flow_records_updated_at 
    BEFORE UPDATE ON cash_flow_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为券商表添加触发器（先删再建，确保幂等）
DROP TRIGGER IF EXISTS update_brokers_updated_at ON brokers;
CREATE TRIGGER update_brokers_updated_at 
    BEFORE UPDATE ON brokers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
