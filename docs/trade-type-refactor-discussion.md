# TradeType 枚举精简 —— 期权交易类型重构讨论

> 创建日期：2026-03-09
> 状态：**已确认方案二（极简版）**

---

## 一、背景

当前 `TradeType` 枚举中有 5 个值：

```java
public enum TradeType {
    BUY,            // 买入
    SELL,           // 卖出
    OPTION_EXPIRE,  // 期权到期
    EXERCISE_BUY,   // 行权买股
    EXERCISE_SELL   // 行权卖股
}
```

在 [market-event-processing-design.md](market-event-processing-design.md) 设计过程中，我们已经确立了一个重要原则：

> **市场事件不新增 TradeType 枚举值，统一复用 `BUY` / `SELL`。**
> 理由：TradeType 描述的是「做了什么动作」，拆股/代码变更本身不是交易动作。「为什么发生」由 `trade_trigger` + `trigger_ref_type` 表达，职责分离更清晰。

然而，这个原则**没有向前追溯**应用到期权相关的交易类型上——市场事件做到了只用 `BUY`/`SELL`，期权却还保留了 `OPTION_EXPIRE`/`EXERCISE_BUY`/`EXERCISE_SELL`，标准不一致。

---

## 二、现有设计的问题

### 2.1 `TradeType` 混淆了"动作"和"原因"

`TradeType` 本意是描述"做了什么动作"，但 `OPTION_EXPIRE`、`EXERCISE_BUY`、`EXERCISE_SELL` 实际上在表达"为什么发生"：

| 当前值 | 它真正描述的 | 本质动作 |
|----|-------------|---------|
| `BUY` | ✅ 动作：买入 | 买入 |
| `SELL` | ✅ 动作：卖出 | 卖出 |
| `OPTION_EXPIRE` | ❌ 原因：期权到期了 | 本质是"持仓归零"（类似卖出） |
| `EXERCISE_BUY` | ❌ 原因：行权导致买股 | 本质就是"买入" |
| `EXERCISE_SELL` | ❌ 原因：行权导致卖股 | 本质就是"卖出" |

### 2.2 已有更好的机制表达"为什么"

在 [trade-trigger-design.md](trade-trigger-design.md) 中，已经引入了 `trade_trigger` + `trigger_ref_id` + `trigger_ref_type` 三个字段来精确描述"交易为什么发生"。

期权相关交易完全可以这样表达：
- `trade_trigger = OPTION`
- `trigger_ref_type = OPTION`
- `trigger_ref_id` = 对应的期权交易记录 ID

### 2.3 与市场事件设计标准不一致

| 场景 | TradeType 使用方式 | "为什么"的表达 |
|------|-------------------|---------------|
| 市场事件（拆股/代码变更/实物分红） | ✅ 只用 `BUY` / `SELL` | `trade_trigger = MARKET_EVENT` |
| 期权相关（到期/行权） | ❌ 有专属类型 `OPTION_EXPIRE` / `EXERCISE_BUY` / `EXERCISE_SELL` | 部分依赖 TradeType 推断，部分用 `trade_trigger = OPTION` |

两套标准并存，增加了理解和维护成本。

### 2.4 导致持仓计算分支膨胀

当前 `PositionService.calculateQuantityDelta()` 需要 5 个 case 分支：

```java
private int calculateQuantityDelta(TradeRecord record) {
    switch (tradeType) {
        case BUY:            return quantity;
        case SELL:           return -quantity;
        case OPTION_EXPIRE:  return -quantity;
        case EXERCISE_BUY:
        case EXERCISE_SELL:  return -quantity;
        default:             return 0;
    }
}
```

其中 `OPTION_EXPIRE`、`EXERCISE_BUY`、`EXERCISE_SELL` 对期权持仓的效果完全相同（都是 `-quantity`），存在冗余。

---

## 三、优化方案

### 方案一：精简版

将 `TradeType` 精简为 3 个值：

```java
public enum TradeType {
    BUY,     // 买入
    SELL,    // 卖出
    EXPIRE   // 到期作废
}
```

| TradeType | 含义 | 适用场景 |
|-----------|------|---------|
| `BUY` | 买入 | 手动买入、行权买股、拆股增量、实物分红 |
| `SELL` | 卖出 | 手动卖出、行权卖股、代码变更卖出旧股 |
| `EXPIRE` | 到期作废 | 期权到期价值归零（特殊，因为没有对手方交易） |

**保留 `EXPIRE` 的理由**：期权到期失效**确实不是买也不是卖**，它是一种特殊的"持仓清零"操作，没有成交金额、没有对手方。用 `SELL` 来表达语义上不太准确。

**行权（EXERCISE）的"为什么"** 完全交给 `trade_trigger = OPTION` + `trigger_ref_type = OPTION` 来表达。

### 方案二：极简版 ✅ 最终选定

将 `TradeType` 精简为 2 个值：

```java
public enum TradeType {
    BUY,   // 买入
    SELL   // 卖出
}
```

