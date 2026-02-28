package com.localledger.entity;

import jakarta.persistence.*;

/**
 * 投资策略实体类
 * 对应数据库 strategies 表
 */
@Entity
@Table(name = "strategies")
public class Strategy extends BaseEntity {

    /**
     * 策略名称
     */
    @Column(name = "strategy_name", nullable = false, length = 200)
    private String strategyName;

    /**
     * 策略描述
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 软删除标记
     */
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    // ============ Constructors ============

    public Strategy() {
    }

    // ============ Getters and Setters ============

    public String getStrategyName() {
        return strategyName;
    }

    public void setStrategyName(String strategyName) {
        this.strategyName = strategyName;
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

    @Override
    public String toString() {
        return "Strategy{" +
                "id=" + getId() +
                ", strategyName='" + strategyName + '\'' +
                ", description='" + description + '\'' +
                ", isDeleted=" + isDeleted +
                '}';
    }
}
