package com.localledger.repository;

import com.localledger.entity.Strategy;

import java.util.List;

/**
 * 策略 Repository 接口
 * 提供策略表的数据访问方法
 */
public interface StrategyRepository extends BaseRepository<Strategy, Long> {

    /**
     * 查询所有未删除的策略
     */
    List<Strategy> findByIsDeletedFalseOrderByCreatedAtDesc();

    /**
     * 检查策略名称是否已存在（未删除的）
     */
    boolean existsByStrategyNameAndIsDeletedFalse(String strategyName);
}
