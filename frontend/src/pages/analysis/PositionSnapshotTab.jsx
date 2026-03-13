import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Card, Table, Tag, Button, message, Statistic, Space, Spin, Typography, Tooltip,
  DatePicker, Select, Empty,
} from 'antd';
import {
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchPositions } from '../../services/positionApi';
import { fetchActiveBrokers } from '../../services/brokerApi';
import { assetTypeMap, assetTypeColorMap } from '../../constants/tradeConstants';

const { Text } = Typography;

/**
 * 持仓快照 Tab 组件
 */
const PositionSnapshotTab = () => {
  const [positionDate, setPositionDate] = useState(dayjs());
  const [positionBrokerId, setPositionBrokerId] = useState(null);
  const [positionData, setPositionData] = useState([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [brokerList, setBrokerList] = useState([]);
  const [positionUnderlyingFilter, setPositionUnderlyingFilter] = useState(null);
  const initialQueryDone = useRef(false);

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

  // 组件挂载时自动查询今天的持仓数据
  useEffect(() => {
    if (initialQueryDone.current) return;
    initialQueryDone.current = true;
    handleQueryPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      title: '底层证券名称',
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

  return (
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
  );
};

export default PositionSnapshotTab;
