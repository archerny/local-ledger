import React from 'react';
import { Card, Row, Col, Statistic, Divider } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

/**
 * 交易统计面板组件
 * 包含：交易概览 + 交易类型分布饼图 + Top 10 热门证券柱状图
 */
const TradeStatisticsPanel = ({ statistics, amountVisible }) => {
  if (!statistics) return null;

  // 饼图数据
  const pieData = [
    { type: '股票', value: statistics.stockCount || 0 },
    { type: 'CALL期权', value: statistics.optionCallCount || 0 },
    { type: 'PUT期权', value: statistics.optionPutCount || 0 },
    { type: 'ETF', value: statistics.etfCount || 0 },
  ].filter(item => item.value > 0);

  // 饼图颜色映射
  const PIE_COLORS = {
    '股票': '#1890ff',
    'CALL期权': '#52c41a',
    'PUT期权': '#ff7875',
    'ETF': '#13c2c2',
  };

  // 自定义饼图标签渲染
  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // 自定义 Tooltip
  const PieTooltipContent = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = statistics ? ((data.value / statistics.totalCount) * 100).toFixed(1) : 0;
      return (
        <div style={{ background: '#fff', padding: '8px 12px', border: '1px solid #e8e8e8', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          <div style={{ color: data.payload.fill || '#333', fontWeight: 500 }}>{data.name}</div>
          <div style={{ color: '#666', fontSize: 13 }}>{`${data.value}次 (${percent}%)`}</div>
        </div>
      );
    }
    return null;
  };

  // 自定义图例格式化
  const pieLegendFormatter = (value) => {
    const item = pieData.find(d => d.type === value);
    const count = item ? item.value : 0;
    return <span style={{ color: '#666', fontSize: 13 }}>{value}  {count}次</span>;
  };

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      {/* 左侧：交易概览 */}
      <Col span={6}>
        <Card title="交易概览" size="small" style={{ height: '100%' }}>
          <Statistic
            title="总交易次数"
            value={statistics.totalCount}
            suffix="次"
            valueStyle={{ color: '#1890ff', fontSize: 28 }}
          />
          <Divider style={{ margin: '12px 0' }} />
          <Statistic
            title="涉及证券数"
            value={statistics.distinctSymbolCount || 0}
            suffix="只"
            valueStyle={{ color: '#36cfc9', fontSize: 28 }}
          />
          <Divider style={{ margin: '12px 0' }} />
          <div>
            <div style={{ color: 'rgba(0, 0, 0, 0.45)', marginBottom: 8, fontSize: 14 }}>总交易费用</div>
            {amountVisible ? (
              <div style={{ fontSize: 16 }}>
                {statistics.totalFeeUSD > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: '#9254de', fontWeight: 'bold' }}>US$ {Number(statistics.totalFeeUSD).toFixed(2)}</span>
                  </div>
                )}
                {statistics.totalFeeCNY > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: '#69b1ff', fontWeight: 'bold' }}>CN¥ {Number(statistics.totalFeeCNY).toFixed(2)}</span>
                  </div>
                )}
                {statistics.totalFeeHKD > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: '#95de64', fontWeight: 'bold' }}>HK$ {Number(statistics.totalFeeHKD).toFixed(2)}</span>
                  </div>
                )}
                {statistics.totalFeeUSD <= 0 && statistics.totalFeeCNY <= 0 && statistics.totalFeeHKD <= 0 && (
                  <span style={{ color: '#999' }}>暂无费用数据</span>
                )}
              </div>
            ) : (
              <span style={{ color: '#999', fontSize: 24, fontWeight: 'bold' }}>****</span>
            )}
          </div>
        </Card>
      </Col>
      {/* 中间：交易类型分布饼图 */}
      <Col span={9}>
        <Card title="交易类型分布" size="small" style={{ height: '100%' }}>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="type"
                  cx="40%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  stroke="#fff"
                  strokeWidth={2}
                  label={renderPieLabel}
                  labelLine={false}
                  isAnimationActive={true}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.type} fill={PIE_COLORS[entry.type] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={pieLegendFormatter}
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ paddingLeft: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              暂无交易数据
            </div>
          )}
        </Card>
      </Col>
      {/* 右侧：Top 10 热门证券（Recharts 水平条形图） */}
      <Col span={9}>
        <Card title="Top 10 热门证券" size="small" style={{ height: '100%' }}>
          {statistics.topSymbols && statistics.topSymbols.length > 0 ? (() => {
            const barColors = ['#597ef7', '#73d13d', '#ff7a45', '#36cfc9', '#f759ab',
                               '#ffc53d', '#40a9ff', '#9254de', '#ff4d4f', '#95de64'];
            const barData = statistics.topSymbols.map((item, idx) => ({
              symbol: item.symbol,
              count: item.count,
              fill: barColors[idx % barColors.length],
            }));

            const BarTooltipContent = ({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{ background: '#fff', padding: '6px 12px', border: '1px solid #e8e8e8', borderRadius: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <div style={{ color: '#333', fontWeight: 500, marginBottom: 2 }}>{data.symbol}</div>
                    <div style={{ color: '#666', fontSize: 13 }}>交易次数：<span style={{ color: data.fill, fontWeight: 'bold' }}>{data.count}次</span></div>
                  </div>
                );
              }
              return null;
            };

            return (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#999' }}
                    axisLine={{ stroke: '#e8e8e8' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="symbol"
                    width={72}
                    tick={{ fontSize: 12, fill: '#333' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<BarTooltipContent />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    isAnimationActive={true}
                    label={{ position: 'right', fill: '#666', fontSize: 12, formatter: (v) => `${v}次` }}
                  >
                    {barData.map((entry, idx) => (
                      <Cell key={`bar-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })() : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              暂无数据
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default TradeStatisticsPanel;
