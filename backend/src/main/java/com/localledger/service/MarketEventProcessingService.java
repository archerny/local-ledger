package com.localledger.service;

import com.localledger.dto.PositionSnapshot;
import com.localledger.entity.*;
import com.localledger.entity.enums.*;
import com.localledger.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 市场事件处理服务
 * 核心功能：当用户录入/修改/删除市场事件时，自动生成或重算系统交易记录。
 *
 * 设计详见 market-event-processing-design.md
 *
 * 核心流程：
 * 1. 确定受影响的 symbols
 * 2. 找出这些 symbols 在事件日期当天及之后的所有市场事件，按时间排序
 * 3. 删除这些事件关联的所有系统交易记录
 * 4. 按排序后的顺序逐个重新处理每个事件（生成系统交易记录）
 * 5. 整个流程包裹在数据库事务中
 */
@Service
public class MarketEventProcessingService {

    private static final Logger log = LoggerFactory.getLogger(MarketEventProcessingService.class);

    /**
     * 同一天内的事件处理优先级（数字越小优先级越高）
     * 代码变更 > 拆股 > 实物分红
     */
    private static final int PRIORITY_SYMBOL_CHANGE = 1;
    private static final int PRIORITY_STOCK_SPLIT = 2;
    private static final int PRIORITY_DIVIDEND_IN_KIND = 3;

    @Autowired
    private PositionService positionService;

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private StockSplitEventRepository stockSplitEventRepository;

    @Autowired
    private SymbolChangeEventRepository symbolChangeEventRepository;

    @Autowired
    private DividendInKindEventRepository dividendInKindEventRepository;

    // ============================================================
    // 公共入口方法：由各事件 Service 的 create/update/delete 调用
    // ============================================================

    /**
     * 处理拆股事件（新增或修改后触发）
     * 包含级联重算机制
     */
    @Transactional
    public void processStockSplitEvent(StockSplitEvent event) {
        log.info("开始处理拆股事件: id={}, symbol={}, eventDate={}", event.getId(), event.getSymbol(), event.getEventDate());
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(event.getSymbol());
        cascadeRecalculate(affectedSymbols, event.getEventDate());
    }

    /**
     * 处理代码变更事件（新增或修改后触发）
     * 包含级联重算机制
     */
    @Transactional
    public void processSymbolChangeEvent(SymbolChangeEvent event) {
        log.info("开始处理代码变更事件: id={}, oldSymbol={}, newSymbol={}, eventDate={}",
                event.getId(), event.getOldSymbol(), event.getNewSymbol(), event.getEventDate());
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(event.getOldSymbol());
        affectedSymbols.add(event.getNewSymbol());
        cascadeRecalculate(affectedSymbols, event.getEventDate());
    }

    /**
     * 处理实物分红事件（新增或修改后触发）
     * 包含级联重算机制
     */
    @Transactional
    public void processDividendInKindEvent(DividendInKindEvent event) {
        log.info("开始处理实物分红事件: id={}, symbol={}, dividendSymbol={}, eventDate={}",
                event.getId(), event.getSymbol(), event.getDividendSymbol(), event.getEventDate());
        Set<String> affectedSymbols = new HashSet<>();
        affectedSymbols.add(event.getSymbol());
        affectedSymbols.add(event.getDividendSymbol());
        cascadeRecalculate(affectedSymbols, event.getEventDate());
    }

    /**
     * 处理市场事件删除后的级联重算
     * 删除事件后，仍需对受影响 symbols 的后续事件进行重算
     *
     * @param affectedSymbols 受影响的 symbol 集合
     * @param eventDate       被删除事件的日期
     */
    @Transactional
    public void processEventDeletion(Set<String> affectedSymbols, LocalDate eventDate) {
        log.info("开始处理事件删除后的级联重算: symbols={}, eventDate={}", affectedSymbols, eventDate);
        cascadeRecalculate(affectedSymbols, eventDate);
    }

    // ============================================================
    // 核心：级联重算机制
    // ============================================================

