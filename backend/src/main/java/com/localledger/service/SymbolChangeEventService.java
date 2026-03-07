package com.localledger.service;

import com.localledger.entity.SymbolChangeEvent;
import com.localledger.entity.enums.Currency;
import com.localledger.repository.SymbolChangeEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 代码变更事件业务逻辑服务
 */
@Service
@Transactional(readOnly = true)
public class SymbolChangeEventService {

    @Autowired
    private SymbolChangeEventRepository symbolChangeEventRepository;

    /**
     * 查询所有未删除的代码变更事件
     */
    public List<SymbolChangeEvent> findAll() {
        return symbolChangeEventRepository.findByIsDeletedFalseOrderByEventDateDesc();
    }

    /**
     * 根据ID查询
     */
    public Optional<SymbolChangeEvent> findById(Long id) {
        return symbolChangeEventRepository.findById(id);
    }

    /**
     * 根据证券代码查询
     */
    public List<SymbolChangeEvent> findBySymbol(String symbol) {
        return symbolChangeEventRepository.findBySymbolAndIsDeletedFalseOrderByEventDateDesc(symbol);
    }

    /**
     * 根据旧代码查询
     */
    public List<SymbolChangeEvent> findByOldSymbol(String oldSymbol) {
        return symbolChangeEventRepository.findByOldSymbolAndIsDeletedFalseOrderByEventDateDesc(oldSymbol);
    }

    /**
     * 根据新代码查询
     */
    public List<SymbolChangeEvent> findByNewSymbol(String newSymbol) {
        return symbolChangeEventRepository.findByNewSymbolAndIsDeletedFalseOrderByEventDateDesc(newSymbol);
    }

    /**
     * 根据币种查询
     */
    public List<SymbolChangeEvent> findByCurrency(Currency currency) {
        return symbolChangeEventRepository.findByCurrencyAndIsDeletedFalseOrderByEventDateDesc(currency);
    }

    /**
     * 根据事件日期范围查询
     */
    public List<SymbolChangeEvent> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return symbolChangeEventRepository.findByEventDateBetweenAndIsDeletedFalseOrderByEventDateDesc(startDate, endDate);
    }

    /**
     * 新增代码变更事件
     */
    @Transactional
    public SymbolChangeEvent create(SymbolChangeEvent event) {
        return symbolChangeEventRepository.save(event);
    }

    /**
     * 更新代码变更事件
     */
    @Transactional
    public SymbolChangeEvent update(Long id, SymbolChangeEvent eventData) {
        SymbolChangeEvent existing = symbolChangeEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("代码变更事件不存在, ID: " + id));

        existing.setSymbol(eventData.getSymbol());
        existing.setSymbolName(eventData.getSymbolName());
        existing.setCurrency(eventData.getCurrency());
        existing.setEventDate(eventData.getEventDate());
        existing.setOldSymbol(eventData.getOldSymbol());
        existing.setNewSymbol(eventData.getNewSymbol());
        existing.setDescription(eventData.getDescription());

        return symbolChangeEventRepository.save(existing);
    }

    /**
     * 软删除代码变更事件
     */
    @Transactional
    public void delete(Long id) {
        SymbolChangeEvent existing = symbolChangeEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("代码变更事件不存在, ID: " + id));
        existing.setIsDeleted(true);
        symbolChangeEventRepository.save(existing);
    }
}
