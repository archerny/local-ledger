package com.localledger.service;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.*;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.StrategyRepository;
import com.localledger.repository.TradeRecordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TradeRecordService 单元测试
 * 覆盖创建、更新、删除、金额自动计算和触发一致性校验逻辑
 */
@ExtendWith(MockitoExtension.class)
class TradeRecordServiceTest {

    @Mock
    private TradeRecordRepository tradeRecordRepository;

    @Mock
    private BrokerRepository brokerRepository;

    @Mock
    private StrategyRepository strategyRepository;

    @InjectMocks
    private TradeRecordService tradeRecordService;

    // ============ 辅助方法 ============

    private TradeRecord buildValidStockRecord() {
        TradeRecord record = new TradeRecord();
        record.setTradeDate(LocalDate.of(2025, 3, 10));
        record.setBrokerId(1L);
        record.setAssetType(AssetType.STOCK);
        record.setSymbol("AAPL");
        record.setUnderlyingSymbol("AAPL");
        record.setTradeType(TradeType.BUY);
        record.setQuantity(100);
        record.setPrice(new BigDecimal("150.00"));
        record.setFee(new BigDecimal("5.00"));
        record.setCurrency(Currency.USD);
        return record;
    }

    private TradeRecord buildValidOptionRecord() {
        TradeRecord record = new TradeRecord();
        record.setTradeDate(LocalDate.of(2025, 3, 10));
        record.setBrokerId(1L);
        record.setAssetType(AssetType.OPTION_CALL);
        record.setSymbol("TSLA-20250117-C210");
        record.setUnderlyingSymbol("TSLA");
        record.setTradeType(TradeType.BUY);
        record.setQuantity(5);
        record.setPrice(new BigDecimal("3.50"));
        record.setFee(new BigDecimal("1.00"));
        record.setCurrency(Currency.USD);
        return record;
    }

    // ========================================================
    // 创建交易记录测试
    // ========================================================
    @Nested
    @DisplayName("创建交易记录")
    class CreateTest {

        @Test
        @DisplayName("创建合法的股票记录 - 应成功并自动计算金额")
        void createValidStockRecord_shouldCalculateAmount() {
            TradeRecord record = buildValidStockRecord();
            when(brokerRepository.existsById(1L)).thenReturn(true);
            when(tradeRecordRepository.save(any(TradeRecord.class))).thenAnswer(i -> i.getArgument(0));

            TradeRecord result = tradeRecordService.create(record);

            // 金额 = 100 * 150.00 = 15000.00
            assertEquals(0, new BigDecimal("15000.00").compareTo(result.getAmount()));
            assertEquals(TradeTrigger.MANUAL, result.getTradeTrigger());
            assertEquals(TriggerRefType.NONE, result.getTriggerRefType());
            assertEquals(0L, result.getTriggerRefId());
            verify(tradeRecordRepository).save(any(TradeRecord.class));
        }

        @Test
        @DisplayName("创建期权记录 - 金额应乘以100（合约乘数）")
        void createOptionRecord_shouldMultiplyBy100() {
            TradeRecord record = buildValidOptionRecord();
            when(brokerRepository.existsById(1L)).thenReturn(true);
            when(tradeRecordRepository.save(any(TradeRecord.class))).thenAnswer(i -> i.getArgument(0));

            TradeRecord result = tradeRecordService.create(record);

            // 金额 = 5 * 3.50 * 100 = 1750.00
            assertEquals(0, new BigDecimal("1750.00").compareTo(result.getAmount()));
        }

