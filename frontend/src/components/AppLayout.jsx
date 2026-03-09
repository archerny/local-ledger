import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, theme, Space, Button, Tag, Tooltip, message } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { TbTornado } from 'react-icons/tb';
import axios from 'axios';
import { menuItems, menuKeyToPath, pathToMenuKey, menuKeyToParent } from '../constants/menuConfig';
import Dashboard from '../pages/Dashboard';
import CashFlow from '../pages/CashFlow';
import BrokerManagement from '../pages/BrokerManagement';
import TradeRecords from '../pages/trade/TradeRecords';
import TradeRecordDetail from '../pages/trade/TradeRecordDetail';
import StockProfitAnalysis from '../pages/profit/StockProfitAnalysis';
import StrategyProfitAnalysis from '../pages/profit/StrategyProfitAnalysis';
import AccountProfitAnalysis from '../pages/profit/AccountProfitAnalysis';
import Settings from '../pages/Settings';
import StrategyManagement from '../pages/StrategyManagement';
import TradeAnomalyAnalysis from '../pages/analysis/TradeAnomalyAnalysis';
import MarketEvents from '../pages/market-events/MarketEvents';
import { AmountVisibilityProvider, useAmountVisibility } from '../contexts/AmountVisibilityContext';
import { PageHeaderProvider } from '../contexts/PageHeaderContext';
import PageHeaderContext from '../contexts/PageHeaderContext';
import { PageHeaderBreadcrumb } from './PageHeader';
import './AppLayout.css';

const { Header, Content, Sider } = Layout;

const AppLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 从 URL hash 中恢复菜单选中状态
  const getMenuKeyFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    // 支持 trade-detail/:id 格式的子页面路由，归属于交易记录菜单
    if (hash.startsWith('trade-detail/')) {
      return '3';
    }
    return pathToMenuKey[hash] || '1';
  };

  const getOpenKeysFromMenuKey = (key) => {
    const parent = menuKeyToParent[key];
    return parent ? [parent] : [];
  };

  const initialMenuKey = getMenuKeyFromHash();
  const [selectedMenu, setSelectedMenu] = useState(initialMenuKey);
  const [openKeys, setOpenKeys] = useState(getOpenKeysFromMenuKey(initialMenuKey));
  const [backendStatus, setBackendStatus] = useState('未连接');
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const hasCheckedHealth = useRef(false);

  // 检查后端连接状态（仅首次挂载时执行一次）
  useEffect(() => {
    if (hasCheckedHealth.current) return;
    hasCheckedHealth.current = true;
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

  // 菜单切换时同步更新 URL hash
  const handleMenuClick = ({ key }) => {
    setSelectedMenu(key);
    const path = menuKeyToPath[key];
    if (path) {
      window.location.hash = `#/${path}`;
    }
  };

  // 监听浏览器前进/后退按钮
  useEffect(() => {
    const handleHashChange = () => {
      const key = getMenuKeyFromHash();
      setSelectedMenu(key);
      setOpenKeys(getOpenKeysFromMenuKey(key));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 初始化时如果没有 hash，设置默认的 hash
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = `#/${menuKeyToPath['1']}`;
    }
  }, []);

  // 从 hash 中提取交易记录详情的 ID
  const getTradeDetailIdFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const match = hash.match(/^trade-detail\/(.+)$/);
    return match ? match[1] : null;
  };

  // 根据选中的菜单渲染对应的页面内容
  const renderContent = () => {
    // 优先判断是否为交易记录详情子页面
    const tradeDetailId = getTradeDetailIdFromHash();
    if (tradeDetailId) {
      return <TradeRecordDetail recordId={tradeDetailId} onBack={() => { window.location.hash = '#/trades'; }} />;
    }

    switch (selectedMenu) {
      case '1':
        return <Dashboard />;
      case '2':
        return <CashFlow />;
      case '6':
        return <BrokerManagement />;
      case '3':
        return <TradeRecords />;
      case '4-1':
        return <StockProfitAnalysis />;
      case '4-2':
        return <StrategyProfitAnalysis />;
      case '4-3':
        return <AccountProfitAnalysis />;
      case '5':
        return <Settings />;
      case '7':
        return <StrategyManagement />;
      case '8':
        return <TradeAnomalyAnalysis />;
      case '9':
        return <MarketEvents />;
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
        onBreakpoint={(broken) => setSiderCollapsed(broken)}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 'bold',
          color: '#fff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0 16px'
        }}>
          <TbTornado style={{ marginRight: 8, fontSize: 24 }} />
          <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', sans-serif", fontWeight: 600, letterSpacing: '1px' }}>Vortex <span style={{ fontWeight: 300, fontSize: 22 }}>+</span></span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: siderCollapsed ? 0 : 200, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Space>
            <AmountVisibilityToggle />
            <Tag color={backendStatus === '已连接' ? 'success' : 'error'}>
              后端状态: {backendStatus}
            </Tag>
            <Button onClick={checkBackendHealth}>刷新连接</Button>
          </Space>
        </Header>
        <Content style={{ margin: '32px 24px 24px', background: '#f5f5f5' }}>
          <PageHeaderRenderer />
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

/**
 * 从 PageHeaderContext 中读取配置并渲染面包屑（内部组件）
 * 标题栏（返回按钮 + 标题 + 标签）由各子页面在白色卡片内自行渲染。
 */
const PageHeaderRenderer = () => {
  const { config } = React.useContext(PageHeaderContext);
  if (!config) return null;
  return (
    <PageHeaderBreadcrumb breadcrumbs={config.breadcrumbs} />
  );
};

/**
 * 金额可见性切换按钮（内部组件）
 */
const AmountVisibilityToggle = () => {
  const { amountVisible, toggleAmountVisible } = useAmountVisibility();
  return (
    <Tooltip title={amountVisible ? '隐藏金额数据' : '显示金额数据'}>
      <Button
        type="text"
        icon={amountVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={toggleAmountVisible}
        style={{
          fontSize: 18,
          color: amountVisible ? '#1890ff' : '#999',
        }}
      />
    </Tooltip>
  );
};

/**
 * 包裹 AmountVisibilityProvider 的导出组件
 */
const AppLayoutWithProvider = () => (
  <AmountVisibilityProvider>
    <PageHeaderProvider>
      <AppLayout />
    </PageHeaderProvider>
  </AmountVisibilityProvider>
);

export default AppLayoutWithProvider;
