import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, Select, DatePicker, InputNumber, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchAllCashFlowRecords, createCashFlowRecord } from '../services/cashFlowApi';
import { fetchAllBrokers } from '../services/brokerApi';

// 记录类型映射
const recordTypeMap = {
  DEPOSIT: { label: '入金', color: 'green' },
  WITHDRAWAL: { label: '出金', color: 'orange' },
};

// 币种颜色映射
const currencyColorMap = {
  CNY: 'blue',
  HKD: 'gold',
  USD: 'purple',
};

const CashFlow = () => {
  const [cashFlowData, setCashFlowData] = useState([]);
  const [brokerList, setBrokerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedBrokerId, setSelectedBrokerId] = useState(null);

  // 加载出入金记录
  const loadCashFlowRecords = async () => {
    setLoading(true);
    try {
      const result = await fetchAllCashFlowRecords();
      if (result.status === 'SUCCESS') {
        const list = (result.data || []).map((item) => ({
          ...item,
          key: String(item.id),
        }));
        setCashFlowData(list);
      } else {
        message.error(result.message || '查询出入金记录失败');
      }
    } catch (error) {
      console.error('查询出入金记录失败:', error);
      message.error('查询出入金记录失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 加载券商列表（用于新增表单的券商下拉）
  const loadBrokers = async () => {
    try {
      const result = await fetchAllBrokers();
      if (result.status === 'SUCCESS') {
        setBrokerList(result.data || []);
      }
    } catch (error) {
      console.error('查询券商列表失败:', error);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadCashFlowRecords();
    loadBrokers();
  }, []);

  // 出入金记录表格列定义
  const cashFlowColumns = [
    {
      title: '日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      sorter: (a, b) => new Date(a.recordDate) - new Date(b.recordDate),
    },
    {
      title: '券商',
      dataIndex: ['broker', 'brokerName'],
      key: 'broker',
    },
    {
      title: '类型',
      dataIndex: 'recordType',
      key: 'recordType',
      render: (type) => {
        const info = recordTypeMap[type] || { label: type, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: [
        { text: '入金', value: 'DEPOSIT' },
        { text: '出金', value: 'WITHDRAWAL' },
      ],
      onFilter: (value, record) => record.recordType === value,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => {
        const isDeposit = record.recordType === 'DEPOSIT';
        return (
          <span style={{
            color: isDeposit ? '#3f8600' : '#cf1322',
            fontWeight: 'bold',
          }}>
            {isDeposit ? '+' : '-'}{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency) => (
        <Tag color={currencyColorMap[currency] || 'default'}>{currency}</Tag>
      ),
      filters: [
        { text: 'CNY', value: 'CNY' },
        { text: 'HKD', value: 'HKD' },
        { text: 'USD', value: 'USD' },
      ],
      onFilter: (value, record) => record.currency === value,
    },
    {
      title: '银行',
      dataIndex: 'bank',
      key: 'bank',
      render: (text) => <span>{text || '-'}</span>,
    },
    {
      title: '备注',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span style={{ color: '#666' }}>{text || '-'}</span>,
    },
  ];

  const handleAddRecord = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(async (values) => {
        setSubmitting(true);
        try {
          // 构建提交数据，日期格式化为 YYYY-MM-DD
          const submitData = {
            recordDate: values.date.format('YYYY-MM-DD'),
            brokerId: values.brokerId,
            recordType: values.recordType,
            amount: values.amount,
            currency: values.currency,
            bank: values.bank || '',
            description: values.description || '',
          };

          const result = await createCashFlowRecord(submitData);
          if (result.status === 'SUCCESS') {
            message.success('出入金记录添加成功！');
            setIsModalOpen(false);
            form.resetFields();
            loadCashFlowRecords(); // 重新加载列表
          } else {
            message.error(result.message || '新增出入金记录失败');
          }
        } catch (error) {
          console.error('新增出入金记录失败:', error);
          const errorMsg = error.response?.data?.message || '新增失败，请稍后重试';
          message.error(errorMsg);
        } finally {
          setSubmitting(false);
        }
      })
      .catch((errorInfo) => {
        console.log('表单验证失败:', errorInfo);
      });
  };

  // 根据券商筛选过滤数据
  const filteredCashFlowData = selectedBrokerId
    ? cashFlowData.filter((item) => item.broker?.id === selectedBrokerId)
    : cashFlowData;

  return (
    <Card
      title="出入金记录"
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>券商筛选：</span>
          <Select
            allowClear
            placeholder="全部券商"
            style={{ width: 200 }}
            value={selectedBrokerId}
            onChange={(value) => setSelectedBrokerId(value)}
          >
            {brokerList.map((broker) => (
              <Select.Option key={broker.id} value={broker.id}>
                {broker.brokerName}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>
            新增记录
          </Button>
        </div>
      }
    >
      <Table
        columns={cashFlowColumns}
        dataSource={filteredCashFlowData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新增出入金记录"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            提交
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>

          <Form.Item
            label="券商"
            name="brokerId"
            rules={[{ required: true, message: '请选择券商' }]}
          >
            <Select placeholder="请选择券商">
              {brokerList
                .filter((b) => b.isActive)
                .map((broker) => (
                  <Select.Option key={broker.id} value={broker.id}>
                    {broker.brokerName}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="类型"
            name="recordType"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select placeholder="请选择类型">
              <Select.Option value="DEPOSIT">入金</Select.Option>
              <Select.Option value="WITHDRAWAL">出金</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="金额"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入金额"
              precision={2}
              min={0.01}
            />
          </Form.Item>

          <Form.Item
            label="币种"
            name="currency"
            rules={[{ required: true, message: '请选择币种' }]}
          >
            <Select placeholder="请选择币种">
              <Select.Option value="CNY">CNY - 人民币</Select.Option>
              <Select.Option value="HKD">HKD - 港币</Select.Option>
              <Select.Option value="USD">USD - 美元</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="银行"
            name="bank"
          >
            <Input placeholder="请输入关联银行名称（选填）" maxLength={100} />
          </Form.Item>

          <Form.Item
            label="备注"
            name="description"
          >
            <Input.TextArea
              placeholder="请输入备注说明（选填）"
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CashFlow;
