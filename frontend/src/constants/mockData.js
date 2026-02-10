import React from 'react';
import { RiseOutlined } from '@ant-design/icons';

// 投资统计数据
export const statistics = [
  {
    title: '总投资金额',
    value: 100000,
    prefix: '¥',
    valueStyle: { color: '#3f8600' },
  },
  {
    title: '当前市值',
    value: 125000,
    prefix: '¥',
    valueStyle: { color: '#cf1322' },
  },
  {
    title: '总盈亏',
    value: 25000,
    prefix: '¥',
    suffix: React.createElement(RiseOutlined),
    valueStyle: { color: '#3f8600' },
  },
  {
    title: '收益率',
    value: 25,
    suffix: '%',
    precision: 2,
    valueStyle: { color: '#3f8600' },
  },
];

// 投资记录数据
export const investmentData = [
  {
    key: '1',
    name: '腾讯控股',
    code: '00700.HK',
    type: '股票',
    buyPrice: 350.5,
    currentPrice: 420.8,
    quantity: 100,
    profit: 7030,
    profitRate: 20.05,
    status: 'profit',
  },
  {
    key: '2',
    name: '阿里巴巴',
    code: 'BABA',
    type: '股票',
    buyPrice: 180.2,
    currentPrice: 165.5,
    quantity: 50,
    profit: -735,
    profitRate: -8.16,
    status: 'loss',
  },
  {
    key: '3',
    name: '比特币',
    code: 'BTC',
    type: '数字货币',
    buyPrice: 45000,
    currentPrice: 52000,
    quantity: 0.5,
    profit: 3500,
    profitRate: 15.56,
    status: 'profit',
  },
];

// 出入金记录数据
export const cashFlowData = [
  {
    key: '1',
    date: '2024-01-15',
    broker: '富途证券',
    type: '入金',
    amount: 50000,
    currency: 'CNY',
  },
  {
    key: '2',
    date: '2024-01-20',
    broker: '老虎证券',
    type: '入金',
    amount: 10000,
    currency: 'USD',
  },
  {
    key: '3',
    date: '2024-02-05',
    broker: '富途证券',
    type: '出金',
    amount: 15000,
    currency: 'CNY',
  },
  {
    key: '4',
    date: '2024-02-10',
    broker: '盈透证券',
    type: '入金',
    amount: 5000,
    currency: 'USD',
  },
  {
    key: '5',
    date: '2024-02-18',
    broker: '老虎证券',
    type: '出金',
    amount: 3000,
    currency: 'USD',
  },
  {
    key: '6',
    date: '2024-03-01',
    broker: '富途证券',
    type: '入金',
    amount: 30000,
    currency: 'CNY',
  },
];
