package com.localledger.entity;

import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.RecordType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 出入金记录实体类
 * 对应数据库 cash_flow_records 表
 */
@Entity
@Table(name = "cash_flow_records")
public class CashFlowRecord extends BaseEntity {

    /**
     * 出入金日期
     */
    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    /**
     * 券商ID（外键关联 brokers 表）
     */
    @Column(name = "broker_id", nullable = false)
    private Long brokerId;

    /**
     * 关联的券商实体（只读，用于查询时自动关联券商信息）
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "broker_id", insertable = false, updatable = false)
    private Broker broker;

    /**
     * 记录类型：DEPOSIT-入金，WITHDRAWAL-出金
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "record_type", nullable = false, columnDefinition = "record_type_enum")
    private RecordType recordType;

    /**
     * 金额（精度2位小数）
     */
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    /**
     * 币种：CNY-人民币，HKD-港币，USD-美元
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "currency", nullable = false, columnDefinition = "currency_enum")
    private Currency currency = Currency.CNY;

    /**
     * 出入金关联的银行
     */
    @Column(name = "bank", length = 100)
    private String bank;

    /**
     * 备注说明
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 创建人
     */
    @Column(name = "created_by", length = 50)
    private String createdBy;

    /**
     * 软删除标记
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    // ============ Constructors ============

    public CashFlowRecord() {
    }

    // ============ Getters and Setters ============

    public LocalDate getRecordDate() {
        return recordDate;
    }

    public void setRecordDate(LocalDate recordDate) {
        this.recordDate = recordDate;
    }

    public Long getBrokerId() {
        return brokerId;
    }

    public void setBrokerId(Long brokerId) {
        this.brokerId = brokerId;
    }

    public Broker getBroker() {
        return broker;
    }

    public void setBroker(Broker broker) {
        this.broker = broker;
    }

    public RecordType getRecordType() {
        return recordType;
    }

    public void setRecordType(RecordType recordType) {
        this.recordType = recordType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public String getBank() {
        return bank;
    }

    public void setBank(String bank) {
        this.bank = bank;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    @Override
    public String toString() {
        return "CashFlowRecord{" +
                "id=" + getId() +
                ", recordDate=" + recordDate +
                ", brokerId=" + brokerId +
                ", recordType=" + recordType +
                ", amount=" + amount +
                ", currency=" + currency +
                ", bank='" + bank + '\'' +
                ", description='" + description + '\'' +
                ", createdBy='" + createdBy + '\'' +
                ", isDeleted=" + isDeleted +
                '}';
    }
}
