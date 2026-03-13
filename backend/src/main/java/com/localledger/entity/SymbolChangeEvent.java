package com.localledger.entity;

import jakarta.persistence.*;

/**
 * 代码变更事件实体类
 * 对应数据库 events_symbol_change 表
 * 记录股票代码变更，如 FB → META
 */
@Entity
@Table(name = "events_symbol_change")
public class SymbolChangeEvent extends BaseMarketEvent {

    /**
     * 变更前代码
     */
    @Column(name = "old_symbol", nullable = false, length = 50)
    private String oldSymbol;

    /**
     * 变更后代码
     */
    @Column(name = "new_symbol", nullable = false, length = 50)
    private String newSymbol;

    // ============ Constructors ============

    public SymbolChangeEvent() {
    }

    // ============ Getters and Setters ============

    public String getOldSymbol() {
        return oldSymbol;
    }

    public void setOldSymbol(String oldSymbol) {
        this.oldSymbol = oldSymbol;
    }

    public String getNewSymbol() {
        return newSymbol;
    }

    public void setNewSymbol(String newSymbol) {
        this.newSymbol = newSymbol;
    }

    @Override
    public String toString() {
        return "SymbolChangeEvent{" +
                "id=" + getId() +
                ", symbol='" + getSymbol() + '\'' +
                ", underlyingSymbolName='" + getUnderlyingSymbolName() + '\'' +
                ", currency=" + getCurrency() +
                ", eventDate=" + getEventDate() +
                ", oldSymbol='" + oldSymbol + '\'' +
                ", newSymbol='" + newSymbol + '\'' +
                ", description='" + getDescription() + '\'' +
                ", isDeleted=" + getIsDeleted() +
                '}';
    }
}
