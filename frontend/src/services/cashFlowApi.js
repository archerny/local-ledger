import axios from 'axios';

const BASE_URL = '/api/cash-flow-records';

/**
 * 查询所有出入金记录
 * GET /api/cash-flow-records
 */
export const fetchAllCashFlowRecords = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

/**
 * 根据ID查询出入金记录
 * GET /api/cash-flow-records/{id}
 */
export const fetchCashFlowRecordById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * 根据券商ID查询出入金记录
 * GET /api/cash-flow-records/broker/{brokerId}
 */
export const fetchCashFlowRecordsByBrokerId = async (brokerId) => {
  const response = await axios.get(`${BASE_URL}/broker/${brokerId}`);
  return response.data;
};

/**
 * 根据记录类型查询
 * GET /api/cash-flow-records/type/{recordType}
 */
export const fetchCashFlowRecordsByType = async (recordType) => {
  const response = await axios.get(`${BASE_URL}/type/${recordType}`);
  return response.data;
};

/**
 * 根据日期范围查询
 * GET /api/cash-flow-records/date-range?startDate=xxx&endDate=xxx
 */
export const fetchCashFlowRecordsByDateRange = async (startDate, endDate) => {
  const response = await axios.get(`${BASE_URL}/date-range`, {
    params: { startDate, endDate },
  });
  return response.data;
};

/**
 * 新增出入金记录
 * POST /api/cash-flow-records
 */
export const createCashFlowRecord = async (record) => {
  const response = await axios.post(BASE_URL, record);
  return response.data;
};

/**
 * 删除出入金记录（软删除）
 * DELETE /api/cash-flow-records/{id}
 */
export const deleteCashFlowRecord = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
