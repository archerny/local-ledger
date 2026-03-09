import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAmountVisibility } from '../../contexts/AmountVisibilityContext';
import { fetchAllTradeRecords, createTradeRecord, fetchTradeStatistics } from '../../services/tradeRecordApi';
import { fetchActiveBrokers } from '../../services/brokerApi';
import { fetchAllStrategies } from '../../services/strategyApi';
import { assetTypeMap, tradeTypeMap } from '../../constants/tradeConstants';
import getTradeColumns from './TradeColumns';
import TradeStatisticsPanel from './TradeStatisticsPanel';

const TradeRecords = () => {
  const [tradeData, setTradeData] = useState([]);
  const [brokerList, setBrokerList] = useState([]);
  const [strategyList, setStrategyList] = useState([]);
  const [brokerMap, setBrokerMap] = useState({});
  const [strategyMap, setStrategyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [selectedTradeType, setSelectedTradeType] = useState('BUY');
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const { amountVisible } = useAmountVisibility();

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const result = await fetchTradeStatistics();
      if (result.status === 'SUCCESS') {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('查询统计数据失败:', error);
    }
  };

  // 加载交易记录数据
  const loadTradeRecords = async () => {
    setLoading(true);
    try {
      const result = await fetchAllTradeRecords();
      if (result.status === 'SUCCESS') {
        const list = (result.data || []).map((item) => ({
          ...item,
          key: String(item.id),
        }));
        setTradeData(list);
      } else {
        message.error(result.message || '查询交易记录失败');
      }
    } catch (error) {
      console.error('查询交易记录失败:', error);
      message.error('查询交易记录失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 加载券商列表
  const loadBrokers = async () => {
    try {
      const result = await fetchActiveBrokers();
      if (result.status === 'SUCCESS') {
        const list = result.data || [];
        setBrokerList(list);
        const map = {};
        list.forEach((b) => { map[b.id] = b.brokerName; });
        setBrokerMap(map);
      }
    } catch (error) {
      console.error('查询券商列表失败:', error);
    }
  };

  // 加载策略列表
  const loadStrategies = async () => {
    try {
      const result = await fetchAllStrategies();
      if (result.status === 'SUCCESS') {
        const list = result.data || [];
        setStrategyList(list);
        const map = {};
        list.forEach((s) => { map[s.id] = s.strategyName; });
        setStrategyMap(map);
      }
    } catch (error) {
      console.error('查询策略列表失败:', error);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadTradeRecords();
    loadBrokers();
    loadStrategies();
    loadStatistics();
  }, []);

  // 查看详情 - 跳转到独立详情页
  const handleViewDetail = (record) => {
    window.location.hash = `#/trade-detail/${record.id}`;
  };

  const tradeColumns = getTradeColumns(amountVisible, brokerMap, strategyMap, handleViewDetail);

  const handleAddRecord = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedTradeType('BUY');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 期权证券代码格式校验
      if (values.assetType === 'OPTION_CALL' || values.assetType === 'OPTION_PUT') {
        const optionFlag = values.assetType === 'OPTION_CALL' ? 'C' : 'P';
        const optionLabel = values.assetType === 'OPTION_CALL' ? 'CALL期权' : 'PUT期权';
        const underlying = values.underlyingSymbol?.trim();
        const symbol = values.symbol?.trim();
        const expectedPattern = new RegExp(`^${underlying.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{8})-${optionFlag}[\\d.]+$`);

        if (!expectedPattern.test(symbol)) {
          message.error(`${optionLabel}的证券代码格式不正确，应为：${underlying}-YYYYMMDD-${optionFlag}价格，例如：${underlying}-20250321-${optionFlag}150`);
          return;
        }

        const dateStr = symbol.match(new RegExp(`^${underlying.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{8})-${optionFlag}`))[1];
        const dateObj = dayjs(dateStr, 'YYYYMMDD', true);
        if (!dateObj.isValid()) {
          message.error(`证券代码中的日期部分 ${dateStr} 不是合法日期，请检查`);
          return;
        }
      }

      setSubmitting(true);

      const isOptionExpire = values.tradeType === 'OPTION_EXPIRE';
      const isOption = values.assetType === 'OPTION_CALL' || values.assetType === 'OPTION_PUT';
      const multiplier = isOption ? 100 : 1;
      const price = isOptionExpire ? 0 : values.price;
      const fee = isOptionExpire ? 0 : values.fee;
      const payload = {
        tradeDate: values.date.format('YYYY-MM-DD'),
        brokerId: values.brokerId,
        assetType: values.assetType,
        symbol: values.symbol,
        name: values.name,
        underlyingSymbol: values.underlyingSymbol,
        tradeType: values.tradeType,
        quantity: values.quantity,
        price: price,
        amount: values.quantity * price * multiplier,
        fee: fee,
        currency: values.currency,
        strategyId: values.strategyId || null,
        tradeTrigger: 'MANUAL',
      };

      const result = await createTradeRecord(payload);
      if (result.status === 'SUCCESS') {
        message.success('交易记录添加成功！');
        setIsModalVisible(false);
        form.resetFields();
        setSelectedTradeType('BUY');
        loadTradeRecords();
        loadStatistics();
      } else {
        message.error(result.message || '新增交易记录失败');
      }
    } catch (error) {
      if (error.errorFields) {
        console.error('表单验证失败:', error);
      } else {
        console.error('新增交易记录失败:', error);
        const errorMsg = error.response?.data?.message || '新增交易记录失败，请稍后重试';
        message.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* 统计数据区域 */}
      <TradeStatisticsPanel statistics={statistics} amountVisible={amountVisible} />

    <Card
      title="交易记录"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>所属策略：</span>
          <Select
            allowClear
            placeholder="选择策略"
            style={{ width: 150 }}
            value={selectedStrategy}
            onChange={(value) => setSelectedStrategy(value || null)}
          >
            {strategyList.map((s) => (
              <Select.Option key={s.id} value={s.id}>{s.strategyName}</Select.Option>
            ))}
          </Select>
          <span>底层证券：</span>
          <Input
            allowClear
            placeholder="输入证券代码，如 AAPL"
            style={{ width: 200 }}
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value || null)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>
            新增记录
          </Button>
        </div>
      }
    >
      <Table
        columns={tradeColumns}
        dataSource={tradeData.filter((item) => {
          if (selectedStrategy && item.strategyId !== selectedStrategy) return false;
          if (selectedAsset) {
            const underlying = (item.underlyingSymbol || item.symbol || '').toUpperCase();
            if (!underlying.includes(selectedAsset.toUpperCase())) return false;
          }
          return true;
        })}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          onShowSizeChange: (_, size) => setPageSize(size),
        }}
        size="middle"
      />

      <Modal
        title="新增交易记录"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            提交
          </Button>,
        ]}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            currency: 'USD',
            tradeType: 'BUY',
            assetType: 'STOCK',
          }}
          style={{ marginTop: 20 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="交易日期"
                name="date"
                rules={[{ required: true, message: '请选择交易日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="券商"
                name="brokerId"
                rules={[{ required: true, message: '请选择券商' }]}
              >
                <Select placeholder="请选择券商">
                  {brokerList.map((b) => (
                    <Select.Option key={b.id} value={b.id}>{b.brokerName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="证券类型"
                name="assetType"
                rules={[{ required: true, message: '请选择证券类型' }]}
              >
                <Select>
                  {Object.entries(assetTypeMap).map(([value, label]) => (
                    <Select.Option key={value} value={value}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="交易类型"
                name="tradeType"
                rules={[{ required: true, message: '请选择交易类型' }]}
              >
                <Select
                  onChange={(value) => {
                    setSelectedTradeType(value);
                    if (value === 'OPTION_EXPIRE') {
                      form.setFieldsValue({ price: undefined, fee: undefined });
                    }
                  }}
                >
                  {Object.entries(tradeTypeMap).map(([value, label]) => (
                    <Select.Option key={value} value={value}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="证券代码"
                name="symbol"
                rules={[{ required: true, message: '请输入证券代码' }]}
              >
                <Input placeholder="例如：AAPL 或 600519" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="底层证券名称"
                name="name"
                rules={[{ required: true, message: '请输入底层证券名称' }]}
              >
                <Input placeholder="例如：苹果公司、特斯拉" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="底层证券代码"
            name="underlyingSymbol"
            rules={[{ required: true, message: '请输入底层证券代码' }]}
            extra="用于关联分析期权与正股收益，例如：TSLA、AAPL"
          >
            <Input placeholder="例如：TSLA、AAPL" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={selectedTradeType === 'OPTION_EXPIRE' ? 24 : 8}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[
                  { required: true, message: '请输入交易数量' },
                  { type: 'number', min: 1, message: '数量必须大于0' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="请输入数量" min={1} />
              </Form.Item>
            </Col>
            {selectedTradeType !== 'OPTION_EXPIRE' && (
              <>
                <Col span={8}>
                  <Form.Item
                    label="成交价格"
                    name="price"
                    rules={[
                      { required: true, message: '请输入成交价格' },
                      { type: 'number', min: 0, message: '价格不能为负' },
                    ]}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="请输入价格" min={0} precision={4} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="交易费用"
                    name="fee"
                    rules={[
                      { required: true, message: '请输入交易费用' },
                      { type: 'number', min: 0, message: '费用不能为负数' },
                    ]}
                  >
                    <InputNumber style={{ width: '100%' }} placeholder="请输入费用" min={0} precision={2} />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="币种"
                name="currency"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select>
                  <Select.Option value="CNY">CNY - 人民币</Select.Option>
                  <Select.Option value="USD">USD - 美元</Select.Option>
                  <Select.Option value="HKD">HKD - 港币</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="所属策略"
                name="strategyId"
              >
                <Select allowClear placeholder="请选择策略（选填）">
                  {strategyList.map((s) => (
                    <Select.Option key={s.id} value={s.id}>{s.strategyName}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>


    </Card>
    </div>
  );
};

export default TradeRecords;
