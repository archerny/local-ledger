import React, { useState } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';

// 交易记录示例数据
const tradeRecordsData = [
  {
    key: '1',
    id: 1,
    date: '2024-01-15',
    broker: '华泰证券',
    assetType: '股票',
    symbol: 'AAPL',
    name: '苹果公司',
    type: '买入',
    quantity: 100,
    price: 185.50,
    amount: 18550.00,
    fee: 9.28,
    currency: 'USD',
    strategy: 1,
  },
  {
    key: '2',
    id: 2,
    date: '2024-01-16',
    broker: '中信证券',
    assetType: '股票',
    symbol: '600519',
    name: '贵州茅台',
    type: '卖出',
    quantity: 10,
    price: 1680.00,
    amount: 16800.00,
    fee: 8.40,
    currency: 'CNY',
    strategy: 2,
  },
  {
    key: '3',
    id: 3,
    date: '2024-01-18',
    broker: '华泰证券',
    assetType: '期权CALL',
    symbol: 'TSLA 240119C210',
    name: '特斯拉看涨期权',
    underlyingSymbol: 'TSLA',
    type: '买入',
    quantity: 5,
    price: 8.50,
    amount: 4250.00,
    fee: 3.25,
    currency: 'USD',
    strategy: 3,
  },
  {
    key: '4',
    id: 4,
    date: '2024-01-20',
    broker: '华泰证券',
    assetType: '期权CALL',
    symbol: 'TSLA 240119C210',
    name: '特斯拉看涨期权',
    underlyingSymbol: 'TSLA',
    type: '期权到期',
    quantity: 5,
    price: 0.00,
    amount: 0.00,
    fee: 0.00,
    currency: 'USD',
    strategy: 3,
  },
  {
    key: '5',
    id: 5,
    date: '2024-01-22',
    broker: '华泰证券',
    assetType: '期权CALL',
    symbol: 'AAPL 240202C190',
    name: '苹果看涨期权',
    underlyingSymbol: 'AAPL',
    type: '行权买入',
    quantity: 10,
    price: 190.00,
    amount: 190000.00,
    fee: 15.00,
    currency: 'USD',
    strategy: 1,
  },
  {
    key: '6',
    id: 6,
    date: '2024-01-25',
    broker: '华泰证券',
    assetType: '期权PUT',
    symbol: 'GOOG 240216P140',
    name: '谷歌看跌期权',
    underlyingSymbol: 'GOOG',
    type: '买入',
    quantity: 30,
    price: 3.85,
    amount: 11550.00,
    fee: 5.78,
    currency: 'USD',
    strategy: 4,
  },
  {
    key: '7',
    id: 7,
    date: '2024-02-16',
    broker: '华泰证券',
    assetType: '期权PUT',
    symbol: 'GOOG 240216P140',
    name: '谷歌看跌期权',
    underlyingSymbol: 'GOOG',
    type: '行权卖出',
    quantity: 30,
    price: 140.00,
    amount: 420000.00,
    fee: 20.00,
    currency: 'USD',
    strategy: 4,
  },
  {
    key: '8',
    id: 8,
    date: '2024-01-28',
    broker: '华泰证券',
    assetType: 'ETF',
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    type: '买入',
    quantity: 50,
    price: 421.35,
    amount: 21067.50,
    fee: 10.53,
    currency: 'USD',
    strategy: 5,
  },
  {
    key: '9',
    id: 9,
    date: '2024-02-05',
    broker: '华泰证券',
    assetType: '股票',
    symbol: 'MSFT',
    name: '微软',
    type: '买入',
    quantity: 80,
    price: 405.20,
    amount: 32416.00,
    fee: 16.21,
    currency: 'USD',
    strategy: 1,
  },
  {
    key: '10',
    id: 10,
    date: '2024-02-10',
    broker: '华泰证券',
    assetType: '期权CALL',
    symbol: 'MSFT 240315C420',
    name: '微软看涨期权',
    underlyingSymbol: 'MSFT',
    type: '卖出',
    quantity: 8,
    price: 12.30,
    amount: 9840.00,
    fee: 4.92,
    currency: 'USD',
    strategy: 6,
  },
  {
    key: '11',
    id: 11,
    date: '2024-02-12',
    broker: '华泰证券',
    assetType: '期权PUT',
    symbol: 'NVDA 240322P700',
    name: '英伟达看跌期权',
    underlyingSymbol: 'NVDA',
    type: '提前行权',
    quantity: 10,
    price: 700.00,
    amount: 700000.00,
    fee: 25.00,
    currency: 'USD',
    strategy: 7,
  },
];

