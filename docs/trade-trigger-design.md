# 交易触发来源（trade_trigger）设计文档

> 创建日期：2026-03-08
> 状态：方案已确认，待实现

---

## 一、背景

当前 `trade_records` 表中的所有交易记录，均由用户人工录入，但实际上不同记录的产生原因各不相同：

1. **手动交易** — 用户主动在券商下单执行的买卖
2. **期权事件** — 期权到期作废、行权、被指派等导致的被动买入或卖出
3. **市场事件** — 拆股、代码变更、实物分红等市场事件由系统自动生成的交易记录

现有的 `trade_type` 字段描述的是「交易做了什么动作」（买入/卖出），而非「这笔交易为什么会发生」。虽然可以通过其他字段间接推断来源，但这种隐式推断不够可靠，随着业务发展映射关系可能变得模糊。

**因此，需要新增专门的字段来显式标记交易记录的触发来源。**

---

## 二、关键设计决策

| # | 决策项 | 结论 | 理由 |
|---|--------|------|------|
| 1 | 字段命名 | `trade_trigger` | "trigger"精确表达"触发因素"；与 `trade_date`、`trade_type` 形成一致的 `trade_xxx` 命名体系 |
| 2 | 与 `trade_type` 的关系 | 互补：`trade_type` 描述"做了什么"，`trade_trigger` 描述"为什么发生" | 两个维度正交，不存在混淆 |
| 3 | 关联 ID 方案 | 采用 `trigger_ref_id` + `trigger_ref_type` 组合 | `MARKET_EVENT` 对应 3 张不同的表，需要 `trigger_ref_type` 区分引用目标；同时保持 `trade_trigger` 枚举简洁，便于按大类统一操作 |
| 4 | `trigger_ref_id` 默认值 | `NOT NULL DEFAULT 0`，`0` 表示无关联 | 避免 NULL 的语义歧义，数据库层面保障字段永远有值，查询友好 |
| 5 | `trade_trigger` 默认值 | 不设默认值，`NOT NULL` | 强制调用方显式指定触发类型，漏填直接报错，防止脏数据进入 |
| 6 | `trigger_ref_type` 默认值 | `NOT NULL DEFAULT 'NONE'`，`NONE` 表示无关联 | 与 `trigger_ref_id` 保持一致的非空策略，避免代码中处理 NULL 的复杂性 |

---

## 三、最终方案

### 3.1 新增字段

在 `trade_records` 表中新增以下 3 个字段：

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `trade_trigger` | VARCHAR(32) | `NOT NULL`，无默认值 | 交易触发来源，枚举值见下方 |
| `trigger_ref_id` | BIGINT | `NOT NULL DEFAULT 0` | 触发来源的关联记录 ID，`0` 表示无关联 |
| `trigger_ref_type` | VARCHAR(32) | `NOT NULL DEFAULT 'NONE'` | 触发来源的关联记录类型，用于区分 `trigger_ref_id` 指向哪张表；`NONE` 表示无关联 |

### 3.2 `trade_trigger` 枚举值

| 枚举值 | 含义 | 说明 |
|--------|------|------|
| `MANUAL` | 手动交易 | 用户在券商平台上主动下单执行的交易 |
| `OPTION` | 期权 | 期权相关事件（到期行权、提前行权、到期失效、被指派等）导致的被动买入或卖出 |
| `MARKET_EVENT` | 市场事件 | 拆股、代码变更、实物分红等市场事件产生的系统交易记录 |

### 3.3 `trigger_ref_type` 枚举值

| 枚举值 | 含义 | 关联表 |
|--------|------|--------|
| `NONE` | 无关联 | — |
| `STOCK_SPLIT` | 拆股事件 | `events_stock_split` |
| `SYMBOL_CHANGE` | 代码变更事件 | `events_symbol_change` |
| `DIVIDEND_IN_KIND` | 实物分红事件 | `events_dividend_in_kind` |
| `OPTION_EXPIRE` | 期权到期作废 | `trade_records`（期权交易记录） |
| `OPTION_EXERCISE` | 行权（含主动行权和到期自动行权，不区分） | `trade_records`（期权交易记录） |
| `OPTION_ASSIGNED` | 被指派 | `trade_records`（期权交易记录） |

> 当 `trade_trigger = MANUAL` 时，`trigger_ref_type` 为 `NONE`，`trigger_ref_id` 为 0。
> 当 `trade_trigger = OPTION` 时，期权侧记录（触发源头）`trigger_ref_id` 为 0；股票侧记录 `trigger_ref_id` 指向期权侧交易记录 ID。

### 3.4 字段组合语义

| `trade_trigger` | `trigger_ref_type` | `trigger_ref_id` | 含义 |
|-----------------|--------------------|--------------------|------|
| `MANUAL` | `NONE` | 0 | 手动交易，无关联记录 |
| `OPTION` | `OPTION_EXPIRE` | 0 | 期权到期作废，期权侧持仓清零（触发源头，无关联记录） |
| `OPTION` | `OPTION_EXERCISE` | 0 | 行权 — 期权侧持仓清零（触发源头，无关联记录） |
| `OPTION` | `OPTION_EXERCISE` | 期权侧交易记录 ID | 行权 — 股票侧买入/卖出，关联到期权侧交易记录 |
| `OPTION` | `OPTION_ASSIGNED` | 0 | 被指派 — 期权侧持仓清零（触发源头，无关联记录） |
| `OPTION` | `OPTION_ASSIGNED` | 期权侧交易记录 ID | 被指派 — 股票侧被动买入/卖出，关联到期权侧交易记录 |
| `MARKET_EVENT` | `STOCK_SPLIT` | 3 | 拆股事件触发，关联 `events_stock_split.id = 3` |
| `MARKET_EVENT` | `SYMBOL_CHANGE` | 7 | 代码变更事件触发，关联 `events_symbol_change.id = 7` |
| `MARKET_EVENT` | `DIVIDEND_IN_KIND` | 2 | 实物分红事件触发，关联 `events_dividend_in_kind.id = 2` |

