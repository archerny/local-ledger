package com.localledger.service;

import com.localledger.entity.DividendInKindEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TriggerRefType;
import com.localledger.repository.DividendInKindEventRepository;
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
 * 实物分红事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class DividendInKindEventService {

    private static final Logger log = LoggerFactory.getLogger(DividendInKindEventService.class);

    @Autowired
    private DividendInKindEventRepository dividendInKindEventRepository;

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private MarketEventProcessingService marketEventProcessingService;

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
     * 新增实物分红事件，并自动生成系统交易记录
     */
    @Transactional
    public DividendInKindEvent create(DividendInKindEvent event) {
        DividendInKindEvent saved = dividendInKindEventRepository.save(event);
        log.info("实物分红事件已保存: id={}, symbol={}, dividendSymbol={}, eventDate={}",
                saved.getId(), saved.getSymbol(), saved.getDividendSymbol(), saved.getEventDate());
        marketEventProcessingService.processDividendInKindEvent(saved);
        return saved;
    }

    /**
     * 更新实物分红事件，并重新生成系统交易记录
     */
    @Transactional
    public DividendInKindEvent update(Long id, DividendInKindEvent eventData) {
        DividendInKindEvent existing = dividendInKindEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("实物分红事件不存在, ID: " + id));

        // 记录旧值，用于确定受影响范围
        String oldSymbol = existing.getSymbol();
        String oldDividendSymbol = existing.getDividendSymbol();
        java.time.LocalDate oldDate = existing.getEventDate();

        existing.setSymbol(eventData.getSymbol());
        existing.setUnderlyingSymbolName(eventData.getUnderlyingSymbolName());
        existing.setCurrency(eventData.getCurrency());
        existing.setEventDate(eventData.getEventDate());
        existing.setDividendSymbol(eventData.getDividendSymbol());
        existing.setDividendSymbolName(eventData.getDividendSymbolName());
        existing.setDividendQtyPerShare(eventData.getDividendQtyPerShare());
        existing.setFairValuePerShare(eventData.getFairValuePerShare());
        existing.setDescription(eventData.getDescription());

        DividendInKindEvent saved = dividendInKindEventRepository.save(existing);

        // 级联重算：受影响 symbols 包含新旧所有 symbols
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(oldSymbol);
        affectedSymbols.add(oldDividendSymbol);
        affectedSymbols.add(saved.getSymbol());
        affectedSymbols.add(saved.getDividendSymbol());
        java.time.LocalDate sinceDate = oldDate.isBefore(saved.getEventDate()) ? oldDate : saved.getEventDate();
        marketEventProcessingService.processEventDeletion(affectedSymbols, sinceDate);

        return saved;
    }

    /**
     * 软删除实物分红事件，并级联重算后续事件
     */
    @Transactional
    public void delete(Long id) {
        DividendInKindEvent existing = dividendInKindEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("实物分红事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        existing.setProcessed(false);
        existing.setProcessedAt(null);
        dividendInKindEventRepository.save(existing);

        // 先清理被删除事件自身关联的系统交易记录
        tradeRecordRepository.deleteByTriggerRefTypeAndTriggerRefIdIn(
                TriggerRefType.DIVIDEND_IN_KIND, List.of(existing.getId()));

        // 删除后级联重算
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(existing.getSymbol());
        affectedSymbols.add(existing.getDividendSymbol());
        marketEventProcessingService.processEventDeletion(affectedSymbols, existing.getEventDate());
    }
}
