import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { RiseOutlined } from '@ant-design/icons';

const ProfitAnalysis = () => {
  return (
    <>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总盈亏"
              value={25000}
              prefix="¥"
              suffix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总收益率"
              value={25}
              suffix="%"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="盈利项目数"
              value={2}
              suffix="个"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="盈亏详细分析">
        <p style={{ fontSize: 16, color: '#666' }}>
          盈亏分析图表和详细数据将在此处显示...
        </p>
      </Card>
    </>
  );
};

export default ProfitAnalysis;