### 3.5 市场事件的交易类型映射

**关键决策：市场事件不新增 TradeType 枚举值，统一复用 `BUY` / `SELL`。**

| 市场事件 | 生成的交易记录 | TradeType | 说明 |
|----------|----------------|-----------|------|
| 拆股（如 1:4） | BUY 增量数量（如原100股→新400股，增量300股） | `BUY` | 价格=0，费用=0，金额=0 |
| 代码变更（如 FB→META） | ① SELL 旧代码股票 | `SELL` | 价格=原持仓平均成本，费用=0，金额=持仓总成本 |
|  | ② BUY 新代码股票 | `BUY` | 价格=原持仓平均成本，费用=0，金额=持仓总成本 |
| 实物分红 | BUY 分红股票 | `BUY` | 价格=公允价格（fairValuePerShare），费用=0，金额=公允价格×分红数量 |

**为什么不新增 TradeType：**

| # | 理由 | 说明 |
|---|------|------|
| 1 | TradeType 描述的是「做了什么动作」 | 拆股/代码变更本身不是交易动作，它们的实际效果就是卖出+买入 |
| 2 | 持仓计算无需特殊处理 | `BUY`/`SELL` 的 `calculateQuantityDelta()` 逻辑天然适用，不需要为每种事件做 case 分支 |
| 3 | 避免枚举膨胀 | 未来新增市场事件类型时，不需要修改 TradeType 枚举和持仓计算逻辑 |
| 4 | 「为什么发生」由 `trade_trigger` + `trigger_ref_type` 表达 | 两个维度职责清晰：TradeType 管动作，trade_trigger 管来源 |

**注意事项：**

- 拆股生成的交易记录，价格、费用、金额均为 **0**，不影响收益统计
- 代码变更生成的交易记录，价格和金额继承原持仓的平均成本，确保成本从旧代码平滑转移到新代码，费用为 **0**
- 实物分红生成的交易记录，价格采用公司公告中的**公允价格**（`fairValuePerShare`），金额 = 公允价格 × 分红数量，费用为 **0**。公允价格用于建立新持仓的成本基础，确保后续卖出时收益计算正确
- 区分市场事件交易和普通交易，通过 `trade_trigger = MARKET_EVENT` 筛选，而非 TradeType
- 收益计算模块需排除 `trade_trigger = MARKET_EVENT` 的记录，或在统计时按 `trade_trigger` 分组

### 3.6 与现有设计的关系

本设计与 [market-event-processing-design.md](market-event-processing-design.md) 中的方案互为补充：

- 市场事件设计文档中定义的 `market_event_id` + `market_event_type` 字段，在本方案中被统一为更通用的 `trigger_ref_id` + `trigger_ref_type`，不仅覆盖市场事件场景，还支持期权行权等其他触发来源
- `trade_trigger` 提供了交易来源的顶层分类维度，便于统一查询和操作

### 3.7 应用层校验规则

| 规则 | 说明 |
|------|------|
| `trade_trigger` 必填 | 新增交易记录时，后端必须校验该字段不为空 |
| `MARKET_EVENT` 时 `trigger_ref_id` 不应为 0 | 市场事件生成的交易记录必须关联到具体的事件 |
| `MARKET_EVENT` 时 `trigger_ref_type` 不应为 `NONE` | 必须指明关联的是哪种市场事件表 |
| `MANUAL` 时 `trigger_ref_id` 应为 0 且 `trigger_ref_type` 应为 `NONE` | 手动交易无关联记录 |
| `OPTION` 时 `trigger_ref_type` 应为 `OPTION_EXPIRE` / `OPTION_EXERCISE` / `OPTION_ASSIGNED` 三者之一 | 必须指明具体的期权子场景 |
| `OPTION` + `OPTION_EXPIRE` 时，`price` 和 `amount` 应为 0 | 到期作废没有成交金额 |
| `OPTION` + `OPTION_EXPIRE` 时，不应有关联的股票侧交易记录 | 到期作废不涉及股票交易 |
| `OPTION` 期权侧记录的 `trigger_ref_id` 应为 0 | 期权侧是触发源头，不关联其他记录 |
| `OPTION` 股票侧记录的 `trigger_ref_id` 不应为 0 | 股票侧必须关联到对应的期权侧交易记录 |

---

## 四、方案价值

1. **数据分析维度** — 可以按触发来源分类统计，比如"手动交易盈亏" vs "被动交易盈亏"
2. **前端展示** — 交易记录列表可以用不同标签/颜色区分来源，一目了然
3. **数据溯源** — 看到一笔被动交易时，可以直接追溯到"是什么触发了这笔交易"
4. **数据校验** — 新增交易时可以验证触发来源与交易类型的匹配关系
5. **统一操作** — 便于按 `MARKET_EVENT` 大类进行批量查询、删除等操作（如级联重算时删除所有市场事件生成的交易记录）
6. **未来扩展** — 如果以后接入自动化交易、信号触发交易等，直接新增枚举值即可