// 交易记录表格列定义
const tradeColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 70,
    sorter: (a, b) => a.id - b.id,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    sorter: (a, b) => new Date(a.date) - new Date(b.date),
    width: 120,
  },
  {
    title: '券商',
    dataIndex: 'broker',
    key: 'broker',
    width: 120,
  },
  {
    title: '证券类型',
    dataIndex: 'assetType',
    key: 'assetType',
    render: (assetType) => {
      const colorMap = {
        '股票': 'blue',
        'ETF': 'cyan',
        '期权CALL': 'green',
        '期权PUT': 'red',      };
      return <Tag color={colorMap[assetType] || 'default'}>{assetType}</Tag>;
    },
    filters: [
      { text: '股票', value: '股票' },
      { text: 'ETF', value: 'ETF' },
      { text: '期权CALL', value: '期权CALL' },
      { text: '期权PUT', value: '期权PUT' },    ],
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
    dataIndex: 'type',
    key: 'type',
    render: (type) => {
      const typeColorMap = {
        '买入': 'green',
        '卖出': 'red',
        '期权到期': 'default',
        '行权买入': 'cyan',
        '行权卖出': 'orange',
        '提前行权': 'purple',
      };
      return <Tag color={typeColorMap[type] || 'default'}>{type}</Tag>;
    },
    filters: [
      { text: '买入', value: '买入' },
      { text: '卖出', value: '卖出' },
      { text: '期权到期', value: '期权到期' },
      { text: '行权买入', value: '行权买入' },
      { text: '行权卖出', value: '行权卖出' },
      { text: '提前行权', value: '提前行权' },
    ],
    onFilter: (value, record) => record.type === value,
    width: 100,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
    render: (quantity) => quantity.toLocaleString(),
    sorter: (a, b) => a.quantity - b.quantity,
    width: 100,
  },
  {
    title: '成交价格',
    dataIndex: 'price',
    key: 'price',
    render: (price) => price.toFixed(2),
    sorter: (a, b) => a.price - b.price,
    width: 120,
  },
  {
    title: '成交金额',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount, record) => {
      const amountColorMap = {
        '买入': '#cf1322',
        '卖出': '#3f8600',
        '期权到期': '#999999',
        '行权买入': '#cf1322',
        '行权卖出': '#3f8600',
        '提前行权': '#cf1322',
      };
      return (
        <span style={{ 
          color: amountColorMap[record.type] || '#000000',
          fontWeight: 'bold'
        }}>
          {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    render: (fee) => fee.toFixed(2),
    sorter: (a, b) => a.fee - b.fee,
    width: 120,
  },
  {
    title: '币种',
    dataIndex: 'currency',
    key: 'currency',
    render: (currency) => (
      <Tag color={currency === 'CNY' ? 'blue' : 'purple'}>{currency}</Tag>
    ),
    filters: [
      { text: 'CNY', value: 'CNY' },
      { text: 'USD', value: 'USD' },
    ],
    onFilter: (value, record) => record.currency === value,
    width: 80,
  },
  {
    title: '所属策略',
    dataIndex: 'strategy',
    key: 'strategy',
    render: (strategy) => strategy ? strategy : '-',
    width: 140,
  },
];

const TradeRecords = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [form] = Form.useForm();

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
      console.log('提交的交易记录数据:', values);
      message.success('交易记录添加成功！');
      setIsModalVisible(false);
      form.resetFields();
      // TODO: 这里可以调用API将数据保存到后端
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Card 
      title="交易记录"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>所属策略：</span>
          <Input
            allowClear
            placeholder="输入策略ID"
            style={{ width: 120 }}
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value || null)}
          />
          <span>底层证券：</span>
          <Input
            allowClear
            placeholder="输入证券代码，如 AAPL"
            style={{ width: 200 }}
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value || null)}
          />
          <Button type="primary" onClick={handleAddRecord}>
            新增记录
          </Button>
        </div>
      }
    >
      <Table 
        columns={tradeColumns} 
        dataSource={tradeRecordsData.filter((item) => {
          if (selectedStrategy && String(item.strategy) !== selectedStrategy) return false;
          if (selectedAsset) {
            const underlying = (item.underlyingSymbol || item.symbol || '').toUpperCase();
            if (!underlying.includes(selectedAsset.toUpperCase())) return false;
          }
          return true;
        })}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1430 }}
      />

      <Modal
        title="新增交易记录"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            提交
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currency: 'CNY',
            type: '买入',
            assetType: '股票',
          }}
        >
          <Form.Item
            label="ID"
            name="id"
            rules={[{ required: true, message: '请输入交易ID' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入交易ID" min={1} />
          </Form.Item>

          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择交易日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>

          <Form.Item
            label="券商"
            name="broker"
            rules={[{ required: true, message: '请输入券商名称' }]}
          >
            <Input placeholder="例如：华泰证券" />
          </Form.Item>

          <Form.Item
            label="证券类型"
            name="assetType"
rules={[{ required: true, message: '请选择证券类型' }]}
          >
            <Select>
              <Select.Option value="股票">股票</Select.Option>
              <Select.Option value="ETF">ETF</Select.Option>
              <Select.Option value="期权CALL">期权CALL</Select.Option>
              <Select.Option value="期权PUT">期权PUT</Select.Option>            </Select>
          </Form.Item>

          <Form.Item
            label="股票代码"
            name="symbol"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="例如：AAPL 或 600519" />
          </Form.Item>

          <Form.Item
            label="底层证券"
            name="name"
rules={[{ required: true, message: '请输入底层证券' }]}
          >
            <Input placeholder="例如：苹果公司" />
          </Form.Item>

          <Form.Item
            label="交易类型"
            name="type"
            rules={[{ required: true, message: '请选择交易类型' }]}
          >
            <Select>
              <Select.Option value="买入">买入</Select.Option>
              <Select.Option value="卖出">卖出</Select.Option>
              <Select.Option value="期权到期">期权到期</Select.Option>
              <Select.Option value="行权买入">行权买入</Select.Option>
              <Select.Option value="行权卖出">行权卖出</Select.Option>
              <Select.Option value="提前行权">提前行权</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="数量"
            name="quantity"
            rules={[
              { required: true, message: '请输入交易数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入数量"
              min={1}
            />
          </Form.Item>

          <Form.Item
            label="成交价格"
            name="price"
            rules={[
              { required: true, message: '请输入成交价格' },
              { type: 'number', min: 0.01, message: '价格必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入价格"
              min={0.01}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="所属策略"
            name="strategy"
          >
<InputNumber style={{ width: '100%' }} placeholder="请输入策略ID" min={1} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="交易费用"
                name="fee"
                rules={[
                  { required: true, message: '请输入交易费用' },
                  { type: 'number', min: 0, message: '费用不能为负数' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入费用"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="币种"
                name="currency"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select>
                  <Select.Option value="CNY">CNY</Select.Option>
                  <Select.Option value="USD">USD</Select.Option>
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
