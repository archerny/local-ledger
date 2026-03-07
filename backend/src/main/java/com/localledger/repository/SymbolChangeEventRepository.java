package com.localledger.repository;

import com.localledger.entity.SymbolChangeEvent;
import com.localledger.entity.enums.Currency;

import java.time.LocalDate;
import java.util.List;

/**
 * 代码变更事件 Repository 接口
 * 提供 events_symbol_change 表的数据访问方法
 */
public interface SymbolChangeEventRepository extends BaseRepository<SymbolChangeEvent, Long> {

    /**
     * 根据证券代码查询（未删除的）
     */
    List<SymbolChangeEvent> findBySymbolAndIsDeletedFalseOrderByEventDateDesc(String symbol);

    /**
     * 根据旧代码查询
     */
    List<SymbolChangeEvent> findByOldSymbolAndIsDeletedFalseOrderByEventDateDesc(String oldSymbol);

    /**
     * 根据新代码查询
     */
    List<SymbolChangeEvent> findByNewSymbolAndIsDeletedFalseOrderByEventDateDesc(String newSymbol);

    /**
     * 根据币种查询
     */
    List<SymbolChangeEvent> findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(Currency currency);

    /**
     * 根据事件日期范围查询
     */
    List<SymbolChangeEvent> findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(LocalDate startDate, LocalDate endDate);

    /**
     * 查询所有未删除的记录
     */
    List<SymbolChangeEvent> findByIsDeletedFalseOrderByEventDateDesc();
}
