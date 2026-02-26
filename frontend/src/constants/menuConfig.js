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
} from '@ant-design/icons';

// 菜单 key 与 URL hash 路径的映射
export const menuKeyToPath = {
  '1': 'dashboard',
  '2': 'cashflow',
  '6': 'broker',
  '3': 'trades',
  '7': 'strategy',
  '4': 'profit',
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
};

// 菜单项配置
export const menuItems = [
  {
    key: '1',
    icon: React.createElement(DashboardOutlined),
    label: '仪表盘',
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
    ],
  },
  {
    key: '4',
    icon: React.createElement(LineChartOutlined),
    label: '盈亏分析',
  },
  {
    key: '5',
    icon: React.createElement(SettingOutlined),
    label: '系统设置',
  },
];
