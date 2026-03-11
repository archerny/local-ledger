package com.localledger.service;

import com.localledger.dto.TradeStatistics;
import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TradeTrigger;
import com.localledger.entity.enums.TriggerRefType;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.StrategyRepository;
import com.localledger.repository.TradeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 交易记录业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class TradeRecordService {

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private BrokerRepository brokerRepository;

    @Autowired
    private StrategyRepository strategyRepository;

    /**
     * 获取交易记录统计数据
     * 包括：总交易次数、各类型交易次数、各币种交易费用总和
     */
    public TradeStatistics getStatistics() {
        TradeStatistics stats = new TradeStatistics();
        stats.setTotalCount(tradeRecordRepository.countByIsDeletedFalse());
        stats.setStockCount(tradeRecordRepository.countByAssetTypeAndIsDeletedFalse(AssetType.STOCK));
        stats.setOptionCallCount(tradeRecordRepository.countByAssetTypeAndIsDeletedFalse(AssetType.OPTION_CALL));
        stats.setOptionPutCount(tradeRecordRepository.countByAssetTypeAndIsDeletedFalse(AssetType.OPTION_PUT));
        stats.setEtfCount(tradeRecordRepository.countByAssetTypeAndIsDeletedFalse(AssetType.ETF));
        stats.setTotalFeeUSD(tradeRecordRepository.sumFeeByIsDeletedFalseAndCurrency(Currency.USD));
        stats.setTotalFeeCNY(tradeRecordRepository.sumFeeByIsDeletedFalseAndCurrency(Currency.CNY));
        stats.setTotalFeeHKD(tradeRecordRepository.sumFeeByIsDeletedFalseAndCurrency(Currency.HKD));

        // 涉及证券数量（underlyingSymbol 去重计数）
        stats.setDistinctSymbolCount(tradeRecordRepository.countDistinctUnderlyingSymbol());

        // Top 10 最常交易的证券
        List<Object[]> topList = tradeRecordRepository.findTopTradedSymbols();
        List<Map<String, Object>> topSymbols = topList.stream()
                .limit(10)
                .map(row -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("symbol", row[0]);
                    item.put("count", row[1]);
                    return item;
                })
                .collect(Collectors.toList());
        stats.setTopSymbols(topSymbols);
        return stats;
    }

    /**
     * 查询所有未删除的交易记录（按ID倒序）
     */
    public List<TradeRecord> findAll() {
        return tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc();
    }

    /**
     * 根据ID查询交易记录
     */
    public Optional<TradeRecord> findById(Long id) {
        return tradeRecordRepository.findById(id)
                .filter(record -> !record.getIsDeleted());
    }

    /**
     * 根据券商ID查询交易记录
     */
    public List<TradeRecord> findByBrokerId(Long brokerId) {
        return tradeRecordRepository.findByBrokerIdAndIsDeletedFalseOrderByTradeDateDesc(brokerId);
    }

    /**
     * 根据证券类型查询交易记录
     */
    public List<TradeRecord> findByAssetType(AssetType assetType) {
        return tradeRecordRepository.findByAssetTypeAndIsDeletedFalseOrderByTradeDateDesc(assetType);
    }

    /**
     * 根据策略ID查询交易记录
     */
    public List<TradeRecord> findByStrategyId(Long strategyId) {
        return tradeRecordRepository.findByStrategyIdAndIsDeletedFalseOrderByTradeDateDesc(strategyId);
    }

    /**
     * 根据底层证券代码查询交易记录
     */
    public List<TradeRecord> findByUnderlyingSymbol(String underlyingSymbol) {
        return tradeRecordRepository.findByUnderlyingSymbolAndIsDeletedFalseOrderByTradeDateDesc(underlyingSymbol);
    }

    /**
     * 根据证券代码模糊查询交易记录
     */
    public List<TradeRecord> searchBySymbol(String symbol) {
        return tradeRecordRepository.findBySymbolContainingIgnoreCaseAndIsDeletedFalseOrderByTradeDateDesc(symbol);
    }

    /**
     * 根据日期范围查询交易记录
     */
    public List<TradeRecord> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return tradeRecordRepository.findByTradeDateBetweenAndIsDeletedFalseOrderByTradeDateDesc(startDate, endDate);
    }

    /**
     * 新增交易记录
     */
    @Transactional
    public TradeRecord create(TradeRecord record) {
        // 校验券商是否存在
        if (!brokerRepository.existsById(record.getBrokerId())) {
            throw new IllegalArgumentException("券商不存在, ID: " + record.getBrokerId());
        }
        // 校验底层证券代码不能为空
        if (record.getUnderlyingSymbol() == null || record.getUnderlyingSymbol().trim().isEmpty()) {
            throw new IllegalArgumentException("底层证券代码不能为空，用于关联分析期权与正股收益");
        }
        // 校验策略是否存在（如果指定了策略）
        if (record.getStrategyId() != null) {
            if (!strategyRepository.existsById(record.getStrategyId())) {
                throw new IllegalArgumentException("策略不存在, ID: " + record.getStrategyId());
            }
        }
        // 校验数量必须大于0
        if (record.getQuantity() == null || record.getQuantity() <= 0) {
            throw new IllegalArgumentException("交易数量必须大于0");
        }
        // 校验价格不能为负
        if (record.getPrice() == null || record.getPrice().signum() < 0) {
            throw new IllegalArgumentException("成交价格不能为负数");
        }
        // 如果未指定交易触发来源，默认为手动交易
        if (record.getTradeTrigger() == null) {
            record.setTradeTrigger(TradeTrigger.MANUAL);
        }
        // 如果未指定触发关联类型，默认为无关联
        if (record.getTriggerRefType() == null) {
            record.setTriggerRefType(TriggerRefType.NONE);
        }
        // 如果未指定触发关联ID，默认为0
        if (record.getTriggerRefId() == null) {
            record.setTriggerRefId(0L);
        }
        // 校验触发来源与关联字段的一致性
        validateTriggerConsistency(record);
        // 自动计算金额：期权（OPTION_CALL / OPTION_PUT）一个合约对应100股正股，金额需要乘以100
        recalculateAmount(record);
        return tradeRecordRepository.save(record);
    }

    /**
     * 更新交易记录
     */
    @Transactional
    public TradeRecord update(Long id, TradeRecord recordData) {
        TradeRecord existing = tradeRecordRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("交易记录不存在, ID: " + id));

        // 校验券商是否存在
        if (!brokerRepository.existsById(recordData.getBrokerId())) {
            throw new IllegalArgumentException("券商不存在, ID: " + recordData.getBrokerId());
        }
        // 校验策略是否存在（如果指定了策略）
        if (recordData.getStrategyId() != null) {
            if (!strategyRepository.existsById(recordData.getStrategyId())) {
                throw new IllegalArgumentException("策略不存在, ID: " + recordData.getStrategyId());
            }
        }

        existing.setTradeDate(recordData.getTradeDate());
        existing.setBrokerId(recordData.getBrokerId());
        existing.setAssetType(recordData.getAssetType());
        existing.setSymbol(recordData.getSymbol());
        existing.setName(recordData.getName());
        existing.setUnderlyingSymbol(recordData.getUnderlyingSymbol());
        existing.setTradeType(recordData.getTradeType());
        existing.setQuantity(recordData.getQuantity());
        existing.setPrice(recordData.getPrice());
        existing.setAmount(recordData.getAmount());
        existing.setFee(recordData.getFee());
        existing.setCurrency(recordData.getCurrency());
        existing.setStrategyId(recordData.getStrategyId());
        // 更新触发来源字段（如果传入了则使用传入值，否则保持原值）
        if (recordData.getTradeTrigger() != null) {
            existing.setTradeTrigger(recordData.getTradeTrigger());
        }
        if (recordData.getTriggerRefId() != null) {
            existing.setTriggerRefId(recordData.getTriggerRefId());
        }
        if (recordData.getTriggerRefType() != null) {
            existing.setTriggerRefType(recordData.getTriggerRefType());
        }
        // 校验触发来源与关联字段的一致性
        validateTriggerConsistency(existing);
        // 自动计算金额：期权（OPTION_CALL / OPTION_PUT）一个合约对应100股正股，金额需要乘以100
        recalculateAmount(existing);
        return tradeRecordRepository.save(existing);
    }

    /**
     * 校验触发来源与关联字段的一致性
     * - MANUAL: trigger_ref_id 应为 0，trigger_ref_type 应为 NONE
     * - MARKET_EVENT: trigger_ref_id 不应为 0，trigger_ref_type 不应为 NONE，且 trigger_ref_type 应为市场事件子类型
     * - OPTION: trigger_ref_type 应为 OPTION_EXPIRE / OPTION_EXERCISE / OPTION_ASSIGNED 三者之一
     */
    private void validateTriggerConsistency(TradeRecord record) {
        TradeTrigger trigger = record.getTradeTrigger();
        Long refId = record.getTriggerRefId();
        TriggerRefType refType = record.getTriggerRefType();

        if (trigger == TradeTrigger.MANUAL) {
            if (refId != null && refId != 0L) {
                throw new IllegalArgumentException("手动交易的 trigger_ref_id 应为 0");
            }
            if (refType != null && refType != TriggerRefType.NONE) {
                throw new IllegalArgumentException("手动交易的 trigger_ref_type 应为 NONE");
            }
        } else if (trigger == TradeTrigger.MARKET_EVENT) {
            if (refId == null || refId == 0L) {
                throw new IllegalArgumentException("市场事件触发的交易必须关联到具体的事件记录（trigger_ref_id 不能为 0）");
            }
            if (refType == null || refType == TriggerRefType.NONE) {
                throw new IllegalArgumentException("市场事件触发的交易必须指明关联的事件类型（trigger_ref_type 不能为 NONE）");
            }
            // 市场事件的 trigger_ref_type 应为三种市场事件子类型之一
            if (refType != TriggerRefType.STOCK_SPLIT
                    && refType != TriggerRefType.SYMBOL_CHANGE
                    && refType != TriggerRefType.DIVIDEND_IN_KIND) {
                throw new IllegalArgumentException("市场事件的 trigger_ref_type 应为 STOCK_SPLIT / SYMBOL_CHANGE / DIVIDEND_IN_KIND 之一");
            }
        } else if (trigger == TradeTrigger.OPTION) {
            // OPTION 场景：trigger_ref_type 必须为三种期权子类型之一
            if (refType != TriggerRefType.OPTION_EXPIRE
                    && refType != TriggerRefType.OPTION_EXERCISE
                    && refType != TriggerRefType.OPTION_ASSIGNED) {
                throw new IllegalArgumentException("期权触发的交易 trigger_ref_type 应为 OPTION_EXPIRE / OPTION_EXERCISE / OPTION_ASSIGNED 之一");
            }
            // 期权到期时，price 和 amount 应为 0
            if (refType == TriggerRefType.OPTION_EXPIRE) {
                if (record.getPrice() != null && record.getPrice().signum() != 0) {
                    throw new IllegalArgumentException("期权到期的成交价格应为 0");
                }
            }
        }
    }

    /**
     * 根据证券类型自动计算成交金额
     * 期权（OPTION_CALL / OPTION_PUT）一个合约对应100股正股，金额 = 数量 × 价格 × 100
     * 其他类型（股票、ETF等），金额 = 数量 × 价格
     */
    private void recalculateAmount(TradeRecord record) {
        if (record.getQuantity() != null && record.getPrice() != null) {
            BigDecimal qty = BigDecimal.valueOf(record.getQuantity());
            BigDecimal amount = qty.multiply(record.getPrice());
            if (record.getAssetType() == AssetType.OPTION_CALL || record.getAssetType() == AssetType.OPTION_PUT) {
                amount = amount.multiply(BigDecimal.valueOf(100));
            }
            record.setAmount(amount);
        }
    }

    /**
     * 软删除交易记录
     */
    @Transactional
    public void softDelete(Long id) {
        TradeRecord record = tradeRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("交易记录不存在, ID: " + id));
        record.setIsDeleted(true);
        tradeRecordRepository.save(record);
    }
}
