# Local Ledger Frontend

投资盈亏管理系统前端项目

## 技术栈

- **React 18** - 前端框架
- **Ant Design 5** - UI组件库
- **Vite** - 构建工具
- **Axios** - HTTP客户端
- **Day.js** - 日期处理

## 快速开始

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── main.jsx              # 应用入口
│   ├── App.jsx               # 主应用组件
│   ├── App.css               # 应用样式
│   └── index.css             # 全局样式
├── index.html                # HTML模板
├── vite.config.js            # Vite配置
└── package.json              # 项目配置
```

## 功能特性

### 当前功能

- ✅ 投资统计仪表盘
- ✅ 投资记录列表展示
- ✅ 盈亏数据可视化
- ✅ 后端服务连接状态检测
- ✅ 响应式布局

### 待开发功能

- 📝 添加/编辑/删除投资记录
- 📊 图表分析（收益趋势、资产分布等）
- 🔍 数据筛选和搜索
- 📤 数据导入导出
- ⚙️ 系统设置

## API接口

前端通过代理访问后端API（配置在 `vite.config.js`）：

- `/api/health` - 健康检查
- `/api/hello` - 测试接口

更多接口将在后续开发中添加。

## 开发说明

1. 确保后端服务运行在 `http://localhost:8080`
2. 前端开发服务器会自动代理 `/api` 请求到后端
3. 使用 Ant Design 组件库进行UI开发
4. 遵循 React Hooks 最佳实践

## 注意事项

- Node.js 版本要求：>= 16.0.0
- 首次运行需要先安装依赖
- 开发时确保后端服务已启动
