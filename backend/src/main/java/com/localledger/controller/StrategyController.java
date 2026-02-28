package com.localledger.controller;

import com.localledger.entity.Strategy;
import com.localledger.service.StrategyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 策略管理控制器
 * 提供策略的查询、新增、修改、删除等 API
 */
@RestController
@RequestMapping("/api/strategies")
public class StrategyController {

    @Autowired
    private StrategyService strategyService;

    /**
     * 查询所有策略
     * GET /api/strategies
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStrategies() {
        List<Strategy> strategies = strategyService.findAll();
        return buildSuccessResponse("查询成功", strategies);
    }

    /**
     * 根据ID查询策略
     * GET /api/strategies/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStrategyById(@PathVariable Long id) {
        return strategyService.findById(id)
                .map(strategy -> buildSuccessResponse("查询成功", strategy))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "策略不存在, ID: " + id));
    }

    /**
     * 新增策略
     * POST /api/strategies
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStrategy(@RequestBody Strategy strategy) {
        try {
            Strategy created = strategyService.create(strategy);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新策略
     * PUT /api/strategies/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateStrategy(@PathVariable Long id, @RequestBody Strategy strategy) {
        try {
            Strategy updated = strategyService.update(id, strategy);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除策略（软删除）
     * DELETE /api/strategies/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteStrategy(@PathVariable Long id) {
        try {
            strategyService.softDelete(id);
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
