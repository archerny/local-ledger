package com.localledger.service;

import com.localledger.dto.PositionSnapshot;
import com.localledger.entity.Broker;
import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.TradeType;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.TradeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 持仓计算服务
 * 根据交易记录计算截止某一时刻的持仓快照
 *
 * 简化版：暂不考虑市场事件（拆股/代码变更/实物分红）的影响，暂不计算平均成本价
 */
@Service
@Transactional(readOnly = true)
public class PositionService {

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    @Autowired
    private BrokerRepository brokerRepository;

    /**
     * 计算截止到指定日期的持仓快照
     *
     * @param targetDate 截止日期（含当天）
     * @param brokerId   可选，按券商筛选；为 null 则查询所有券商
     * @return 持仓快照列表（按券商分组，每个 symbol+brokerId 独立一条记录）
     */
    public List<PositionSnapshot> calculatePositions(LocalDate targetDate, Long brokerId) {
        // 1. 查询截止日期内的所有交易记录
        List<TradeRecord> records;
        if (brokerId != null) {
            records = tradeRecordRepository.findByTradeDateLessThanEqualAndBrokerIdAndIsDeletedFalseOrderByTradeDateAsc(targetDate, brokerId);
        } else {
            records = tradeRecordRepository.findByTradeDateLessThanEqualAndIsDeletedFalseOrderByTradeDateAsc(targetDate);
        }

        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. 构建券商名称映射
        Map<Long, String> brokerNameMap = buildBrokerNameMap(records);

        // 3. 按 (symbol, brokerId) 维度聚合计算持仓
        Map<String, PositionSnapshot> positionMap = new LinkedHashMap<>();

        for (TradeRecord record : records) {
            String key = record.getSymbol() + "|" + record.getBrokerId();
            PositionSnapshot position = positionMap.computeIfAbsent(key, k -> {
                PositionSnapshot snapshot = new PositionSnapshot();
                snapshot.setSymbol(record.getSymbol());
                snapshot.setName(record.getName());
                snapshot.setUnderlyingSymbol(record.getUnderlyingSymbol());
                snapshot.setAssetType(record.getAssetType());
                snapshot.setCurrency(record.getCurrency());
                snapshot.setBrokerId(record.getBrokerId());
                snapshot.setBrokerName(brokerNameMap.getOrDefault(record.getBrokerId(), "未知券商"));
                snapshot.setQuantity(0);
                return snapshot;
            });

            // 根据交易类型计算持仓数量变动
            int delta = calculateQuantityDelta(record);
            position.setQuantity(position.getQuantity() + delta);

            // 更新名称（取最新的名称）
            if (record.getName() != null && !record.getName().isEmpty()) {
                position.setName(record.getName());
            }

            // 处理行权交易对正股的影响
            handleExerciseImpactOnStock(record, positionMap, brokerNameMap);
        }

        // 4. 过滤掉持仓为0的记录，返回结果
        return positionMap.values().stream()
                .filter(p -> p.getQuantity() != 0)
                .collect(Collectors.toList());
    }

    /**
     * 根据交易类型计算当前 symbol 的数量变动
     */
    private int calculateQuantityDelta(TradeRecord record) {
        TradeType tradeType = record.getTradeType();
        int quantity = record.getQuantity();

        switch (tradeType) {
            case BUY:
                return quantity;
            case SELL:
                return -quantity;
            case OPTION_EXPIRE:
                // 期权到期作废，持仓归零（减去持有数量）
                return -quantity;
            case EXERCISE_BUY:
            case EXERCISE_SELL:
                // 行权：期权合约被消耗（减去期权持仓）
                return -quantity;
            default:
                return 0;
        }
    }

    /**
     * 处理行权交易对正股持仓的影响
     * EXERCISE_BUY: 行权买股 → 正股持仓 + quantity × 100
     * EXERCISE_SELL: 行权卖股 → 正股持仓 - quantity × 100
     */
    private void handleExerciseImpactOnStock(TradeRecord record, Map<String, PositionSnapshot> positionMap, Map<Long, String> brokerNameMap) {
        TradeType tradeType = record.getTradeType();
        if (tradeType != TradeType.EXERCISE_BUY && tradeType != TradeType.EXERCISE_SELL) {
            return;
        }

        String underlyingSymbol = record.getUnderlyingSymbol();
        if (underlyingSymbol == null || underlyingSymbol.trim().isEmpty()) {
            return;
        }

        // 正股的 key
        String stockKey = underlyingSymbol + "|" + record.getBrokerId();
        PositionSnapshot stockPosition = positionMap.computeIfAbsent(stockKey, k -> {
            PositionSnapshot snapshot = new PositionSnapshot();
            snapshot.setSymbol(underlyingSymbol);
            snapshot.setName(null); // 正股名称暂时为空，后续可能被其他交易记录填充
            snapshot.setUnderlyingSymbol(underlyingSymbol);
            snapshot.setAssetType(AssetType.STOCK);
            snapshot.setCurrency(record.getCurrency());
            snapshot.setBrokerId(record.getBrokerId());
            snapshot.setBrokerName(brokerNameMap.getOrDefault(record.getBrokerId(), "未知券商"));
            snapshot.setQuantity(0);
            return snapshot;
        });

        // 每个期权合约对应100股正股
        int stockDelta = record.getQuantity() * 100;
        if (tradeType == TradeType.EXERCISE_BUY) {
            stockPosition.setQuantity(stockPosition.getQuantity() + stockDelta);
        } else {
            // EXERCISE_SELL
            stockPosition.setQuantity(stockPosition.getQuantity() - stockDelta);
        }
    }

    /**
     * 构建券商ID→名称的映射
     */
    private Map<Long, String> buildBrokerNameMap(List<TradeRecord> records) {
        Set<Long> brokerIds = records.stream()
                .map(TradeRecord::getBrokerId)
                .collect(Collectors.toSet());

        Map<Long, String> map = new HashMap<>();
        for (Long id : brokerIds) {
            brokerRepository.findById(id).ifPresent(broker -> map.put(id, broker.getBrokerName()));
        }
        return map;
    }
}
