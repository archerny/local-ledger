import React, { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Tag, Button, message, Statistic, Space, Result, Spin, Typography, Tooltip,
  DatePicker, Select, Empty, Tabs,
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  AuditOutlined,
  FileSearchOutlined,
  FundOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { verifyTradeRecords } from '../services/tradeRecordApi';
import { fetchPositions } from '../services/positionApi';
import { fetchActiveBrokers } from '../services/brokerApi';

const { Text, Title } = Typography;

// 规则名称对应的 Tag 颜色
const ruleColorMap = {
  '期权证券代码格式': 'purple',
  '港股证券代码格式': 'orange',
  '期权到期/行权交易费用价格': 'red',
  '美股证券代码格式': 'blue',
};

// 证券类型映射
const assetTypeMap = {
  STOCK: '股票',
  ETF: 'ETF',
  OPTION_CALL: 'CALL期权',
  OPTION_PUT: 'PUT期权',
};

// 证券类型 Tag 颜色
const assetTypeColorMap = {
  STOCK: 'blue',
  ETF: 'green',
  OPTION_CALL: 'orange',
  OPTION_PUT: 'red',
};

const TradeAnomalyAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);

  // 持仓快照相关状态
  const [positionDate, setPositionDate] = useState(dayjs());
  const [positionBrokerId, setPositionBrokerId] = useState(null);
  const [positionData, setPositionData] = useState([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [brokerList, setBrokerList] = useState([]);
  const [positionUnderlyingFilter, setPositionUnderlyingFilter] = useState(null);

  // 加载券商列表
  useEffect(() => {
    const loadBrokers = async () => {
      try {
        const result = await fetchActiveBrokers();
        if (result.status === 'SUCCESS') {
          setBrokerList(result.data || []);
        }
      } catch (error) {
        console.error('查询券商列表失败:', error);
      }
    };
    loadBrokers();
  }, []);

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

  // 查询持仓快照
  const handleQueryPositions = useCallback(async () => {
    if (!positionDate) {
      message.warning('请选择截止日期');
      return;
    }
    setPositionLoading(true);
    try {
      const dateStr = positionDate.format('YYYY-MM-DD');
      const res = await fetchPositions(dateStr, positionBrokerId);
      if (res.status === 'SUCCESS') {
        const list = (res.data || []).map((item, index) => ({ ...item, key: `${item.symbol}-${item.brokerId}-${index}` }));
        setPositionData(list);
        setHasQueried(true);
        if (list.length === 0) {
          message.info('截止该日期暂无持仓记录');
        } else {
          message.success(`查询成功，共 ${list.length} 条持仓记录`);
        }
      } else {
        message.error(res.message || '查询持仓失败');
      }
    } catch (error) {
      console.error('查询持仓失败:', error);
      message.error('查询持仓失败，请检查后端服务');
    } finally {
      setPositionLoading(false);
    }
  }, [positionDate, positionBrokerId]);

  // 持仓表格列定义
  const positionColumns = [
    {
      title: '证券代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 180,
      render: (symbol) => <Text code>{symbol}</Text>,
    },
    {
      title: '证券名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name) => name || <Text type="secondary">-</Text>,
    },
    {
      title: '底层证券',
      dataIndex: 'underlyingSymbol',
      key: 'underlyingSymbol',
      width: 120,
      render: (symbol) => symbol ? <Text code>{symbol}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '证券类型',
      dataIndex: 'assetType',
      key: 'assetType',
      width: 110,
      filters: Object.entries(assetTypeMap).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.assetType === value,
      render: (type) => {
        const color = assetTypeColorMap[type] || 'default';
        return <Tag color={color}>{assetTypeMap[type] || type}</Tag>;
      },
    },
    {
      title: '持仓数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      sorter: (a, b) => a.quantity - b.quantity,
      render: (qty) => {
        const isNegative = qty < 0;
        return (
          <Text strong style={{ color: isNegative ? '#ff4d4f' : undefined }}>
            {qty.toLocaleString()}
            {isNegative && <Tooltip title="持仓为负数，可能存在数据异常"><ExclamationCircleOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} /></Tooltip>}
          </Text>
        );
      },
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      filters: [
        { text: 'USD', value: 'USD' },
        { text: 'HKD', value: 'HKD' },
        { text: 'CNY', value: 'CNY' },
      ],
      onFilter: (value, record) => record.currency === value,
    },
    {
      title: '券商',
      dataIndex: 'brokerName',
      key: 'brokerName',
      width: 130,
    },
  ];

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

  // Tab 项定义
  const tabItems = [
    {
      key: 'position',
      label: (
        <span>
          <FundOutlined style={{ marginRight: 6 }} />
          持仓快照
        </span>
      ),
      children: (
        <div>
          {/* 操作栏 */}
          <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                根据交易记录计算截止某一日期的持仓情况（暂未考虑拆股/代码变更/实物分红等市场事件的影响）
              </Text>
              <Space size={16}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>截止日期</Text>
                  <DatePicker
                    value={positionDate}
                    onChange={(date) => setPositionDate(date)}
                    allowClear={false}
                    style={{ width: 140 }}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, marginRight: 6 }}>券商</Text>
                  <Select
                    value={positionBrokerId}
                    onChange={(value) => setPositionBrokerId(value)}
                    allowClear
                    placeholder="全部券商"
                    style={{ width: 160 }}
                    options={[
                      ...brokerList.map((b) => ({ label: b.brokerName, value: b.id })),
                    ]}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleQueryPositions}
                  loading={positionLoading}
                >
                  查询持仓
                </Button>
              </Space>
            </div>
          </Card>

          {/* 持仓结果 */}
          {!hasQueried && !positionLoading && (
            <Card>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="选择截止日期后点击「查询持仓」"
              />
            </Card>
          )}

          {positionLoading && (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">正在计算持仓...</Text>
                </div>
              </div>
            </Card>
          )}

          {hasQueried && !positionLoading && (
            <>
              {positionData.length > 0 && (
                <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '12px 24px' }}>
                  <Space size={32}>
                    <Statistic title="持仓证券数" value={positionData.length} suffix="只" valueStyle={{ fontSize: 22 }} />
                    <Statistic
                      title="股票/ETF"
                      value={positionData.filter(p => p.assetType === 'STOCK' || p.assetType === 'ETF').length}
                      suffix="只"
                      valueStyle={{ fontSize: 22, color: '#1677ff' }}
                    />
                    <Statistic
                      title="期权合约"
                      value={positionData.filter(p => p.assetType === 'OPTION_CALL' || p.assetType === 'OPTION_PUT').length}
                      suffix="只"
                      valueStyle={{ fontSize: 22, color: '#fa8c16' }}
                    />
                    {positionData.some(p => p.quantity < 0) && (
                      <Statistic
                        title="异常（负持仓）"
                        value={positionData.filter(p => p.quantity < 0).length}
                        suffix="只"
                        valueStyle={{ fontSize: 22, color: '#ff4d4f' }}
                      />
                    )}
                  </Space>
                </Card>
              )}

              <Card
                title={positionData.length > 0 ? `持仓明细（共 ${positionData.length} 条）` : undefined}
                extra={
                  positionData.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>底层证券：</Text>
                      <Select
                        allowClear
                        showSearch
                        placeholder="选择底层证券"
                        style={{ width: 180 }}
                        value={positionUnderlyingFilter}
                        onChange={(value) => setPositionUnderlyingFilter(value || null)}
                        options={[...new Set(positionData.map(p => p.underlyingSymbol).filter(Boolean))].sort().map(s => ({ label: s, value: s }))}
                        filterOption={(input, option) => (option?.label ?? '').toUpperCase().includes(input.toUpperCase())}
                      />
                    </div>
                  ) : null
                }
                size="small"
              >
                {positionData.length === 0 ? (
                  <Empty description="截止该日期暂无持仓记录" />
                ) : (
                  <Table
                    columns={positionColumns}
                    dataSource={positionData.filter((item) => {
                      if (positionUnderlyingFilter) {
                        return (item.underlyingSymbol || '') === positionUnderlyingFilter;
                      }
                      return true;
                    })}
                    rowKey="key"
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total) => `共 ${total} 条` }}
                    size="small"
                    scroll={{ x: 900 }}
                  />
                )}
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'anomaly',
      label: (
        <span>
          <WarningOutlined style={{ marginRight: 6 }} />
          异常记录分析
        </span>
      ),
      children: (
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
      ),
    },
  ];

  return (
    <div>
      {/* 顶部标题栏 */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AuditOutlined style={{ fontSize: 22, color: '#1677ff' }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>交易数据分析</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              基于交易记录的多维度数据分析能力，后续将持续扩展更多分析功能
            </Text>
          </div>
        </div>
      </Card>

      <Tabs
        type="card"
        items={tabItems}
        defaultActiveKey="position"
      />
    </div>
  );
};

export default TradeAnomalyAnalysis;
