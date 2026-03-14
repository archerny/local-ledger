# 实物分红 Tab 重构方案

> 创建日期：2026-03-14
> 状态：待实施

---

## 一、背景

拆股事件 Tab（`StockSplitTab.jsx`）和股票代码变更事件 Tab（`SymbolChangeTab.jsx`）已经完成重构，采用了精简的"仅新增"模式：

- 前端只提供核心字段表单，不提供编辑/删除功能
- `currency`、`underlyingSymbolName` 等可推断字段由后端 `autoFillFromExistingTradeRecord()` 自动填充

当前实物分红事件 Tab（`DividendInKindTab.jsx`）尚未按此模式重构，存在功能冗余和风格不一致的问题。

---

## 二、当前状态与目标状态对比

### 2.1 前端差异

| 对比维度 | 拆股 / 代码变更（已重构） | 实物分红（当前） |
|---------|------------------------|----------------|
| 编辑功能 | ❌ 无编辑/删除，仅新增 | ✅ 有编辑和删除（`editingRecord`、`handleEdit`、`handleDelete`） |
| 表单字段 | 只传核心字段，`currency`/`underlyingSymbolName` 由后端自动填充 | 前端手动传 `currency`、`underlyingSymbolName`、`dividendSymbolName` |
| 组件引入 | 精简（无 `Select`, `Popconfirm`, `Space`） | 冗余（`Select`, `Popconfirm`, `Space`, `ExclamationCircleOutlined`） |
| Modal 标题 | 固定"新增 XXX 事件" | 动态切换"新增/编辑 实物分红事件" |
| 提交按钮 | 固定"提交" | 动态切换"提交/保存" |

### 2.2 后端差异

| 对比维度 | 拆股 / 代码变更（已重构） | 实物分红（当前） |
|---------|------------------------|----------------|
| `create()` 方法 | 调用 `autoFillFromExistingTradeRecord()` 自动填充 `currency` + `underlyingSymbolName` | ❌ 无自动填充，完全依赖前端传入 |
| `update()` 方法 | 调用 `autoFillFromExistingTradeRecord()` 自动填充 | ❌ 无自动填充 |

---

## 三、重构方案

### 3.1 自动填充逻辑设计

实物分红与拆股/代码变更的**关键区别**：

- **拆股/代码变更**：涉及的证券都是用户已经持有的，可以从已有交易记录中推断 `currency` 和 `underlyingSymbolName`。
- **实物分红**：`symbol`（持有的证券）是已有的，但 `dividendSymbol`（分红获得的证券）**可能从未交易过**，系统无法推断其信息。

因此，自动填充的范围为：

| 字段 | 来源 | 说明 |
|------|------|------|
| `currency` | ✅ 后端自动填充（从 `symbol` 的交易记录） | 持有证券的币种 |
| `underlyingSymbolName` | ✅ 后端自动填充（从 `symbol` 的交易记录） | 持有证券的底层名称 |
| `dividendSymbolName` | ❌ **用户手动填写** | 分红证券的底层名称，需与交易记录 `name` 字段对齐；但因分红证券可能从未交易过，无法自动推断 |

### 3.2 后端修改：`DividendInKindEventService.java`

**新增 `autoFillFromExistingTradeRecord()` 方法**，参考拆股的实现：

```java
private void autoFillFromExistingTradeRecord(DividendInKindEvent event) {
    // 用 event.getSymbol() 查找最近一条交易记录
    // - 自动填充 currency (如果为 null)
    // - 自动填充 underlyingSymbolName (如果为 null 或空)
    // 如果没有找到交易记录，抛异常阻止脏数据写入
    //
    // 注意：不处理 dividendSymbol 相关字段（dividendSymbolName 由用户提供）
}
```

在 `create()` 和 `update()` 中，`save` 之前调用此方法。

### 3.3 前端修改：`DividendInKindTab.jsx`

精简为与拆股/代码变更一致的"仅新增"模式：

#### 3.3.1 移除的内容

