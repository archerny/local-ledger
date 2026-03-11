package com.localledger.entity.enums;

/**
 * 触发关联类型枚举
 * 用于区分 trigger_ref_id 指向哪张表
 */
public enum TriggerRefType {
    /** 无关联 */
    NONE,
    /** 拆股事件，关联 events_stock_split 表 */
    STOCK_SPLIT,
    /** 代码变更事件，关联 events_symbol_change 表 */
    SYMBOL_CHANGE,
    /** 实物分红事件，关联 events_dividend_in_kind 表 */
    DIVIDEND_IN_KIND,
/** 期权到期，关联 trade_records 表（期权交易记录） */
    OPTION_EXPIRE,
    /** 行权（含主动行权和到期自动行权，不区分），关联 trade_records 表（期权交易记录） */
    OPTION_EXERCISE,
    /** 被指派，关联 trade_records 表（期权交易记录） */
    OPTION_ASSIGNED,

    /**
     * @deprecated 已废弃，请使用 OPTION_EXPIRE / OPTION_EXERCISE / OPTION_ASSIGNED 替代。
     *             保留仅为兼容存量历史数据，待数据订正完成后移除。
     */
    @Deprecated
    OPTION
}
