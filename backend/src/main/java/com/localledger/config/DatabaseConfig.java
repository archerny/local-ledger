package com.localledger.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 数据库配置类
 * 用于配置 JPA 和事务管理
 */
@Configuration
@EnableJpaRepositories(basePackages = "com.localledger.repository")
@EnableTransactionManagement
public class DatabaseConfig {
    
    // Spring Boot 会自动配置 DataSource、EntityManagerFactory 等
    // 如需自定义配置，可以在此添加 @Bean 方法
    
}
