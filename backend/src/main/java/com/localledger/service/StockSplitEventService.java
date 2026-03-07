package com.localledger.service;

import com.localledger.entity.StockSplitEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.repository.StockSplitEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 拆股事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class StockSplitEventService {

    @Autowired
    private StockSplitEventRepository stockSplitEventRepository;

    /**
     * 查询所有未删除的拆股事件
     */
    public List<StockSplitEvent> findAll() {
        return stockSplitEventRepository.findByIsDeletedFalseOrderByEventDateDesc();
    }

    /**
     * 根据ID查询
     */
    public Optional<StockSplitEvent> findById(Long id) {
        return stockSplitEventRepository.findById(id);
    }

    /**
     * 根据证券代码查询
     */
    public List<StockSplitEvent> findBySymbol(String symbol) {
        return stockSplitEventRepository.findBySymbolAndIsDeletedFalseOrderByEventDateDesc(symbol);
    }

    /**
     * 根据币种查询
     */
    public List<StockSplitEvent> findByCurrency(Currency currency) {
        return stockSplitEventRepository.findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(currency);
    }

    /**
     * 根据事件日期范围查询
     */
    public List<StockSplitEvent> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return stockSplitEventRepository.findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(startDate, endDate);
    }

    /**
     * 新增拆股事件
     */
    @Transactional
    public StockSplitEvent create(StockSplitEvent event) {
        return stockSplitEventRepository.save(event);
    }

    /**
     * 更新拆股事件
     */
    @Transactional
    public StockSplitEvent update(Long id, StockSplitEvent eventData) {
        StockSplitEvent existing = stockSplitEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("拆股事件不存在, ID: " + id));

        existing.setSymbol(eventData.getSymbol());
        existing.setSymbolName(eventData.getSymbolName());
        existing.setCurrency(eventData.getCurrency());
        existing.setEventDate(eventData.getEventDate());
        existing.setRatioFrom(eventData.getRatioFrom());
        existing.setRatioTo(eventData.getRatioTo());
        existing.setDescription(eventData.getDescription());

        return stockSplitEventRepository.save(existing);
    }

    /**
     * 软删除拆股事件
     */
    @Transactional
    public void delete(Long id) {
        StockSplitEvent existing = stockSplitEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("拆股事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        stockSplitEventRepository.save(existing);
    }
}
