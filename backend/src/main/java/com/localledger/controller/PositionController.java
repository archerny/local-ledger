package com.localledger.controller;

import com.localledger.dto.PositionSnapshot;
import com.localledger.service.PositionService;
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
 * 持仓快照控制器
 * 提供根据交易记录计算持仓快照的 API
 */
@RestController
@RequestMapping("/api/positions")
public class PositionController {

    @Autowired
    private PositionService positionService;

    /**
     * 计算截止到指定日期的持仓快照
     * GET /api/positions?date=2026-03-08&brokerId=1
     *
     * @param date     截止日期（必填，格式 YYYY-MM-DD）
     * @param brokerId 券商ID（可选，不传则查询所有券商）
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getPositions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long brokerId) {
        try {
            List<PositionSnapshot> positions = positionService.calculatePositions(date, brokerId);
            return buildSuccessResponse("查询成功", positions);
        } catch (Exception e) {
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "持仓计算失败: " + e.getMessage());
        }
    }

    // ============ 响应构建工具方法 ============

    private ResponseEntity<Map<String, Object>> buildSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", message);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ERROR");
        response.put("message", message);
        return ResponseEntity.status(status).body(response);
    }
}
