package com.localledger.entity;

import com.localledger.entity.enums.Currency;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.LocalDate;

/**
 * 市场异动事件基础实体类
 * 包含所有事件表的公共字段
 */
@MappedSuperclass
public abstract class BaseMarketEvent extends BaseEntity {

    /**
     * 涉及的证券代码
     */
    @Column(name = "symbol", nullable = false, length = 50)
    private String symbol;

    /**
     * 证券名称
     */
    @Column(name = "symbol_name", length = 200)
    private String symbolName;

    /**
     * 所属市场币种
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "currency", columnDefinition = "currency_enum")
    private Currency currency;

    /**
     * 事件生效日期
     */
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    /**
     * 事件描述/备注
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 软删除标记
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    // ============ Getters and Setters ============

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getSymbolName() {
        return symbolName;
    }

    public void setSymbolName(String symbolName) {
        this.symbolName = symbolName;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }
}
