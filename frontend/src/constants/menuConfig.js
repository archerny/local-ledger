import React from 'react';
import {
  DashboardOutlined,
  DollarOutlined,
  BankOutlined,
  WalletOutlined,
  LineChartOutlined,
  SettingOutlined,
  SwapOutlined,
  BulbOutlined,
  AuditOutlined,
  AlertOutlined,
  StockOutlined,
  ExperimentOutlined,
  FundOutlined,
} from '@ant-design/icons';

// 菜单 key 与 URL hash 路径的映射
export const menuKeyToPath = {
  '1': 'dashboard',
  '2': 'cashflow',
  '6': 'broker',
  '3': 'trades',
  '7': 'strategy',
  '8': 'anomaly',
  '9': 'market-events',
  '4-1': 'profit-stock',
  '4-2': 'profit-strategy',
  '4-3': 'profit-account',
  '5': 'settings',
};

// 反向映射：path -> key
export const pathToMenuKey = Object.fromEntries(
  Object.entries(menuKeyToPath).map(([k, v]) => [v, k])
);

// 根据菜单 key 找到其所属的父级菜单 key（用于展开子菜单）
export const menuKeyToParent = {
  '2': 'account',
  '6': 'account',
  '3': 'trade',
  '7': 'trade',
  '8': 'trade',
  '9': 'trade',
  '4-1': 'profit',
  '4-2': 'profit',
  '4-3': 'profit',
};

// 菜单项配置
export const menuItems = [
  {
    key: '1',
    icon: React.createElement(DashboardOutlined),
    label: '仪表盘',
  },
  {
    key: 'trade',
    icon: React.createElement(SwapOutlined),
    label: '交易管理',
    children: [
      {
        key: '3',
        icon: React.createElement(SwapOutlined),
        label: '交易记录',
      },
      {
        key: '7',
        icon: React.createElement(BulbOutlined),
        label: '策略管理',
      },
      {
        key: '8',
        icon: React.createElement(AuditOutlined),
        label: '交易数据分析',
      },
      {
        key: '9',
        icon: React.createElement(AlertOutlined),
        label: '市场异动事件',
      },
    ],
  },
  {
    key: 'profit',
    icon: React.createElement(LineChartOutlined),
    label: '盈亏分析',
    children: [
      {
        key: '4-1',
        icon: React.createElement(StockOutlined),
        label: '个股盈亏分析',
      },
      {
        key: '4-2',
        icon: React.createElement(ExperimentOutlined),
        label: '策略盈亏分析',
      },
      {
        key: '4-3',
        icon: React.createElement(FundOutlined),
        label: '账户盈亏分析',
      },
    ],
  },
  {
    key: 'account',
    icon: React.createElement(WalletOutlined),
    label: '账户管理',
    children: [
      {
        key: '2',
        icon: React.createElement(DollarOutlined),
        label: '出入金记录',
      },
      {
        key: '6',
        icon: React.createElement(BankOutlined),
        label: '券商管理',
      },
    ],
  },
  {
    key: '5',
    icon: React.createElement(SettingOutlined),
    label: '系统设置',
  },
];
