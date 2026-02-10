import React from 'react';
import { Card, Statistic, Row, Col, Table } from 'antd';
import { statistics, investmentData } from '../constants/mockData';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { Tag, Space, Button } from 'antd';

// 投资记录表格列定义
const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '代码',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    render: (type) => (
      <Tag color={type === '股票' ? 'blue' : 'gold'}>{type}</Tag>
    ),
  },
  {
    title: '买入价',
    dataIndex: 'buyPrice',
    key: 'buyPrice',
    render: (price) => `¥${price.toFixed(2)}`,
  },
  {
    title: '当前价',
    dataIndex: 'currentPrice',
    key: 'currentPrice',
    render: (price) => `¥${price.toFixed(2)}`,
  },
  {
    title: '数量',
    dataIndex: 'quantity',
    key: 'quantity',
  },
  {
    title: '盈亏',
    dataIndex: 'profit',
    key: 'profit',
    render: (profit) => (
      <span style={{ color: profit >= 0 ? '#3f8600' : '#cf1322' }}>
        {profit >= 0 ? <RiseOutlined /> : <FallOutlined />} ¥{Math.abs(profit).toFixed(2)}
      </span>
    ),
  },
  {
    title: '收益率',
    dataIndex: 'profitRate',
    key: 'profitRate',
    render: (rate) => (
      <span style={{ color: rate >= 0 ? '#3f8600' : '#cf1322' }}>
        {rate >= 0 ? '+' : ''}{rate.toFixed(2)}%
      </span>
    ),
  },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space size="middle">
        <Button type="link" size="small">详情</Button>
        <Button type="link" size="small">编辑</Button>
        <Button type="link" danger size="small">删除</Button>
      </Space>
    ),
  },
];

const Dashboard = () => {
  return (
    <>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statistics.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                precision={stat.precision || 0}
                valueStyle={stat.valueStyle}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 投资记录表格 */}
      <Card title="最近投资记录">
        <Table 
          columns={columns} 
          dataSource={investmentData} 
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </>
  );
};

export default Dashboard;