        @Test
        @DisplayName("券商不存在 - 应抛出异常")
        void createWithNonExistentBroker_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            when(brokerRepository.existsById(1L)).thenReturn(false);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("券商不存在"));
        }

        @Test
        @DisplayName("底层证券代码为空 - 应抛出异常")
        void createWithEmptyUnderlyingSymbol_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setUnderlyingSymbol("");
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("底层证券代码不能为空"));
        }

        @Test
        @DisplayName("数量为0 - 应抛出异常")
        void createWithZeroQuantity_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setQuantity(0);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("交易数量必须大于0"));
        }

        @Test
        @DisplayName("价格为负数 - 应抛出异常")
        void createWithNegativePrice_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setPrice(new BigDecimal("-1.00"));
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("成交价格不能为负数"));
        }

        @Test
        @DisplayName("策略不存在 - 应抛出异常")
        void createWithNonExistentStrategy_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setStrategyId(999L);
            when(brokerRepository.existsById(1L)).thenReturn(true);
            when(strategyRepository.existsById(999L)).thenReturn(false);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("策略不存在"));
        }
    }

    // ========================================================
    // 触发来源一致性校验
    // ========================================================
    @Nested
    @DisplayName("触发来源一致性校验")
    class TriggerConsistencyTest {

        @Test
        @DisplayName("MANUAL触发 + refId=0 + refType=NONE - 应通过")
        void manualTriggerValid_shouldPass() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.MANUAL);
            record.setTriggerRefId(0L);
            record.setTriggerRefType(TriggerRefType.NONE);
            when(brokerRepository.existsById(1L)).thenReturn(true);
            when(tradeRecordRepository.save(any(TradeRecord.class))).thenAnswer(i -> i.getArgument(0));

            assertDoesNotThrow(() -> tradeRecordService.create(record));
        }

        @Test
        @DisplayName("MANUAL触发 + refId不为0 - 应抛出异常")
        void manualTriggerWithNonZeroRefId_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.MANUAL);
            record.setTriggerRefId(100L);
            record.setTriggerRefType(TriggerRefType.NONE);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("手动交易的 trigger_ref_id 应为 0"));
        }

        @Test
        @DisplayName("MARKET_EVENT触发 + refId=0 - 应抛出异常")
        void marketEventTriggerWithZeroRefId_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefId(0L);
            record.setTriggerRefType(TriggerRefType.STOCK_SPLIT);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("trigger_ref_id 不能为 0"));
        }

        @Test
        @DisplayName("MARKET_EVENT触发 + refType=NONE - 应抛出异常")
        void marketEventTriggerWithNoneRefType_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefId(1L);
            record.setTriggerRefType(TriggerRefType.NONE);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("trigger_ref_type 不能为 NONE"));
        }

        @Test
        @DisplayName("MARKET_EVENT触发 + 期权子类型关联 - 应抛出异常")
        void marketEventTriggerWithOptionRefType_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefId(1L);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("STOCK_SPLIT / SYMBOL_CHANGE / DIVIDEND_IN_KIND"));
        }

        @Test
        @DisplayName("OPTION触发 + 市场事件子类型关联 - 应抛出异常")
        void optionTriggerWithMarketEventRefType_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.STOCK_SPLIT);
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("OPTION_EXPIRE / OPTION_EXERCISE / OPTION_ASSIGNED"));
        }

        @Test
        @DisplayName("OPTION触发 + OPTION_EXPIRE + price不为0 - 应抛出异常")
        void optionTriggerExpireWithNonZeroPrice_shouldThrow() {
            TradeRecord record = buildValidStockRecord();
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            record.setPrice(new BigDecimal("1.00"));
            when(brokerRepository.existsById(1L)).thenReturn(true);

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.create(record));

            assertTrue(ex.getMessage().contains("期权到期的成交价格应为 0"));
        }
    }

    // ========================================================
    // 软删除测试
    // ========================================================
    @Nested
    @DisplayName("软删除交易记录")
    class SoftDeleteTest {

        @Test
        @DisplayName("软删除存在的记录 - 应成功")
        void softDeleteExistingRecord_shouldSetDeleted() {
            TradeRecord record = buildValidStockRecord();
            record.setId(1L);
            record.setIsDeleted(false);
            when(tradeRecordRepository.findById(1L)).thenReturn(Optional.of(record));
            when(tradeRecordRepository.save(any(TradeRecord.class))).thenAnswer(i -> i.getArgument(0));

            tradeRecordService.softDelete(1L);

            assertTrue(record.getIsDeleted());
            verify(tradeRecordRepository).save(record);
        }

        @Test
        @DisplayName("软删除不存在的记录 - 应抛出异常")
        void softDeleteNonExistentRecord_shouldThrow() {
            when(tradeRecordRepository.findById(999L)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.softDelete(999L));

            assertTrue(ex.getMessage().contains("交易记录不存在"));
        }
    }

    // ========================================================
    // 更新交易记录测试
    // ========================================================
    @Nested
    @DisplayName("更新交易记录")
    class UpdateTest {

        @Test
        @DisplayName("更新存在的记录 - 应成功并重新计算金额")
        void updateExistingRecord_shouldRecalculateAmount() {
            TradeRecord existing = buildValidStockRecord();
            existing.setId(1L);
            existing.setIsDeleted(false);
            existing.setAmount(new BigDecimal("15000.00"));
            existing.setTradeTrigger(TradeTrigger.MANUAL);
            existing.setTriggerRefType(TriggerRefType.NONE);
            existing.setTriggerRefId(0L);

            TradeRecord updateData = buildValidStockRecord();
            updateData.setQuantity(200); // 修改数量
            updateData.setPrice(new BigDecimal("160.00")); // 修改价格

            when(tradeRecordRepository.findById(1L)).thenReturn(Optional.of(existing));
            when(brokerRepository.existsById(1L)).thenReturn(true);
            when(tradeRecordRepository.save(any(TradeRecord.class))).thenAnswer(i -> i.getArgument(0));

            TradeRecord result = tradeRecordService.update(1L, updateData);

            // 金额 = 200 * 160.00 = 32000.00
            assertEquals(0, new BigDecimal("32000.00").compareTo(result.getAmount()));
        }

        @Test
        @DisplayName("更新不存在的记录 - 应抛出异常")
        void updateNonExistentRecord_shouldThrow() {
            when(tradeRecordRepository.findById(999L)).thenReturn(Optional.empty());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> tradeRecordService.update(999L, buildValidStockRecord()));

            assertTrue(ex.getMessage().contains("交易记录不存在"));
        }
    }
}
