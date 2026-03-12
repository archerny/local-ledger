package com.localledger.service;

import com.localledger.dto.PositionSnapshot;
import com.localledger.entity.Broker;
import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.*;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.TradeRecordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * PositionService 单元测试
 * 覆盖持仓计算的核心逻辑
 */
@ExtendWith(MockitoExtension.class)
class PositionServiceTest {

    @Mock
    private TradeRecordRepository tradeRecordRepository;

    @Mock
    private BrokerRepository brokerRepository;

    @InjectMocks
    private PositionService positionService;

    // ============ 辅助方法 ============

    private TradeRecord buildRecord(Long id, String symbol, TradeType tradeType,
                                     int quantity, Long brokerId) {
        TradeRecord record = new TradeRecord();
        record.setId(id);
        record.setSymbol(symbol);
        record.setName("测试证券");
        record.setUnderlyingSymbol(symbol);
        record.setAssetType(AssetType.STOCK);
        record.setCurrency(Currency.USD);
        record.setTradeType(tradeType);
        record.setQuantity(quantity);
        record.setPrice(new BigDecimal("100.00"));
        record.setAmount(new BigDecimal("10000.00"));
        record.setFee(BigDecimal.ZERO);
        record.setBrokerId(brokerId);
        record.setTradeDate(LocalDate.of(2025, 1, 10));
        record.setTradeTrigger(TradeTrigger.MANUAL);
        record.setTriggerRefType(TriggerRefType.NONE);
        record.setTriggerRefId(0L);
        record.setIsDeleted(false);
        return record;
    }

    private Broker buildBroker(Long id, String name) {
        Broker broker = new Broker(name, "US");
        broker.setId(id);
        return broker;
    }

    // ============ 测试用例 ============

    @Test
    @DisplayName("空交易记录 - 应返回空持仓列表")
    void emptyRecords_shouldReturnEmptyList() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Collections.emptyList());

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("单次买入 - 应有持仓")
    void singleBuy_shouldHavePosition() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy = buildRecord(1L, "AAPL", TradeType.BUY, 100, 1L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Collections.singletonList(buy));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertEquals(1, result.size());
        assertEquals("AAPL", result.get(0).getSymbol());
        assertEquals(100, result.get(0).getQuantity());
    }

    @Test
    @DisplayName("买入后全部卖出 - 持仓应为空（数量为0被过滤）")
    void buyThenSellAll_shouldBeEmpty() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy = buildRecord(1L, "AAPL", TradeType.BUY, 100, 1L);
        TradeRecord sell = buildRecord(2L, "AAPL", TradeType.SELL, 100, 1L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Arrays.asList(buy, sell));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("买入后部分卖出 - 持仓应为剩余数量")
    void buyThenPartialSell_shouldHaveRemaining() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy = buildRecord(1L, "AAPL", TradeType.BUY, 100, 1L);
        TradeRecord sell = buildRecord(2L, "AAPL", TradeType.SELL, 30, 1L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Arrays.asList(buy, sell));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertEquals(1, result.size());
        assertEquals(70, result.get(0).getQuantity());
    }

    @Test
    @DisplayName("同一证券不同券商 - 应分别计算持仓")
    void sameSymbolDifferentBrokers_shouldSeparatePositions() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy1 = buildRecord(1L, "AAPL", TradeType.BUY, 100, 1L);
        TradeRecord buy2 = buildRecord(2L, "AAPL", TradeType.BUY, 50, 2L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Arrays.asList(buy1, buy2));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));
        when(brokerRepository.findById(2L)).thenReturn(Optional.of(buildBroker(2L, "富途证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertEquals(2, result.size());
        // 验证两个券商分别有正确的持仓
        int totalQuantity = result.stream().mapToInt(PositionSnapshot::getQuantity).sum();
        assertEquals(150, totalQuantity);
    }

    @Test
    @DisplayName("按券商筛选 - 应只返回该券商的持仓")
    void filterByBroker_shouldReturnOnlyThatBroker() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy = buildRecord(1L, "AAPL", TradeType.BUY, 100, 1L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndBrokerIdAndIsDeletedFalseOrderByTradeDateAsc(
                targetDate, 1L)).thenReturn(Collections.singletonList(buy));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, 1L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getBrokerId());
        assertEquals("盈透证券", result.get(0).getBrokerName());
    }

    @Test
    @DisplayName("多次买入同一证券 - 持仓应累加")
    void multipleBuys_shouldAccumulate() {
        LocalDate targetDate = LocalDate.of(2025, 3, 10);
        TradeRecord buy1 = buildRecord(1L, "TSLA", TradeType.BUY, 50, 1L);
        TradeRecord buy2 = buildRecord(2L, "TSLA", TradeType.BUY, 30, 1L);
        TradeRecord buy3 = buildRecord(3L, "TSLA", TradeType.BUY, 20, 1L);
        when(tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate))
                .thenReturn(Arrays.asList(buy1, buy2, buy3));
        when(brokerRepository.findById(1L)).thenReturn(Optional.of(buildBroker(1L, "盈透证券")));

        List<PositionSnapshot> result = positionService.calculatePositions(targetDate, null);

        assertEquals(1, result.size());
        assertEquals(100, result.get(0).getQuantity());
    }
}
