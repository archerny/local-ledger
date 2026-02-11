import React from 'react';
import {
  DashboardOutlined,
  DollarOutlined,
  LineChartOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons';

// 菜单项配置
export const menuItems = [
  {
    key: '1',
    icon: React.createElement(DashboardOutlined),
    label: '仪表盘',
  },
  {
    key: '2',
    icon: React.createElement(DollarOutlined),
    label: '出入金记录',
  },
  {
    key: '3',
    icon: React.createElement(SwapOutlined),
    label: '交易记录',
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
