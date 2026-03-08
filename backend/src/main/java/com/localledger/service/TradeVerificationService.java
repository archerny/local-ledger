package com.localledger.service;

import com.localledger.dto.TradeVerificationResult;
import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.entity.enums.Currency;
import com.localledger.entity.enums.TradeType;
import com.localledger.repository.TradeRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 交易数据核对验证服务
 * 负责对交易记录进行数据完整性和一致性校验
 */
@Service
@Transactional(readOnly = true)
public class TradeVerificationService {

    @Autowired
    private TradeRecordRepository tradeRecordRepository;

    /**
     * 期权 symbol 格式的正则表达式
     * 格式：底层证券代码-YYYYMMDD-C价格 或 底层证券代码-YYYYMMDD-P价格
     * 价格部分支持整数或小数（如 210、17.5）
     */
    private static final Pattern OPTION_SYMBOL_PATTERN =
            Pattern.compile("^(.+)-(\\d{8})-([CP])(.+)$");

    /**
     * 港股证券代码的正则表达式
     * 港股代码为纯数字（如 00700、09988、03690），不包含字母
     */
    private static final Pattern HK_STOCK_SYMBOL_PATTERN =
            Pattern.compile("^\\d+$");

    /**
     * 美股证券代码的正则表达式
     * 美股代码为纯字母（如 AAPL、TSLA、MSFT），不包含数字
     */
    private static final Pattern US_STOCK_SYMBOL_PATTERN =
            Pattern.compile("^[A-Za-z]+$");

    /**
     * 核对所有未删除的交易记录
     * 当前核对规则：
     * 1. 期权证券代码格式核对（OPTION_CALL / OPTION_PUT）
     * 2. 港股证券代码格式核对（HKD 结算的交易）
     * 3. 期权到期/行权交易的费用和价格核对
     * 4. 美股证券代码格式核对（USD 结算的股票交易）
     * 5. 证券代码类别一致性核对（同一 symbol 不应分属不同 assetType）
     */
    public TradeVerificationResult verifyAll() {
        List<TradeRecord> records = tradeRecordRepository.findByIsDeletedFalseOrderByIdDesc();
        return doVerify(records);
    }

    /**
     * 对指定的交易记录列表执行所有核对规则
     */
    private TradeVerificationResult doVerify(List<TradeRecord> records) {
        TradeVerificationResult result = new TradeVerificationResult();
        result.setTotalChecked(records.size());
        result.setPassed(true);

        for (TradeRecord record : records) {
            // 规则1：期权证券代码格式核对
            verifyOptionSymbolFormat(record, result);
            // 规则2：港股证券代码格式核对
            verifyHkStockSymbolFormat(record, result);
            // 规则3：期权到期/行权交易的费用和价格核对
            verifyExerciseExpireFeeAndPrice(record, result);
            // 规则4：美股证券代码格式核对
            verifyUsStockSymbolFormat(record, result);
        }

        // 规则5：证券代码类别一致性核对（全局规则，需在循环外执行）
        verifySymbolAssetTypeConsistency(records, result);

        result.setErrorCount(result.getErrors().size());
        return result;
    }