将 `EXPIRE` 也归入 `SELL`（数量归零的卖出，价格为 0），所有"为什么"都交给 trigger 字段。

**关于 `EXPIRE` 归入 `SELL` 的语义问题**：虽然到期失效并不是真正的"卖出"（没有交易对手、没有成交价格），但可以通过 `trade_trigger` 字段来区分。`SELL` 在这里的含义更接近"持仓减少/清零"，配合 trigger 机制能准确表达完整语义。

### 期权被动操作的细分场景

期权的被动操作虽然在持仓上可能表现相似（都是持仓清零），但业务含义截然不同：

| 场景 | 期权侧表现 | 股票侧表现 | 含义差异 |
|------|-----------|-----------|----------|
| **到期作废（Expire Worthless）** | 持仓清零 | 无 | 期权过期，价值归零，纯亏损 |
| **被指派（Assigned）** | 持仓清零 | 被动买入/卖出股票 | 到期时被行权方行使权利，义务方被指派 |
| **行权（Exercise）** | 持仓清零 | 主动买入/卖出股票 | 持有人选择行权（含主动行权和到期自动行权，**不做区分**） |

因此，仅靠 `trade_trigger = OPTION` 无法区分这三种场景。需要通过 `trigger_ref_type` 的不同枚举值来细分，仿照市场事件的设计模式：

| `trade_trigger` | `trigger_ref_type` | 含义 |
|-----------------|-------------------|------|
| `OPTION` | `OPTION_EXPIRE` | 期权到期 |
| `OPTION` | `OPTION_EXERCISE` | 行权（主动行权 + 自动行权，不区分） |
| `OPTION` | `OPTION_ASSIGNED` | 被指派 |

> **设计决策**：主动行权（Exercise）和到期自动行权（Auto Exercise）不做区分，统一为 `OPTION_EXERCISE`。两者在结果上完全一样——持有人行使权利，期权转化为股票持仓。是否自动触发只是券商的执行细节，对投资分析无影响。

### 重构后的期权操作场景映射

以下是方案二下，所有期权相关操作场景的 `TradeType` + `trade_trigger` + `trigger_ref_type` 组合：

| 操作场景 | 资产类型 | TradeType | trade_trigger | trigger_ref_type | trigger_ref_id | 说明 |
|---------|---------|-----------|---------------|------------------|----------------|------|
| **手动买入期权** | OPTION_CALL / OPTION_PUT | `BUY` | `MANUAL` | `NONE` | `0` | 用户主动在券商下单买入期权 |
| **手动卖出期权** | OPTION_CALL / OPTION_PUT | `SELL` | `MANUAL` | `NONE` | `0` | 用户主动在券商下单卖出期权 |
| **到期作废 — 期权侧** | OPTION_CALL / OPTION_PUT | `SELL` | `OPTION` | `OPTION_EXPIRE` | `0` | 原 `OPTION_EXPIRE`，持仓清零，价格=0，金额=0 |
| **行权 — 期权侧（持仓清零）** | OPTION_CALL / OPTION_PUT | `SELL` | `OPTION` | `OPTION_EXERCISE` | `0` | 行权后期权持仓归零，期权侧是触发源头 |
| **行权 — 股票侧（买入股票）** | STOCK | `BUY` | `OPTION` | `OPTION_EXERCISE` | `期权侧交易记录ID` | 原 `EXERCISE_BUY`，Call 行权买入股票 |
| **行权 — 股票侧（卖出股票）** | STOCK | `SELL` | `OPTION` | `OPTION_EXERCISE` | `期权侧交易记录ID` | 原 `EXERCISE_SELL`，Put 行权卖出股票 |
| **被指派 — 期权侧（持仓清零）** | OPTION_CALL / OPTION_PUT | `SELL` | `OPTION` | `OPTION_ASSIGNED` | `0` | 被指派后期权持仓归零，期权侧是触发源头 |
| **被指派 — 股票侧（被动买入）** | STOCK | `BUY` | `OPTION` | `OPTION_ASSIGNED` | `期权侧交易记录ID` | Put 卖方被指派，被动买入股票 |
| **被指派 — 股票侧（被动卖出）** | STOCK | `SELL` | `OPTION` | `OPTION_ASSIGNED` | `期权侧交易记录ID` | Call 卖方被指派，被动卖出股票 |

**关键结论**：
- 常规的期权买入和卖出（用户手动操作），`trade_trigger` 为 `MANUAL`，与普通股票交易完全一致
- 期权的被动操作统一 `trade_trigger = OPTION`，通过 `trigger_ref_type` 的三个值（`OPTION_EXPIRE` / `OPTION_EXERCISE` / `OPTION_ASSIGNED`）精确区分
- `TradeType` 只关注"做了什么"（买入 or 卖出），不关注"为什么"
- `trigger_ref_id` 的关联方式为**单向关联**：期权侧是触发源头（`trigger_ref_id = 0`），股票侧通过 `trigger_ref_id` 指向期权侧交易记录 ID，不存在循环引用。反查时通过 `trigger_ref_id = 期权交易ID` 即可找到对应的股票交易

