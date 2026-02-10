import React from 'react';
import {
  DashboardOutlined,
  DollarOutlined,
  LineChartOutlined,
  SettingOutlined,
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
    icon: React.createElement(LineChartOutlined),
    label: '盈亏分析',
  },
  {
    key: '4',
    icon: React.createElement(SettingOutlined),
    label: '系统设置',
  },
];

// 页面标题映射
export const pageTitles = {
  '1': '仪表盘',
  '2': '出入金记录',
  '3': '盈亏分析',
  '4': '系统设置',
};
