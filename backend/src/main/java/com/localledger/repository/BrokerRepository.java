package com.localledger.repository;

import com.localledger.entity.Broker;

import java.util.List;
import java.util.Optional;

/**
 * 券商 Repository 接口
 * 提供券商表的数据访问方法
 */
public interface BrokerRepository extends BaseRepository<Broker, Long> {

    /**
     * 根据券商名称查询
     */
    Optional<Broker> findByBrokerName(String brokerName);

    /**
     * 根据是否启用状态查询
     */
    List<Broker> findByIsActive(Boolean isActive);

    /**
     * 根据国家/地区查询
     */
    List<Broker> findByCountry(String country);

    /**
     * 根据券商名称模糊查询
     */
    List<Broker> findByBrokerNameContainingIgnoreCase(String keyword);

    /**
     * 检查券商名称是否已存在
     */
    boolean existsByBrokerName(String brokerName);
}
