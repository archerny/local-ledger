package com.localledger.entity.enums;

/**
 * 交易类型枚举
 * 对应数据库 trade_type_enum
 */
public enum TradeType {
    /** 买入 */
    BUY,
    /** 卖出 */
    SELL,
    /** 期权到期 */
    OPTION_EXPIRE,
    /** 行权买入 */
    EXERCISE_BUY,
    /** 行权卖出 */
    EXERCISE_SELL,
    /** 提前行权 */
    EARLY_EXERCISE
}
