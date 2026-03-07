package com.localledger.repository;

import com.localledger.entity.DividendInKindEvent;
import com.localledger.entity.enums.Currency;

import java.time.LocalDate;
import java.util.List;

/**
 * 实物分红事件 Repository 接口
 * 提供 events_dividend_in_kind 表的数据访问方法
 */
public interface DividendInKindEventRepository extends BaseRepository<DividendInKindEvent, Long> {

    /**
     * 根据证券代码查询（未删除的）
     */
    List<DividendInKindEvent> findBySymbolAndIsDeletedFalseOrderByEventDateDesc(String symbol);

    /**
     * 根据分红证券代码查询
     */
    List<DividendInKindEvent> findByDividendSymbolAndIsDeletedFalseOrderByEventDateDesc(String dividendSymbol);

    /**
     * 根据币种查询
     */
    List<DividendInKindEvent> findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(Currency currency);

    /**
     * 根据事件日期范围查询
     */
    List<DividendInKindEvent> findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(LocalDate startDate, LocalDate endDate);

    /**
     * 查询所有未删除的记录
     */
    List<DividendInKindEvent> findByIsDeletedFalseOrderByEventDateDesc();
}