    /**
     * 级联重算：找出受影响的所有后续事件，删除旧交易记录，按时间顺序重新生成
     *
     * @param affectedSymbols 受影响的 symbol 集合
     * @param sinceDate       从该日期（含）开始的事件需要重算
     */
    private void cascadeRecalculate(Set<String> affectedSymbols, LocalDate sinceDate) {
        // 1. 收集所有受影响的事件（按时间+优先级排序）
        List<EventWrapper> allEvents = collectAffectedEvents(affectedSymbols, sinceDate);
        log.info("级联重算: 共找到 {} 个受影响的事件", allEvents.size());

        if (allEvents.isEmpty()) {
            return;
        }

        // 2. 按事件类型分组，收集需要清理的 triggerRefIds
        Map<TriggerRefType, List<Long>> idsToDelete = new HashMap<>();
        for (EventWrapper wrapper : allEvents) {
            idsToDelete.computeIfAbsent(wrapper.triggerRefType, k -> new ArrayList<>())
                    .add(wrapper.eventId);
        }

        // 3. 批量删除旧的系统交易记录
        for (Map.Entry<TriggerRefType, List<Long>> entry : idsToDelete.entrySet()) {
            tradeRecordRepository.deleteByTriggerRefTypeAndTriggerRefIdIn(entry.getKey(), entry.getValue());
            log.info("已删除 triggerRefType={} 关联的系统交易记录, eventIds={}", entry.getKey(), entry.getValue());
        }

        // 4. 将所有事件的 processed 状态重置为 false
        resetProcessedStatus(allEvents);

        // 5. 按排序顺序逐个处理每个事件
        for (EventWrapper wrapper : allEvents) {
            List<TradeRecord> generatedRecords = processOneEvent(wrapper);
            if (!generatedRecords.isEmpty()) {
                tradeRecordRepository.saveAll(generatedRecords);
                log.info("事件 {} (id={}) 生成了 {} 条系统交易记录",
                        wrapper.triggerRefType, wrapper.eventId, generatedRecords.size());
            } else {
                log.info("事件 {} (id={}) 处理完毕，无持仓影响，未生成交易记录",
                        wrapper.triggerRefType, wrapper.eventId);
            }
            // 标记为已处理
            markAsProcessed(wrapper);
        }
    }

    // ============================================================
    // 收集受影响的事件并排序
    // ============================================================

    /**
     * 收集所有受影响的市场事件，按 eventDate 升序 + 同一天内固定优先级排序
     * 同一天内顺序：代码变更 > 拆股 > 实物分红
     */
    private List<EventWrapper> collectAffectedEvents(Set<String> symbols, LocalDate sinceDate) {
        List<EventWrapper> allEvents = new ArrayList<>();

        // 查询拆股事件
        List<StockSplitEvent> splitEvents = stockSplitEventRepository
                .findBySymbolInAndEventDateGreaterThanEqualAndIsDeletedFalseOrderByEventDateAsc(symbols, sinceDate);
        for (StockSplitEvent e : splitEvents) {
            allEvents.add(new EventWrapper(e.getEventDate(), PRIORITY_STOCK_SPLIT,
                    TriggerRefType.STOCK_SPLIT, e.getId(), e));
        }

        // 查询代码变更事件
        List<SymbolChangeEvent> changeEvents = symbolChangeEventRepository.findAffectedEvents(symbols, sinceDate);
        for (SymbolChangeEvent e : changeEvents) {
            allEvents.add(new EventWrapper(e.getEventDate(), PRIORITY_SYMBOL_CHANGE,
                    TriggerRefType.SYMBOL_CHANGE, e.getId(), e));
        }

        // 查询实物分红事件
        List<DividendInKindEvent> dividendEvents = dividendInKindEventRepository.findAffectedEvents(symbols, sinceDate);
        for (DividendInKindEvent e : dividendEvents) {
            allEvents.add(new EventWrapper(e.getEventDate(), PRIORITY_DIVIDEND_IN_KIND,
                    TriggerRefType.DIVIDEND_IN_KIND, e.getId(), e));
        }

        // 排序：先按日期升序，同一天按优先级升序
        allEvents.sort(Comparator.comparing(EventWrapper::getEventDate)
                .thenComparingInt(EventWrapper::getPriority));

        return allEvents;
    }

