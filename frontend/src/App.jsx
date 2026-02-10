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
      label: '出入金记录',
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

  // 出入金记录数据
  const cashFlowData = [
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

  // 获取当前页面标题
  const getPageTitle = () => {
    const titles = {
      '1': '仪表盘',
      '2': '出入金记录',
      '3': '盈亏分析',
      '4': '系统设置',
    };
    return titles[selectedMenu] || '仪表盘';
  };

  // 渲染仪表盘页面
  const renderDashboard = () => (
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

  // 渲染出入金记录页面
  const renderInvestmentRecords = () => (
    <Card 
      title="出入金记录"
      extra={
        <Button type="primary" onClick={() => message.info('新增记录功能开发中...')}>
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

  // 渲染盈亏分析页面
  const renderProfitAnalysis = () => (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总盈亏"
              value={25000}
              prefix="¥"
              suffix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总收益率"
              value={25}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="盈利项目数"
              value={2}
              suffix="个"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="盈亏详细分析">
        <p style={{ fontSize: 16, color: '#666' }}>
          盈亏分析图表和详细数据将在此处显示...
        </p>
      </Card>
    </>
  );

  // 渲染系统设置页面
  const renderSettings = () => (
    <Card title="系统设置">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <h3>数据库配置</h3>
          <p style={{ color: '#666' }}>配置数据库连接信息</p>
        </div>
        <div>
          <h3>通知设置</h3>
          <p style={{ color: '#666' }}>配置价格提醒和通知方式</p>
        </div>
        <div>
          <h3>数据导入导出</h3>
          <p style={{ color: '#666' }}>导入或导出投资数据</p>
        </div>
        <div>
          <h3>关于</h3>
          <p style={{ color: '#666' }}>版本信息和系统说明</p>
        </div>
      </Space>
    </Card>
  );

  // 根据选中的菜单渲染对应的页面内容
  const renderContent = () => {
    switch (selectedMenu) {
      case '1':
        return renderDashboard();
      case '2':
        return renderInvestmentRecords();
      case '3':
        return renderProfitAnalysis();
      case '4':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 'bold',
          color: '#fff'
        }}>
          投资盈亏管理
        </div>
        <Menu
          theme="dark"
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
          <h2 style={{ margin: 0 }}>{getPageTitle()}</h2>
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
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
