# PostgreSQL 数据库配置指南

## 1. 数据库准备

### 1.1 安装 PostgreSQL
确保已安装 PostgreSQL 数据库（推荐版本 12 或更高）。

### 1.2 数据库已创建
数据库 `ledgerdb` 已通过手动操作创建完成。
数据库用户 `ledger` 已通过手动操作创建完成。

如需授予权限，可执行：
```sql
-- 连接到 PostgreSQL
psql -U postgres

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE ledgerdb TO ledger;
```

## 2. 配置数据库连接

编辑 `src/main/resources/application.properties` 文件，修改以下配置：

```properties
# 数据库连接 URL（修改为你的数据库地址）
spring.datasource.url=jdbc:postgresql://your-host:5432/ledgerdb

# 数据库用户名
spring.datasource.username=ledger

# 数据库密码
spring.datasource.password=your_password
```

### 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `your-host` | 数据库服务器地址 | `localhost` 或 `192.168.1.100` |
| `5432` | PostgreSQL 默认端口 | 可根据实际情况修改 |
| `ledgerdb` | 数据库名称 | 已手动创建 |
| `ledger` | 数据库用户名 | 已手动创建 |
| `your_password` | 数据库密码 | 用户 ledger 的密码 |

## 3. 连接池配置

HikariCP 连接池配置（已在 application.properties 中配置）：

```properties
# 最大连接数
spring.datasource.hikari.maximum-pool-size=10

# 最小空闲连接数
spring.datasource.hikari.minimum-idle=5

# 连接超时时间（毫秒）
spring.datasource.hikari.connection-timeout=30000

# 空闲连接超时时间（毫秒）
spring.datasource.hikari.idle-timeout=600000

# 连接最大生命周期（毫秒）
spring.datasource.hikari.max-lifetime=1800000
```

## 4. JPA 配置说明

```properties
# Hibernate 方言（PostgreSQL）
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# 显示 SQL 语句（开发环境建议开启）
spring.jpa.show-sql=true

# DDL 自动更新策略
# - none: 不做任何操作
# - validate: 验证表结构
# - update: 更新表结构（推荐开发环境使用）
# - create: 每次启动创建表（会删除原有数据）
# - create-drop: 启动时创建，关闭时删除
spring.jpa.hibernate.ddl-auto=update

# 格式化 SQL 输出
spring.jpa.properties.hibernate.format_sql=true

# 时区设置
spring.jpa.properties.hibernate.jdbc.time_zone=UTC+8
```

## 5. 测试数据库连接

启动应用后，访问以下接口测试数据库连接：

```bash
curl http://localhost:8080/api/db-test
```

成功响应示例：
```json
{
  "status": "SUCCESS",
  "message": "数据库连接成功",
  "database": "ledgerdb",
  "url": "jdbc:postgresql://localhost:5432/ledgerdb",
  "driver": "PostgreSQL JDBC Driver",
  "driverVersion": "42.x.x"
}
```

失败响应示例：
```json
{
  "status": "FAILED",
  "message": "数据库连接失败: Connection refused",
  "error": "org.postgresql.util.PSQLException"
}
```

## 6. 项目结构

```
backend/
├── src/main/java/com/localledger/
│   ├── config/
│   │   └── DatabaseConfig.java          # 数据库配置类
│   ├── entity/
│   │   └── BaseEntity.java              # 基础实体类
│   ├── repository/
│   │   └── BaseRepository.java          # 基础 Repository 接口
│   └── controller/
│       └── DatabaseTestController.java  # 数据库测试控制器
└── src/main/resources/
    └── application.properties           # 数据库配置文件
```

## 7. 常见问题

### 7.1 连接被拒绝
- 检查 PostgreSQL 服务是否启动
- 检查防火墙设置
- 检查 `pg_hba.conf` 配置文件，确保允许远程连接

### 7.2 认证失败
- 检查用户名和密码是否正确
- 检查用户是否有访问数据库的权限

### 7.3 数据库不存在
- 数据库 `ledgerdb` 已手动创建
- 检查数据库名称拼写是否正确（应为 `ledgerdb`）

### 7.4 时区问题
- 已配置时区为 UTC+8
- 如需修改，调整 `spring.jpa.properties.hibernate.jdbc.time_zone` 配置

## 8. 下一步

现在数据库框架已经搭建完成，你可以：

1. 创建具体的实体类（Entity）
2. 创建对应的 Repository 接口
3. 创建 Service 层处理业务逻辑
4. 创建 Controller 提供 REST API

示例：创建出入金记录实体
```java
@Entity
@Table(name = "cash_flow")
public class CashFlow extends BaseEntity {
    // 字段定义...
}
```
