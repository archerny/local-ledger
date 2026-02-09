# Local Ledger Backend

这是一个基于 Spring Boot 的简单后端服务。

## 技术栈

- Java 17
- Spring Boot 3.2.0
- Maven

## 快速开始

### 前置要求

- JDK 17 或更高版本
- Maven 3.6+

### 运行项目

```bash
# 进入backend目录
cd backend

# 使用Maven运行
mvn spring-boot:run
```

或者：

```bash
# 编译打包
mvn clean package

# 运行jar包
java -jar target/backend-1.0.0.jar
```

### 访问接口

服务启动后，默认运行在 `http://localhost:8080`

- 健康检查: `http://localhost:8080/api/health`
- 欢迎接口: `http://localhost:8080/api/hello`

## 项目结构

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── localledger/
│   │   │           ├── Application.java          # 主应用入口
│   │   │           └── controller/
│   │   │               └── HelloController.java  # 示例控制器
│   │   └── resources/
│   │       └── application.properties            # 配置文件
│   └── test/
└── pom.xml                                        # Maven配置
```
