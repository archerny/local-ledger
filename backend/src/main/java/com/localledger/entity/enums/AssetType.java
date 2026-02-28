package com.localledger.entity.enums;

/**
 * 证券类型枚举
 * 对应数据库 asset_type_enum
 */
public enum AssetType {
    /** 股票 */
    STOCK,
    /** ETF基金 */
    ETF,
    /** 看涨期权 */
    OPTION_CALL,
    /** 看跌期权 */
    OPTION_PUT
}
