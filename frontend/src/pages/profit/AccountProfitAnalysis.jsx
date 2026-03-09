import React from 'react';
import { Card, Empty } from 'antd';
import { FundOutlined } from '@ant-design/icons';

const AccountProfitAnalysis = () => {
  return (
    <Card
      title={
        <span>
          <FundOutlined style={{ marginRight: 8 }} />
          账户盈亏分析
        </span>
      }
    >
      <Empty description="账户盈亏分析功能开发中..." />
    </Card>
  );
};

export default AccountProfitAnalysis;
