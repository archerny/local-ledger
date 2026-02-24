package com.localledger.service;

import com.localledger.entity.CashFlowRecord;
import com.localledger.entity.enums.RecordType;
import com.localledger.repository.BrokerRepository;
import com.localledger.repository.CashFlowRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 出入金记录业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class CashFlowRecordService {

    @Autowired
    private CashFlowRecordRepository cashFlowRecordRepository;

    @Autowired
    private BrokerRepository brokerRepository;

    /**
     * 查询所有未删除的出入金记录（按日期倒序）
     */
    public List<CashFlowRecord> findAll() {
        return cashFlowRecordRepository.findByIsDeletedFalseOrderByRecordDateDesc();
    }

    /**
     * 根据ID查询出入金记录
     */
    public Optional<CashFlowRecord> findById(Long id) {
        return cashFlowRecordRepository.findById(id)
                .filter(record -> !record.getIsDeleted());
    }

    /**
     * 根据券商ID查询出入金记录
     */
    public List<CashFlowRecord> findByBrokerId(Long brokerId) {
        return cashFlowRecordRepository.findByBrokerIdAndIsDeletedFalseOrderByRecordDateDesc(brokerId);
    }

    /**
     * 根据记录类型查询
     */
    public List<CashFlowRecord> findByRecordType(RecordType recordType) {
        return cashFlowRecordRepository.findByRecordTypeAndIsDeletedFalseOrderByRecordDateDesc(recordType);
    }

    /**
     * 根据日期范围查询
     */
    public List<CashFlowRecord> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return cashFlowRecordRepository.findByRecordDateBetweenAndIsDeletedFalseOrderByRecordDateDesc(startDate, endDate);
    }

    /**
     * 根据券商ID和日期范围查询
     */
    public List<CashFlowRecord> findByBrokerIdAndDateRange(Long brokerId, LocalDate startDate, LocalDate endDate) {
        return cashFlowRecordRepository.findByBrokerIdAndRecordDateBetweenAndIsDeletedFalseOrderByRecordDateDesc(brokerId, startDate, endDate);
    }

    /**
     * 新增出入金记录
     */
    @Transactional
    public CashFlowRecord create(CashFlowRecord record) {
        // 校验券商是否存在
        if (!brokerRepository.existsById(record.getBrokerId())) {
            throw new IllegalArgumentException("券商不存在, ID: " + record.getBrokerId());
        }
        // 校验金额必须大于0
        if (record.getAmount() == null || record.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("金额必须大于0");
        }
        return cashFlowRecordRepository.save(record);
    }

    /**
     * 软删除出入金记录
     */
    @Transactional
    public void softDelete(Long id) {
        CashFlowRecord record = cashFlowRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("出入金记录不存在, ID: " + id));
        record.setIsDeleted(true);
        cashFlowRecordRepository.save(record);
    }
}
