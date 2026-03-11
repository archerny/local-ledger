// 证券类型：后端枚举 <-> 前端中文
export const assetTypeMap = {
  STOCK: '股票',
  ETF: 'ETF',
  OPTION_CALL: 'CALL期权',
  OPTION_PUT: 'PUT期权',
};
export const assetTypeReverseMap = Object.fromEntries(Object.entries(assetTypeMap).map(([k, v]) => [v, k]));

// 证券类型 Tag 颜色
export const assetTypeColorMap = {
  STOCK: 'blue',
  ETF: 'cyan',
  OPTION_CALL: 'green',
  OPTION_PUT: 'volcano',
};

// 交易类型：后端枚举 <-> 前端中文
// 重构后仅使用 BUY / SELL，旧值保留兼容存量数据展示
export const tradeTypeMap = {
  BUY: '买入',
  SELL: '卖出',
  // 以下旧值已废弃，保留仅为兼容存量历史数据展示，待数据订正完成后移除
  OPTION_EXPIRE: '期权到期（旧）',
  EXERCISE_BUY: '行权买股（旧）',
  EXERCISE_SELL: '行权卖股（旧）',
};
export const tradeTypeReverseMap = Object.fromEntries(Object.entries(tradeTypeMap).map(([k, v]) => [v, k]));

// 交易类型 Tag 颜色
export const tradeTypeColorMap = {
  BUY: 'green',
  SELL: 'red',
  // 以下旧值已废弃，保留仅为兼容存量历史数据展示
  OPTION_EXPIRE: 'default',
  EXERCISE_BUY: 'cyan',
  EXERCISE_SELL: 'orange',
};

// 金额颜色映射（按交易类型）
export const amountColorMap = {
  BUY: '#cf1322',
  SELL: '#3f8600',
  // 以下旧值已废弃，保留仅为兼容存量历史数据展示
  OPTION_EXPIRE: '#999999',
  EXERCISE_BUY: '#cf1322',
  EXERCISE_SELL: '#3f8600',
};

// 币种选项
export const currencyOptions = [
  { label: '🇨🇳 CNY（人民币）', value: 'CNY' },
  { label: '🇭🇰 HKD（港币）', value: 'HKD' },
  { label: '🇺🇸 USD（美元）', value: 'USD' },
];

// 币种颜色映射
export const currencyColorMap = {
  CNY: 'red',
  HKD: 'green',
  USD: 'purple',
};

// 交易触发来源：后端枚举 <-> 前端中文
export const tradeTriggerMap = {
  MANUAL: '手动交易',
  OPTION: '期权',
  MARKET_EVENT: '市场事件',
};

// 交易触发来源 Tag 颜色
export const tradeTriggerColorMap = {
  MANUAL: 'blue',
  OPTION: 'purple',
  MARKET_EVENT: 'orange',
};

// 触发关联类型：后端枚举 <-> 前端中文
export const triggerRefTypeMap = {
  NONE: '无关联',
  STOCK_SPLIT: '拆股事件',
  SYMBOL_CHANGE: '代码变更',
  DIVIDEND_IN_KIND: '实物分红',
OPTION_EXPIRE: '期权到期',
  OPTION_EXERCISE: '行权',
  OPTION_ASSIGNED: '被指派',
  // 以下旧值已废弃，保留仅为兼容存量历史数据展示
  OPTION: '期权记录（旧）',
};

// 触发关联类型 Tag 颜色
export const triggerRefTypeColorMap = {
  NONE: 'default',
  STOCK_SPLIT: 'blue',
  SYMBOL_CHANGE: 'green',
  DIVIDEND_IN_KIND: 'orange',
  OPTION_EXPIRE: 'red',
  OPTION_EXERCISE: 'purple',
  OPTION_ASSIGNED: 'magenta',
  OPTION: 'default',
};
