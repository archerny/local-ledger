package com.localledger.dto;

import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;

/**
 * 持仓快照 DTO
 * 用于展示截止某一日期的持仓情况
 */
public class PositionSnapshot {

    /** 证券代码 */
    private String symbol;

    /** 证券名称 */
    private String name;

    /** 底层证券代码 */
    private String underlyingSymbol;

    /** 证券类型 */
    private AssetType assetType;

    /** 持仓数量（正数=多头，负数=异常） */
    private Integer quantity;

    /** 币种 */
    private Currency currency;

    /** 券商ID */
    private Long brokerId;

    /** 券商名称 */
    private String brokerName;

    public PositionSnapshot() {
    }

    // ============ Getters and Setters ============

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUnderlyingSymbol() {
        return underlyingSymbol;
    }

    public void setUnderlyingSymbol(String underlyingSymbol) {
        this.underlyingSymbol = underlyingSymbol;
    }

    public AssetType getAssetType() {
        return assetType;
    }

    public void setAssetType(AssetType assetType) {
        this.assetType = assetType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public Long getBrokerId() {
        return brokerId;
    }

    public void setBrokerId(Long brokerId) {
        this.brokerId = brokerId;
    }

    public String getBrokerName() {
        return brokerName;
    }

    public void setBrokerName(String brokerName) {
        this.brokerName = brokerName;
    }
}
