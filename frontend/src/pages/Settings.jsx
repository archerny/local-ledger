import React from 'react';
import { Card, Space } from 'antd';

const Settings = () => {
  return (
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
};

export default Settings;
