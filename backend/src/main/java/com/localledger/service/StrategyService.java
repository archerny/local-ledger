package com.localledger.service;

import com.localledger.entity.Strategy;
import com.localledger.repository.StrategyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 策略业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class StrategyService {

    @Autowired
    private StrategyRepository strategyRepository;

    /**
     * 查询所有未删除的策略
     */
    public List<Strategy> findAll() {
        return strategyRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
    }

    /**
     * 根据ID查询策略
     */
    public Optional<Strategy> findById(Long id) {
        return strategyRepository.findById(id)
                .filter(strategy -> !strategy.getIsDeleted());
    }

    /**
     * 新增策略
     */
    @Transactional
    public Strategy create(Strategy strategy) {
        if (strategyRepository.existsByStrategyNameAndIsDeletedFalse(strategy.getStrategyName())) {
            throw new IllegalArgumentException("策略名称已存在: " + strategy.getStrategyName());
        }
        return strategyRepository.save(strategy);
    }

    /**
     * 更新策略
     */
    @Transactional
    public Strategy update(Long id, Strategy strategyData) {
        Strategy existing = strategyRepository.findById(id)
                .filter(s -> !s.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("策略不存在, ID: " + id));

        // 如果修改了名称，检查新名称是否已存在
        if (!existing.getStrategyName().equals(strategyData.getStrategyName())
                && strategyRepository.existsByStrategyNameAndIsDeletedFalse(strategyData.getStrategyName())) {
            throw new IllegalArgumentException("策略名称已存在: " + strategyData.getStrategyName());
        }

        existing.setStrategyName(strategyData.getStrategyName());
        existing.setDescription(strategyData.getDescription());
        return strategyRepository.save(existing);
    }

    /**
     * 软删除策略
     */
    @Transactional
    public void softDelete(Long id) {
        Strategy strategy = strategyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("策略不存在, ID: " + id));
        strategy.setIsDeleted(true);
        strategyRepository.save(strategy);
    }
}
