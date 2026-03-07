import axios from 'axios';

const BASE_URL = '/api/market-events';

// ============================================================
// 代码变更事件 API
// ============================================================

/**
 * 查询所有代码变更事件
 * GET /api/market-events/symbol-change
 */
export const fetchAllSymbolChangeEvents = async () => {
  const response = await axios.get(`${BASE_URL}/symbol-change`);
  return response.data;
};

/**
 * 根据ID查询代码变更事件
 * GET /api/market-events/symbol-change/{id}
 */
export const fetchSymbolChangeEventById = async (id) => {
  const response = await axios.get(`${BASE_URL}/symbol-change/${id}`);
  return response.data;
};

/**
 * 新增代码变更事件
 * POST /api/market-events/symbol-change
 */
export const createSymbolChangeEvent = async (event) => {
  const response = await axios.post(`${BASE_URL}/symbol-change`, event);
  return response.data;
};

/**
 * 更新代码变更事件
 * PUT /api/market-events/symbol-change/{id}
 */
export const updateSymbolChangeEvent = async (id, event) => {
  const response = await axios.put(`${BASE_URL}/symbol-change/${id}`, event);
  return response.data;
};

/**
 * 删除代码变更事件（软删除）
 * DELETE /api/market-events/symbol-change/{id}
 */
export const deleteSymbolChangeEvent = async (id) => {
  const response = await axios.delete(`${BASE_URL}/symbol-change/${id}`);
  return response.data;
};

// ============================================================
// 拆股事件 API
// ============================================================

/**
 * 查询所有拆股事件
 * GET /api/market-events/stock-split
 */
export const fetchAllStockSplitEvents = async () => {
  const response = await axios.get(`${BASE_URL}/stock-split`);
  return response.data;
};

/**
 * 根据ID查询拆股事件
 * GET /api/market-events/stock-split/{id}
 */
export const fetchStockSplitEventById = async (id) => {
  const response = await axios.get(`${BASE_URL}/stock-split/${id}`);
  return response.data;
};

/**
 * 新增拆股事件
 * POST /api/market-events/stock-split
 */
export const createStockSplitEvent = async (event) => {
  const response = await axios.post(`${BASE_URL}/stock-split`, event);
  return response.data;
};

/**
 * 更新拆股事件
 * PUT /api/market-events/stock-split/{id}
 */
export const updateStockSplitEvent = async (id, event) => {
  const response = await axios.put(`${BASE_URL}/stock-split/${id}`, event);
  return response.data;
};

/**
 * 删除拆股事件（软删除）
 * DELETE /api/market-events/stock-split/{id}
 */
export const deleteStockSplitEvent = async (id) => {
  const response = await axios.delete(`${BASE_URL}/stock-split/${id}`);
  return response.data;
};

// ============================================================
// 实物分红事件 API
// ============================================================

/**
 * 查询所有实物分红事件
 * GET /api/market-events/dividend-in-kind
 */
export const fetchAllDividendInKindEvents = async () => {
  const response = await axios.get(`${BASE_URL}/dividend-in-kind`);
  return response.data;
};

/**
 * 根据ID查询实物分红事件
 * GET /api/market-events/dividend-in-kind/{id}
 */
export const fetchDividendInKindEventById = async (id) => {
  const response = await axios.get(`${BASE_URL}/dividend-in-kind/${id}`);
  return response.data;
};

/**
 * 新增实物分红事件
 * POST /api/market-events/dividend-in-kind
 */
export const createDividendInKindEvent = async (event) => {
  const response = await axios.post(`${BASE_URL}/dividend-in-kind`, event);
  return response.data;
};

/**
 * 更新实物分红事件
 * PUT /api/market-events/dividend-in-kind/{id}
 */
export const updateDividendInKindEvent = async (id, event) => {
  const response = await axios.put(`${BASE_URL}/dividend-in-kind/${id}`, event);
  return response.data;
};

/**
 * 删除实物分红事件（软删除）
 * DELETE /api/market-events/dividend-in-kind/{id}
 */
export const deleteDividendInKindEvent = async (id) => {
  const response = await axios.delete(`${BASE_URL}/dividend-in-kind/${id}`);
  return response.data;
};
