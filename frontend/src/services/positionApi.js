import axios from 'axios';

const BASE_URL = '/api/positions';

/**
 * 查询截止某日期的持仓快照
 * GET /api/positions?date=YYYY-MM-DD&brokerId=xxx
 *
 * @param {string} date 截止日期，格式 YYYY-MM-DD（必填）
 * @param {number|null} brokerId 券商ID（可选）
 */
export const fetchPositions = async (date, brokerId = null) => {
  const params = { date };
  if (brokerId) {
    params.brokerId = brokerId;
  }
  const response = await axios.get(BASE_URL, { params });
  return response.data;
};
