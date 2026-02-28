package com.localledger.controller;

import com.localledger.entity.TradeRecord;
import com.localledger.entity.enums.AssetType;
import com.localledger.service.TradeRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 交易记录控制器
 * 提供交易记录的查询、新增、修改、删除等 API
 */
@RestController
@RequestMapping("/api/trade-records")
public class TradeRecordController {

    @Autowired
    private TradeRecordService tradeRecordService;

    /**
     * 查询所有交易记录
     * GET /api/trade-records
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRecords() {
        List<TradeRecord> records = tradeRecordService.findAll();
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据ID查询交易记录
     * GET /api/trade-records/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRecordById(@PathVariable Long id) {
        return tradeRecordService.findById(id)
                .map(record -> buildSuccessResponse("查询成功", record))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "交易记录不存在, ID: " + id));
    }

    /**
     * 根据券商ID查询交易记录
     * GET /api/trade-records/broker/{brokerId}
     */
    @GetMapping("/broker/{brokerId}")
    public ResponseEntity<Map<String, Object>> getRecordsByBrokerId(@PathVariable Long brokerId) {
        List<TradeRecord> records = tradeRecordService.findByBrokerId(brokerId);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据证券类型查询交易记录
     * GET /api/trade-records/asset-type/{assetType}
     */
    @GetMapping("/asset-type/{assetType}")
    public ResponseEntity<Map<String, Object>> getRecordsByAssetType(@PathVariable AssetType assetType) {
        List<TradeRecord> records = tradeRecordService.findByAssetType(assetType);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据策略ID查询交易记录
     * GET /api/trade-records/strategy/{strategyId}
     */
    @GetMapping("/strategy/{strategyId}")
    public ResponseEntity<Map<String, Object>> getRecordsByStrategyId(@PathVariable Long strategyId) {
        List<TradeRecord> records = tradeRecordService.findByStrategyId(strategyId);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据证券代码模糊搜索交易记录
     * GET /api/trade-records/search?symbol=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchBySymbol(@RequestParam String symbol) {
        List<TradeRecord> records = tradeRecordService.searchBySymbol(symbol);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据日期范围查询交易记录
     * GET /api/trade-records/date-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<Map<String, Object>> getRecordsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<TradeRecord> records = tradeRecordService.findByDateRange(startDate, endDate);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 新增交易记录
     * POST /api/trade-records
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRecord(@RequestBody TradeRecord record) {
        try {
            TradeRecord created = tradeRecordService.create(record);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新交易记录
     * PUT /api/trade-records/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateRecord(@PathVariable Long id, @RequestBody TradeRecord record) {
        try {
            TradeRecord updated = tradeRecordService.update(id, record);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除交易记录（软删除）
     * DELETE /api/trade-records/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecord(@PathVariable Long id) {
        try {
            tradeRecordService.softDelete(id);
            return buildSuccessResponse("删除成功", null);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ============ 响应构建工具方法 ============

    private ResponseEntity<Map<String, Object>> buildSuccessResponse(String message, Object data) {
        return buildSuccessResponse(HttpStatus.OK, message, data);
    }

    private ResponseEntity<Map<String, Object>> buildSuccessResponse(HttpStatus status, String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", message);
        response.put("data", data);
        return ResponseEntity.status(status).body(response);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ERROR");
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}
