import React, { useState } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';

// 交易记录示例数据
const tradeRecordsData = [
  {
    key: '1',
    date: '2024-01-15',
    broker: '华泰证券',
    symbol: 'AAPL',
    name: '苹果公司',
    type: '买入',
    quantity: 100,
    price: 185.50,
    amount: 18550.00,
    fee: 9.28,
    currency: 'USD',
  },
  {
    key: '2',
    date: '2024-01-16',
    broker: '中信证券',
    symbol: '600519',
    name: '贵州茅台',
    type: '买入',
    quantity: 10,
    price: 1680.00,
    amount: 16800.00,
    fee: 8.40,
    currency: 'CNY',
  },
  {
    key: '3',
    date: '2024-01-18',
    broker: '华泰证券',
    symbol: 'TSLA',
    name: '特斯拉',
    type: '卖出',
    quantity: 50,
    price: 210.30,
    amount: 10515.00,
    fee: 5.26,
    currency: 'USD',
  },
  {
    key: '4',
    date: '2024-01-20',
    broker: '招商证券',
    symbol: '000858',
    name: '五粮液',
    type: '买入',
    quantity: 200,
    price: 145.80,
    amount: 29160.00,
    fee: 14.58,
    currency: 'CNY',
  },
  {
    key: '5',
    date: '2024-01-22',
    broker: '华泰证券',
    symbol: 'MSFT',
    name: '微软',
    type: '买入',
    quantity: 80,
    price: 405.20,
    amount: 32416.00,
    fee: 16.21,
    currency: 'USD',
  },
];

// 交易记录表格列定义
const tradeColumns = [
  {
    title: '交易ID',
    dataIndex: 'key',
    key: 'id',
    width: 80,
    fixed: 'left',
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
    title: '股票代码',
    dataIndex: 'symbol',
    key: 'symbol',
    width: 100,
  },
  {
    title: '股票名称',
    dataIndex: 'name',
    key: 'name',
    width: 120,
  },
  {
    title: '交易类型',
    dataIndex: 'type',
    key: 'type',
    render: (type) => (
      <Tag color={type === '买入' ? 'green' : 'red'}>{type}</Tag>
    ),
    filters: [
      { text: '买入', value: '买入' },
      { text: '卖出', value: '卖出' },
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
    render: (price, record) => {
      const symbol = record.currency === 'CNY' ? '¥' : '$';
      return `${symbol}${price.toFixed(2)}`;
    },
    sorter: (a, b) => a.price - b.price,
    width: 120,
  },
  {
    title: '成交金额',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount, record) => {
      const symbol = record.currency === 'CNY' ? '¥' : '$';
      return (
        <span style={{ 
          color: record.type === '买入' ? '#cf1322' : '#3f8600',
          fontWeight: 'bold'
        }}>
          {symbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    render: (fee, record) => {
      const symbol = record.currency === 'CNY' ? '¥' : '$';
      return `${symbol}${fee.toFixed(2)}`;
    },
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
];

const TradeRecords = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
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
        <Button type="primary" onClick={handleAddRecord}>
          新增记录
        </Button>
      }
    >
      <Table 
        columns={tradeColumns} 
        dataSource={tradeRecordsData} 
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
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
          }}
        >
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
            label="股票代码"
            name="symbol"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="例如：AAPL 或 600519" />
          </Form.Item>

          <Form.Item
            label="股票名称"
            name="name"
            rules={[{ required: true, message: '请输入股票名称' }]}
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