| 移除项 | 说明 |
|-------|------|
| `editingRecord` state | 不再需要编辑状态 |
| `handleEdit()` 方法 | 不再支持编辑 |
| `handleDelete()` 方法 | 不再支持删除 |
| 操作列（编辑/删除按钮） | 表格中不再显示操作列 |
| `Select` 组件引入 | 不再需要币种下拉框 |
| `Popconfirm` 组件引入 | 不再需要删除确认 |
| `Space` 组件引入 | 不再需要操作按钮容器 |
| `ExclamationCircleOutlined` 图标引入 | 不再需要删除确认图标 |
| `updateDividendInKindEvent` API 引入 | 前端不再调用更新接口 |
| `deleteDividendInKindEvent` API 引入 | 前端不再调用删除接口 |
| `currencyOptions` 常量引入 | 不再需要币种选项 |

#### 3.3.2 移除的表单字段

| 字段 | 原因 |
|------|------|
| `underlyingSymbolName`（底层证券名称） | 改为后端自动填充 |
| `currency`（币种） | 改为后端自动填充 |

#### 3.3.3 重构后的表单结构

```
┌─────────────────────────────────────────┐
│  新增实物分红事件                           │
├─────────────────────────────────────────┤
│  [证券代码*]          [事件日期*]          │
│  持有的证券代码         请选择日期          │
├─────────────────────────────────────────┤
│  [分红证券代码*]       [分红证券名称*]       │
│  获得的分红证券代码     分红证券底层名称      │
├─────────────────────────────────────────┤
│  [每股分红数量*]       [公允价格(每股)*]     │
│  每持有1股获得的数量    分红证券的公允价格     │
├─────────────────────────────────────────┤
│  [描述]                                   │
│  事件描述（选填）                           │
├─────────────────────────────────────────┤
│                     [取消]  [提交]         │
└─────────────────────────────────────────┘
```

**表单字段必填规则**：

| 字段 | 必填 | 说明 |
|------|------|------|
| `symbol` | ✅ | 持有的证券代码 |
| `eventDate` | ✅ | 事件日期 |
| `dividendSymbol` | ✅ | 分红证券代码 |
| `dividendSymbolName` | ✅ | 分红证券底层名称（需与交易记录 `name` 字段对齐） |
| `dividendQtyPerShare` | ✅ | 每股分红数量 |
| `fairValuePerShare` | ✅ | 公允价格（每股） |
| `description` | ❌ | 事件描述（选填） |

#### 3.3.4 简化 Modal

- 标题固定为"新增实物分红事件"
- 提交按钮固定为"提交"
- `handleSubmit` 去掉 `editingRecord` 的分支判断，只保留 `create` 逻辑

### 3.4 API 层

`marketEventApi.js` 中的 `updateDividendInKindEvent` 和 `deleteDividendInKindEvent` 函数**暂时保留但不在 Tab 中引入**，后端接口也继续保留，以备将来使用。

---

## 四、修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `backend/.../service/DividendInKindEventService.java` | 新增 `autoFillFromExistingTradeRecord()` 方法；在 `create()` 和 `update()` 中调用 |
| `frontend/.../market-events/DividendInKindTab.jsx` | 精简为仅新增模式；去掉编辑/删除；移除 `currency`、`underlyingSymbolName` 表单字段；保留 `dividendSymbolName` 为必填 |

---

## 五、风险与注意事项

| 风险点 | 说明 | 应对措施 |
|-------|------|---------|
| `dividendSymbol` 无交易记录 | 分红证券可能从未交易过，系统无法自动填充 `dividendSymbolName` | `dividendSymbolName` 由用户手动填写，后端不尝试自动填充 |
| 移除编辑/删除后的回退能力 | 用户录错实物分红事件后无法通过 UI 修改 | 与拆股/代码变更保持一致，必要时通过后端 API 或数据库直接操作；后端接口保留不删 |
| `dividendSymbolName` 一致性 | 该字段是分红证券的底层名称，需要与后续交易记录的 `name` 字段保持一致 | 表单中标注清楚，提示用户填写底层证券名称 |
