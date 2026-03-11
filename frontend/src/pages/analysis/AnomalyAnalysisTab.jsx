import React, { useState, useCallback } from 'react';
import {
  Card, Table, Tag, Button, message, Statistic, Space, Result, Spin, Typography, Tooltip, Collapse,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { verifyTradeRecords } from '../../services/tradeRecordApi';

const { Text } = Typography;

// 规则名称对应的 Tag 颜色
const ruleColorMap = {
  '期权证券代码格式': 'purple',
  '港股证券代码格式': 'orange',
  '期权被动操作费用价格': 'red',
  '美股证券代码格式': 'blue',
  '证券代码类别一致性': 'magenta',
  '旧体系数据兼容': 'gold',
  '触发类型关联类型一致性': 'cyan',
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
      render: (id) => (
        <a
          href={`#/trade-detail/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 600 }}
        >
          #{id}
        </a>
      ),
    },
    {
      title: '核对规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 180,
      filters: [
        { text: '期权证券代码格式', value: '期权证券代码格式' },
        { text: '港股证券代码格式', value: '港股证券代码格式' },
        { text: '期权被动操作费用价格', value: '期权被动操作费用价格' },
        { text: '美股证券代码格式', value: '美股证券代码格式' },
        { text: '证券代码类别一致性', value: '证券代码类别一致性' },
        { text: '旧体系数据兼容', value: '旧体系数据兼容' },
        { text: '触发类型关联类型一致性', value: '触发类型关联类型一致性' },
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

      {/* 检测规则说明 */}
      <Collapse
        ghost
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'rules',
            label: (
              <span style={{ fontSize: 13, color: '#595959' }}>
                <InfoCircleOutlined style={{ marginRight: 6 }} />
                查看当前检测规则说明
              </span>
            ),
            children: (
              <div style={{ padding: '4px 8px', fontSize: 13, lineHeight: 2 }}>
                <p style={{ marginBottom: 12 }}>
                  系统将依据以下 <Text strong>7 项规则</Text> 对所有交易记录逐一进行校验，任何不符合规则的记录均会被标记为异常：
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', width: 60, color: '#8c8c8c', fontWeight: 'normal' }}>序号</th>
                      <th style={{ padding: '8px 12px', width: 200, color: '#8c8c8c', fontWeight: 'normal' }}>规则名称</th>
                      <th style={{ padding: '8px 12px', color: '#8c8c8c', fontWeight: 'normal' }}>规则说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>1</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="purple">期权证券代码格式</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        当资产类别为 OPTION_CALL 或 OPTION_PUT 时，校验证券代码是否符合标准期权命名格式
                        <Text code>底层代码-YYYYMMDD-C/P行权价</Text>，
                        并核对底层证券代码一致性、日期合法性、期权类型标识匹配及行权价格有效性。
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>2</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="orange">港股证券代码格式</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        当结算币种为 HKD（港币）时，校验证券代码及底层证券代码是否为纯数字格式（如 <Text code>00700</Text>、<Text code>09988</Text>）。
                        期权类型的港股记录不在此规则校验范围内。
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>3</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="red">期权被动操作费用价格</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        当交易触发来源为 OPTION（期权）时，根据关联类型进行校验：
期权到期（OPTION_EXPIRE）时 fee 和 price 应均为 0；
                        行权/被指派的期权侧记录 fee 应为 0。
                        同时兼容旧体系的 OPTION_EXPIRE / EXERCISE_BUY / EXERCISE_SELL 交易类型。
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>4</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="blue">美股证券代码格式</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        当资产类别为 STOCK（股票）且结算币种为 USD（美元）时，校验证券代码及底层证券代码是否为纯字母格式
                        （如 <Text code>AAPL</Text>、<Text code>TSLA</Text>）。
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>5</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="magenta">证券代码类别一致性</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        校验同一证券代码在所有记录中是否始终对应唯一的资产类别。
                        同一代码不应同时归属于不同类别（如同一代码既被记录为 STOCK 又被记录为 ETF），
                        出现此类冲突表明部分记录的资产类别存在错误。
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px' }}>6</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="gold">旧体系数据兼容</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        检测使用了已废弃交易类型或触发关联类型的历史记录。
                        交易类型（TradeType）应仅使用 <Text code>BUY</Text> / <Text code>SELL</Text>，
                        使用了 <Text code>OPTION_EXPIRE</Text>、<Text code>EXERCISE_BUY</Text>、<Text code>EXERCISE_SELL</Text> 的记录需订正；
                        触发关联类型（TriggerRefType）中笼统的 <Text code>OPTION</Text> 已废弃，
                        应更新为 <Text code>OPTION_EXPIRE</Text> / <Text code>OPTION_EXERCISE</Text> / <Text code>OPTION_ASSIGNED</Text> 之一。
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 12px' }}>7</td>
                      <td style={{ padding: '10px 12px' }}><Tag color="cyan">触发类型关联类型一致性</Tag></td>
                      <td style={{ padding: '10px 12px' }}>
                        校验触发类型（TradeTrigger）与关联类型（TriggerRefType）的搭配是否合法，防止出现交叉错配。
                        当触发类型为 <Text code>OPTION</Text> 时，关联类型只能是
                        <Text code>OPTION_EXPIRE</Text> / <Text code>OPTION_EXERCISE</Text> / <Text code>OPTION_ASSIGNED</Text> 三者之一；
                        当触发类型为 <Text code>MARKET_EVENT</Text> 时，关联类型只能是
                        <Text code>STOCK_SPLIT</Text> / <Text code>SYMBOL_CHANGE</Text> / <Text code>DIVIDEND_IN_KIND</Text> 三者之一。
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ),
          },
        ]}
      />

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
