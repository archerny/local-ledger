import axios from 'axios';

const BASE_URL = '/api/brokers';

/**
 * 查询所有券商
 * GET /api/brokers
 */
export const fetchAllBrokers = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

/**
 * 根据ID查询券商
 * GET /api/brokers/{id}
 */
export const fetchBrokerById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * 查询所有启用的券商
 * GET /api/brokers/active
 */
export const fetchActiveBrokers = async () => {
  const response = await axios.get(`${BASE_URL}/active`);
  return response.data;
};

/**
 * 根据国家/地区查询券商
 * GET /api/brokers/country/{country}
 */
export const fetchBrokersByCountry = async (country) => {
  const response = await axios.get(`${BASE_URL}/country/${country}`);
  return response.data;
};

/**
 * 根据关键词搜索券商
 * GET /api/brokers/search?keyword=xxx
 */
export const searchBrokers = async (keyword) => {
  const response = await axios.get(`${BASE_URL}/search`, { params: { keyword } });
  return response.data;
};

/**
 * 新增券商
 * POST /api/brokers
 */
export const createBroker = async (broker) => {
  const response = await axios.post(BASE_URL, broker);
  return response.data;
};

/**
 * 更新券商信息
 * PUT /api/brokers/{id}
 */
export const updateBroker = async (id, broker) => {
  const response = await axios.put(`${BASE_URL}/${id}`, broker);
  return response.data;
};

/**
 * 删除券商
 * DELETE /api/brokers/{id}
 */
export const deleteBroker = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
