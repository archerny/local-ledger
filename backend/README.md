# Local Ledger Backend

A simple backend service based on Spring Boot for managing investment profit and loss.

## Technology Stack

- Java 17
- Spring Boot 3.2.0
- Maven

## Getting Started

### Prerequisites

Before running the project, ensure the following environment is installed:

- **JDK 17 or higher**
  ```bash
  # Check Java version
  java -version
  ```
  
- **Maven 3.6+**
  ```bash
  # Check Maven version
  mvn -version
  ```

### Running the Application

#### Option 1: Run Directly with Maven (Recommended for Development)

This is the simplest approach, suitable for development and debugging:

```bash
# Navigate to backend directory
cd backend

# Run using Maven Spring Boot plugin
mvn spring-boot:run
```

#### Option 2: Build and Run JAR

This approach compiles and packages the application into a JAR file before running, suitable for production environments:

```bash
# Navigate to backend directory
cd backend

# Clean and package the project
mvn clean package

# Run the generated JAR file
java -jar target/backend-1.0.0.jar
```

#### Option 3: Quick Start with Skipping Tests

If you have test cases but want to start quickly:

```bash
# Run with Maven and skip tests
cd backend
mvn spring-boot:run -DskipTests
```

Or skip tests during packaging:

```bash
# Package with skipping tests
mvn clean package -DskipTests
java -jar target/backend-1.0.0.jar
```

### Verifying the Service

After the service starts, it runs by default at `http://localhost:8080`

#### 1. Check Console Logs

Upon successful startup, the console should display information similar to:
```
Started Application in X.XXX seconds
```

#### 2. Test API Endpoints

- **Health Check Endpoint**: 
  ```bash
  curl http://localhost:8080/api/health
  ```
  Or open in browser: `http://localhost:8080/api/health`

- **Hello Endpoint**: 
  ```bash
  curl http://localhost:8080/api/hello
  ```
  Or open in browser: `http://localhost:8080/api/hello`

### Troubleshooting

#### Port Already in Use

If port 8080 is already occupied, modify the `src/main/resources/application.properties` file:

```properties
server.port=8081
```

#### Java Version Mismatch

Ensure you are using JDK 17 or higher, as required by the project configuration.

#### Slow Maven Dependency Download

The first run will download dependencies, which may take some time. If the download is too slow, consider configuring a Maven mirror.

### Integration with Frontend

After the backend starts (default `http://localhost:8080`), you can start the frontend project:

```bash
# In another terminal window
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000` and automatically proxy API requests to the backend.

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── localledger/
│   │   │           ├── Application.java          # Main application entry point
│   │   │           └── controller/
│   │   │               └── HelloController.java  # Sample controller
│   │   └── resources/
│   │       └── application.properties            # Configuration file
│   └── test/
└── pom.xml                                        # Maven configuration
```
