import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Space, Button, Tag, message } from 'antd';
import axios from 'axios';
import { menuItems, pageTitles } from '../constants/menuConfig';
import Dashboard from '../pages/Dashboard';
import CashFlow from '../pages/CashFlow';
import ProfitAnalysis from '../pages/ProfitAnalysis';
import Settings from '../pages/Settings';
import './AppLayout.css';

const { Header, Content, Sider } = Layout;

const AppLayout = () => {
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

  // 获取当前页面标题
  const getPageTitle = () => {
    return pageTitles[selectedMenu] || '仪表盘';
  };

  // 根据选中的菜单渲染对应的页面内容
  const renderContent = () => {
    switch (selectedMenu) {
      case '1':
        return <Dashboard />;
      case '2':
        return <CashFlow />;
      case '3':
        return <ProfitAnalysis />;
      case '4':
        return <Settings />;
      default:
        return <Dashboard />;
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
};

export default AppLayout;
