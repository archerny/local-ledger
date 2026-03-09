import React from 'react';
import { Card, Empty } from 'antd';
import { StockOutlined } from '@ant-design/icons';

const StockProfitAnalysis = () => {
  return (
    <Card
      title={
        <span>
          <StockOutlined style={{ marginRight: 8 }} />
          个股盈亏分析
        </span>
      }
    >
      <Empty description="个股盈亏分析功能开发中..." />
    </Card>
  );
};

export default StockProfitAnalysis;
