# 单元测试规范

## 核心原则

> **⚠️ 单元测试不得操作数据库中的数据。**

所有单元测试必须在纯内存环境中运行，不得连接、读取、写入或修改任何真实数据库。这是本项目单元测试的首要规范，违反此规则的测试代码不允许合入。

## 为什么不允许操作数据库

1. **数据安全**：测试可能意外修改或删除生产/开发环境的真实数据
2. **测试隔离**：依赖外部数据库的测试结果不稳定，容易因环境差异导致误判
3. **执行速度**：纯内存测试执行速度远快于需要数据库连接的测试
4. **环境无关**：开发者无需配置数据库即可运行测试，降低协作门槛

## 后端测试规范（Java）

### 框架要求

- 测试框架：**JUnit 5**（通过 `spring-boot-starter-test` 内置）
- Mock 框架：**Mockito**（通过 `spring-boot-starter-test` 内置）

### 必须遵守的规则

1. **使用 `@ExtendWith(MockitoExtension.class)` 注解**，不得使用 `@SpringBootTest` 等会启动 Spring 容器并连接数据库的注解
2. **所有 Repository 必须使用 `@Mock` 声明为模拟对象**，不得注入真实的 Repository 实现
3. **被测试的 Service 使用 `@InjectMocks` 注入 Mock 对象**
4. **使用 `when(...).thenReturn(...)` 预设 Repository 的返回数据**，而非从真实数据库查询

### 标准测试类结构

```java
@ExtendWith(MockitoExtension.class)
class XxxServiceTest {

    @Mock
    private XxxRepository xxxRepository;  // Mock 数据库依赖

    @InjectMocks
    private XxxService xxxService;        // 被测试的 Service

    @Test
    void shouldDoSomething() {
        // given - 准备测试数据和 Mock 行为
        when(xxxRepository.findAll()).thenReturn(List.of(...));

        // when - 执行被测方法
        var result = xxxService.doSomething();

        // then - 验证结果
        assertNotNull(result);
        verify(xxxRepository).findAll();
    }
}
```

### 禁止的写法

```java
// ❌ 禁止：使用 @SpringBootTest 会启动容器并连接数据库
@SpringBootTest
class XxxServiceTest { ... }

// ❌ 禁止：使用 @DataJpaTest 会连接数据库
@DataJpaTest
class XxxRepositoryTest { ... }

// ❌ 禁止：使用 @Autowired 注入真实的 Repository
@Autowired
private XxxRepository xxxRepository;

// ❌ 禁止：直接调用 EntityManager 操作数据库
entityManager.persist(entity);
```

### 测试目录结构

```
backend/src/test/java/com/localledger/
└── service/
    ├── TradeVerificationServiceTest.java
    ├── TradeRecordServiceTest.java
    └── PositionServiceTest.java
```

### 运行命令

```bash
cd backend
mvn test                                    # 运行所有测试
mvn test -Dtest=XxxServiceTest              # 运行指定测试类
mvn test -Dtest=XxxServiceTest#methodName   # 运行指定测试方法
```

## 前端测试规范（JavaScript）

### 框架要求

- 测试框架：**Vitest**（基于 Vite，零配置）

### 必须遵守的规则

1. **测试运行环境设置为 `node`**，不得连接任何后端服务或数据库
2. **不得在测试中发起真实的网络请求**（`fetch`、`axios` 等），如需测试涉及网络请求的逻辑，必须使用 Mock
3. **测试对象限定为纯函数、常量映射、配置数据**等不涉及外部 I/O 的模块

### 测试目录结构

测试文件统一放置在对应模块的 `__tests__` 目录下：

```
frontend/src/
├── constants/
│   └── __tests__/
│       ├── tradeConstants.test.js
│       └── menuConfig.test.js
└── utils/
    └── __tests__/
        └── xxx.test.js        # 工具函数测试（如有）
```

### 运行命令

```bash
cd frontend
npm install       # 首次运行需安装依赖
npm test          # 运行所有测试
npx vitest        # 监听模式（开发时推荐）
```

## 命名约定

| 约定项 | 规则 | 示例 |
|---|---|---|
| 测试文件名 | 被测类名 + `Test` 后缀（后端）或 `.test.js` 后缀（前端） | `TradeRecordServiceTest.java`、`tradeConstants.test.js` |
| 测试方法名 | 采用 `should + 预期行为` 或 `场景描述_期望结果` 格式 | `shouldCalculateAmountForStock`、`validCallOptionSymbol_shouldPass` |
| 测试结构 | 遵循 **Given-When-Then** 模式 | 准备数据 → 执行方法 → 验证结果 |

## 检查清单

在提交单元测试代码前，请对照以下清单自查：

- [ ] 测试类未使用 `@SpringBootTest`、`@DataJpaTest` 等启动容器的注解
- [ ] 所有数据库依赖（Repository）均使用 `@Mock` 声明
- [ ] 测试中不存在直接的数据库连接或 SQL 执行
- [ ] 前端测试中不存在真实的网络请求调用
- [ ] 测试可以在无数据库环境下独立运行通过
- [ ] 测试方法命名清晰，能表达测试意图
