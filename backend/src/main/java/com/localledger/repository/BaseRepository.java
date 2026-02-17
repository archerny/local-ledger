package com.localledger.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

/**
 * 基础 Repository 接口
 * 所有 Repository 接口都应该继承此接口
 */
@NoRepositoryBean
public interface BaseRepository<T, ID> extends JpaRepository<T, ID> {
    // 可以在这里添加通用的查询方法
}
