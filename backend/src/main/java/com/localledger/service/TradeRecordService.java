package com.localledger.service;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.StrategyRepository;
import com.localledger.repository.TradeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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
     * 查询所有未删除的交易记录（按交易日期倒序）
     */
    public List<TradeRecord> findAll() {
        return tradeRecordRepository.findByIsDeletedFalseOrderByTradeDateDesc();
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

        return tradeRecordRepository.save(existing);
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
