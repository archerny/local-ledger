import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Card, Statistic, Row, Col, Table, Tag, Space, Button, message } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  LineChartOutlined,
  SettingOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [selectedMenu, setSelectedMenu] = useState('1');
  const [backendStatus, setBackendStatus] = useState('未连接');

  // 检查后端连接状态
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get('/api/health');
      if (response.data.status === 'UP') {
        setBackendStatus('已连接');
        message.success('后端服务连接成功');
      }
    } catch (error) {
      setBackendStatus('连接失败');
      console.error('后端连接失败:', error);
    }
  };

  // 菜单项
  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '2',
      icon: <DollarOutlined />,
      label: '投资记录',
    },
    {
      key: '3',
      icon: <LineChartOutlined />,
      label: '盈亏分析',
    },
    {
      key: '4',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  // 模拟数据 - 投资统计
  const statistics = [
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
      suffix: <RiseOutlined />,
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

  // 模拟数据 - 投资记录表格
  const investmentData = [
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: colorBgContainer,
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1890ff'
        }}>
          投资盈亏管理
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          items={menuItems}
          onClick={({ key }) => setSelectedMenu(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0 }}>仪表盘</h2>
          <Space>
            <Tag color={backendStatus === '已连接' ? 'success' : 'error'}>
              后端状态: {backendStatus}
            </Tag>
            <Button onClick={checkBackendHealth}>刷新连接</Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
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
            <Card 
              title="投资记录" 
              extra={
                <Space>
                  <Button type="primary">添加投资</Button>
                  <Button>导出数据</Button>
                </Space>
              }
            >
              <Table 
                columns={columns} 
                dataSource={investmentData} 
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
