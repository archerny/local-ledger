-- ============================================
-- 标签管理 - 数据库表结构
-- 创建时间: 2026-02-26
-- 说明: 交易标签表 + 交易记录与标签的多对多关联表
--       一条交易记录可以被打上多个标签
--       一个标签也可以打给多条交易记录
-- 注意: 本脚本支持幂等执行（可重复执行N次）
-- ============================================

-- ============================================
-- 1. 创建交易标签表
-- ============================================
CREATE TABLE IF NOT EXISTS trade_tags (
    id BIGSERIAL PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 标签名称唯一约束（未删除的标签名称不能重复）
    CONSTRAINT uk_trade_tags_name UNIQUE (tag_name)
);

-- ============================================
-- 2. 创建交易记录-标签关联表（多对多）
-- ============================================
CREATE TABLE IF NOT EXISTS trade_tag_mappings (
    id BIGSERIAL PRIMARY KEY,
    trade_record_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束：关联交易记录表
    CONSTRAINT fk_trt_trade_record FOREIGN KEY (trade_record_id)
        REFERENCES trade_records(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- 外键约束：关联标签表
    CONSTRAINT fk_trt_tag FOREIGN KEY (tag_id)
        REFERENCES trade_tags(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- 联合唯一约束：同一条交易记录不能重复打同一个标签
    CONSTRAINT uk_trade_record_tag UNIQUE (trade_record_id, tag_id)
);

-- ============================================
-- 3. 创建索引
-- ============================================

-- 标签名称索引（支持按名称查询）
CREATE INDEX IF NOT EXISTS idx_trade_tags_name ON trade_tags(tag_name);

-- 关联表：交易记录ID索引（支持查询某条交易记录的所有标签）
CREATE INDEX IF NOT EXISTS idx_ttm_trade_record_id ON trade_tag_mappings(trade_record_id);

-- 关联表：标签ID索引（支持查询某个标签下的所有交易记录）
CREATE INDEX IF NOT EXISTS idx_ttm_tag_id ON trade_tag_mappings(tag_id);

-- ============================================
-- 4. 添加表注释
-- ============================================

-- 交易标签表注释
COMMENT ON TABLE trade_tags IS '交易标签表';
COMMENT ON COLUMN trade_tags.id IS '主键ID';
COMMENT ON COLUMN trade_tags.tag_name IS '标签名称（唯一）';
COMMENT ON COLUMN trade_tags.description IS '标签描述';
COMMENT ON COLUMN trade_tags.is_deleted IS '软删除标记';
COMMENT ON COLUMN trade_tags.created_at IS '创建时间';
COMMENT ON COLUMN trade_tags.updated_at IS '更新时间';

-- 关联表注释
COMMENT ON TABLE trade_tag_mappings IS '交易记录-标签关联表（多对多）';
COMMENT ON COLUMN trade_tag_mappings.id IS '主键ID';
COMMENT ON COLUMN trade_tag_mappings.trade_record_id IS '交易记录ID（外键关联trade_records表）';
COMMENT ON COLUMN trade_tag_mappings.tag_id IS '标签ID（外键关联trade_tags表）';
COMMENT ON COLUMN trade_tag_mappings.created_at IS '创建时间';

-- ============================================
-- 5. 创建更新时间触发器
-- ============================================

-- 为交易标签表添加触发器
DROP TRIGGER IF EXISTS update_trade_tags_updated_at ON trade_tags;
CREATE TRIGGER update_trade_tags_updated_at
    BEFORE UPDATE ON trade_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
