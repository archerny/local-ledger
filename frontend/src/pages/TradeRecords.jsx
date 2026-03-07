import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col, Space, Descriptions, Statistic, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import dayjs from 'dayjs';
import { useAmountVisibility } from '../contexts/AmountVisibilityContext';
import { fetchAllTradeRecords, createTradeRecord, fetchTradeStatistics } from '../services/tradeRecordApi';
import { fetchActiveBrokers } from '../services/brokerApi';
import { fetchAllStrategies } from '../services/strategyApi';

// 证券类型：后端枚举 <-> 前端中文
const assetTypeMap = {
  STOCK: '股票',
  ETF: 'ETF',
  OPTION_CALL: 'CALL期权',
  OPTION_PUT: 'PUT期权',
};
const assetTypeReverseMap = Object.fromEntries(Object.entries(assetTypeMap).map(([k, v]) => [v, k]));

// 交易类型：后端枚举 <-> 前端中文
const tradeTypeMap = {
  BUY: '买入',
  SELL: '卖出',
  OPTION_EXPIRE: '期权到期',
  EXERCISE_BUY: '行权买股',
  EXERCISE_SELL: '行权卖股',
  EARLY_EXERCISE: '提前行权',
};
const tradeTypeReverseMap = Object.fromEntries(Object.entries(tradeTypeMap).map(([k, v]) => [v, k]));

