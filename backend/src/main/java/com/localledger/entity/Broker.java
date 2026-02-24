package com.localledger.entity;

import jakarta.persistence.*;

/**
 * 券商实体类
 * 对应数据库 brokers 表
 */
@Entity
@Table(name = "brokers")
public class Broker extends BaseEntity {

    /**
     * 券商名称（唯一）
     */
    @Column(name = "broker_name", nullable = false, unique = true, length = 100)
    private String brokerName;

    /**
     * 所属国家/地区
     */
    @Column(name = "country", nullable = false, length = 50)
    private String country;

    /**
     * 券商账户描述
     */
    @Column(name = "description", length = 200)
    private String description;

    /**
     * 关联邮箱
     */
    @Column(name = "email", length = 100)
    private String email;

    /**
     * 关联电话
     */
    @Column(name = "phone", length = 30)
    private String phone;

    /**
     * 是否启用
     */
    @Column(name = "is_active")
    private Boolean isActive = true;

    // ============ Constructors ============

    public Broker() {
    }

    public Broker(String brokerName, String country) {
        this.brokerName = brokerName;
        this.country = country;
    }

    // ============ Getters and Setters ============

    public String getBrokerName() {
        return brokerName;
    }

    public void setBrokerName(String brokerName) {
        this.brokerName = brokerName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    @Override
    public String toString() {
        return "Broker{" +
                "id=" + getId() +
                ", brokerName='" + brokerName + '\'' +
                ", country='" + country + '\'' +
                ", description='" + description + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
