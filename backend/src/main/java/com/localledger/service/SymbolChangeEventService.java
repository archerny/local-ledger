package com.localledger.service;

import com.localledger.entity.SymbolChangeEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TriggerRefType;
import com.localledger.repository.SymbolChangeEventRepository;
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
 * 代码变更事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class SymbolChangeEventService {

    private static final Logger log = LoggerFactory.getLogger(SymbolChangeEventService.class);

    @Autowired
    private SymbolChangeEventRepository symbolChangeEventRepository;

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private MarketEventProcessingService marketEventProcessingService;

    /**
     * 查询所有未删除的代码变更事件
     */
    public List<SymbolChangeEvent> findAll() {
        return symbolChangeEventRepository.findByIsDeletedFalseOrderByEventDateDesc();
    }

    /**
     * 根据ID查询
     */
    public Optional<SymbolChangeEvent> findById(Long id) {
        return symbolChangeEventRepository.findById(id);
    }

    /**
     * 根据证券代码查询
     */
    public List<SymbolChangeEvent> findBySymbol(String symbol) {
        return symbolChangeEventRepository.findBySymbolAndIsDeletedFalseOrderByEventDateDesc(symbol);
    }

    /**
     * 根据旧代码查询
     */
    public List<SymbolChangeEvent> findByOldSymbol(String oldSymbol) {
        return symbolChangeEventRepository.findByOldSymbolAndIsDeletedFalseOrderByEventDateDesc(oldSymbol);
    }

    /**
     * 根据新代码查询
     */
    public List<SymbolChangeEvent> findByNewSymbol(String newSymbol) {
        return symbolChangeEventRepository.findByNewSymbolAndIsDeletedFalseOrderByEventDateDesc(newSymbol);
    }

    /**
     * 根据币种查询
     */
    public List<SymbolChangeEvent> findByCurrency(Currency currency) {
        return symbolChangeEventRepository.findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(currency);
    }

    /**
     * 根据事件日期范围查询
     */
    public List<SymbolChangeEvent> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return symbolChangeEventRepository.findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(startDate, endDate);
    }

    /**
     * 新增代码变更事件，并自动生成系统交易记录
     * 自动填充以下字段：
     * - symbol = oldSymbol（事件发生前的证券代码）
     * - currency：从 oldSymbol 的已有交易记录中获取
     * - underlyingSymbolName：从 oldSymbol 的已有交易记录中获取（旧的底层证券名称）
     */
    @Transactional
    public SymbolChangeEvent create(SymbolChangeEvent event) {
        // 自动填充：symbol = oldSymbol（事件是对旧代码发生的）
        event.setSymbol(event.getOldSymbol());

        // 从 oldSymbol 的已有交易记录中自动填充 currency 和 underlyingSymbolName
        autoFillFromExistingTradeRecord(event);

        SymbolChangeEvent saved = symbolChangeEventRepository.save(event);
        log.info("代码变更事件已保存: id={}, {}=>{}, eventDate={}",
                saved.getId(), saved.getOldSymbol(), saved.getNewSymbol(), saved.getEventDate());
        marketEventProcessingService.processSymbolChangeEvent(saved);
        return saved;
    }

    /**
     * 更新代码变更事件，并重新生成系统交易记录
     */
    @Transactional
    public SymbolChangeEvent update(Long id, SymbolChangeEvent eventData) {
        SymbolChangeEvent existing = symbolChangeEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("代码变更事件不存在, ID: " + id));

        // 记录旧值，用于确定受影响范围
        String oldOldSymbol = existing.getOldSymbol();
        String oldNewSymbol = existing.getNewSymbol();
        java.time.LocalDate oldDate = existing.getEventDate();

        existing.setSymbol(eventData.getOldSymbol()); // symbol = oldSymbol
        existing.setEventDate(eventData.getEventDate());
        existing.setOldSymbol(eventData.getOldSymbol());
        existing.setNewSymbol(eventData.getNewSymbol());
        existing.setNewUnderlyingSymbolName(eventData.getNewUnderlyingSymbolName());
        existing.setDescription(eventData.getDescription());

        // 重新自动填充 currency 和 underlyingSymbolName（旧代码可能已变更）
        autoFillFromExistingTradeRecord(existing);

        SymbolChangeEvent saved = symbolChangeEventRepository.save(existing);

        // 级联重算：受影响 symbols 包含新旧所有 symbols
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(oldOldSymbol);
        affectedSymbols.add(oldNewSymbol);
        affectedSymbols.add(saved.getOldSymbol());
        affectedSymbols.add(saved.getNewSymbol());
        java.time.LocalDate sinceDate = oldDate.isBefore(saved.getEventDate()) ? oldDate : saved.getEventDate();
        marketEventProcessingService.processEventDeletion(affectedSymbols, sinceDate);

        return saved;
    }

    /**
     * 软删除代码变更事件，并级联重算后续事件
     */
    @Transactional
    public void delete(Long id) {
        SymbolChangeEvent existing = symbolChangeEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("代码变更事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        existing.setProcessed(false);
        existing.setProcessedAt(null);
        symbolChangeEventRepository.save(existing);

        // 先清理被删除事件自身关联的系统交易记录
        tradeRecordRepository.deleteByTriggerRefTypeAndTriggerRefIdIn(
                TriggerRefType.SYMBOL_CHANGE, List.of(existing.getId()));

        // 删除后级联重算
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(existing.getOldSymbol());
        affectedSymbols.add(existing.getNewSymbol());
        marketEventProcessingService.processEventDeletion(affectedSymbols, existing.getEventDate());
    }

    /**
     * 从 oldSymbol 的已有交易记录中自动填充 currency 和 underlyingSymbolName
     * 如果 oldSymbol 有交易记录，则用其 currency 和 name 填充
     * 如果没有交易记录，则保持前端传入的值（如果有的话）
     */
    private void autoFillFromExistingTradeRecord(SymbolChangeEvent event) {
        tradeRecordRepository.findFirstBySymbolAndIsDeletedFalseOrderByTradeDateDesc(event.getOldSymbol())
                .ifPresent(record -> {
                    // 自动填充币种
                    if (event.getCurrency() == null) {
                        event.setCurrency(record.getCurrency());
                        log.debug("自动填充币种: {} (来自 {} 的交易记录)", record.getCurrency(), event.getOldSymbol());
                    }
                    // 自动填充旧的底层证券名称
                    if (event.getUnderlyingSymbolName() == null || event.getUnderlyingSymbolName().isBlank()) {
                        event.setUnderlyingSymbolName(record.getName());
                        log.debug("自动填充旧底层证券名称: {} (来自 {} 的交易记录)", record.getName(), event.getOldSymbol());
                    }
                });
    }
}
