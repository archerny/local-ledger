import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, message, Typography, Tooltip,
  Tabs, Modal, Form, Input, Select, DatePicker, InputNumber, Popconfirm, Row, Col, Space,
} from 'antd';
import {
  ExclamationCircleOutlined,
  PlusOutlined,
  SwapOutlined,
  SplitCellsOutlined,
  GiftOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchAllSymbolChangeEvents, createSymbolChangeEvent, updateSymbolChangeEvent, deleteSymbolChangeEvent,
  fetchAllStockSplitEvents, createStockSplitEvent, updateStockSplitEvent, deleteStockSplitEvent,
  fetchAllDividendInKindEvents, createDividendInKindEvent, updateDividendInKindEvent, deleteDividendInKindEvent,
} from '../services/marketEventApi';

const { Text, Title } = Typography;

// 币种选项
const currencyOptions = [
  { label: '🇨🇳 CNY（人民币）', value: 'CNY' },
  { label: '🇭🇰 HKD（港币）', value: 'HKD' },
  { label: '🇺🇸 USD（美元）', value: 'USD' },
];

// 币种颜色映射
const currencyColorMap = {
  CNY: 'red',
  HKD: 'magenta',
  USD: 'blue',
};

// ============================================================
// 代码变更事件 Tab 内容组件
// ============================================================
const SymbolChangeTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchAllSymbolChangeEvents();
      if (result.status === 'SUCCESS') {
        setData((result.data || []).map((item) => ({ ...item, key: String(item.id) })));
      } else {
        message.error(result.message || '查询代码变更事件失败');
      }
    } catch (error) {
      console.error('查询代码变更事件失败:', error);
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
      title: '证券名称',
      dataIndex: 'symbolName',
      key: 'symbolName',
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
      title: '旧代码',
      dataIndex: 'oldSymbol',
      key: 'oldSymbol',
      width: 120,
      render: (text) => <Text code style={{ color: '#ff4d4f' }}>{text}</Text>,
    },
    {
      title: '新代码',
      dataIndex: 'newSymbol',
      key: 'newSymbol',
      width: 120,
      render: (text) => <Text code style={{ color: '#52c41a' }}>{text}</Text>,
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
            title="确认删除" description="确定要删除该代码变更事件吗？"
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
      symbolName: record.symbolName,
      currency: record.currency,
      eventDate: record.eventDate ? dayjs(record.eventDate) : null,
      oldSymbol: record.oldSymbol,
      newSymbol: record.newSymbol,
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
      const result = await deleteSymbolChangeEvent(record.id);
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
          const result = await updateSymbolChangeEvent(editingRecord.id, payload);
          if (result.status === 'SUCCESS') {
            message.success('更新成功');
            loadData();
          } else {
            message.error(result.message || '更新失败');
          }
        } else {
          const result = await createSymbolChangeEvent(payload);
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
        title="代码变更事件"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增事件</Button>}
      >
        <Table
          columns={columns} dataSource={data} loading={loading} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          size="small" scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑代码变更事件' : '新增代码变更事件'}
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
                <Input placeholder="变更后的证券代码，如 META" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="证券名称" name="symbolName">
                <Input placeholder="证券名称（选填）" />
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
              <Form.Item label="旧代码" name="oldSymbol" rules={[{ required: true, message: '请输入旧代码' }]}>
                <Input placeholder="变更前的证券代码，如 FB" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="新代码" name="newSymbol" rules={[{ required: true, message: '请输入新代码' }]}>
                <Input placeholder="变更后的证券代码，如 META" />
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

