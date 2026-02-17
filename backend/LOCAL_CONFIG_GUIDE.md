# Local Ledger Backend - 本地配置指南

## 📝 本地开发环境配置说明

为了保护敏感信息（如数据库密码）不被提交到代码仓库，本项目采用了 **Spring Boot Profile** 机制来管理本地配置。

---

## 🚀 快速开始

### 1️⃣ 创建本地配置文件

项目已经为你创建了 `application-local.properties` 文件，你需要修改其中的配置：

```bash
cd backend/src/main/resources
# 文件已存在，直接编辑即可
```

### 2️⃣ 修改本地配置

编辑 `application-local.properties` 文件，填入你的实际数据库信息：

```properties
# 数据库配置 - 本地环境
spring.datasource.url=jdbc:postgresql://localhost:5432/ledgerdb
spring.datasource.username=ledger
spring.datasource.password=你的实际密码
```

### 3️⃣ 启动应用（使用本地配置）

**方式一：Maven 命令启动**
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**方式二：IDE 启动（推荐）**

在 IDE 中设置环境变量：
- **IntelliJ IDEA**：Run → Edit Configurations → Environment variables → 添加 `SPRING_PROFILES_ACTIVE=local`
- **VSCode**：在 launch.json 中添加：
  ```json
  {
    "type": "java",
    "name": "Application",
    "request": "launch",
    "mainClass": "com.localledger.Application",
    "env": {
      "SPRING_PROFILES_ACTIVE": "local"
    }
  }
  ```

**方式三：JAR 包启动**
```bash
java -jar target/backend-1.0.0.jar --spring.profiles.active=local
```

---

## 📂 配置文件说明

| 文件名 | 用途 | 是否提交到代码仓库 |
|--------|------|-------------------|
| `application.properties` | 通用配置模板，不包含敏感信息 | ✅ 是 |
| `application-local.properties` | 本地开发配置，包含真实密码 | ❌ 否（已在 .gitignore 中） |
| `application-local.properties.template` | 本地配置模板，供参考 | ✅ 是 |

---

## 🔒 安全机制

1. **`.gitignore` 已配置**：`application-local.properties` 不会被 Git 追踪
2. **模板文件**：`application-local.properties.template` 提供配置参考，但不含真实密码
3. **配置优先级**：`application-local.properties` 会覆盖 `application.properties` 中的同名配置

---

## ✅ 验证配置

启动应用后，检查日志中的数据库连接信息：

```bash
# 访问健康检查接口
curl http://localhost:8080/api/health

# 访问数据库测试接口
curl http://localhost:8080/api/test/db
```

如果返回正常，说明配置成功！

---

## 🎯 配置优先级

Spring Boot 配置加载顺序（后面的会覆盖前面的）：

1. `application.properties`（通用配置）
2. `application-{profile}.properties`（环境特定配置）
3. 环境变量
4. 命令行参数

---

## 💡 最佳实践

### ✅ 推荐做法

- ✅ 在 `application-local.properties` 中配置本地数据库密码
- ✅ 使用 `--spring.profiles.active=local` 启动应用
- ✅ 团队成员各自维护自己的 `application-local.properties`

### ❌ 不推荐做法

- ❌ 直接在 `application.properties` 中写真实密码
- ❌ 将 `application-local.properties` 提交到代码仓库
- ❌ 在代码中硬编码敏感信息

---

## 🔧 其他环境配置

你可以创建更多环境配置文件：

- `application-dev.properties`：开发环境
- `application-test.properties`：测试环境
- `application-prod.properties`：生产环境

启动时指定对应的 profile 即可：
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## ❓ 常见问题

### Q1: 启动时提示数据库连接失败？
**A**: 检查是否使用了 `local` profile 启动：
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Q2: 如何确认使用了哪个配置文件？
**A**: 查看启动日志，会显示：
```
The following profiles are active: local
```

### Q3: 配置文件没有生效？
**A**: 确保：
1. 文件名正确：`application-local.properties`
2. 文件位置正确：`src/main/resources/`
3. 启动时指定了 profile：`--spring.profiles.active=local`

---

## 📚 参考资料

- [Spring Boot 配置文件](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [Spring Boot Profiles](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
