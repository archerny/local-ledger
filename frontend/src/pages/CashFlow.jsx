import React from 'react';
import { Card, Table, Tag, Button, message } from 'antd';
import { cashFlowData } from '../constants/mockData';

// 出入金记录表格列定义
const cashFlowColumns = [
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
  const handleAddRecord = () => {
    message.info('新增记录功能开发中...');
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
    </Card>
  );
};

export default CashFlow;