---

## 四、方案对比

| 对比项 | 当前设计（5个） | 方案一：精简版（3个） | 方案二：极简版（2个） |
|--------|---------------|---------------------|---------------------|
| TradeType 枚举数 | 5 | 3 | 2 |
| 职责清晰度 | 混杂动作和原因 | 纯粹描述动作 | 纯粹描述动作 |
| 与 trigger 机制的一致性 | ❌ 不一致 | ✅ 完全一致 | ✅ 完全一致 |
| 持仓计算 case 分支 | 5 个 | 3 个 | 2 个 |
| 语义准确性 | 高（EXERCISE_BUY 直观） | 高（EXPIRE 有独立语义） | 略低（EXPIRE ≈ SELL 有点勉强） |
| 与市场事件设计标准统一 | ❌ 不统一 | ✅ 统一 | ✅ 统一 |

---

## 五、迁移影响范围（待确认方案后细化）

### 5.0 迁移总体策略：渐进式迁移

> **核心原则：温和迁移、渐进推进，避免一次性大爆炸式变更。**

#### 数据库迁移策略

- **数据库迁移脚本仅处理数据库结构变更**（如新增枚举值、新增字段），**不在脚本中处理数据迁移**
- 老体系下的枚举值（`OPTION_EXPIRE`、`EXERCISE_BUY`、`EXERCISE_SELL`）**暂时不删除**，先新增新的枚举值（`OPTION_EXPIRE`、`OPTION_EXERCISE`、`OPTION_ASSIGNED` 等 `trigger_ref_type` 相关值）
- 历史存量数据较少，采用**手动订正**的方式逐条修正为新体系的值
- 等存量数据全部订正完毕后，再通过后续迁移脚本移除旧枚举值

#### 前端迁移策略

- 前端同样采用**渐进式改动**，不会一步到位
- 在存量数据订正完成之前，前端需要同时兼容新旧两套枚举值的展示
- 中间过渡阶段会逐步设计过渡形态的 UI 交互
- 等存量数据全部订正完毕后，再进行前端的彻底清理和最终形态的改造

**初步过渡方案**：新增一个「期权事件」录入按钮，作为期权被动操作（到期 / 行权 / 被指派）的独立入口。这样可以在不改动现有常规交易录入流程的前提下，率先支持新体系的 `trade_trigger = OPTION` + `trigger_ref_type` 组合录入。后续再逐步将整体交易录入 UI 统一改造。

### 5.1 数据库层

- 修改 `trade_type_enum` 枚举类型（需数据迁移脚本）
- 已有数据的迁移映射：
  - `EXERCISE_BUY` → `BUY`
  - `EXERCISE_SELL` → `SELL`
  - `OPTION_EXPIRE` → `SELL`

### 5.2 后端代码

- `TradeType.java` 枚举类
- `PositionService.calculateQuantityDelta()` — 简化分支
- `TradeRecordService` — 创建交易记录时的类型选择逻辑
- 其他引用了 `OPTION_EXPIRE`、`EXERCISE_BUY`、`EXERCISE_SELL` 的代码

### 5.3 前端代码

- 交易类型下拉选项
- 交易记录列表的类型展示
- 交易详情页面
- 其他引用了这些枚举值的组件

---

## 六、待讨论事项

- [x] 确认采用哪个方案 → **已确认：方案二（极简版），TradeType 只保留 `BUY` / `SELL`**
- [x] 行权场景下，生成的股票交易记录和期权交易记录的 `trade_trigger` 关联方式确认 → **已确认：期权侧 `trigger_ref_id = 0`（触发源头），股票侧 `trigger_ref_id = 期权侧交易记录ID`（单向关联，无循环引用）**
- [x] 数据迁移策略：是否需要回填历史数据的 `trade_trigger` 字段 → **已确认：采用渐进式迁移策略。数据库迁移脚本仅处理结构变更，不处理数据迁移；老枚举值暂不删除，先新增新值；存量数据通过手动方式逐条订正；全部订正后再移除旧枚举值（详见第五节 5.0）**
- [x] 前端交易类型选择的 UI 交互是否需要调整 → **已确认：采用渐进式改动。存量数据订正期间前端兼容新旧两套值，中间设计过渡形态 UI；订正完成后再进行彻底清理和最终改造（详见第五节 5.0）**
- [x] 期权到期（原 `OPTION_EXPIRE`）归入 `SELL` 后，`trade_trigger` 如何区分 → **已明确：通过 `trigger_ref_type` 的三个枚举值区分：`OPTION_EXPIRE`（到期作废）、`OPTION_EXERCISE`（行权）、`OPTION_ASSIGNED`（被指派）**
- [x] 主动行权和自动行权是否需要区分 → **已确认：不做区分，统一为 `OPTION_EXERCISE`**
