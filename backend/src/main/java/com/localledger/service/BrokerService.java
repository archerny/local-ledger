package com.localledger.service;

import com.localledger.entity.Broker;
import com.localledger.repository.BrokerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 券商业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class BrokerService {

    @Autowired
    private BrokerRepository brokerRepository;

    /**
     * 查询所有券商
     */
    public List<Broker> findAll() {
        return brokerRepository.findAll();
    }

    /**
     * 根据ID查询券商
     */
    public Optional<Broker> findById(Long id) {
        return brokerRepository.findById(id);
    }

    /**
     * 根据券商名称查询
     */
    public Optional<Broker> findByBrokerName(String brokerName) {
        return brokerRepository.findByBrokerName(brokerName);
    }

    /**
     * 查询所有启用的券商
     */
    public List<Broker> findActiveBrokers() {
        return brokerRepository.findByIsActive(true);
    }

    /**
     * 查询所有未启用的券商
     */
    public List<Broker> findInactiveBrokers() {
        return brokerRepository.findByIsActive(false);
    }

    /**
     * 根据国家/地区查询券商
     */
    public List<Broker> findByCountry(String country) {
        return brokerRepository.findByCountry(country);
    }

    /**
     * 根据关键词模糊搜索券商
     */
    public List<Broker> searchByName(String keyword) {
        return brokerRepository.findByBrokerNameContainingIgnoreCase(keyword);
    }

    /**
     * 新增券商
     */
    @Transactional
    public Broker create(Broker broker) {
        if (brokerRepository.existsByBrokerName(broker.getBrokerName())) {
            throw new IllegalArgumentException("券商名称已存在: " + broker.getBrokerName());
        }
        return brokerRepository.save(broker);
    }

    /**
     * 更新券商信息
     */
    @Transactional
    public Broker update(Long id, Broker brokerData) {
        Broker existing = brokerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("券商不存在, ID: " + id));

        // 如果修改了名称，需要检查新名称是否已存在
        if (!existing.getBrokerName().equals(brokerData.getBrokerName())
                && brokerRepository.existsByBrokerName(brokerData.getBrokerName())) {
            throw new IllegalArgumentException("券商名称已存在: " + brokerData.getBrokerName());
        }

        existing.setBrokerName(brokerData.getBrokerName());
        existing.setCountry(brokerData.getCountry());
        existing.setDescription(brokerData.getDescription());
        existing.setEmail(brokerData.getEmail());
        existing.setPhone(brokerData.getPhone());
        existing.setIsActive(brokerData.getIsActive());

        return brokerRepository.save(existing);
    }

    /**
     * 删除券商
     */
    @Transactional
    public void delete(Long id) {
        if (!brokerRepository.existsById(id)) {
            throw new IllegalArgumentException("券商不存在, ID: " + id);
        }
        brokerRepository.deleteById(id);
    }
}
