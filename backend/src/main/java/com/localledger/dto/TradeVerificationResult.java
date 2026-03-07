package com.localledger.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * 交易数据核对结果 DTO
 * 用于返回交易数据核对接口的完整结果
 */
public class TradeVerificationResult {

    /**
     * 是否全部通过核对
     */
    private boolean passed;

    /**
     * 核对的总记录数
     */
    private int totalChecked;

    /**
     * 存在异常的记录数
     */
    private int errorCount;

    /**
     * 异常记录详情列表
     */
    private List<ErrorDetail> errors = new ArrayList<>();

    // ============ 内部类：异常详情 ============

    public static class ErrorDetail {

        /**
         * 交易记录ID
         */
        private Long recordId;

        /**
         * 核对规则名称
         */
        private String ruleName;

        /**
         * 证券类型
         */
        private String assetType;

        /**
         * 当前的 symbol 值
         */
        private String actualSymbol;

        /**
         * 期望的 symbol 格式
         */
        private String expectedFormat;

        /**
         * 底层证券代码
         */
        private String underlyingSymbol;

        /**
         * 异常描述信息
         */
        private String message;

        public ErrorDetail() {
        }

        public ErrorDetail(Long recordId, String ruleName, String message) {
            this.recordId = recordId;
            this.ruleName = ruleName;
            this.message = message;
        }

        // ============ Getters and Setters ============

        public Long getRecordId() {
            return recordId;
        }

        public void setRecordId(Long recordId) {
            this.recordId = recordId;
        }

        public String getRuleName() {
            return ruleName;
        }

        public void setRuleName(String ruleName) {
            this.ruleName = ruleName;
        }

        public String getAssetType() {
            return assetType;
        }

        public void setAssetType(String assetType) {
            this.assetType = assetType;
        }

        public String getActualSymbol() {
            return actualSymbol;
        }

        public void setActualSymbol(String actualSymbol) {
            this.actualSymbol = actualSymbol;
        }

        public String getExpectedFormat() {
            return expectedFormat;
        }

        public void setExpectedFormat(String expectedFormat) {
            this.expectedFormat = expectedFormat;
        }

        public String getUnderlyingSymbol() {
            return underlyingSymbol;
        }

        public void setUnderlyingSymbol(String underlyingSymbol) {
            this.underlyingSymbol = underlyingSymbol;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    // ============ Getters and Setters ============

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public int getTotalChecked() {
        return totalChecked;
    }

    public void setTotalChecked(int totalChecked) {
        this.totalChecked = totalChecked;
    }

    public int getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(int errorCount) {
        this.errorCount = errorCount;
    }

    public List<ErrorDetail> getErrors() {
        return errors;
    }

    public void setErrors(List<ErrorDetail> errors) {
        this.errors = errors;
    }

    /**
     * 添加一条异常记录
     */
    public void addError(ErrorDetail error) {
        this.errors.add(error);
        this.errorCount = this.errors.size();
        this.passed = false;
    }
}
