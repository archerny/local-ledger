package com.localledger.entity;

import jakarta.persistence.*;

/**
 * 拆股事件实体类
 * 对应数据库 events_stock_split 表
 * 记录股票拆分，如 TSLA 1拆3
 */
@Entity
@Table(name = "events_stock_split")
public class StockSplitEvent extends BaseMarketEvent {

    /**
     * 拆分前股数（如 1拆3，此处为 1）
     */
    @Column(name = "ratio_from", nullable = false)
    private Integer ratioFrom;

    /**
     * 拆分后股数（如 1拆3，此处为 3）
     */
    @Column(name = "ratio_to", nullable = false)
    private Integer ratioTo;

    // ============ Constructors ============

    public StockSplitEvent() {
    }

    // ============ Getters and Setters ============

    public Integer getRatioFrom() {
        return ratioFrom;
    }

    public void setRatioFrom(Integer ratioFrom) {
        this.ratioFrom = ratioFrom;
    }

    public Integer getRatioTo() {
        return ratioTo;
    }

    public void setRatioTo(Integer ratioTo) {
        this.ratioTo = ratioTo;
    }

    @Override
    public String toString() {
        return "StockSplitEvent{" +
                "id=" + getId() +
                ", symbol='" + getSymbol() + '\'' +
                ", underlyingSymbolName='" + getUnderlyingSymbolName() + '\'' +
                ", currency=" + getCurrency() +
                ", eventDate=" + getEventDate() +
                ", ratioFrom=" + ratioFrom +
                ", ratioTo=" + ratioTo +
                ", description='" + getDescription() + '\'' +
                ", isDeleted=" + getIsDeleted() +
                '}';
    }
}
