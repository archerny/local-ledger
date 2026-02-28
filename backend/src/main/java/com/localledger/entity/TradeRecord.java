package com.localledger.entity;

import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TradeType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 交易记录实体类
 * 对应数据库 trade_records 表
 */
@Entity
@Table(name = "trade_records")
public class TradeRecord extends BaseEntity {

    /**
     * 交易日期
     */
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

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
     * 证券类型：STOCK-股票，ETF-ETF基金，OPTION_CALL-看涨期权，OPTION_PUT-看跌期权
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "asset_type", nullable = false, columnDefinition = "asset_type_enum")
    private AssetType assetType;

    /**
     * 证券代码，如 AAPL、600519、TSLA 240119C210
     */
    @Column(name = "symbol", nullable = false, length = 50)
    private String symbol;

    /**
     * 证券名称，如 苹果公司、贵州茅台、特斯拉看涨期权
     */
    @Column(name = "name", length = 200)
    private String name;

    /**
     * 底层证券代码，用于关联分析期权与正股收益，如 TSLA、AAPL
     */
    @Column(name = "underlying_symbol", length = 50, nullable = false)
    private String underlyingSymbol;

    /**
     * 交易类型：BUY-买入，SELL-卖出，OPTION_EXPIRE-期权到期，EXERCISE_BUY-行权买入，EXERCISE_SELL-行权卖出，EARLY_EXERCISE-提前行权
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "trade_type", nullable = false, columnDefinition = "trade_type_enum")
    private TradeType tradeType;

    /**
     * 交易数量
     */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /**
     * 成交价格（精度4位小数）
     */
    @Column(name = "price", nullable = false, precision = 15, scale = 4)
    private BigDecimal price;

    /**
     * 成交金额（精度2位小数）
     */
    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    /**
     * 交易费用（精度2位小数）
     */
    @Column(name = "fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    /**
     * 币种：CNY-人民币，HKD-港币，USD-美元
     */
    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "currency", nullable = false, columnDefinition = "currency_enum")
    private Currency currency = Currency.CNY;

    /**
     * 所属策略ID（外键关联 strategies 表，可空）
     */
    @Column(name = "strategy_id")
    private Long strategyId;

    /**
     * 关联的策略实体（只读，用于查询时自动关联策略信息）
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "strategy_id", insertable = false, updatable = false)
    private Strategy strategy;

    /**
     * 软删除标记
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    // ============ Constructors ============

    public TradeRecord() {
    }

    // ============ Getters and Setters ============

    public LocalDate getTradeDate() {
        return tradeDate;
    }

    public void setTradeDate(LocalDate tradeDate) {
        this.tradeDate = tradeDate;
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

    public AssetType getAssetType() {
        return assetType;
    }

    public void setAssetType(AssetType assetType) {
        this.assetType = assetType;
    }

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

    public TradeType getTradeType() {
        return tradeType;
    }

    public void setTradeType(TradeType tradeType) {
        this.tradeType = tradeType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getFee() {
        return fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public Long getStrategyId() {
        return strategyId;
    }

    public void setStrategyId(Long strategyId) {
        this.strategyId = strategyId;
    }

    public Strategy getStrategy() {
        return strategy;
    }

    public void setStrategy(Strategy strategy) {
        this.strategy = strategy;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    @Override
    public String toString() {
        return "TradeRecord{" +
                "id=" + getId() +
                ", tradeDate=" + tradeDate +
                ", brokerId=" + brokerId +
                ", assetType=" + assetType +
                ", symbol='" + symbol + '\'' +
                ", name='" + name + '\'' +
                ", underlyingSymbol='" + underlyingSymbol + '\'' +
                ", tradeType=" + tradeType +
                ", quantity=" + quantity +
                ", price=" + price +
                ", amount=" + amount +
                ", fee=" + fee +
                ", currency=" + currency +
                ", strategyId=" + strategyId +
                ", isDeleted=" + isDeleted +
                '}';
    }
}
