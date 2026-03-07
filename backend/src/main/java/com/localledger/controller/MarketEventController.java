package com.localledger.controller;

import com.localledger.entity.DividendInKindEvent;
import com.localledger.entity.StockSplitEvent;
import com.localledger.entity.SymbolChangeEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.service.DividendInKindEventService;
import com.localledger.service.StockSplitEventService;
import com.localledger.service.SymbolChangeEventService;
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
 * 市场异动事件控制器
 * 提供代码变更、拆股、实物分红事件的查询、新增、修改、删除等 API
 */
@RestController
@RequestMapping("/api/market-events")
public class MarketEventController {

    @Autowired
    private SymbolChangeEventService symbolChangeEventService;

    @Autowired
    private StockSplitEventService stockSplitEventService;

    @Autowired
    private DividendInKindEventService dividendInKindEventService;

    // ============================================================
    // 代码变更事件 API
    // ============================================================

    /**
     * 查询所有代码变更事件
     * GET /api/market-events/symbol-change
     */
    @GetMapping("/symbol-change")
    public ResponseEntity<Map<String, Object>> getAllSymbolChangeEvents() {
        List<SymbolChangeEvent> events = symbolChangeEventService.findAll();
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据ID查询代码变更事件
     * GET /api/market-events/symbol-change/{id}
     */
    @GetMapping("/symbol-change/{id}")
    public ResponseEntity<Map<String, Object>> getSymbolChangeEventById(@PathVariable Long id) {
        return symbolChangeEventService.findById(id)
                .map(event -> buildSuccessResponse("查询成功", event))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "代码变更事件不存在, ID: " + id));
    }

    /**
     * 根据证券代码查询代码变更事件
     * GET /api/market-events/symbol-change/by-symbol?symbol=xxx
     */
    @GetMapping("/symbol-change/by-symbol")
    public ResponseEntity<Map<String, Object>> getSymbolChangeEventsBySymbol(@RequestParam String symbol) {
        List<SymbolChangeEvent> events = symbolChangeEventService.findBySymbol(symbol);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据日期范围查询代码变更事件
     * GET /api/market-events/symbol-change/by-date?startDate=xxx&endDate=xxx
     */
    @GetMapping("/symbol-change/by-date")
    public ResponseEntity<Map<String, Object>> getSymbolChangeEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<SymbolChangeEvent> events = symbolChangeEventService.findByDateRange(startDate, endDate);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 新增代码变更事件
     * POST /api/market-events/symbol-change
     */
    @PostMapping("/symbol-change")
    public ResponseEntity<Map<String, Object>> createSymbolChangeEvent(@RequestBody SymbolChangeEvent event) {
        try {
            SymbolChangeEvent created = symbolChangeEventService.create(event);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新代码变更事件
     * PUT /api/market-events/symbol-change/{id}
     */
    @PutMapping("/symbol-change/{id}")
    public ResponseEntity<Map<String, Object>> updateSymbolChangeEvent(
            @PathVariable Long id, @RequestBody SymbolChangeEvent event) {
        try {
            SymbolChangeEvent updated = symbolChangeEventService.update(id, event);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除代码变更事件（软删除）
     * DELETE /api/market-events/symbol-change/{id}
     */
    @DeleteMapping("/symbol-change/{id}")
    public ResponseEntity<Map<String, Object>> deleteSymbolChangeEvent(@PathVariable Long id) {
        try {
            symbolChangeEventService.delete(id);
            return buildSuccessResponse("删除成功", null);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ============================================================
    // 拆股事件 API
    // ============================================================

    /**
     * 查询所有拆股事件
     * GET /api/market-events/stock-split
     */
    @GetMapping("/stock-split")
    public ResponseEntity<Map<String, Object>> getAllStockSplitEvents() {
        List<StockSplitEvent> events = stockSplitEventService.findAll();
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据ID查询拆股事件
     * GET /api/market-events/stock-split/{id}
     */
    @GetMapping("/stock-split/{id}")
    public ResponseEntity<Map<String, Object>> getStockSplitEventById(@PathVariable Long id) {
        return stockSplitEventService.findById(id)
                .map(event -> buildSuccessResponse("查询成功", event))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "拆股事件不存在, ID: " + id));
    }

    /**
     * 根据证券代码查询拆股事件
     * GET /api/market-events/stock-split/by-symbol?symbol=xxx
     */
    @GetMapping("/stock-split/by-symbol")
    public ResponseEntity<Map<String, Object>> getStockSplitEventsBySymbol(@RequestParam String symbol) {
        List<StockSplitEvent> events = stockSplitEventService.findBySymbol(symbol);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据日期范围查询拆股事件
     * GET /api/market-events/stock-split/by-date?startDate=xxx&endDate=xxx
     */
    @GetMapping("/stock-split/by-date")
    public ResponseEntity<Map<String, Object>> getStockSplitEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<StockSplitEvent> events = stockSplitEventService.findByDateRange(startDate, endDate);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 新增拆股事件
     * POST /api/market-events/stock-split
     */
    @PostMapping("/stock-split")
    public ResponseEntity<Map<String, Object>> createStockSplitEvent(@RequestBody StockSplitEvent event) {
        try {
            StockSplitEvent created = stockSplitEventService.create(event);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新拆股事件
     * PUT /api/market-events/stock-split/{id}
     */
    @PutMapping("/stock-split/{id}")
    public ResponseEntity<Map<String, Object>> updateStockSplitEvent(
            @PathVariable Long id, @RequestBody StockSplitEvent event) {
        try {
            StockSplitEvent updated = stockSplitEventService.update(id, event);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除拆股事件（软删除）
     * DELETE /api/market-events/stock-split/{id}
     */
    @DeleteMapping("/stock-split/{id}")
    public ResponseEntity<Map<String, Object>> deleteStockSplitEvent(@PathVariable Long id) {
        try {
            stockSplitEventService.delete(id);
            return buildSuccessResponse("删除成功", null);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    // ============================================================
    // 实物分红事件 API
    // ============================================================

    /**
     * 查询所有实物分红事件
     * GET /api/market-events/dividend-in-kind
     */
    @GetMapping("/dividend-in-kind")
    public ResponseEntity<Map<String, Object>> getAllDividendInKindEvents() {
        List<DividendInKindEvent> events = dividendInKindEventService.findAll();
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据ID查询实物分红事件
     * GET /api/market-events/dividend-in-kind/{id}
     */
    @GetMapping("/dividend-in-kind/{id}")
    public ResponseEntity<Map<String, Object>> getDividendInKindEventById(@PathVariable Long id) {
        return dividendInKindEventService.findById(id)
                .map(event -> buildSuccessResponse("查询成功", event))
                .orElse(buildErrorResponse(HttpStatus.NOT_FOUND, "实物分红事件不存在, ID: " + id));
    }

    /**
     * 根据证券代码查询实物分红事件
     * GET /api/market-events/dividend-in-kind/by-symbol?symbol=xxx
     */
    @GetMapping("/dividend-in-kind/by-symbol")
    public ResponseEntity<Map<String, Object>> getDividendInKindEventsBySymbol(@RequestParam String symbol) {
        List<DividendInKindEvent> events = dividendInKindEventService.findBySymbol(symbol);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 根据日期范围查询实物分红事件
     * GET /api/market-events/dividend-in-kind/by-date?startDate=xxx&endDate=xxx
     */
    @GetMapping("/dividend-in-kind/by-date")
    public ResponseEntity<Map<String, Object>> getDividendInKindEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DividendInKindEvent> events = dividendInKindEventService.findByDateRange(startDate, endDate);
        return buildSuccessResponse("查询成功", events);
    }

    /**
     * 新增实物分红事件
     * POST /api/market-events/dividend-in-kind
     */
    @PostMapping("/dividend-in-kind")
    public ResponseEntity<Map<String, Object>> createDividendInKindEvent(@RequestBody DividendInKindEvent event) {
        try {
            DividendInKindEvent created = dividendInKindEventService.create(event);
            return buildSuccessResponse(HttpStatus.CREATED, "新增成功", created);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 更新实物分红事件
     * PUT /api/market-events/dividend-in-kind/{id}
     */
    @PutMapping("/dividend-in-kind/{id}")
    public ResponseEntity<Map<String, Object>> updateDividendInKindEvent(
            @PathVariable Long id, @RequestBody DividendInKindEvent event) {
        try {
            DividendInKindEvent updated = dividendInKindEventService.update(id, event);
            return buildSuccessResponse("更新成功", updated);
        } catch (IllegalArgumentException e) {
            return buildErrorResponse(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * 删除实物分红事件（软删除）
     * DELETE /api/market-events/dividend-in-kind/{id}
     */
    @DeleteMapping("/dividend-in-kind/{id}")
    public ResponseEntity<Map<String, Object>> deleteDividendInKindEvent(@PathVariable Long id) {
        try {
            dividendInKindEventService.delete(id);
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
