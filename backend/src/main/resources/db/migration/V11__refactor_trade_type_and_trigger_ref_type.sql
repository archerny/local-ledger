-- ============================================
-- TradeType 枚举精简 & TriggerRefType 期权子类型新增
-- 设计文档：trade-type-refactor-discussion.md
-- 迁移策略：渐进式迁移
--   - 仅处理数据库结构变更（注释），不迁移数据
--   - 旧枚举值暂不删除，先新增新值
--   - 存量数据通过手动方式逐条订正
--   - 全部订正后再通过后续迁移脚本移除旧枚举值
-- ============================================

-- 1. 更新 trigger_ref_type 字段注释（反映新增的三个期权子类型）
-- 注：trigger_ref_type 为 VARCHAR(32)，不是数据库枚举类型，无需 ALTER TYPE，
--     新增的枚举值（OPTION_EXPIRE / OPTION_EXERCISE / OPTION_ASSIGNED）由应用层 Java Enum 管理
COMMENT ON COLUMN trade_records.trigger_ref_type IS '触发来源的关联记录类型：NONE-无关联，STOCK_SPLIT-拆股事件，SYMBOL_CHANGE-代码变更，DIVIDEND_IN_KIND-实物分红，OPTION_EXPIRE-期权到期，OPTION_EXERCISE-行权，OPTION_ASSIGNED-被指派（旧值 OPTION 已废弃）';

-- 2. 更新 trade_type 字段注释（标注旧枚举值已废弃）
-- 注：trade_type 使用的是 PostgreSQL 数据库枚举类型 trade_type_enum（V3 创建），
--     重构后仅使用 BUY / SELL，旧值 OPTION_EXPIRE / EXERCISE_BUY / EXERCISE_SELL 暂保留在数据库枚举中，
--     待存量数据订正完成后，再通过后续迁移脚本从 trade_type_enum 中移除旧值
COMMENT ON COLUMN trade_records.trade_type IS '交易类型：BUY-买入，SELL-卖出（重构后仅使用 BUY/SELL，旧值 OPTION_EXPIRE/EXERCISE_BUY/EXERCISE_SELL 已废弃，待数据订正后移除）';

-- 3. 更新 trade_trigger 字段注释
COMMENT ON COLUMN trade_records.trade_trigger IS '交易触发来源：MANUAL-手动交易，OPTION-期权相关（到期/行权/被指派），MARKET_EVENT-市场事件';