// 交易记录表格列定义（需要 amountVisible、brokerMap、strategyMap 参数）
const getTradeColumns = (amountVisible, brokerMap, strategyMap, onViewDetail) => [
  {
    title: '日期',
    dataIndex: 'tradeDate',
    key: 'tradeDate',
    sorter: (a, b) => new Date(a.tradeDate) - new Date(b.tradeDate),
    width: 110,
  },
  {
    title: '类型',
    dataIndex: 'assetType',
    key: 'assetType',
    render: (assetType) => {
      const label = assetTypeMap[assetType] || assetType;
      const colorMap = {
        STOCK: 'blue',
        ETF: 'cyan',
        OPTION_CALL: 'green',
        OPTION_PUT: 'volcano',
      };
      return <Tag color={colorMap[assetType] || 'default'}>{label}</Tag>;
    },
    filters: Object.entries(assetTypeMap).map(([value, text]) => ({ text, value })),
    onFilter: (value, record) => record.assetType === value,
    width: 90,
  },
  {
    title: '代码',
    dataIndex: 'symbol',
    key: 'symbol',
    ellipsis: true,
    width: 160,
  },
  {
    title: '底层证券',
    dataIndex: 'name',
    key: 'name',
    render: (name, record) => {
      const code = record.underlyingSymbol || record.symbol;
      const displayName = name ? `${code}(${name})` : code;
      return <span title={displayName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{displayName}</span>;
    },
    width: 140,
    ellipsis: true,
  },
  {
    title: '方向',
    dataIndex: 'tradeType',
    key: 'tradeType',
    render: (tradeType) => {
      const label = tradeTypeMap[tradeType] || tradeType;
      const typeColorMap = {
        BUY: 'green',
        SELL: 'red',
        OPTION_EXPIRE: 'default',
        EXERCISE_BUY: 'cyan',
        EXERCISE_SELL: 'orange',
        EARLY_EXERCISE: 'purple',
      };
      return <Tag color={typeColorMap[tradeType] || 'default'}>{label}</Tag>;
    },
    filters: Object.entries(tradeTypeMap).map(([value, text]) => ({ text, value })),
    onFilter: (value, record) => record.tradeType === value,
    width: 90,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    render: (quantity) => amountVisible ? (quantity != null ? quantity.toLocaleString() : '-') : '****',
    sorter: (a, b) => a.quantity - b.quantity,
    width: 80,
  },
  {
    title: '价格',
    dataIndex: 'price',
    key: 'price',
    render: (price) => amountVisible ? (price != null ? Number(price).toFixed(2) : '-') : '****',
    sorter: (a, b) => a.price - b.price,
    width: 90,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount, record) => {
      if (!amountVisible) return <span style={{ fontWeight: 'bold', color: '#999' }}>****</span>;
      const amountColorMap = {
        BUY: '#cf1322',
        SELL: '#3f8600',
        OPTION_EXPIRE: '#999999',
        EXERCISE_BUY: '#cf1322',
        EXERCISE_SELL: '#3f8600',
        EARLY_EXERCISE: '#cf1322',
      };
      return (
        <span style={{
          color: amountColorMap[record.tradeType] || '#000000',
          fontWeight: 'bold'
        }}>
          {amount != null ? Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
        </span>
      );
    },
    sorter: (a, b) => a.amount - b.amount,
    width: 120,
  },
  {
    title: '费用',
    dataIndex: 'fee',
    key: 'fee',
    render: (fee) => amountVisible ? (fee != null ? Number(fee).toFixed(2) : '-') : '****',
    sorter: (a, b) => a.fee - b.fee,
    width: 80,
  },
  {
    title: '币种',
    dataIndex: 'currency',
    key: 'currency',
    render: (currency) => (
      <Tag color={currency === 'CNY' ? 'blue' : currency === 'HKD' ? 'green' : 'purple'}>{currency}</Tag>
    ),
    filters: [
      { text: 'CNY', value: 'CNY' },
      { text: 'USD', value: 'USD' },
      { text: 'HKD', value: 'HKD' },
    ],
    onFilter: (value, record) => record.currency === value,
    width: 80,
  },
  {
    title: '操作',
    key: 'action',
    width: 60,
    render: (_, record) => (
      <a onClick={() => onViewDetail(record)}>详情</a>
    ),
  },
];

const TradeRecords = () => {
  const [tradeData, setTradeData] = useState([]);
  const [brokerList, setBrokerList] = useState([]);
  const [strategyList, setStrategyList] = useState([]);
  const [brokerMap, setBrokerMap] = useState({});
  const [strategyMap, setStrategyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [selectedTradeType, setSelectedTradeType] = useState('BUY');
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const { amountVisible } = useAmountVisibility();

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const result = await fetchTradeStatistics();
      if (result.status === 'SUCCESS') {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('查询统计数据失败:', error);
    }
  };

  // 加载交易记录数据
  const loadTradeRecords = async () => {
    setLoading(true);
    try {
      const result = await fetchAllTradeRecords();
      if (result.status === 'SUCCESS') {
        const list = (result.data || []).map((item) => ({
          ...item,
          key: String(item.id),
        }));
        setTradeData(list);
      } else {
        message.error(result.message || '查询交易记录失败');
      }
    } catch (error) {
      console.error('查询交易记录失败:', error);
      message.error('查询交易记录失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 加载券商列表
  const loadBrokers = async () => {
    try {
      const result = await fetchActiveBrokers();
      if (result.status === 'SUCCESS') {
        const list = result.data || [];
        setBrokerList(list);
        const map = {};
        list.forEach((b) => { map[b.id] = b.brokerName; });
        setBrokerMap(map);
      }
    } catch (error) {
      console.error('查询券商列表失败:', error);
    }
  };

  // 加载策略列表
  const loadStrategies = async () => {
    try {
      const result = await fetchAllStrategies();
      if (result.status === 'SUCCESS') {
        const list = result.data || [];
        setStrategyList(list);
        const map = {};
        list.forEach((s) => { map[s.id] = s.strategyName; });
        setStrategyMap(map);
      }
    } catch (error) {
      console.error('查询策略列表失败:', error);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadTradeRecords();
    loadBrokers();
    loadStrategies();
    loadStatistics();
  }, []);

  // 查看详情
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState(null);

  const handleViewDetail = (record) => {
    setDetailRecord(record);
    setDetailVisible(true);
  };

  const tradeColumns = getTradeColumns(amountVisible, brokerMap, strategyMap, handleViewDetail);

  const handleAddRecord = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedTradeType('BUY');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 期权证券代码格式校验：CALL期权格式为 "底层证券代码-YYYYMMDD-C价格"，PUT期权格式为 "底层证券代码-YYYYMMDD-P价格"
      if (values.assetType === 'OPTION_CALL' || values.assetType === 'OPTION_PUT') {
        const optionFlag = values.assetType === 'OPTION_CALL' ? 'C' : 'P';
        const optionLabel = values.assetType === 'OPTION_CALL' ? 'CALL期权' : 'PUT期权';
        const underlying = values.underlyingSymbol?.trim();
        const symbol = values.symbol?.trim();
        const expectedPattern = new RegExp(`^${underlying.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{8})-${optionFlag}[\\d.]+$`);

        if (!expectedPattern.test(symbol)) {
          message.error(`${optionLabel}的证券代码格式不正确，应为：${underlying}-YYYYMMDD-${optionFlag}价格，例如：${underlying}-20250321-${optionFlag}150`);
          return;
        }

        // 校验日期部分是否为合法日期
        const dateStr = symbol.match(new RegExp(`^${underlying.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{8})-${optionFlag}`))[1];
        const dateObj = dayjs(dateStr, 'YYYYMMDD', true);
        if (!dateObj.isValid()) {
          message.error(`证券代码中的日期部分 ${dateStr} 不是合法日期，请检查`);
          return;
        }
      }

      setSubmitting(true);

      // 构建后端要求的数据格式
      const isOptionExpire = values.tradeType === 'OPTION_EXPIRE';
      // 期权（OPTION_CALL / OPTION_PUT）一个合约对应100股正股，金额需要乘以100
      const isOption = values.assetType === 'OPTION_CALL' || values.assetType === 'OPTION_PUT';
      const multiplier = isOption ? 100 : 1;
      // 期权到期时，价格和费用均为0，金额也为0
      const price = isOptionExpire ? 0 : values.price;
      const fee = isOptionExpire ? 0 : values.fee;
      const payload = {
        tradeDate: values.date.format('YYYY-MM-DD'),
        brokerId: values.brokerId,
        assetType: values.assetType,
        symbol: values.symbol,
        name: values.name,
        underlyingSymbol: values.underlyingSymbol,
        tradeType: values.tradeType,
        quantity: values.quantity,
        price: price,
        amount: values.quantity * price * multiplier,
        fee: fee,
        currency: values.currency,
        strategyId: values.strategyId || null,
      };

      const result = await createTradeRecord(payload);
      if (result.status === 'SUCCESS') {
        message.success('交易记录添加成功！');
        setIsModalVisible(false);
        form.resetFields();
        setSelectedTradeType('BUY');
        loadTradeRecords();
        loadStatistics();
      } else {
        message.error(result.message || '新增交易记录失败');
      }
    } catch (error) {
      if (error.errorFields) {
        // 表单验证失败
        console.error('表单验证失败:', error);
      } else {
        console.error('新增交易记录失败:', error);
        const errorMsg = error.response?.data?.message || '新增交易记录失败，请稍后重试';
        message.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 饼图数据
  const pieData = statistics ? [
    { type: '股票', value: statistics.stockCount || 0 },
    { type: 'CALL期权', value: statistics.optionCallCount || 0 },
    { type: 'PUT期权', value: statistics.optionPutCount || 0 },
    { type: 'ETF', value: statistics.etfCount || 0 },
  ].filter(item => item.value > 0) : [];

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
    <div>
      {/* 统计数据区域 */}
      {statistics && (
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
                        <span style={{ color: '#69b1ff', fontWeight: 'bold' }}>¥ {Number(statistics.totalFeeCNY).toFixed(2)}</span>
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
                // 为每条数据附加颜色
                const barData = statistics.topSymbols.map((item, idx) => ({
                  symbol: item.symbol,
                  count: item.count,
                  fill: barColors[idx % barColors.length],
                })); // 后端已按 count 降序排列，直接使用

                // 自定义 Tooltip
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
      )}

    <Card
      title="交易记录"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>所属策略：</span>
          <Select
            allowClear
            placeholder="选择策略"
            style={{ width: 150 }}
            value={selectedStrategy}
            onChange={(value) => setSelectedStrategy(value || null)}
          >
            {strategyList.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.strategyName}</Select.Option>
            ))}
          </Select>
          <span>底层证券：</span>
          <Input
            allowClear
            placeholder="输入证券代码，如 AAPL"
            style={{ width: 200 }}
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value || null)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>
            新增记录
          </Button>
        </div>
      }
    >
      <Table
        columns={tradeColumns}
        dataSource={tradeData.filter((item) => {
          if (selectedStrategy && item.strategyId !== selectedStrategy) return false;
          if (selectedAsset) {
            const underlying = (item.underlyingSymbol || item.symbol || '').toUpperCase();
            if (!underlying.includes(selectedAsset.toUpperCase())) return false;
          }
          return true;
        })}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        size="middle"
      />

      <Modal
        title="新增交易记录"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            提交
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currency: 'USD',
            tradeType: 'BUY',
            assetType: 'STOCK',
          }}
          style={{ marginTop: 20 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="交易日期"
                name="date"
                rules={[{ required: true, message: '请选择交易日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="券商"
                name="brokerId"
                rules={[{ required: true, message: '请选择券商' }]}
              >
                <Select placeholder="请选择券商">
                  {brokerList.map((b) => (
                    <Select.Option key={b.id} value={b.id}>{b.brokerName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="证券类型"
                name="assetType"
                rules={[{ required: true, message: '请选择证券类型' }]}
              >
                <Select>
                  {Object.entries(assetTypeMap).map(([value, label]) => (
                    <Select.Option key={value} value={value}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="交易类型"
                name="tradeType"
                rules={[{ required: true, message: '请选择交易类型' }]}
              >
                <Select
                  onChange={(value) => {
                    setSelectedTradeType(value);
                    if (value === 'OPTION_EXPIRE') {
                      // 期权到期时，自动清除价格和费用字段
                      form.setFieldsValue({ price: undefined, fee: undefined });
                    }
                  }}
                >
                  {Object.entries(tradeTypeMap).map(([value, label]) => (
                    <Select.Option key={value} value={value}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="证券代码"
                name="symbol"
                rules={[{ required: true, message: '请输入证券代码' }]}
              >
                <Input placeholder="例如：AAPL 或 600519" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="底层证券名称"
                name="name"
                rules={[{ required: true, message: '请输入底层证券名称' }]}
              >
                <Input placeholder="例如：苹果公司、特斯拉" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="底层证券代码"
            name="underlyingSymbol"
            rules={[{ required: true, message: '请输入底层证券代码' }]}
            extra="用于关联分析期权与正股收益，例如：TSLA、AAPL"
          >
            <Input placeholder="例如：TSLA、AAPL" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={selectedTradeType === 'OPTION_EXPIRE' ? 24 : 8}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[
                  { required: true, message: '请输入交易数量' },
                  { type: 'number', min: 1, message: '数量必须大于0' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入数量" min={1} />
              </Form.Item>
            </Col>
            {selectedTradeType !== 'OPTION_EXPIRE' && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="成交价格"
                    name="price"
                    rules={[
                      { required: true, message: '请输入成交价格' },
                      { type: 'number', min: 0, message: '价格不能为负' },
                    ]}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="请输入价格" min={0} precision={4} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="交易费用"
                    name="fee"
                    rules={[
                      { required: true, message: '请输入交易费用' },
                      { type: 'number', min: 0, message: '费用不能为负数' },
                    ]}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="请输入费用" min={0} precision={2} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="币种"
                name="currency"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select>
                  <Select.Option value="CNY">CNY - 人民币</Select.Option>
                  <Select.Option value="USD">USD - 美元</Select.Option>
                  <Select.Option value="HKD">HKD - 港币</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="所属策略"
                name="strategyId"
              >
                <Select allowClear placeholder="请选择策略（选填）">
                  {strategyList.map((s) => (
                    <Select.Option key={s.id} value={s.id}>{s.strategyName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 查看详情弹框 */}
      <Modal
        title="交易记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={650}
        destroyOnClose
      >
        {detailRecord && (
          <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="交易日期">{detailRecord.tradeDate}</Descriptions.Item>
            <Descriptions.Item label="券商">{brokerMap[detailRecord.brokerId] || `ID:${detailRecord.brokerId}`}</Descriptions.Item>
            <Descriptions.Item label="证券类型">
              <Tag color={{ STOCK: 'blue', ETF: 'cyan', OPTION_CALL: 'green', OPTION_PUT: 'volcano' }[detailRecord.assetType] || 'default'}>
                {assetTypeMap[detailRecord.assetType] || detailRecord.assetType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="证券代码">{detailRecord.symbol}</Descriptions.Item>
            <Descriptions.Item label="底层证券名称">{detailRecord.name || '-'}</Descriptions.Item>
<Descriptions.Item label="底层证券">{detailRecord.underlyingSymbol}</Descriptions.Item>
            <Descriptions.Item label="交易类型">
              <Tag color={{ BUY: 'green', SELL: 'red', OPTION_EXPIRE: 'default', EXERCISE_BUY: 'cyan', EXERCISE_SELL: 'orange', EARLY_EXERCISE: 'purple' }[detailRecord.tradeType] || 'default'}>
                {tradeTypeMap[detailRecord.tradeType] || detailRecord.tradeType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="数量">
              {amountVisible ? (detailRecord.quantity != null ? detailRecord.quantity.toLocaleString() : '-') : '****'}
            </Descriptions.Item>
            <Descriptions.Item label="成交价格">
              {amountVisible ? (detailRecord.price != null ? Number(detailRecord.price).toFixed(4) : '-') : '****'}
            </Descriptions.Item>
            <Descriptions.Item label="成交金额">
              {amountVisible ? (detailRecord.amount != null ? Number(detailRecord.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-') : '****'}
            </Descriptions.Item>
            <Descriptions.Item label="交易费用">
              {amountVisible ? (detailRecord.fee != null ? Number(detailRecord.fee).toFixed(2) : '-') : '****'}
            </Descriptions.Item>
            <Descriptions.Item label="币种">
              <Tag color={detailRecord.currency === 'CNY' ? 'blue' : detailRecord.currency === 'HKD' ? 'green' : 'purple'}>
                {detailRecord.currency}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属策略">
              {detailRecord.strategyId ? (strategyMap[detailRecord.strategyId] || `ID:${detailRecord.strategyId}`) : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
    </div>
  );
};

export default TradeRecords;
