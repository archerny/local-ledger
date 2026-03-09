import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Spin, message, Empty } from 'antd';
import { usePageHeader } from '../../contexts/PageHeaderContext';
import { PageHeaderTitle } from '../../components/PageHeader';
import { useAmountVisibility } from '../../contexts/AmountVisibilityContext';
import { fetchAllTradeRecords } from '../../services/tradeRecordApi';
import { fetchActiveBrokers } from '../../services/brokerApi';
import { fetchAllStrategies } from '../../services/strategyApi';
import {
  assetTypeMap, tradeTypeMap, tradeTypeColorMap, assetTypeColorMap,
  tradeTriggerMap, tradeTriggerColorMap, triggerRefTypeMap,
} from '../../constants/tradeConstants';

/**
 * 交易记录详情独立页面
 * 通过 usePageHeader 将面包屑、标题等配置上报给 AppLayout，
 * 由 AppLayout 在白色内容卡片外部的灰色背景区域统一渲染。
 */
const TradeRecordDetail = ({ recordId, onBack }) => {
  const { amountVisible } = useAmountVisibility();
  const { setPageHeader, clearPageHeader } = usePageHeader();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brokerMap, setBrokerMap] = useState({});
  const [strategyMap, setStrategyMap] = useState({});

  // 面包屑配置
  const breadcrumbs = [
    { label: '交易记录', href: '#/trades' },
    { label: '交易详情' },
  ];

  // 上报面包屑到 AppLayout（灰色背景区域渲染）
  useEffect(() => {
    setPageHeader({ breadcrumbs });
    return () => clearPageHeader();
  }, []);

  // 构建标题栏右侧的标签内容
  const titleExtra = record ? (
    <>
      <Tag color={assetTypeColorMap[record.assetType] || 'default'}>
        {assetTypeMap[record.assetType] || record.assetType}
      </Tag>
      <Tag color={tradeTypeColorMap[record.tradeType] || 'default'}>
        {tradeTypeMap[record.tradeType] || record.tradeType}
      </Tag>
    </>
  ) : null;

  useEffect(() => {
    loadData();
  }, [recordId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsResult, brokersResult, strategiesResult] = await Promise.all([
        fetchAllTradeRecords(),
        fetchActiveBrokers(),
        fetchAllStrategies(),
      ]);

      if (brokersResult.status === 'SUCCESS') {
        const map = {};
        (brokersResult.data || []).forEach((b) => { map[b.id] = b.brokerName; });
        setBrokerMap(map);
      }

      if (strategiesResult.status === 'SUCCESS') {
        const map = {};
        (strategiesResult.data || []).forEach((s) => { map[s.id] = s.strategyName; });
        setStrategyMap(map);
      }

      if (recordsResult.status === 'SUCCESS') {
        const found = (recordsResult.data || []).find((item) => String(item.id) === String(recordId));
        setRecord(found || null);
        if (!found) {
          message.warning('未找到该交易记录');
        }
      } else {
        message.error(recordsResult.message || '查询交易记录失败');
      }
    } catch (error) {
      console.error('加载详情失败:', error);
      message.error('加载详情失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!record) {
    return (
      <Card>
        <Empty description="未找到该交易记录">
          <Button type="primary" onClick={() => { window.location.hash = '#/trades'; }}>返回交易记录列表</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card>
      {/* 标题栏：返回箭头 + 标题 + 标签（在白色内容卡片内部渲染） */}
      <PageHeaderTitle
        title="交易记录详情"
        breadcrumbs={breadcrumbs}
        onBack={onBack}
        extra={titleExtra}
      />
      {/* 基本信息 */}
      <Descriptions
        title="基本信息"
        bordered
        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        size="middle"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="记录ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="交易日期">{record.tradeDate}</Descriptions.Item>
        <Descriptions.Item label="券商">
          {brokerMap[record.brokerId] || `ID:${record.brokerId}`}
        </Descriptions.Item>
        <Descriptions.Item label="证券类型">
          <Tag color={assetTypeColorMap[record.assetType] || 'default'}>
            {assetTypeMap[record.assetType] || record.assetType}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="证券代码">{record.symbol}</Descriptions.Item>
        <Descriptions.Item label="底层证券名称">{record.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="底层证券代码">{record.underlyingSymbol}</Descriptions.Item>
        <Descriptions.Item label="交易类型">
          <Tag color={tradeTypeColorMap[record.tradeType] || 'default'}>
            {tradeTypeMap[record.tradeType] || record.tradeType}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="币种">
          <Tag color={record.currency === 'CNY' ? 'blue' : record.currency === 'HKD' ? 'green' : 'purple'}>
            {record.currency}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* 交易数据 */}
      <Descriptions
        title="交易数据"
        bordered
        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        size="middle"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="数量">
          {amountVisible ? (record.quantity != null ? record.quantity.toLocaleString() : '-') : '****'}
        </Descriptions.Item>
        <Descriptions.Item label="成交价格">
          {amountVisible ? (record.price != null ? Number(record.price).toFixed(4) : '-') : '****'}
        </Descriptions.Item>
        <Descriptions.Item label="成交金额">
          {amountVisible
            ? (record.amount != null
              ? Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '-')
            : '****'}
        </Descriptions.Item>
        <Descriptions.Item label="交易费用">
          {amountVisible ? (record.fee != null ? Number(record.fee).toFixed(2) : '-') : '****'}
        </Descriptions.Item>
      </Descriptions>

      {/* 触发与策略信息 */}
      <Descriptions
        title="触发与策略"
        bordered
        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        size="middle"
      >
        <Descriptions.Item label="所属策略">
          {record.strategyId ? (strategyMap[record.strategyId] || `ID:${record.strategyId}`) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="触发来源">
          <Tag color={tradeTriggerColorMap[record.tradeTrigger] || 'default'}>
            {tradeTriggerMap[record.tradeTrigger] || record.tradeTrigger || '-'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="触发关联类型">
          {triggerRefTypeMap[record.triggerRefType] || record.triggerRefType || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="触发关联ID">
          {record.triggerRefId && record.triggerRefId !== 0 ? record.triggerRefId : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default TradeRecordDetail;