    /**
     * 规则1：核对期权证券代码格式
     *
     * 当 assetType 为 OPTION_CALL 时，symbol 应匹配格式：底层证券代码-YYYYMMDD-C价格
     *   - 底层证券代码部分应与 underlyingSymbol 字段一致
     *   - YYYYMMDD 应为合法日期
     *   - C 代表 CALL 类型
     *
     * 当 assetType 为 OPTION_PUT 时，symbol 应匹配格式：底层证券代码-YYYYMMDD-P价格
     *   - 底层证券代码部分应与 underlyingSymbol 字段一致
     *   - YYYYMMDD 应为合法日期
     *   - P 代表 PUT 类型
     *
     * 非期权类型的记录跳过此规则。
     */
    private void verifyOptionSymbolFormat(TradeRecord record, TradeVerificationResult result) {
        AssetType assetType = record.getAssetType();
        if (assetType != AssetType.OPTION_CALL && assetType != AssetType.OPTION_PUT) {
            return; // 非期权类型，跳过
        }

        String symbol = record.getSymbol();
        String underlyingSymbol = record.getUnderlyingSymbol();
        String expectedTypeChar = (assetType == AssetType.OPTION_CALL) ? "C" : "P";
        String expectedFormat = underlyingSymbol + "-YYYYMMDD-" + expectedTypeChar + "价格";

        // 1. 检查 symbol 是否匹配整体格式
        Matcher matcher = OPTION_SYMBOL_PATTERN.matcher(symbol);
        if (!matcher.matches()) {
            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("期权证券代码格式");
            error.setAssetType(assetType.name());
            error.setActualSymbol(symbol);
            error.setExpectedFormat(expectedFormat);
            error.setUnderlyingSymbol(underlyingSymbol);
            error.setMessage("期权证券代码格式不正确，应为：" + expectedFormat);
            result.addError(error);
            return;
        }

        String symbolUnderlying = matcher.group(1);  // 底层证券代码部分
        String dateStr = matcher.group(2);            // 日期部分 YYYYMMDD
        String typeChar = matcher.group(3);           // C 或 P
        String priceStr = matcher.group(4);           // 价格部分

        List<String> issues = new ArrayList<>();

        // 2. 核对底层证券代码是否一致
        if (!symbolUnderlying.equalsIgnoreCase(underlyingSymbol)) {
            issues.add("底层证券代码不匹配：symbol 中为 '" + symbolUnderlying +
                    "'，underlyingSymbol 为 '" + underlyingSymbol + "'");
        }

        // 3. 核对日期部分是否为合法日期
        try {
            LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyyMMdd"));
        } catch (DateTimeParseException e) {
            issues.add("日期部分 '" + dateStr + "' 不是合法的日期格式（应为YYYYMMDD）");
        }

        // 4. 核对期权类型标识是否与 assetType 匹配
        if (!typeChar.equals(expectedTypeChar)) {
            issues.add("期权类型标识不匹配：symbol 中为 '" + typeChar +
                    "'（" + (typeChar.equals("C") ? "CALL" : "PUT") + "），" +
                    "但 assetType 为 " + assetType.name() + "（应为 '" + expectedTypeChar + "'）");
        }

        // 5. 核对价格部分是否为合法数字
        try {
            BigDecimal price = new BigDecimal(priceStr);
            if (price.signum() <= 0) {
                issues.add("价格部分 '" + priceStr + "' 应为正数");
            }
        } catch (NumberFormatException e) {
            issues.add("价格部分 '" + priceStr + "' 不是合法的数字");
        }

        // 汇总异常
        if (!issues.isEmpty()) {
            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("期权证券代码格式");
            error.setAssetType(assetType.name());
            error.setActualSymbol(symbol);
            error.setExpectedFormat(expectedFormat);
            error.setUnderlyingSymbol(underlyingSymbol);
            error.setMessage(String.join("；", issues));
            result.addError(error);
        }
    }

    /**
     * 规则2：核对港股证券代码格式
     *
     * 当结算币种为 HKD（港币）时，说明交易的是港股，
     * 港股的证券代码（symbol）应为纯数字，不包含字母。
     * 同时底层证券代码（underlyingSymbol）也应为纯数字。
     *
     * 非 HKD 结算的记录跳过此规则。
     */
    private void verifyHkStockSymbolFormat(TradeRecord record, TradeVerificationResult result) {
        if (record.getCurrency() != Currency.HKD) {
            return; // 非港币结算，跳过
        }

        // 期权类型的港股暂不做此规则校验（期权代码有自己的格式规则）
        AssetType assetType = record.getAssetType();
        if (assetType == AssetType.OPTION_CALL || assetType == AssetType.OPTION_PUT) {
            return;
        }

        String symbol = record.getSymbol();
        String underlyingSymbol = record.getUnderlyingSymbol();
        List<String> issues = new ArrayList<>();

        // 核对 symbol 是否为纯数字
        if (!HK_STOCK_SYMBOL_PATTERN.matcher(symbol).matches()) {
            issues.add("港股证券代码应为纯数字，但实际为 '" + symbol + "'");
        }

        // 核对 underlyingSymbol 是否为纯数字
        if (underlyingSymbol != null && !underlyingSymbol.trim().isEmpty()
                && !HK_STOCK_SYMBOL_PATTERN.matcher(underlyingSymbol).matches()) {
            issues.add("港股底层证券代码应为纯数字，但实际为 '" + underlyingSymbol + "'");
        }

        if (!issues.isEmpty()) {
            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("港股证券代码格式");
            error.setAssetType(assetType.name());
            error.setActualSymbol(symbol);
            error.setExpectedFormat("纯数字（如 00700、09988）");
            error.setUnderlyingSymbol(underlyingSymbol);
            error.setMessage(String.join("；", issues));
            result.addError(error);
        }
    }

    /**
     * 规则3：核对期权到期/行权交易的费用和价格
     *
     * 当交易类型为 OPTION_EXPIRE（期权到期）、EXERCISE_BUY（行权买股）、EXERCISE_SELL（行权卖股）时，
     * 交易的费用（fee）和价格（price）都应为 0。
     *
     * 其他交易类型跳过此规则。
     */
    private void verifyExerciseExpireFeeAndPrice(TradeRecord record, TradeVerificationResult result) {
        TradeType tradeType = record.getTradeType();
        if (tradeType != TradeType.OPTION_EXPIRE
                && tradeType != TradeType.EXERCISE_BUY
                && tradeType != TradeType.EXERCISE_SELL) {
            return; // 非期权到期/行权交易，跳过
        }

        BigDecimal fee = record.getFee();
        BigDecimal price = record.getPrice();
        List<String> issues = new ArrayList<>();

        // 核对费用是否为0
        if (fee != null && fee.compareTo(BigDecimal.ZERO) != 0) {
            issues.add("交易费用应为 0，但实际为 " + fee);
        }

        // 核对价格是否为0
        if (price != null && price.compareTo(BigDecimal.ZERO) != 0) {
            issues.add("成交价格应为 0，但实际为 " + price);
        }

        if (!issues.isEmpty()) {
            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("期权到期/行权交易费用价格");
            error.setAssetType(record.getAssetType().name());
            error.setActualSymbol(record.getSymbol());
            error.setExpectedFormat("费用=0, 价格=0");
            error.setUnderlyingSymbol(record.getUnderlyingSymbol());
            error.setMessage("交易类型为 " + tradeType.name() + "，" + String.join("；", issues));
            result.addError(error);
        }
    }