// ============================================================
// 拆股事件 Tab 内容组件
// ============================================================
const StockSplitTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchAllStockSplitEvents();
      if (result.status === 'SUCCESS') {
        setData((result.data || []).map((item) => ({ ...item, key: String(item.id) })));
      } else {
        message.error(result.message || '查询拆股事件失败');
      }
    } catch (error) {
      console.error('查询拆股事件失败:', error);
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
      title: '证券名称',
      dataIndex: 'symbolName',
      key: 'symbolName',
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
      title: '拆股比例',
      key: 'ratio',
      width: 120,
      render: (_, record) => (
        <Tag color="geekblue" style={{ fontSize: 13 }}>
          {record.ratioFrom} 拆 {record.ratioTo}
        </Tag>
      ),
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
            title="确认删除" description="确定要删除该拆股事件吗？"
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
      symbolName: record.symbolName,
      currency: record.currency,
      eventDate: record.eventDate ? dayjs(record.eventDate) : null,
      ratioFrom: record.ratioFrom,
      ratioTo: record.ratioTo,
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
      const result = await deleteStockSplitEvent(record.id);
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
          const result = await updateStockSplitEvent(editingRecord.id, payload);
          if (result.status === 'SUCCESS') {
            message.success('更新成功');
            loadData();
          } else {
            message.error(result.message || '更新失败');
          }
        } else {
          const result = await createStockSplitEvent(payload);
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
        title="拆股事件"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增事件</Button>}
      >
        <Table
          columns={columns} dataSource={data} loading={loading} rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          size="small" scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑拆股事件' : '新增拆股事件'}
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
                <Input placeholder="如 TSLA" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="证券名称" name="symbolName">
                <Input placeholder="证券名称（选填）" />
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
              <Form.Item label="拆分前股数" name="ratioFrom" rules={[{ required: true, message: '请输入拆分前股数' }]}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder="如 1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="拆分后股数" name="ratioTo" rules={[{ required: true, message: '请输入拆分后股数' }]}>
                <InputNumber style={{ width: '100%' }} min={1} placeholder="如 3（表示1拆3）" />
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

// ============================================================
// 实物分红事件 Tab 内容组件
// ============================================================
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
      title: '证券名称',
      dataIndex: 'symbolName',
      key: 'symbolName',
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
      symbolName: record.symbolName,
      currency: record.currency,
      eventDate: record.eventDate ? dayjs(record.eventDate) : null,
      dividendSymbol: record.dividendSymbol,
      dividendSymbolName: record.dividendSymbolName,
      dividendQtyPerShare: record.dividendQtyPerShare,
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
              <Form.Item label="证券名称" name="symbolName">
                <Input placeholder="证券名称（选填）" />
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
          <Form.Item label="每股分红数量" name="dividendQtyPerShare" rules={[{ required: true, message: '请输入每股分红数量' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.000001} precision={6} placeholder="每持有1股获得的分红数量" />
          </Form.Item>
          <Form.Item label="描述" name="description" rules={[{ max: 500, message: '描述不能超过500个字符' }]}>
            <Input.TextArea placeholder="事件描述（选填）" rows={3} showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ============================================================
// 主页面组件
// ============================================================
const MarketEvents = () => {
  const tabItems = [
    {
      key: 'symbolChange',
      label: (
        <span>
          <SwapOutlined />
          代码变更
        </span>
      ),
      children: <SymbolChangeTab />,
    },
    {
      key: 'stockSplit',
      label: (
        <span>
          <SplitCellsOutlined />
          拆股事件
        </span>
      ),
      children: <StockSplitTab />,
    },
    {
      key: 'dividendInKind',
      label: (
        <span>
          <GiftOutlined />
          实物分红
        </span>
      ),
      children: <DividendInKindTab />,
    },
  ];

  return (
    <div>
      {/* 顶部标题栏 */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertOutlined style={{ fontSize: 22, color: '#faad14' }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>市场异动事件</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              记录市场上的非正常行为数据，用于追溯交易记录中不可解释的情况（代码变更、拆股、实物分红）
            </Text>
          </div>
        </div>
      </Card>

      {/* Tab 切换区域 */}
      <Tabs defaultActiveKey="symbolChange" items={tabItems} type="card" />
    </div>
  );
};

export default MarketEvents;
