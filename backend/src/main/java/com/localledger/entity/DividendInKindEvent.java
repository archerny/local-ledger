package com.localledger.entity;

import com.localledger.entity.enums.Currency;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;

/**
 * Dividend-in-kind event entity
 * Maps to events_dividend_in_kind table
 * Records stock dividends, e.g. every 21 shares of A gets 1 share of B
 */
@Entity
@Table(name = "events_dividend_in_kind")
public class DividendInKindEvent extends BaseMarketEvent {

    /**
     * Dividend symbol (the stock received as dividend)
     */
    @Column(name = "dividend_symbol", nullable = false, length = 50)
    private String dividendSymbol;

    /**
     * Dividend symbol name (underlying name)
     */
    @Column(name = "dividend_symbol_name", length = 200)
    private String dividendSymbolName;

    /**
     * Currency of the dividend symbol (may differ from the held symbol currency)
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "dividend_currency", nullable = false, columnDefinition = "currency_enum")
    private Currency dividendCurrency;

    /**
     * Ratio denominator: every N shares held (e.g. 21 in "every 21 shares get 1 share")
     */
    @Column(name = "ratio_from", nullable = false)
    private Integer ratioFrom;

    /**
     * Ratio numerator: receive M shares (e.g. 1 in "every 21 shares get 1 share")
     */
    @Column(name = "ratio_to", nullable = false)
    private Integer ratioTo;

    /**
     * Fair value per share, used to establish cost basis for dividend position
     */
    @Column(name = "fair_value_per_share", precision = 15, scale = 4)
    private BigDecimal fairValuePerShare;

    // ============ Constructors ============

    public DividendInKindEvent() {
    }

    // ============ Getters and Setters ============

    public String getDividendSymbol() {
        return dividendSymbol;
    }

    public void setDividendSymbol(String dividendSymbol) {
        this.dividendSymbol = dividendSymbol != null ? dividendSymbol.trim() : null;
    }

    public String getDividendSymbolName() {
        return dividendSymbolName;
    }

    public void setDividendSymbolName(String dividendSymbolName) {
        this.dividendSymbolName = dividendSymbolName;
    }

    public Currency getDividendCurrency() {
        return dividendCurrency;
    }

    public void setDividendCurrency(Currency dividendCurrency) {
        this.dividendCurrency = dividendCurrency;
    }

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

    public BigDecimal getFairValuePerShare() {
        return fairValuePerShare;
    }

    public void setFairValuePerShare(BigDecimal fairValuePerShare) {
        this.fairValuePerShare = fairValuePerShare;
    }

    @Override
    public String toString() {
        return "DividendInKindEvent{" +
                "id=" + getId() +
                ", symbol='" + getSymbol() + '\'' +
                ", underlyingSymbolName='" + getUnderlyingSymbolName() + '\'' +
                ", currency=" + getCurrency() +
                ", eventDate=" + getEventDate() +
                ", dividendSymbol='" + dividendSymbol + '\'' +
                ", dividendSymbolName='" + dividendSymbolName + '\'' +
                ", dividendCurrency=" + dividendCurrency +
                ", ratioFrom=" + ratioFrom +
                ", ratioTo=" + ratioTo +
                ", fairValuePerShare=" + fairValuePerShare +
                ", description='" + getDescription() + '\'' +
                ", isDeleted=" + getIsDeleted() +
                ", processed=" + getProcessed() +
                '}';
    }
}
