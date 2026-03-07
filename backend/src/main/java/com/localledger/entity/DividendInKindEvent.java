package com.localledger.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * 实物分红事件实体类
 * 对应数据库 events_dividend_in_kind 表
 * 记录以股代息等实物分红，如每持有1股A获得0.5股B
 */
@Entity
@Table(name = "events_dividend_in_kind")
public class DividendInKindEvent extends BaseMarketEvent {

    /**
     * 分红获得的证券代码
     */
    @Column(name = "dividend_symbol", nullable = false, length = 50)
    private String dividendSymbol;

    /**
     * 分红证券名称
     */
    @Column(name = "dividend_symbol_name", length = 200)
    private String dividendSymbolName;

    /**
     * 每股获得的分红数量
     */
    @Column(name = "dividend_qty_per_share", nullable = false, precision = 15, scale = 6)
    private BigDecimal dividendQtyPerShare;

    // ============ Constructors ============

    public DividendInKindEvent() {
    }

    // ============ Getters and Setters ============

    public String getDividendSymbol() {
        return dividendSymbol;
    }

    public void setDividendSymbol(String dividendSymbol) {
        this.dividendSymbol = dividendSymbol;
    }

    public String getDividendSymbolName() {
        return dividendSymbolName;
    }

    public void setDividendSymbolName(String dividendSymbolName) {
        this.dividendSymbolName = dividendSymbolName;
    }

    public BigDecimal getDividendQtyPerShare() {
        return dividendQtyPerShare;
    }

    public void setDividendQtyPerShare(BigDecimal dividendQtyPerShare) {
        this.dividendQtyPerShare = dividendQtyPerShare;
    }

    @Override
    public String toString() {
        return "DividendInKindEvent{" +
                "id=" + getId() +
                ", symbol='" + getSymbol() + '\'' +
                ", symbolName='" + getSymbolName() + '\'' +
                ", currency=" + getCurrency() +
                ", eventDate=" + getEventDate() +
                ", dividendSymbol='" + dividendSymbol + '\'' +
                ", dividendSymbolName='" + dividendSymbolName + '\'' +
                ", dividendQtyPerShare=" + dividendQtyPerShare +
                ", description='" + getDescription() + '\'' +
                ", isDeleted=" + getIsDeleted() +
                '}';
    }
}