    /**
     * 规则4：核对美股证券代码格式
     *
     * 当资产类型为 STOCK（股票）且结算币种为 USD（美元）时，说明交易的是美股，
     * 美股的证券代码（symbol）应为纯字母，不包含数字。
     * 同时底层证券代码（underlyingSymbol）也应为纯字母。
     *
     * 非 USD 结算或非 STOCK 类型的记录跳过此规则。
     */
    private void verifyUsStockSymbolFormat(TradeRecord record, TradeVerificationResult result) {
        if (record.getCurrency() != Currency.USD) {
            return; // 非美元结算，跳过
        }

        AssetType assetType = record.getAssetType();
        if (assetType != AssetType.STOCK) {
            return; // 非股票类型，跳过（期权、ETF 有自己的代码格式规则）
        }

        String symbol = record.getSymbol();
        String underlyingSymbol = record.getUnderlyingSymbol();
        List<String> issues = new ArrayList<>();

        // 核对 symbol 是否为纯字母
        if (!US_STOCK_SYMBOL_PATTERN.matcher(symbol).matches()) {
            issues.add("美股证券代码应为纯字母，但实际为 '" + symbol + "'");
        }

        // 核对 underlyingSymbol 是否为纯字母
        if (underlyingSymbol != null && !underlyingSymbol.trim().isEmpty()
                && !US_STOCK_SYMBOL_PATTERN.matcher(underlyingSymbol).matches()) {
            issues.add("美股底层证券代码应为纯字母，但实际为 '" + underlyingSymbol + "'");
        }

        if (!issues.isEmpty()) {
            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("美股证券代码格式");
            error.setAssetType(assetType.name());
            error.setActualSymbol(symbol);
            error.setExpectedFormat("纯字母（如 AAPL、TSLA、MSFT）");
            error.setUnderlyingSymbol(underlyingSymbol);
            error.setMessage(String.join("；", issues));
            result.addError(error);
        }
    }

    /**
     * 规则5：核对证券代码类别一致性
     *
     * 同一个证券代码（symbol）在所有记录中只应对应唯一的一种资产类别（assetType）。
     * 例如：
     *   - 'QQQ' 不可能既是 STOCK 又是 ETF
     *   - 某个期权代码不可能既是 OPTION_CALL 又是 OPTION_PUT
     *
     * 此规则为全局性规则，需要对所有记录进行交叉比较，
     * 先按 symbol（忽略大小写）分组统计 assetType，再对存在冲突的记录逐条报出异常。
     */
    private void verifySymbolAssetTypeConsistency(List<TradeRecord> records, TradeVerificationResult result) {
        // 按 symbol（忽略大小写）分组，收集每个 symbol 对应的所有 assetType
        Map<String, Set<AssetType>> symbolAssetTypeMap = new HashMap<>();
        for (TradeRecord record : records) {
            String symbolKey = record.getSymbol().toUpperCase();
            symbolAssetTypeMap.computeIfAbsent(symbolKey, k -> new HashSet<>())
                    .add(record.getAssetType());
        }

        // 筛选出存在多种 assetType 的 symbol（即存在冲突的代码）
        Set<String> conflictSymbols = symbolAssetTypeMap.entrySet().stream()
                .filter(entry -> entry.getValue().size() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        if (conflictSymbols.isEmpty()) {
            return; // 无冲突，跳过
        }

        // 对涉及冲突 symbol 的所有记录报出异常
        for (TradeRecord record : records) {
            String symbolKey = record.getSymbol().toUpperCase();
            if (!conflictSymbols.contains(symbolKey)) {
                continue;
            }

            Set<AssetType> conflictTypes = symbolAssetTypeMap.get(symbolKey);
            String typesStr = conflictTypes.stream()
                    .map(AssetType::name)
                    .sorted()
                    .collect(Collectors.joining("、"));

            TradeVerificationResult.ErrorDetail error = new TradeVerificationResult.ErrorDetail();
            error.setRecordId(record.getId());
            error.setRuleName("证券代码类别一致性");
            error.setAssetType(record.getAssetType().name());
            error.setActualSymbol(record.getSymbol());
            error.setExpectedFormat("同一证券代码应对应唯一的资产类别");
            error.setUnderlyingSymbol(record.getUnderlyingSymbol());
            error.setMessage("证券代码 '" + record.getSymbol() + "' 在不同记录中被归为多种资产类别：" +
                    typesStr + "，当前记录类别为 " + record.getAssetType().name());
            result.addError(error);
        }
    }
}