    // ============================================================
    // 单个事件处理：根据事件类型分发
    // ============================================================

    /**
     * 处理单个市场事件，返回生成的系统交易记录列表
     */
    private List<TradeRecord> processOneEvent(EventWrapper wrapper) {
        return switch (wrapper.triggerRefType) {
            case STOCK_SPLIT -> processStockSplit((StockSplitEvent) wrapper.event);
            case SYMBOL_CHANGE -> processSymbolChange((SymbolChangeEvent) wrapper.event);
            case DIVIDEND_IN_KIND -> processDividendInKind((DividendInKindEvent) wrapper.event);
            default -> {
                log.warn("未知的事件类型: {}", wrapper.triggerRefType);
                yield Collections.emptyList();
            }
        };
    }

    // ============================================================
    // 拆股事件处理逻辑
    // ============================================================

    /**
     * 处理拆股事件
     * 对持有该 symbol 的每个券商，生成一条 BUY 记录，数量 = 原持仓 × (ratioTo/ratioFrom - 1)
     * 价格=0，金额=0，费用=0
     */
    private List<TradeRecord> processStockSplit(StockSplitEvent event) {
        List<TradeRecord> records = new ArrayList<>();

        // 计算事件前一天的持仓快照
        LocalDate dayBefore = event.getEventDate().minusDays(1);
        List<PositionSnapshot> positions = positionService.calculatePositions(dayBefore, null);

        // 筛选持有该 symbol 的持仓
        List<PositionSnapshot> relevantPositions = positions.stream()
                .filter(p -> event.getSymbol().equals(p.getSymbol()))
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0)
                .collect(Collectors.toList());

        if (relevantPositions.isEmpty()) {
            log.info("拆股事件 (id={}, symbol={}): 事件发生时无持仓，跳过", event.getId(), event.getSymbol());
            return records;
        }

        for (PositionSnapshot position : relevantPositions) {
            // 新数量 = quantity × ratioTo / ratioFrom
            // 增量 = quantity × (ratioTo/ratioFrom - 1)
            long newQty = Math.round((double) position.getQuantity() * event.getRatioTo() / event.getRatioFrom());
            int delta = (int) (newQty - position.getQuantity());

            if (delta <= 0) {
                continue;
            }

            TradeRecord record = new TradeRecord();
            record.setTradeDate(event.getEventDate());
            record.setBrokerId(position.getBrokerId());
            record.setAssetType(position.getAssetType());
            record.setSymbol(event.getSymbol());
            record.setName(position.getName());
            record.setUnderlyingSymbol(position.getUnderlyingSymbol() != null ? position.getUnderlyingSymbol() : event.getSymbol());
            record.setTradeType(TradeType.BUY);
            record.setQuantity(delta);
            record.setPrice(BigDecimal.ZERO);
            record.setAmount(BigDecimal.ZERO);
            record.setFee(BigDecimal.ZERO);
            record.setCurrency(event.getCurrency() != null ? event.getCurrency() : position.getCurrency());
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefId(event.getId());
            record.setTriggerRefType(TriggerRefType.STOCK_SPLIT);
            record.setIsDeleted(false);

            records.add(record);
            log.debug("拆股: brokerId={}, symbol={}, 原持仓={}, 增量={}",
                    position.getBrokerId(), event.getSymbol(), position.getQuantity(), delta);
        }

