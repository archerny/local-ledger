package com.localledger.repository;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TradeTrigger;
import com.localledger.entity.enums.TriggerRefType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    /**
     * 查询截止某日期的所有未删除交易记录（按交易日期正序，方便按时间顺序计算持仓）
     */
    List<TradeRecord> findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(LocalDate date);

    /**
     * 查询截止某日期、指定券商的所有未删除交易记录（按交易日期正序）
     */
    List<TradeRecord> findByTradeDateLessThanEqualAndBrokerIdAndIsDeletedFalseOrderByTradeDateAsc(LocalDate date, Long brokerId);

    // ============ 触发来源相关查询方法 ============

    /**
     * 根据触发关联ID和关联类型查询未删除的交易记录
     * 用于查找某个市场事件/期权生成的所有交易记录
     */
    List<TradeRecord> findByTriggerRefIdAndTriggerRefTypeAndIsDeletedFalse(Long triggerRefId, TriggerRefType triggerRefType);

    /**
     * 根据交易触发来源查询未删除的交易记录
     */
    List<TradeRecord> findByTradeTriggerAndIsDeletedFalseOrderByTradeDateDesc(TradeTrigger tradeTrigger);

    /**
     * 根据触发关联类型和关联ID列表查询未删除的交易记录
     * 用于级联重算时，批量查找多个市场事件生成的所有系统交易记录
     */
    List<TradeRecord> findByTriggerRefTypeAndTriggerRefIdInAndIsDeletedFalse(TriggerRefType triggerRefType, java.util.Collection<Long> triggerRefIds);

    /**
     * 批量删除指定触发类型和触发ID列表关联的交易记录（物理删除）
     * 用于级联重算时清理旧的系统交易记录
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM TradeRecord t WHERE t.triggerRefType = :refType AND t.triggerRefId IN :refIds")
    void deleteByTriggerRefTypeAndTriggerRefIdIn(
        @Param("refType") TriggerRefType refType,
        @Param("refIds") java.util.Collection<Long> refIds
    );

    /**
     * 根据证券代码查询最近一条未删除的交易记录
     * 用于自动填充市场事件中的 currency 和 name 等字段
     */
    Optional<TradeRecord> findFirstBySymbolAndIsDeletedFalseOrderByTradeDateDesc(String symbol);
}
