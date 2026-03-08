import React, { useState, useCallback } from 'react';
import {
  Card, Table, Tag, Button, message, Statistic, Space, Result, Spin, Typography, Tooltip,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { verifyTradeRecords } from '../../services/tradeRecordApi';

const { Text } = Typography;

// 规则名称对应的 Tag 颜色
const ruleColorMap = {
  '期权证券代码格式': 'purple',
  '港股证券代码格式': 'orange',
  '期权到期/行权交易费用价格': 'red',
  '美股证券代码格式': 'blue',
  '证券代码类别一致性': 'magenta',
};

/**
 * 异常记录分析 Tab 组件
 */
const AnomalyAnalysisTab = () => {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);

  const handleVerify = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verifyTradeRecords();
      if (res.status === 'SUCCESS') {
        setVerificationResult(res.data);
        setHasChecked(true);
        if (res.data.passed) {
          message.success('核对通过，所有交易记录数据正常');
        } else {
          message.warning(`核对完成，发现 ${res.data.errorCount} 条异常记录`);
        }
      } else {
        message.error(res.message || '核对失败');
      }
    } catch (error) {
      console.error('核对失败:', error);
      message.error('核对请求失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }, []);

  const errorColumns = [
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 80,
      sorter: (a, b) => a.recordId - b.recordId,
      render: (id) => <Text strong>#{id}</Text>,
    },
    {
      title: '核对规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 180,
      filters: [
        { text: '期权证券代码格式', value: '期权证券代码格式' },
        { text: '港股证券代码格式', value: '港股证券代码格式' },
        { text: '期权到期/行权交易费用价格', value: '期权到期/行权交易费用价格' },
        { text: '美股证券代码格式', value: '美股证券代码格式' },
        { text: '证券代码类别一致性', value: '证券代码类别一致性' },
      ],
      onFilter: (value, record) => record.ruleName === value,
      render: (ruleName) => {
        const color = ruleColorMap[ruleName] || 'default';
        return <Tag color={color}>{ruleName}</Tag>;
      },
    },
    {
      title: '证券类型',
      dataIndex: 'assetType',
      key: 'assetType',
      width: 120,
      render: (type) => {
        const labelMap = {
          STOCK: '股票',
          ETF: 'ETF',
          OPTION_CALL: 'CALL期权',
          OPTION_PUT: 'PUT期权',
        };
        return labelMap[type] || type;
      },
    },
    {
      title: '当前代码',
      dataIndex: 'actualSymbol',
      key: 'actualSymbol',
      width: 160,
      render: (symbol) => <Text code>{symbol}</Text>,
    },
    {
      title: '底层证券',
      dataIndex: 'underlyingSymbol',
      key: 'underlyingSymbol',
      width: 120,
      render: (symbol) => symbol ? <Text code>{symbol}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '期望格式',
      dataIndex: 'expectedFormat',
      key: 'expectedFormat',
      width: 200,
      render: (format) => <Text type="secondary">{format}</Text>,
    },
    {
      title: '异常描述',
      dataIndex: 'message',
      key: 'message',
      ellipsis: { showTitle: false },
      render: (msg) => (
        <Tooltip placement="topLeft" title={msg}>
          <Text type="danger">{msg}</Text>
        </Tooltip>
      ),
    },
  ];

  const getRuleStats = () => {
    if (!verificationResult || !verificationResult.errors) return [];
    const ruleMap = {};
    verificationResult.errors.forEach((err) => {
      if (!ruleMap[err.ruleName]) {
        ruleMap[err.ruleName] = 0;
      }
      ruleMap[err.ruleName]++;
    });
    return Object.entries(ruleMap).map(([name, count]) => ({ name, count }));
  };

  return (
    <div>
      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            基于预设规则，对所有交易记录进行数据完整性和一致性分析
          </Text>
          <Button
            type="primary"
            icon={hasChecked ? <ReloadOutlined /> : <FileSearchOutlined />}
            onClick={handleVerify}
            loading={loading}
          >
            {hasChecked ? '重新核对' : '开始核对'}
          </Button>
        </div>
      </Card>

      {/* 未核对状态 */}
      {!hasChecked && !loading && (
        <Card>
          <Result
            icon={<FileSearchOutlined style={{ color: '#8c8c8c' }} />}
            title="尚未执行核对"
            subTitle="点击「开始核对」按钮，系统将自动分析所有交易记录中的异常数据"
          />
        </Card>
      )}

      {/* 加载中 */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">正在核对交易记录...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* 核对结果 */}
      {hasChecked && !loading && verificationResult && (
        <>
          <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: verificationResult.passed ? '#f6ffed' : '#fff2f0',
              }}>
                {verificationResult.passed
                  ? <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  : <ExclamationCircleOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />
                }
              </div>
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  {verificationResult.passed ? '全部通过' : '发现异常'}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {verificationResult.passed
                    ? '所有交易记录均通过数据核对，未发现异常'
                    : `共核对 ${verificationResult.totalChecked} 条记录，发现 ${verificationResult.errorCount} 条异常`
                  }
                </Text>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 40 }}>
                <Statistic title="核对总数" value={verificationResult.totalChecked} suffix="条" valueStyle={{ fontSize: 22 }} />
                <Statistic title="异常数量" value={verificationResult.errorCount} suffix="条"
                  valueStyle={{ fontSize: 22, color: verificationResult.errorCount > 0 ? '#ff4d4f' : '#52c41a' }} />
                <Statistic title="通过率"
                  value={verificationResult.totalChecked > 0
                    ? (((verificationResult.totalChecked - verificationResult.errorCount) / verificationResult.totalChecked) * 100).toFixed(1)
                    : 100}
                  suffix="%"
                  valueStyle={{ fontSize: 22, color: verificationResult.passed ? '#52c41a' : '#faad14' }} />
              </div>
            </div>
          </Card>

          {verificationResult.errorCount > 0 && (
            <Card title="异常分布" size="small" style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 24px' }}>
              <Space size={16} wrap>
                {getRuleStats().map((stat) => (
                  <Tag key={stat.name} color={ruleColorMap[stat.name] || 'default'} style={{ padding: '4px 12px', fontSize: 13 }}>
                    {stat.name}：{stat.count} 条
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {verificationResult.errorCount > 0 && (
            <Card title={`异常记录详情（共 ${verificationResult.errorCount} 条）`} size="small">
              <Table
                columns={errorColumns}
                dataSource={verificationResult.errors}
                rowKey={(record, index) => `${record.recordId}-${record.ruleName}-${index}`}
                pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'], showTotal: (total) => `共 ${total} 条异常` }}
                size="small"
                scroll={{ x: 1100 }}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AnomalyAnalysisTab;
