package com.localledger.service;

import com.localledger.entity.DividendInKindEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.repository.DividendInKindEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 实物分红事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class DividendInKindEventService {

    @Autowired
    private DividendInKindEventRepository dividendInKindEventRepository;

    /**
     * 查询所有未删除的实物分红事件
     */
    public List<DividendInKindEvent> findAll() {
        return dividendInKindEventRepository.findByIsDeletedFalseOrderByEventDateDesc();
    }

    /**
     * 根据ID查询
     */
    public Optional<DividendInKindEvent> findById(Long id) {
        return dividendInKindEventRepository.findById(id);
    }

    /**
     * 根据证券代码查询
     */
    public List<DividendInKindEvent> findBySymbol(String symbol) {
        return dividendInKindEventRepository.findBySymbolAndIsDeletedFalseOrderByEventDateDesc(symbol);
    }

    /**
     * 根据分红证券代码查询
     */
    public List<DividendInKindEvent> findByDividendSymbol(String dividendSymbol) {
        return dividendInKindEventRepository.findByDividendSymbolAndIsDeletedFalseOrderByEventDateDesc(dividendSymbol);
    }

    /**
     * 根据币种查询
     */
    public List<DividendInKindEvent> findByCurrency(Currency currency) {
        return dividendInKindEventRepository.findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(currency);
    }

    /**
     * 根据事件日期范围查询
     */
    public List<DividendInKindEvent> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return dividendInKindEventRepository.findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(startDate, endDate);
    }

    /**
     * 新增实物分红事件
     */
    @Transactional
    public DividendInKindEvent create(DividendInKindEvent event) {
        return dividendInKindEventRepository.save(event);
    }

    /**
     * 更新实物分红事件
     */
    @Transactional
    public DividendInKindEvent update(Long id, DividendInKindEvent eventData) {
        DividendInKindEvent existing = dividendInKindEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("实物分红事件不存在, ID: " + id));

        existing.setSymbol(eventData.getSymbol());
        existing.setSymbolName(eventData.getSymbolName());
        existing.setCurrency(eventData.getCurrency());
        existing.setEventDate(eventData.getEventDate());
        existing.setDividendSymbol(eventData.getDividendSymbol());
        existing.setDividendSymbolName(eventData.getDividendSymbolName());
        existing.setDividendQtyPerShare(eventData.getDividendQtyPerShare());
        existing.setDescription(eventData.getDescription());

        return dividendInKindEventRepository.save(existing);
    }

    /**
     * 软删除实物分红事件
     */
    @Transactional
    public void delete(Long id) {
        DividendInKindEvent existing = dividendInKindEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("实物分红事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        dividendInKindEventRepository.save(existing);
    }
}
