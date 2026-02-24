package com.localledger.controller;

import com.localledger.entity.CashFlowRecord;
import com.localledger.entity.enums.RecordType;
import com.localledger.service.CashFlowRecordService;
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
 * 出入金记录控制器
 * 提供出入金记录的查询、新增等 API
 */
@RestController
@RequestMapping("/api/cash-flow-records")
public class CashFlowRecordController {

    @Autowired
    private CashFlowRecordService cashFlowRecordService;

    /**
     * 查询所有出入金记录
     * GET /api/cash-flow-records
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllRecords() {
        List<CashFlowRecord> records = cashFlowRecordService.findAll();
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据ID查询出入金记录
     * GET /api/cash-flow-records/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRecordById(@PathVariable Long id) {
        return cashFlowRecordService.findById(id)
                .map(record -> buildSuccessResponse("查询成功", record))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "出入金记录不存在, ID: " + id));
    }

    /**
     * 根据券商ID查询出入金记录
     * GET /api/cash-flow-records/broker/{brokerId}
     */
    @GetMapping("/broker/{brokerId}")
    public ResponseEntity<Map<String, Object>> getRecordsByBrokerId(@PathVariable Long brokerId) {
        List<CashFlowRecord> records = cashFlowRecordService.findByBrokerId(brokerId);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据记录类型查询
     * GET /api/cash-flow-records/type/{recordType}
     */
    @GetMapping("/type/{recordType}")
    public ResponseEntity<Map<String, Object>> getRecordsByType(@PathVariable RecordType recordType) {
        List<CashFlowRecord> records = cashFlowRecordService.findByRecordType(recordType);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据日期范围查询
     * GET /api/cash-flow-records/date-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<Map<String, Object>> getRecordsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CashFlowRecord> records = cashFlowRecordService.findByDateRange(startDate, endDate);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 根据券商ID和日期范围查询
     * GET /api/cash-flow-records/broker/{brokerId}/date-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/broker/{brokerId}/date-range")
    public ResponseEntity<Map<String, Object>> getRecordsByBrokerIdAndDateRange(
            @PathVariable Long brokerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CashFlowRecord> records = cashFlowRecordService.findByBrokerIdAndDateRange(brokerId, startDate, endDate);
        return buildSuccessResponse("查询成功", records);
    }

    /**
     * 新增出入金记录
     * POST /api/cash-flow-records
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRecord(@RequestBody CashFlowRecord record) {
        try {
            CashFlowRecord created = cashFlowRecordService.create(record);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除出入金记录（软删除）
     * DELETE /api/cash-flow-records/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecord(@PathVariable Long id) {
        try {
            cashFlowRecordService.softDelete(id);
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