        return records;
    }

    // ============================================================
    // 代码变更事件处理逻辑
    // ============================================================

    /**
     * 处理代码变更事件
     * 对持有 oldSymbol 的每个券商生成两条记录：
     * ① SELL oldSymbol 全部持仓（价格=平均成本）
     * ② BUY newSymbol 同等数量（价格=平均成本）
     * 排除期权类型
     */
    private List<TradeRecord> processSymbolChange(SymbolChangeEvent event) {
        List<TradeRecord> records = new ArrayList<>();

        // 计算事件前一天的持仓快照
        LocalDate dayBefore = event.getEventDate().minusDays(1);
        List<PositionSnapshot> positions = positionService.calculatePositions(dayBefore, null);

        // 筛选持有 oldSymbol 的持仓，排除期权
        List<PositionSnapshot> relevantPositions = positions.stream()
                .filter(p -> event.getOldSymbol().equals(p.getSymbol()))
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0)
                .filter(p -> p.getAssetType() != AssetType.OPTION_CALL && p.getAssetType() != AssetType.OPTION_PUT)
                .collect(Collectors.toList());

        if (relevantPositions.isEmpty()) {
            log.info("代码变更事件 (id={}, {}->{}): 事件发生时无持仓，跳过",
                    event.getId(), event.getOldSymbol(), event.getNewSymbol());
            return records;
        }

        for (PositionSnapshot position : relevantPositions) {
            // 计算平均持仓成本
            BigDecimal avgCost = calculateAverageCost(position.getSymbol(), position.getBrokerId(), dayBefore);
            BigDecimal totalCost = avgCost.multiply(BigDecimal.valueOf(position.getQuantity()));

            // ① SELL oldSymbol
            TradeRecord sellRecord = new TradeRecord();
            sellRecord.setTradeDate(event.getEventDate());
            sellRecord.setBrokerId(position.getBrokerId());
            sellRecord.setAssetType(position.getAssetType());
            sellRecord.setSymbol(event.getOldSymbol());
            sellRecord.setName(position.getName());
            sellRecord.setUnderlyingSymbol(event.getOldSymbol());
            sellRecord.setTradeType(TradeType.SELL);
            sellRecord.setQuantity(position.getQuantity());
            sellRecord.setPrice(avgCost);
            sellRecord.setAmount(totalCost);
            sellRecord.setFee(BigDecimal.ZERO);
            sellRecord.setCurrency(event.getCurrency() != null ? event.getCurrency() : position.getCurrency());
            sellRecord.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            sellRecord.setTriggerRefId(event.getId());
            sellRecord.setTriggerRefType(TriggerRefType.SYMBOL_CHANGE);
            sellRecord.setIsDeleted(false);
            records.add(sellRecord);

            // ② BUY newSymbol
            TradeRecord buyRecord = new TradeRecord();
            buyRecord.setTradeDate(event.getEventDate());
            buyRecord.setBrokerId(position.getBrokerId());
            buyRecord.setAssetType(position.getAssetType());
            buyRecord.setSymbol(event.getNewSymbol());
            buyRecord.setName(event.getNewUnderlyingSymbolName()); // 使用变更后的底层证券名称
            buyRecord.setUnderlyingSymbol(event.getNewSymbol());
            buyRecord.setTradeType(TradeType.BUY);
            buyRecord.setQuantity(position.getQuantity());
            buyRecord.setPrice(avgCost);
            buyRecord.setAmount(totalCost);
            buyRecord.setFee(BigDecimal.ZERO);
            buyRecord.setCurrency(event.getCurrency() != null ? event.getCurrency() : position.getCurrency());
            buyRecord.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            buyRecord.setTriggerRefId(event.getId());
            buyRecord.setTriggerRefType(TriggerRefType.SYMBOL_CHANGE);
            buyRecord.setIsDeleted(false);
            records.add(buyRecord);

            log.debug("代码变更: brokerId={}, SELL {} {} 股 (avgCost={}), BUY {} {} 股",
                    position.getBrokerId(), event.getOldSymbol(), position.getQuantity(), avgCost,
                    event.getNewSymbol(), position.getQuantity());
        }

        return records;
    }

    // ============================================================
    // 实物分红事件处理逻辑
    // ============================================================

    /**
     * 处理实物分红事件
     * 对持有该 symbol 的每个券商，生成一条 dividendSymbol 的 BUY 记录
     * 数量 = 持仓 × dividendQtyPerShare（向下取整）
     * 价格 = fairValuePerShare
     */
    private List<TradeRecord> processDividendInKind(DividendInKindEvent event) {
        List<TradeRecord> records = new ArrayList<>();

        // 计算事件前一天的持仓快照
        LocalDate dayBefore = event.getEventDate().minusDays(1);
        List<PositionSnapshot> positions = positionService.calculatePositions(dayBefore, null);

        // 筛选持有该 symbol 且 quantity > 0 的持仓
        List<PositionSnapshot> relevantPositions = positions.stream()
                .filter(p -> event.getSymbol().equals(p.getSymbol()))
                .filter(p -> p.getQuantity() != null && p.getQuantity() > 0)
                .collect(Collectors.toList());

        if (relevantPositions.isEmpty()) {
            log.info("实物分红事件 (id={}, symbol={}): 事件发生时无持仓，跳过",
                    event.getId(), event.getSymbol());
            return records;
        }

        for (PositionSnapshot position : relevantPositions) {
            // 分红数量 = (int)(quantity × dividendQtyPerShare)，向下取整
            int dividendQty = BigDecimal.valueOf(position.getQuantity())
                    .multiply(event.getDividendQtyPerShare())
                    .setScale(0, RoundingMode.FLOOR)
                    .intValue();

            if (dividendQty <= 0) {
                continue;
            }

            // 公允价格（如果未设置则为0）
            BigDecimal fairValue = event.getFairValuePerShare() != null ? event.getFairValuePerShare() : BigDecimal.ZERO;
            BigDecimal amount = fairValue.multiply(BigDecimal.valueOf(dividendQty));

            TradeRecord record = new TradeRecord();
            record.setTradeDate(event.getEventDate());
            record.setBrokerId(position.getBrokerId());
            record.setAssetType(AssetType.STOCK); // 分红获得的是股票
            record.setSymbol(event.getDividendSymbol());
            record.setName(event.getDividendSymbolName());
            record.setUnderlyingSymbol(event.getDividendSymbol());
            record.setTradeType(TradeType.BUY);
            record.setQuantity(dividendQty);
            record.setPrice(fairValue);
            record.setAmount(amount);
            record.setFee(BigDecimal.ZERO);
            record.setCurrency(event.getCurrency() != null ? event.getCurrency() : position.getCurrency());
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefId(event.getId());
            record.setTriggerRefType(TriggerRefType.DIVIDEND_IN_KIND);
            record.setIsDeleted(false);

            records.add(record);
            log.debug("实物分红: brokerId={}, symbol={}, 持仓={}, 分红数量={}, 公允价格={}",
                    position.getBrokerId(), event.getDividendSymbol(), position.getQuantity(),
                    dividendQty, fairValue);
        }

        return records;
    }

    // ============================================================
    // 辅助方法
    // ============================================================

    /**
     * 计算某个 symbol 在某个券商下截止指定日期的加权平均持仓成本
     *
     * 使用移动加权平均法：
     * - BUY:  持仓成本池 += 买入金额，持仓数量 += 买入数量
     * - SELL: 持仓成本池 -= 卖出数量 × 当前平均成本，持仓数量 -= 卖出数量
     * 最终平均成本 = 持仓成本池 / 当前持仓数量
     *
     * TODO: 当前使用移动加权平均法，未来在做盈亏分析时需要深度考虑成本计算方式，
     *       可能需要支持 FIFO、LIFO 等不同算法，届时需重构此方法。
     */
    private BigDecimal calculateAverageCost(String symbol, Long brokerId, LocalDate asOfDate) {
        List<TradeRecord> records = tradeRecordRepository
                .findByTradeDateLessThanEqualAndBrokerIdAndIsDeletedFalseOrderByTradeDateAsc(asOfDate, brokerId);

        BigDecimal costPool = BigDecimal.ZERO;  // 持仓成本池
        int holdingQty = 0;                      // 当前持仓数量

        for (TradeRecord record : records) {
            if (!symbol.equals(record.getSymbol())) {
                continue;
            }
            BigDecimal amount = record.getAmount() != null ? record.getAmount() : BigDecimal.ZERO;
            if (record.getTradeType() == TradeType.BUY) {
                costPool = costPool.add(amount);
                holdingQty += record.getQuantity();
            } else if (record.getTradeType() == TradeType.SELL) {
                if (holdingQty > 0) {
                    // 卖出时按当前平均成本减少成本池
                    BigDecimal avgCostBeforeSell = costPool.divide(BigDecimal.valueOf(holdingQty), 6, RoundingMode.HALF_UP);
                    costPool = costPool.subtract(avgCostBeforeSell.multiply(BigDecimal.valueOf(record.getQuantity())));
                }
                holdingQty -= record.getQuantity();
            }
        }

        if (holdingQty <= 0) {
            return BigDecimal.ZERO;
        }

        return costPool.divide(BigDecimal.valueOf(holdingQty), 4, RoundingMode.HALF_UP);
    }

    /**
     * 重置事件列表中所有事件的 processed 状态为 false
     */
    private void resetProcessedStatus(List<EventWrapper> events) {
        for (EventWrapper wrapper : events) {
            wrapper.event.setProcessed(false);
            wrapper.event.setProcessedAt(null);
        }
        // 批量保存（按类型分组保存）
        saveEventsByType(events);
    }

    /**
     * 标记单个事件为已处理
     */
    private void markAsProcessed(EventWrapper wrapper) {
        wrapper.event.setProcessed(true);
        wrapper.event.setProcessedAt(LocalDateTime.now());
        saveOneEvent(wrapper);
    }

    /**
     * 按类型分组批量保存事件列表
     */
    private void saveEventsByType(List<EventWrapper> events) {
        List<StockSplitEvent> splitEvents = new ArrayList<>();
        List<SymbolChangeEvent> changeEvents = new ArrayList<>();
        List<DividendInKindEvent> dividendEvents = new ArrayList<>();

        for (EventWrapper wrapper : events) {
            switch (wrapper.triggerRefType) {
                case STOCK_SPLIT -> splitEvents.add((StockSplitEvent) wrapper.event);
                case SYMBOL_CHANGE -> changeEvents.add((SymbolChangeEvent) wrapper.event);
                case DIVIDEND_IN_KIND -> dividendEvents.add((DividendInKindEvent) wrapper.event);
                default -> { }
            }
        }

        if (!splitEvents.isEmpty()) {
            stockSplitEventRepository.saveAll(splitEvents);
        }
        if (!changeEvents.isEmpty()) {
            symbolChangeEventRepository.saveAll(changeEvents);
        }
        if (!dividendEvents.isEmpty()) {
            dividendInKindEventRepository.saveAll(dividendEvents);
        }
    }

    /**
     * 保存单个事件
     */
    private void saveOneEvent(EventWrapper wrapper) {
        switch (wrapper.triggerRefType) {
            case STOCK_SPLIT -> stockSplitEventRepository.save((StockSplitEvent) wrapper.event);
            case SYMBOL_CHANGE -> symbolChangeEventRepository.save((SymbolChangeEvent) wrapper.event);
            case DIVIDEND_IN_KIND -> dividendInKindEventRepository.save((DividendInKindEvent) wrapper.event);
            default -> { }
        }
    }

    // ============================================================
    // 内部类：事件包装器，用于统一排序
    // ============================================================

    /**
     * 事件包装器，将不同类型的市场事件统一封装，便于排序和处理
     */
    private static class EventWrapper {
        private final LocalDate eventDate;
        private final int priority;
        private final TriggerRefType triggerRefType;
        private final Long eventId;
        private final BaseMarketEvent event;

        EventWrapper(LocalDate eventDate, int priority, TriggerRefType triggerRefType, Long eventId, BaseMarketEvent event) {
            this.eventDate = eventDate;
            this.priority = priority;
            this.triggerRefType = triggerRefType;
            this.eventId = eventId;
            this.event = event;
        }

        LocalDate getEventDate() {
            return eventDate;
        }

        int getPriority() {
            return priority;
        }
    }
}
