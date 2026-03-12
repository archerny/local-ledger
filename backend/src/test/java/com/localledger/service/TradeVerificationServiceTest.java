package com.localledger.service;

import com.localledger.dto.TradeVerificationResult;
import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.*;
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
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * TradeVerificationService 单元测试
 * 覆盖所有6条核对规则的正常与异常场景
 */
@ExtendWith(MockitoExtension.class)
class TradeVerificationServiceTest {

    @Mock
    private TradeRecordRepository tradeRecordRepository;

    @InjectMocks
    private TradeVerificationService tradeVerificationService;

    // ============ 辅助方法：构建测试数据 ============

    /**
     * 构建一条基础交易记录
     */
    private TradeRecord buildBaseRecord(Long id, String symbol, String underlyingSymbol,
                                         AssetType assetType, Currency currency) {
        TradeRecord record = new TradeRecord();
        record.setId(id);
        record.setSymbol(symbol);
        record.setUnderlyingSymbol(underlyingSymbol);
        record.setAssetType(assetType);
        record.setCurrency(currency);
        record.setTradeDate(LocalDate.of(2025, 1, 15));
        record.setTradeType(TradeType.BUY);
        record.setQuantity(100);
        record.setPrice(new BigDecimal("10.00"));
        record.setAmount(new BigDecimal("1000.00"));
        record.setFee(new BigDecimal("5.00"));
        record.setBrokerId(1L);
        record.setTradeTrigger(TradeTrigger.MANUAL);
        record.setTriggerRefType(TriggerRefType.NONE);
        record.setTriggerRefId(0L);
        record.setIsDeleted(false);
        return record;
    }

    // ========================================================
    // 规则1：期权证券代码格式核对
    // ========================================================
    @Nested
    @DisplayName("规则1：期权证券代码格式核对")
    class OptionSymbolFormatTest {

