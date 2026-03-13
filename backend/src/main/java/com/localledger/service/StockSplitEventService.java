package com.localledger.service;

import com.localledger.entity.StockSplitEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TriggerRefType;
import com.localledger.repository.StockSplitEventRepository;
import com.localledger.repository.TradeRecordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 拆股事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class StockSplitEventService {

    private static final Logger log = LoggerFactory.getLogger(StockSplitEventService.class);

    @Autowired
    private StockSplitEventRepository stockSplitEventRepository;

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private MarketEventProcessingService marketEventProcessingService;

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
     * 新增拆股事件，并自动生成系统交易记录
     */
    @Transactional
    public StockSplitEvent create(StockSplitEvent event) {
        StockSplitEvent saved = stockSplitEventRepository.save(event);
        log.info("拆股事件已保存: id={}, symbol={}, eventDate={}", saved.getId(), saved.getSymbol(), saved.getEventDate());
        marketEventProcessingService.processStockSplitEvent(saved);
        return saved;
    }

    /**
     * 更新拆股事件，并重新生成系统交易记录
     * 需要考虑修改前后 symbol/eventDate 变化导致的受影响范围
     */
    @Transactional
    public StockSplitEvent update(Long id, StockSplitEvent eventData) {
        StockSplitEvent existing = stockSplitEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("拆股事件不存在, ID: " + id));

        // 记录旧值，用于确定受影响范围
        String oldSymbol = existing.getSymbol();
        java.time.LocalDate oldDate = existing.getEventDate();

        existing.setSymbol(eventData.getSymbol());
        existing.setUnderlyingSymbolName(eventData.getUnderlyingSymbolName());
        existing.setCurrency(eventData.getCurrency());
        existing.setEventDate(eventData.getEventDate());
        existing.setRatioFrom(eventData.getRatioFrom());
        existing.setRatioTo(eventData.getRatioTo());
        existing.setDescription(eventData.getDescription());

        StockSplitEvent saved = stockSplitEventRepository.save(existing);

        // 级联重算：受影响 symbols 包含新旧 symbol，起始日期取新旧中较早的
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(oldSymbol);
        affectedSymbols.add(saved.getSymbol());
        java.time.LocalDate sinceDate = oldDate.isBefore(saved.getEventDate()) ? oldDate : saved.getEventDate();
        marketEventProcessingService.processEventDeletion(affectedSymbols, sinceDate);

        return saved;
    }

    /**
     * 软删除拆股事件，并级联重算后续事件
     */
    @Transactional
    public void delete(Long id) {
        StockSplitEvent existing = stockSplitEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("拆股事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        existing.setProcessed(false);
        existing.setProcessedAt(null);
        stockSplitEventRepository.save(existing);

        // 先清理被删除事件自身关联的系统交易记录
        tradeRecordRepository.deleteByTriggerRefTypeAndTriggerRefIdIn(
                TriggerRefType.STOCK_SPLIT, List.of(existing.getId()));

        // 删除后级联重算
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(existing.getSymbol());
        marketEventProcessingService.processEventDeletion(affectedSymbols, existing.getEventDate());
    }
}
