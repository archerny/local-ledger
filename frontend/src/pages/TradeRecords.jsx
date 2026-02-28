import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col, Popconfirm, Space } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAmountVisibility } from '../contexts/AmountVisibilityContext';
import { fetchAllTradeRecords, createTradeRecord, deleteTradeRecord } from '../services/tradeRecordApi';
import { fetchAllBrokers } from '../services/brokerApi';
import { fetchAllStrategies } from '../services/strategyApi';

// 证券类型：后端枚举 <-> 前端中文
const assetTypeMap = {
  STOCK: '股票',
  ETF: 'ETF',
  OPTION_CALL: '期权CALL',
  OPTION_PUT: '期权PUT',
};
const assetTypeReverseMap = Object.fromEntries(Object.entries(assetTypeMap).map(([k, v]) => [v, k]));

// 交易类型：后端枚举 <-> 前端中文
const tradeTypeMap = {
  BUY: '买入',
  SELL: '卖出',
  OPTION_EXPIRE: '期权到期',
  EXERCISE_BUY: '行权买入',
  EXERCISE_SELL: '行权卖出',
  EARLY_EXERCISE: '提前行权',
};
const tradeTypeReverseMap = Object.fromEntries(Object.entries(tradeTypeMap).map(([k, v]) => [v, k]));

// 交易记录表格列定义（需要 amountVisible、brokerMap、strategyMap 参数）
const getTradeColumns = (amountVisible, brokerMap, strategyMap, onDelete) => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 70,
    sorter: (a, b) => a.id - b.id,
  },
  {
    title: '日期',
    dataIndex: 'tradeDate',
    key: 'tradeDate',
    sorter: (a, b) => new Date(a.tradeDate) - new Date(b.tradeDate),
    width: 120,
  },
  {
    title: '券商',
    dataIndex: 'brokerId',
    key: 'brokerId',
    render: (brokerId) => brokerMap[brokerId] || `ID:${brokerId}`,
    width: 120,
  },
  {
    title: '证券类型',
    dataIndex: 'assetType',
    key: 'assetType',
    render: (assetType) => {
      const label = assetTypeMap[assetType] || assetType;
      const colorMap = {
        STOCK: 'blue',
        ETF: 'cyan',
        OPTION_CALL: 'green',
        OPTION_PUT: 'red',
      };
      return <Tag color={colorMap[assetType] || 'default'}>{label}</Tag>;
    },
    filters: Object.entries(assetTypeMap).map(([value, text]) => ({ text, value })),
    onFilter: (value, record) => record.assetType === value,
    width: 100,
  },
  {
    title: '代码',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 180,
  },
  {
    title: '底层证券',
    dataIndex: 'name',
    key: 'name',
    render: (name, record) => {
      // 期权显示底层资产代号，股票/ETF显示自身代号
      return record.underlyingSymbol || record.symbol;
    },
    width: 120,
  },
  {
    title: '交易类型',
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
    width: 100,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    render: (quantity) => amountVisible ? (quantity != null ? quantity.toLocaleString() : '-') : '****',
    sorter: (a, b) => a.quantity - b.quantity,
    width: 100,
  },
  {
    title: '成交价格',
    dataIndex: 'price',
    key: 'price',
    render: (price) => amountVisible ? (price != null ? Number(price).toFixed(2) : '-') : '****',
    sorter: (a, b) => a.price - b.price,
    width: 120,
  },
  {
    title: '成交金额',
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
    width: 140,
  },
  {
    title: '交易费用',
    dataIndex: 'fee',
    key: 'fee',
    render: (fee) => amountVisible ? (fee != null ? Number(fee).toFixed(2) : '-') : '****',
    sorter: (a, b) => a.fee - b.fee,
    width: 120,
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
    title: '所属策略',
    dataIndex: 'strategyId',
    key: 'strategyId',
    render: (strategyId) => strategyId ? (strategyMap[strategyId] || `ID:${strategyId}`) : '-',
    width: 140,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    render: (_, record) => (
      <Popconfirm
        title="确认删除"
        description={`确定要删除此交易记录吗？`}
        onConfirm={() => onDelete(record)}
        okText="确认"
        cancelText="取消"
        icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
      >
        <a style={{ color: '#ff4d4f' }}>删除</a>
      </Popconfirm>
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [form] = Form.useForm();
  const { amountVisible } = useAmountVisibility();

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
      const result = await fetchAllBrokers();
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
  }, []);

  // 删除交易记录
  const handleDelete = async (record) => {
    try {
      const result = await deleteTradeRecord(record.id);
      if (result.status === 'SUCCESS') {
        message.success('交易记录已删除');
        loadTradeRecords();
      } else {
        message.error(result.message || '删除交易记录失败');
      }
    } catch (error) {
      console.error('删除交易记录失败:', error);
      const errorMsg = error.response?.data?.message || '删除交易记录失败，请稍后重试';
      message.error(errorMsg);
    }
  };

  const tradeColumns = getTradeColumns(amountVisible, brokerMap, strategyMap, handleDelete);

  const handleAddRecord = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 构建后端要求的数据格式
      const payload = {
        tradeDate: values.date.format('YYYY-MM-DD'),
        brokerId: values.brokerId,
        assetType: values.assetType,
        symbol: values.symbol,
        name: values.name,
        underlyingSymbol: values.underlyingSymbol || null,
        tradeType: values.tradeType,
        quantity: values.quantity,
        price: values.price,
        amount: values.quantity * values.price,
        fee: values.fee,
        currency: values.currency,
        strategyId: values.strategyId || null,
      };

      const result = await createTradeRecord(payload);
      if (result.status === 'SUCCESS') {
        message.success('交易记录添加成功！');
        setIsModalVisible(false);
        form.resetFields();
        loadTradeRecords();
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

  return (
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
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1530 }}
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
            currency: 'CNY',
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
                <Select>
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
                label="证券名称"
                name="name"
                rules={[{ required: true, message: '请输入证券名称' }]}
              >
                <Input placeholder="例如：苹果公司" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="底层证券代码（期权时填写，股票/ETF可不填）"
            name="underlyingSymbol"
          >
            <Input placeholder="例如：TSLA、AAPL" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
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
    </Card>
  );
};

export default TradeRecords;
