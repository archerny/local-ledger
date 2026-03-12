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

    /**
     * 查询涉及指定 symbols 集合（匹配 symbol 或 dividendSymbol），且在指定日期当天及之后的所有未删除事件
     * 用于级联重算
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT e FROM DividendInKindEvent e WHERE e.isDeleted = false " +
        "AND (e.symbol IN :symbols OR e.dividendSymbol IN :symbols) " +
        "AND e.eventDate >= :eventDate ORDER BY e.eventDate ASC"
    )
    List<DividendInKindEvent> findAffectedEvents(
        @org.springframework.data.repository.query.Param("symbols") java.util.Collection<String> symbols,
        @org.springframework.data.repository.query.Param("eventDate") java.time.LocalDate eventDate
    );
}
