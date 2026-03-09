import React from 'react';
import { Card, Empty } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

const StrategyProfitAnalysis = () => {
  return (
    <Card
      title={
        <span>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          策略盈亏分析
        </span>
      }
    >
      <Empty description="策略盈亏分析功能开发中..." />
    </Card>
  );
};

export default StrategyProfitAnalysis;
