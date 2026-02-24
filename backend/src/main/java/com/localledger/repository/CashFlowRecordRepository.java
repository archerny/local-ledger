package com.localledger.repository;

import com.localledger.entity.CashFlowRecord;
import com.localledger.entity.enums.RecordType;

import java.time.LocalDate;
import java.util.List;

/**
 * 出入金记录 Repository 接口
 * 提供出入金记录表的数据访问方法
 */
public interface CashFlowRecordRepository extends BaseRepository<CashFlowRecord, Long> {

    /**
     * 查询所有未删除的记录（按日期倒序）
     */
    List<CashFlowRecord> findByIsDeletedFalseOrderByRecordDateDesc();

    /**
     * 根据券商ID查询未删除的记录
     */
    List<CashFlowRecord> findByBrokerIdAndIsDeletedFalseOrderByRecordDateDesc(Long brokerId);

    /**
     * 根据记录类型查询未删除的记录
     */
    List<CashFlowRecord> findByRecordTypeAndIsDeletedFalseOrderByRecordDateDesc(RecordType recordType);

    /**
     * 根据日期范围查询未删除的记录
     */
    List<CashFlowRecord> findByRecordDateBetweenAndIsDeletedFalseOrderByRecordDateDesc(LocalDate startDate, LocalDate endDate);

    /**
     * 根据券商ID和日期范围查询未删除的记录
     */
    List<CashFlowRecord> findByBrokerIdAndRecordDateBetweenAndIsDeletedFalseOrderByRecordDateDesc(Long brokerId, LocalDate startDate, LocalDate endDate);
}
