import axios from 'axios';

const BASE_URL = '/api/strategies';

/**
 * 查询所有策略
 * GET /api/strategies
 */
export const fetchAllStrategies = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

/**
 * 根据ID查询策略
 * GET /api/strategies/{id}
 */
export const fetchStrategyById = async (id) => {
  const response = await axios.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * 新增策略
 * POST /api/strategies
 */
export const createStrategy = async (strategy) => {
  const response = await axios.post(BASE_URL, strategy);
  return response.data;
};

/**
 * 更新策略
 * PUT /api/strategies/{id}
 */
export const updateStrategy = async (id, strategy) => {
  const response = await axios.put(`${BASE_URL}/${id}`, strategy);
  return response.data;
};

/**
 * 删除策略（软删除）
 * DELETE /api/strategies/{id}
 */
export const deleteStrategy = async (id) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
