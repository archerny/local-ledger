package com.localledger.repository;

import com.localledger.entity.StockSplitEvent;
import com.localledger.entity.enums.Currency;

import java.time.LocalDate;
import java.util.List;

/**
 * 拆股事件 Repository 接口
 * 提供 events_stock_split 表的数据访问方法
 */
public interface StockSplitEventRepository extends BaseRepository<StockSplitEvent, Long> {

    /**
     * 根据证券代码查询（未删除的）
     */
    List<StockSplitEvent> findBySymbolAndIsDeletedFalseOrderByEventDateDesc(String symbol);

    /**
     * 根据币种查询
     */
    List<StockSplitEvent> findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(Currency currency);

    /**
     * 根据事件日期范围查询
     */
    List<StockSplitEvent> findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(LocalDate startDate, LocalDate endDate);

    /**
     * 查询所有未删除的记录
     */
    List<StockSplitEvent> findByIsDeletedFalseOrderByEventDateDesc();

    /**
     * 查询某个 symbol 在指定日期当天及之后的所有未删除事件（按事件日期升序）
     * 用于级联重算
     */
    List<StockSplitEvent> findBySymbolAndEventDateGreaterThanEqualAndIsDeletedFalseOrderByEventDateAsc(String symbol, LocalDate eventDate);

    /**
     * 查询涉及指定 symbols 集合，且在指定日期当天及之后的所有未删除事件（按事件日期升序）
     * 用于级联重算
     */
    List<StockSplitEvent> findBySymbolInAndEventDateGreaterThanEqualAndIsDeletedFalseOrderByEventDateAsc(java.util.Collection<String> symbols, LocalDate eventDate);
}
