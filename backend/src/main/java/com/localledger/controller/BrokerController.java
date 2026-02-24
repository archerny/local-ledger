package com.localledger.controller;

import com.localledger.entity.Broker;
import com.localledger.service.BrokerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 券商管理控制器
 * 提供券商的查询、新增、修改、删除等 API
 */
@RestController
@RequestMapping("/api/brokers")
public class BrokerController {

    @Autowired
    private BrokerService brokerService;

    /**
     * 查询所有券商
     * GET /api/brokers
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllBrokers() {
        List<Broker> brokers = brokerService.findAll();
        return buildSuccessResponse("查询成功", brokers);
    }

    /**
     * 根据ID查询券商
     * GET /api/brokers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBrokerById(@PathVariable Long id) {
        return brokerService.findById(id)
                .map(broker -> buildSuccessResponse("查询成功", broker))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "券商不存在, ID: " + id));
    }

    /**
     * 查询所有启用的券商
     * GET /api/brokers/active
     */
    @GetMapping("/active")
    public ResponseEntity<Map<String, Object>> getActiveBrokers() {
        List<Broker> brokers = brokerService.findActiveBrokers();
        return buildSuccessResponse("查询成功", brokers);
    }

    /**
     * 根据国家/地区查询券商
     * GET /api/brokers/country/{country}
     */
    @GetMapping("/country/{country}")
    public ResponseEntity<Map<String, Object>> getBrokersByCountry(@PathVariable String country) {
        List<Broker> brokers = brokerService.findByCountry(country);
        return buildSuccessResponse("查询成功", brokers);
    }

    /**
     * 根据关键词搜索券商
     * GET /api/brokers/search?keyword=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchBrokers(@RequestParam String keyword) {
        List<Broker> brokers = brokerService.searchByName(keyword);
        return buildSuccessResponse("查询成功", brokers);
    }

    /**
     * 新增券商
     * POST /api/brokers
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBroker(@RequestBody Broker broker) {
        try {
            Broker created = brokerService.create(broker);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新券商信息
     * PUT /api/brokers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBroker(@PathVariable Long id, @RequestBody Broker broker) {
        try {
            Broker updated = brokerService.update(id, broker);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除券商
     * DELETE /api/brokers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBroker(@PathVariable Long id) {
        try {
            brokerService.delete(id);
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
