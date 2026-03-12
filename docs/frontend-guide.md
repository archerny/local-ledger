# Local Ledger Frontend

A frontend application for managing investment profit and loss.

## Technology Stack

- **React 18** - Frontend framework
- **Ant Design 5** - UI component library
- **Vite** - Build tool
- **Axios** - HTTP client
- **Day.js** - Date manipulation library

## Getting Started

### Prerequisites

Before running the project, ensure you have:

- **Node.js >= 16.0.0**
  ```bash
  # Check Node.js version
  node -v
  ```

- **npm or yarn**
  ```bash
  # Check npm version
  npm -v
  ```

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Running in Development Mode

```bash
# Start development server
npm run dev
```

The application will start at `http://localhost:3000`

### Building for Production

```bash
# Build the project
npm run build
```

Build artifacts will be generated in the `dist` directory.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

## Debugging Guide

### Development Tools

#### 1. Browser DevTools

**Chrome/Edge DevTools:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Console Tab**: View logs, errors, and warnings
- **Network Tab**: Monitor API requests and responses
- **React DevTools**: Install the React Developer Tools extension for component inspection

**Useful Console Commands:**
```javascript
// Check if backend is accessible
fetch('/api/health').then(r => r.json()).then(console.log)

// View current React version
console.log(React.version)
```

#### 2. Vite Hot Module Replacement (HMR)

Vite provides instant feedback during development:
- Changes to `.jsx` files trigger automatic component updates
- CSS changes apply immediately without page reload
- Check terminal for compilation errors

#### 3. Network Debugging

**API Proxy Configuration** (in `vite.config.js`):
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

**Testing API Endpoints:**
```bash
# Test backend health check
curl http://localhost:3000/api/health

# Or use browser
open http://localhost:3000/api/hello
```

#### 4. Common Debugging Scenarios

**Backend Connection Issues:**
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check proxy configuration in `vite.config.js`
3. Review browser Network tab for failed requests

**Component Not Updating:**
1. Check browser console for errors
2. Verify component state management
3. Use React DevTools to inspect component props and state

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### IDE Configuration

**VS Code Recommended Extensions:**
- ESLint
- Prettier
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag

**VS Code Debug Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx              # Application entry point
│   ├── App.jsx               # Main application component
│   ├── App.css               # Application styles
│   └── index.css             # Global styles
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Project configuration
```

## Features

### Current Features

- Investment statistics dashboard
- Investment records list display
- Profit and loss data visualization
- Backend service connection status detection
- Responsive layout

### Planned Features

- Add/Edit/Delete investment records
- Chart analysis (profit trends, asset distribution, etc.)
- Data filtering and search
- Data import/export
- System settings

## API Endpoints

The frontend accesses backend APIs through proxy (configured in `vite.config.js`):

- `/api/health` - Health check endpoint
- `/api/hello` - Test endpoint

More endpoints will be added during development.

## Development Guidelines

1. Ensure backend service is running at `http://localhost:8080`
2. Frontend dev server automatically proxies `/api` requests to backend
3. Use Ant Design components for UI development
4. Follow React Hooks best practices
5. Keep components small and focused
6. Use meaningful variable and function names

## Troubleshooting

### Port Already in Use

If port 3000 is occupied, modify `vite.config.js`:

```javascript
server: {
  port: 3001,  // Change to another port
  // ...
}
```

### Dependency Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Use alternative registry (if needed)
npm install --registry=https://registry.npmjs.org/
```

### Hot Reload Not Working

1. Check if file is saved properly
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache and reload

## 单元测试

> 📋 完整的单元测试规范请参阅 [单元测试规范](unit-test-spec.md)。核心原则：**单元测试不得操作数据库中的数据**。

### 测试框架

- **Vitest** - 基于 Vite 的测试框架，开箱即用，无需额外编译配置

### 配置

测试配置已集成在 `vite.config.js` 中：

```javascript
export default defineConfig({
  // ...
  test: {
    globals: true,
    environment: 'node',
  },
})
```

### 运行测试

```bash
cd frontend

# 安装依赖（首次或新增 vitest 后需要执行）
npm install

# 运行所有测试
npm test

# 监听模式运行测试（开发时推荐）
npx vitest
```

### 测试思路

前端采用**常量/配置层优先**的测试策略，专注于数据映射的完整性和一致性验证。这些常量是整个前端 UI 展示的基础，一旦映射缺失或错误会导致页面显示异常。

测试文件统一放置在对应模块的 `__tests__` 目录下。

### 测试清单

#### 1. tradeConstants.test.js（交易常量映射）

文件路径：`src/constants/__tests__/tradeConstants.test.js`

| 测试模块 | 测试场景 |
|---|---|
| 证券类型映射 | `assetTypeMap` 包含全部 4 种类型（STOCK/ETF/OPTION_CALL/OPTION_PUT）、正反向映射一致性、颜色映射覆盖所有类型 |
| 交易类型映射 | `tradeTypeMap` 只有 BUY/SELL、正反向映射一致性、颜色映射覆盖、金额颜色映射覆盖 |
| 币种配置 | `currencyOptions` 包含 3 种币种（CNY/HKD/USD）、每项有 label+value、颜色映射覆盖 |
| 交易触发来源映射 | `tradeTriggerMap` 包含 3 种触发类型（MANUAL/OPTION/MARKET_EVENT）、颜色映射覆盖 |
| 触发关联类型映射 | `triggerRefTypeMap` 包含全部 7 种关联类型、颜色映射覆盖、期权子类型和市场事件子类型分组验证 |

**测试设计要点：**
- 验证**双向映射一致性**：`assetTypeMap` 与 `assetTypeReverseMap` 互为反转，确保前端表单提交和展示能正确互换
- 验证**颜色映射完整性**：每个枚举值都有对应的颜色配置，防止 Tag 组件渲染时出现无颜色的情况
- 验证**关联类型分组**：期权子类型（EXPIRE/EXERCISE/ASSIGNED）和市场事件子类型（STOCK_SPLIT/SYMBOL_CHANGE/DIVIDEND_IN_KIND）各成一组，与后端校验逻辑对应

#### 2. menuConfig.test.js（菜单配置）

文件路径：`src/constants/__tests__/menuConfig.test.js`

| 测试模块 | 测试场景 |
|---|---|
| 路由映射 | `menuKeyToPath` 包含所有页面路由、`pathToMenuKey` 双向映射一致性、条目数量一致 |
| 父菜单映射 | 子菜单 key 都存在于 `menuKeyToPath` 中、账户管理/交易管理/盈亏分析子菜单正确映射到父组 |
| 菜单项结构 | `menuItems` 非空数组、顶级项有 key/icon/label、含子菜单项的 children 非空且结构正确、包含仪表盘/交易管理/盈亏分析/账户管理/系统设置五大模块 |

**测试设计要点：**
- 验证**路由映射不丢失**：防止新增页面后忘记添加映射，导致路由跳转或菜单高亮失效
- 验证**父子菜单关系**：确保侧边栏展开/收起状态和面包屑导航的正确性
- 验证**菜单结构完整性**：确保 Ant Design Menu 组件能正确渲染所有菜单项

## Integration with Backend

### Full Stack Development Workflow

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Verify Integration:**
1. Backend: `http://localhost:8080/api/health`
2. Frontend: `http://localhost:3000`
3. Frontend API call: `http://localhost:3000/api/health` (proxied to backend)
