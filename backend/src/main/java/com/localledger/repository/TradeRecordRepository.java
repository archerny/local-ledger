package com.localledger.repository;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 交易记录 Repository 接口
 * 提供交易记录表的数据访问方法
 */
public interface TradeRecordRepository extends BaseRepository<TradeRecord, Long> {

    /**
     * 查询所有未删除的交易记录（按ID倒序）
     */
    List<TradeRecord> findByIsDeletedFalseOrderByIdDesc();

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

    // ============ 统计查询方法 ============

    /**
     * 统计未删除记录总数
     */
    long countByIsDeletedFalse();

    /**
     * 按证券类型统计未删除记录数
     */
    long countByAssetTypeAndIsDeletedFalse(AssetType assetType);

    /**
     * 按币种统计未删除记录的交易费用总和
     */
    @Query("SELECT COALESCE(SUM(t.fee), 0) FROM TradeRecord t WHERE t.currency = :currency AND t.isDeleted = false")
    BigDecimal sumFeeByIsDeletedFalseAndCurrency(@Param("currency") Currency currency);

    /**
     * 统计未删除记录中不同底层证券代码的数量（去重计数）
     */
    @Query("SELECT COUNT(DISTINCT t.underlyingSymbol) FROM TradeRecord t WHERE t.isDeleted = false")
    long countDistinctUnderlyingSymbol();

    /**
     * 查询 Top N 最常交易的底层证券（按交易次数降序）
     * 返回结果为 Object[]，其中 [0] 是 underlyingSymbol，[1] 是交易次数
     */
    @Query("SELECT t.underlyingSymbol, COUNT(t) as cnt FROM TradeRecord t WHERE t.isDeleted = false AND t.underlyingSymbol IS NOT NULL GROUP BY t.underlyingSymbol ORDER BY cnt DESC")
    List<Object[]> findTopTradedSymbols();
}
