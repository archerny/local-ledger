import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, message, Typography, Tooltip,
  Modal, Form, Input, Select, DatePicker, InputNumber, Popconfirm, Row, Col, Space,
} from 'antd';
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchAllDividendInKindEvents, createDividendInKindEvent, updateDividendInKindEvent, deleteDividendInKindEvent,
} from '../../services/marketEventApi';
import { currencyOptions, currencyColorMap } from '../../constants/tradeConstants';

const { Text } = Typography;

/**
 * 实物分红事件 Tab 组件
 */
const DividendInKindTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchAllDividendInKindEvents();
      if (result.status === 'SUCCESS') {
        setData((result.data || []).map((item) => ({ ...item, key: String(item.id) })));
      } else {
        message.error(result.message || '查询实物分红事件失败');
      }
    } catch (error) {
      console.error('查询实物分红事件失败:', error);
      message.error('查询失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const columns = [
    {
      title: '证券代码',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 120,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: '底层证券名称',
      dataIndex: 'underlyingSymbolName',
      key: 'underlyingSymbolName',
      width: 140,
      render: (text) => text || <Text type="secondary">-</Text>,
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
      render: (currency) => currency ? <Tag color={currencyColorMap[currency] || 'default'}>{currency}</Tag> : '-',
      filters: currencyOptions.map((item) => ({ text: item.value, value: item.value })),
      onFilter: (value, record) => record.currency === value,
    },
    {
      title: '事件日期',
      dataIndex: 'eventDate',
      key: 'eventDate',
      width: 120,
      sorter: (a, b) => dayjs(a.eventDate).unix() - dayjs(b.eventDate).unix(),
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD') : '-',
    },
    {
      title: '分红证券',
      dataIndex: 'dividendSymbol',
      key: 'dividendSymbol',
      width: 120,
      render: (text) => <Text code style={{ color: '#722ed1' }}>{text}</Text>,
    },
    {
      title: '分红证券名称',
      dataIndex: 'dividendSymbolName',
      key: 'dividendSymbolName',
      width: 140,
      render: (text) => text || <Text type="secondary">-</Text>,
    },
    {
      title: '每股分红数量',
      dataIndex: 'dividendQtyPerShare',
      key: 'dividendQtyPerShare',
      width: 130,
      render: (val) => <Tag color="purple">{val}</Tag>,
    },
    {
      title: '公允价格',
      dataIndex: 'fairValuePerShare',
      key: 'fairValuePerShare',
      width: 120,
      render: (val) => val != null ? <Tag color="blue">{val}</Tag> : <Text type="secondary">未设置</Text>,
    },
    {
      title: '处理状态',
      dataIndex: 'processed',
      key: 'processed',
      width: 100,
      filters: [
        { text: '已处理', value: true },
        { text: '未处理', value: false },
      ],
      onFilter: (value, record) => record.processed === value,
      render: (processed) => processed
        ? <Tag icon={<CheckCircleOutlined />} color="success">已处理</Tag>
        : <Tag icon={<ClockCircleOutlined />} color="warning">未处理</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ color: '#666' }}>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <a onClick={() => handleEdit(record)}>编辑</a>
          <Popconfirm
            title="确认删除" description="确定要删除该实物分红事件吗？"
            onConfirm={() => handleDelete(record)} okText="确认" cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      symbol: record.symbol,
      underlyingSymbolName: record.underlyingSymbolName,
      currency: record.currency,
      eventDate: record.eventDate ? dayjs(record.eventDate) : null,
      dividendSymbol: record.dividendSymbol,
      dividendSymbolName: record.dividendSymbolName,
      dividendQtyPerShare: record.dividendQtyPerShare,
      fairValuePerShare: record.fairValuePerShare,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleDelete = async (record) => {
    try {
      const result = await deleteDividendInKindEvent(record.id);
      if (result.status === 'SUCCESS') {
        message.success('删除成功');
        loadData();
      } else {
        message.error(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = () => {
    form.validateFields().then(async (values) => {
      setSubmitting(true);
      try {
        const payload = {
          ...values,
          eventDate: values.eventDate ? values.eventDate.format('YYYY-MM-DD') : null,
        };
        if (editingRecord) {
          const result = await updateDividendInKindEvent(editingRecord.id, payload);
          if (result.status === 'SUCCESS') {
            message.success('更新成功');
            loadData();
          } else {
            message.error(result.message || '更新失败');
          }
        } else {
          const result = await createDividendInKindEvent(payload);
          if (result.status === 'SUCCESS') {
            message.success('新增成功');
            loadData();
          } else {
            message.error(result.message || '新增失败');
          }
        }
        setIsModalOpen(false);
        setEditingRecord(null);
        form.resetFields();
      } catch (error) {
        console.error('操作失败:', error);
        message.error(error.response?.data?.message || '操作失败');
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div>
      <Card
        title="实物分红事件"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增事件</Button>}
      >
        <Table
          columns={columns} dataSource={data} loading={loading} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          size="small" scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑实物分红事件' : '新增实物分红事件'}
        open={isModalOpen} onCancel={handleCancel} width={640} destroyOnClose
        footer={[
          <Button key="cancel" onClick={handleCancel}>取消</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            {editingRecord ? '保存' : '提交'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="证券代码" name="symbol" rules={[{ required: true, message: '请输入证券代码' }]}>
                <Input placeholder="持有的证券代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="底层证券名称" name="underlyingSymbolName">
                <Input placeholder="底层证券名称（选填）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="币种" name="currency">
                <Select placeholder="请选择币种" options={currencyOptions} allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="事件日期" name="eventDate" rules={[{ required: true, message: '请选择事件日期' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="分红证券代码" name="dividendSymbol" rules={[{ required: true, message: '请输入分红证券代码' }]}>
                <Input placeholder="获得的分红证券代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="分红证券名称" name="dividendSymbolName">
                <Input placeholder="分红证券名称（选填）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="每股分红数量" name="dividendQtyPerShare" rules={[{ required: true, message: '请输入每股分红数量' }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.000001} precision={6} placeholder="每持有1股获得的分红数量" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="公允价格(每股)" name="fairValuePerShare" tooltip="用于建立分红新持仓的成本基础，影响后续卖出时的收益计算">
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={4} placeholder="分红证券的公允价格" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="描述" name="description" rules={[{ max: 500, message: '描述不能超过500个字符' }]}>
            <Input.TextArea placeholder="事件描述（选填）" rows={3} showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DividendInKindTab;
