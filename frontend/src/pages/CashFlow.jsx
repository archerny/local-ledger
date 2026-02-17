import React, { useState } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, Select, DatePicker, InputNumber } from 'antd';
import { cashFlowData } from '../constants/mockData';

// 出入金记录表格列定义
const cashFlowColumns = [
  {
    title: 'ID',
    dataIndex: 'key',
    key: 'id',
    width: 60,
  },
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    sorter: (a, b) => new Date(a.date) - new Date(b.date),
  },
  {
    title: '券商',
    dataIndex: 'broker',
    key: 'broker',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    render: (type) => (
      <Tag color={type === '入金' ? 'green' : 'orange'}>{type}</Tag>
    ),
    filters: [
      { text: '入金', value: '入金' },
      { text: '出金', value: '出金' },
    ],
    onFilter: (value, record) => record.type === value,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    render: (amount, record) => {
      const symbol = record.currency === 'CNY' ? '¥' : '$';
      return (
        <span style={{ 
          color: record.type === '入金' ? '#3f8600' : '#cf1322',
          fontWeight: 'bold'
        }}>
          {record.type === '入金' ? '+' : '-'}{symbol}{amount.toLocaleString()}
        </span>
      );
    },
    sorter: (a, b) => a.amount - b.amount,
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
  },
];

const CashFlow = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddRecord = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields()
      .then((values) => {
        console.log('表单数据:', values);
        message.success('出入金记录添加成功！');
        setIsModalOpen(false);
        form.resetFields();
        // TODO: 这里后续需要调用API保存数据
      })
      .catch((errorInfo) => {
        console.log('表单验证失败:', errorInfo);
      });
  };

  return (
    <Card 
      title="出入金记录"
      extra={
        <Button type="primary" onClick={handleAddRecord}>
          新增记录
        </Button>
      }
    >
      <Table 
        columns={cashFlowColumns} 
        dataSource={cashFlowData} 
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增出入金记录"
        open={isModalOpen}
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
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>

          <Form.Item
            label="券商"
            name="broker"
            rules={[{ required: true, message: '请输入券商名称' }]}
          >
            <Input placeholder="请输入券商名称" />
          </Form.Item>

          <Form.Item
            label="类型"
            name="type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="入金">入金</Select.Option>
              <Select.Option value="出金">出金</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="金额"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入金额"
              precision={2}
              min={0.01}
            />
          </Form.Item>

          <Form.Item
            label="币种"
            name="currency"
            rules={[{ required: true, message: '请选择币种' }]}
          >
            <Select placeholder="请选择币种">
              <Select.Option value="CNY">CNY</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CashFlow;
