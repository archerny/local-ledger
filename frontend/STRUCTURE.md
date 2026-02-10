# 前端工程结构说明

## 目录结构

```
frontend/src/
├── components/          # 可复用组件
│   ├── AppLayout.jsx   # 主布局组件（包含侧边栏、头部、内容区域）
│   └── AppLayout.css   # 布局样式
├── pages/              # 页面组件
│   ├── Dashboard.jsx   # 仪表盘页面
│   ├── CashFlow.jsx    # 出入金记录页面
│   ├── ProfitAnalysis.jsx  # 盈亏分析页面
│   ├── Settings.jsx    # 系统设置页面
│   └── index.js        # 页面组件统一导出
├── constants/          # 常量和配置
│   ├── mockData.js     # 模拟数据
│   └── menuConfig.js   # 菜单配置
├── App.jsx             # 应用入口（简化版）
├── App.css             # 应用样式
├── main.jsx            # React入口
└── index.css           # 全局样式
```

## 组件说明

### 1. App.jsx
- 应用的主入口文件
- 简化为只导入和渲染 `AppLayout` 组件

### 2. components/AppLayout.jsx
- 主布局组件
- 包含侧边栏、头部和内容区域
- 管理菜单选择状态和页面路由
- 处理后端连接状态检查

### 3. pages/
各个独立的页面组件：
- **Dashboard.jsx**: 仪表盘，显示投资统计和最近投资记录
- **CashFlow.jsx**: 出入金记录管理
- **ProfitAnalysis.jsx**: 盈亏分析和统计
- **Settings.jsx**: 系统设置

### 4. constants/
- **mockData.js**: 存放所有模拟数据（统计数据、投资记录、出入金记录）
- **menuConfig.js**: 菜单配置和页面标题映射

## 优势

1. **模块化**: 每个页面都是独立的组件，便于维护和测试
2. **可复用**: 组件和数据分离，便于复用
3. **清晰的结构**: 按功能划分目录，代码组织更清晰
4. **易于扩展**: 添加新页面只需在 pages 目录创建新组件
5. **统一管理**: 配置和数据集中管理，修改方便

## 如何添加新页面

1. 在 `pages/` 目录创建新的页面组件
2. 在 `pages/index.js` 中导出新组件
3. 在 `constants/menuConfig.js` 中添加菜单项和标题
4. 在 `components/AppLayout.jsx` 的 `renderContent()` 方法中添加路由逻辑
