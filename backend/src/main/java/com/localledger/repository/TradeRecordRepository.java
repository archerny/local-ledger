package com.localledger.repository;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;

import java.time.LocalDate;
import java.util.List;

/**
 * 交易记录 Repository 接口
 * 提供交易记录表的数据访问方法
 */
public interface TradeRecordRepository extends BaseRepository<TradeRecord, Long> {

    /**
     * 查询所有未删除的交易记录（按交易日期倒序）
     */
    List<TradeRecord> findByIsDeletedFalseOrderByTradeDateDesc();

    /**
     * 根据券商ID查询未删除的交易记录
     */
    List<TradeRecord> findByBrokerIdAndIsDeletedFalseOrderByTradeDateDesc(Long brokerId);

    /**
     * 根据证券类型查询未删除的交易记录
     */
    List<TradeRecord> findByAssetTypeAndIsDeletedFalseOrderByTradeDateDesc(AssetType assetType);

    /**
     * 根据策略ID查询未删除的交易记录
     */
    List<TradeRecord> findByStrategyIdAndIsDeletedFalseOrderByTradeDateDesc(Long strategyId);

    /**
     * 根据底层证券代码查询未删除的交易记录（精确匹配）
     */
    List<TradeRecord> findByUnderlyingSymbolAndIsDeletedFalseOrderByTradeDateDesc(String underlyingSymbol);

    /**
     * 根据证券代码模糊查询未删除的交易记录
     */
    List<TradeRecord> findBySymbolContainingIgnoreCaseAndIsDeletedFalseOrderByTradeDateDesc(String symbol);

    /**
     * 根据日期范围查询未删除的交易记录
     */
    List<TradeRecord> findByTradeDateBetweenAndIsDeletedFalseOrderByTradeDateDesc(LocalDate startDate, LocalDate endDate);
}