        @Test
        @DisplayName("合法的CALL期权代码 - 应通过")
        void validCallOptionSymbol_shouldPass() {
            TradeRecord record = buildBaseRecord(1L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
            assertEquals(0, result.getErrorCount());
        }

        @Test
        @DisplayName("合法的PUT期权代码（含小数价格）- 应通过")
        void validPutOptionSymbolWithDecimalPrice_shouldPass() {
            TradeRecord record = buildBaseRecord(2L, "AAPL-20250321-P17.5", "AAPL",
                    AssetType.OPTION_PUT, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
            assertEquals(0, result.getErrorCount());
        }

        @Test
        @DisplayName("期权代码格式不匹配正则 - 应报错")
        void invalidOptionSymbolFormat_shouldFail() {
            TradeRecord record = buildBaseRecord(3L, "TSLA_CALL_210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertEquals(1, result.getErrorCount());
            assertEquals("期权证券代码格式", result.getErrors().get(0).getRuleName());
        }

        @Test
        @DisplayName("底层证券代码不匹配 - 应报错")
        void mismatchedUnderlyingSymbol_shouldFail() {
            TradeRecord record = buildBaseRecord(4L, "AAPL-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertTrue(result.getErrors().get(0).getMessage().contains("底层证券代码不匹配"));
        }

        @Test
        @DisplayName("期权类型标识与assetType不匹配（CALL代码配PUT类型）- 应报错")
        void mismatchedOptionType_shouldFail() {
            TradeRecord record = buildBaseRecord(5L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_PUT, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertTrue(result.getErrors().get(0).getMessage().contains("期权类型标识不匹配"));
        }

        @Test
        @DisplayName("日期部分不合法 - 应报错")
        void invalidDateInOptionSymbol_shouldFail() {
            TradeRecord record = buildBaseRecord(6L, "TSLA-99991301-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertTrue(result.getErrors().get(0).getMessage().contains("日期"));
        }

        @Test
        @DisplayName("非期权类型记录 - 应跳过此规则")
        void nonOptionAssetType_shouldSkip() {
            TradeRecord record = buildBaseRecord(7L, "AAPL", "AAPL",
                    AssetType.STOCK, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
        }
    }

    // ========================================================
    // 规则2：港股证券代码格式核对
    // ========================================================
    @Nested
    @DisplayName("规则2：港股证券代码格式核对")
    class HkStockSymbolFormatTest {

        @Test
        @DisplayName("合法的港股代码（纯数字）- 应通过")
        void validHkStockSymbol_shouldPass() {
            TradeRecord record = buildBaseRecord(10L, "00700", "00700",
                    AssetType.STOCK, Currency.HKD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
        }

        @Test
        @DisplayName("港股代码含字母 - 应报错")
        void hkStockSymbolWithLetters_shouldFail() {
            TradeRecord record = buildBaseRecord(11L, "TENCENT", "TENCENT",
                    AssetType.STOCK, Currency.HKD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertEquals("港股证券代码格式", result.getErrors().get(0).getRuleName());
        }

        @Test
        @DisplayName("HKD期权记录 - 应跳过港股代码规则")
        void hkdOptionRecord_shouldSkip() {
            TradeRecord record = buildBaseRecord(12L, "00700-20250117-C350", "00700",
                    AssetType.OPTION_CALL, Currency.HKD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            // 只检查港股规则不会报错（期权规则可能会报错，但那是规则1的事）
            boolean hasHkError = result.getErrors().stream()
                    .anyMatch(e -> "港股证券代码格式".equals(e.getRuleName()));
            assertFalse(hasHkError);
        }

        @Test
        @DisplayName("非HKD币种记录 - 应跳过港股代码规则")
        void nonHkdCurrency_shouldSkip() {
            TradeRecord record = buildBaseRecord(13L, "AAPL", "AAPL",
                    AssetType.STOCK, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasHkError = result.getErrors().stream()
                    .anyMatch(e -> "港股证券代码格式".equals(e.getRuleName()));
            assertFalse(hasHkError);
        }
    }

    // ========================================================
    // 规则3：期权被动操作交易的费用和价格核对
    // ========================================================
    @Nested
    @DisplayName("规则3：期权被动操作费用价格核对")
    class OptionTriggerFeeAndPriceTest {

        @Test
        @DisplayName("期权到期且fee=0、price=0 - 应通过")
        void optionExpireWithZeroFeeAndPrice_shouldPass() {
            TradeRecord record = buildBaseRecord(20L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            record.setFee(BigDecimal.ZERO);
            record.setPrice(BigDecimal.ZERO);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertFalse(hasFeeError);
        }

        @Test
        @DisplayName("期权到期但fee不为0 - 应报错")
        void optionExpireWithNonZeroFee_shouldFail() {
            TradeRecord record = buildBaseRecord(21L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            record.setFee(new BigDecimal("5.00"));
            record.setPrice(BigDecimal.ZERO);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertTrue(hasFeeError);
        }

        @Test
        @DisplayName("期权到期但price不为0 - 应报错")
        void optionExpireWithNonZeroPrice_shouldFail() {
            TradeRecord record = buildBaseRecord(22L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            record.setFee(BigDecimal.ZERO);
            record.setPrice(new BigDecimal("1.50"));
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertTrue(hasFeeError);
        }

        @Test
        @DisplayName("行权期权侧（triggerRefId=0）fee=0 - 应通过")
        void optionExerciseOptionSideZeroFee_shouldPass() {
            TradeRecord record = buildBaseRecord(23L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXERCISE);
            record.setTriggerRefId(0L);
            record.setFee(BigDecimal.ZERO);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertFalse(hasFeeError);
        }

        @Test
        @DisplayName("行权期权侧（triggerRefId=0）fee不为0 - 应报错")
        void optionExerciseOptionSideNonZeroFee_shouldFail() {
            TradeRecord record = buildBaseRecord(24L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXERCISE);
            record.setTriggerRefId(0L);
            record.setFee(new BigDecimal("10.00"));
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertTrue(hasFeeError);
        }

        @Test
        @DisplayName("被指派股票侧（triggerRefId!=0）fee不为0 - 不应由此规则报错")
        void optionAssignedStockSideNonZeroFee_shouldNotTriggerThisRule() {
            TradeRecord record = buildBaseRecord(25L, "TSLA", "TSLA",
                    AssetType.STOCK, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_ASSIGNED);
            record.setTriggerRefId(100L); // 股票侧，关联到期权记录
            record.setFee(new BigDecimal("5.00"));
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasFeeError = result.getErrors().stream()
                    .anyMatch(e -> "期权被动操作费用价格".equals(e.getRuleName()));
            assertFalse(hasFeeError);
        }
    }

    // ========================================================
    // 规则4：美股证券代码格式核对
    // ========================================================
    @Nested
    @DisplayName("规则4：美股证券代码格式核对")
    class UsStockSymbolFormatTest {

        @Test
        @DisplayName("合法的美股代码（纯字母）- 应通过")
        void validUsStockSymbol_shouldPass() {
            TradeRecord record = buildBaseRecord(30L, "AAPL", "AAPL",
                    AssetType.STOCK, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
        }

        @Test
        @DisplayName("美股代码含数字 - 应报错")
        void usStockSymbolWithDigits_shouldFail() {
            TradeRecord record = buildBaseRecord(31L, "AAPL123", "AAPL123",
                    AssetType.STOCK, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertEquals("美股证券代码格式", result.getErrors().get(0).getRuleName());
        }

        @Test
        @DisplayName("USD期权记录 - 应跳过美股代码规则")
        void usdOptionRecord_shouldSkipUsStockRule() {
            TradeRecord record = buildBaseRecord(32L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasUsError = result.getErrors().stream()
                    .anyMatch(e -> "美股证券代码格式".equals(e.getRuleName()));
            assertFalse(hasUsError);
        }

        @Test
        @DisplayName("非USD币种股票 - 应跳过美股代码规则")
        void nonUsdStockRecord_shouldSkip() {
            TradeRecord record = buildBaseRecord(33L, "00700", "00700",
                    AssetType.STOCK, Currency.HKD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasUsError = result.getErrors().stream()
                    .anyMatch(e -> "美股证券代码格式".equals(e.getRuleName()));
            assertFalse(hasUsError);
        }
    }

    // ========================================================
    // 规则5：证券代码类别一致性核对
    // ========================================================
    @Nested
    @DisplayName("规则5：证券代码类别一致性核对")
    class SymbolAssetTypeConsistencyTest {

        @Test
        @DisplayName("同一symbol仅对应一种assetType - 应通过")
        void sameSymbolSameAssetType_shouldPass() {
            TradeRecord r1 = buildBaseRecord(40L, "AAPL", "AAPL", AssetType.STOCK, Currency.USD);
            TradeRecord r2 = buildBaseRecord(41L, "AAPL", "AAPL", AssetType.STOCK, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Arrays.asList(r1, r2));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasConsistencyError = result.getErrors().stream()
                    .anyMatch(e -> "证券代码类别一致性".equals(e.getRuleName()));
            assertFalse(hasConsistencyError);
        }

        @Test
        @DisplayName("同一symbol对应多种assetType - 应报错")
        void sameSymbolDifferentAssetType_shouldFail() {
            TradeRecord r1 = buildBaseRecord(42L, "QQQ", "QQQ", AssetType.STOCK, Currency.USD);
            TradeRecord r2 = buildBaseRecord(43L, "QQQ", "QQQ", AssetType.ETF, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Arrays.asList(r1, r2));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            boolean hasConsistencyError = result.getErrors().stream()
                    .anyMatch(e -> "证券代码类别一致性".equals(e.getRuleName()));
            assertTrue(hasConsistencyError);
        }

        @Test
        @DisplayName("不同symbol各自对应不同assetType - 应通过（不冲突）")
        void differentSymbolsDifferentAssetTypes_shouldPass() {
            TradeRecord r1 = buildBaseRecord(44L, "AAPL", "AAPL", AssetType.STOCK, Currency.USD);
            TradeRecord r2 = buildBaseRecord(45L, "QQQ", "QQQ", AssetType.ETF, Currency.USD);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Arrays.asList(r1, r2));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasConsistencyError = result.getErrors().stream()
                    .anyMatch(e -> "证券代码类别一致性".equals(e.getRuleName()));
            assertFalse(hasConsistencyError);
        }
    }

    // ========================================================
    // 规则6：触发类型与关联类型一致性核对
    // ========================================================
    @Nested
    @DisplayName("规则6：触发类型与关联类型一致性核对")
    class TriggerRefTypeConsistencyTest {

        @Test
        @DisplayName("OPTION触发 + OPTION_EXPIRE关联 - 应通过")
        void optionTriggerWithOptionExpire_shouldPass() {
            TradeRecord record = buildBaseRecord(50L, "TSLA-20250117-C210", "TSLA",
                    AssetType.OPTION_CALL, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.OPTION_EXPIRE);
            record.setFee(BigDecimal.ZERO);
            record.setPrice(BigDecimal.ZERO);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasTriggerError = result.getErrors().stream()
                    .anyMatch(e -> "触发类型关联类型一致性".equals(e.getRuleName()));
            assertFalse(hasTriggerError);
        }

        @Test
        @DisplayName("OPTION触发 + STOCK_SPLIT关联 - 应报错（交叉错配）")
        void optionTriggerWithStockSplitRef_shouldFail() {
            TradeRecord record = buildBaseRecord(51L, "TSLA", "TSLA",
                    AssetType.STOCK, Currency.USD);
            record.setTradeTrigger(TradeTrigger.OPTION);
            record.setTriggerRefType(TriggerRefType.STOCK_SPLIT);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasTriggerError = result.getErrors().stream()
                    .anyMatch(e -> "触发类型关联类型一致性".equals(e.getRuleName()));
            assertTrue(hasTriggerError);
        }

        @Test
        @DisplayName("MARKET_EVENT触发 + STOCK_SPLIT关联 - 应通过")
        void marketEventTriggerWithStockSplit_shouldPass() {
            TradeRecord record = buildBaseRecord(52L, "TSLA", "TSLA",
                    AssetType.STOCK, Currency.USD);
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefType(TriggerRefType.STOCK_SPLIT);
            record.setTriggerRefId(1L);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasTriggerError = result.getErrors().stream()
                    .anyMatch(e -> "触发类型关联类型一致性".equals(e.getRuleName()));
            assertFalse(hasTriggerError);
        }

        @Test
        @DisplayName("MARKET_EVENT触发 + OPTION_EXERCISE关联 - 应报错（交叉错配）")
        void marketEventTriggerWithOptionExercise_shouldFail() {
            TradeRecord record = buildBaseRecord(53L, "TSLA", "TSLA",
                    AssetType.STOCK, Currency.USD);
            record.setTradeTrigger(TradeTrigger.MARKET_EVENT);
            record.setTriggerRefType(TriggerRefType.OPTION_EXERCISE);
            record.setTriggerRefId(1L);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasTriggerError = result.getErrors().stream()
                    .anyMatch(e -> "触发类型关联类型一致性".equals(e.getRuleName()));
            assertTrue(hasTriggerError);
        }

        @Test
        @DisplayName("MANUAL触发 - 应跳过触发一致性规则")
        void manualTrigger_shouldSkip() {
            TradeRecord record = buildBaseRecord(54L, "AAPL", "AAPL",
                    AssetType.STOCK, Currency.USD);
            record.setTradeTrigger(TradeTrigger.MANUAL);
            record.setTriggerRefType(TriggerRefType.NONE);
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.singletonList(record));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            boolean hasTriggerError = result.getErrors().stream()
                    .anyMatch(e -> "触发类型关联类型一致性".equals(e.getRuleName()));
            assertFalse(hasTriggerError);
        }
    }

    // ========================================================
    // 综合场景
    // ========================================================
    @Nested
    @DisplayName("综合场景")
    class IntegrationTest {

        @Test
        @DisplayName("空记录列表 - 应通过且检查数量为0")
        void emptyRecordList_shouldPass() {
            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Collections.emptyList());

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertTrue(result.isPassed());
            assertEquals(0, result.getTotalChecked());
            assertEquals(0, result.getErrorCount());
        }

        @Test
        @DisplayName("多条记录中部分有异常 - 应正确统计错误数量")
        void mixedRecords_shouldReportCorrectErrorCount() {
            // 正常的美股记录
            TradeRecord r1 = buildBaseRecord(60L, "AAPL", "AAPL", AssetType.STOCK, Currency.USD);
            // 异常：美股代码含数字
            TradeRecord r2 = buildBaseRecord(61L, "AAPL123", "AAPL123", AssetType.STOCK, Currency.USD);
            // 异常：港股代码含字母
            TradeRecord r3 = buildBaseRecord(62L, "TENCENT", "TENCENT", AssetType.STOCK, Currency.HKD);

            when(tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc())
                    .thenReturn(Arrays.asList(r1, r2, r3));

            TradeVerificationResult result = tradeVerificationService.verifyAll();

            assertFalse(result.isPassed());
            assertEquals(3, result.getTotalChecked());
            assertTrue(result.getErrorCount() >= 2);
        }
    }
}
