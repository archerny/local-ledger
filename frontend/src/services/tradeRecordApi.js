import axios from 'axios';

const BASE_URL = '/api/trade-records';

/**
 * 查询所有交易记录
 * GET /api/trade-records
 */
export const fetchAllTradeRecords = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

/**
 * 根据ID查询交易记录
 * GET /api/trade-records/{id}
 */
export const fetchTradeRecordById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * 根据券商ID查询交易记录
 * GET /api/trade-records/broker/{brokerId}
 */
export const fetchTradeRecordsByBrokerId = async (brokerId) => {
  const response = await axios.get(`${BASE_URL}/broker/${brokerId}`);
  return response.data;
};

/**
 * 根据证券类型查询交易记录
 * GET /api/trade-records/asset-type/{assetType}
 */
export const fetchTradeRecordsByAssetType = async (assetType) => {
  const response = await axios.get(`${BASE_URL}/asset-type/${assetType}`);
  return response.data;
};

/**
 * 根据策略ID查询交易记录
 * GET /api/trade-records/strategy/{strategyId}
 */
export const fetchTradeRecordsByStrategyId = async (strategyId) => {
  const response = await axios.get(`${BASE_URL}/strategy/${strategyId}`);
  return response.data;
};

/**
 * 根据证券代码搜索交易记录
 * GET /api/trade-records/search?symbol=xxx
 */
export const searchTradeRecordsBySymbol = async (symbol) => {
  const response = await axios.get(`${BASE_URL}/search`, { params: { symbol } });
  return response.data;
};

/**
 * 根据日期范围查询交易记录
 * GET /api/trade-records/date-range?startDate=xxx&endDate=xxx
 */
export const fetchTradeRecordsByDateRange = async (startDate, endDate) => {
  const response = await axios.get(`${BASE_URL}/date-range`, {
    params: { startDate, endDate },
  });
  return response.data;
};

/**
 * 新增交易记录
 * POST /api/trade-records
 */
export const createTradeRecord = async (record) => {
  const response = await axios.post(BASE_URL, record);
  return response.data;
};

/**
 * 更新交易记录
 * PUT /api/trade-records/{id}
 */
export const updateTradeRecord = async (id, record) => {
  const response = await axios.put(`${BASE_URL}/${id}`, record);
  return response.data;
};

/**
 * 删除交易记录（软删除）
 * DELETE /api/trade-records/{id}
 */
export const deleteTradeRecord = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
