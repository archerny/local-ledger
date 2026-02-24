import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message, Modal, Form, Input, Select, Tooltip, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchAllBrokers, createBroker } from '../services/brokerApi';

// 国家/地区选项
const countryOptions = [
  { label: '🇨🇳 中国大陆', value: 'CN' },
  { label: '🇭🇰 中国香港', value: 'HK' },
  { label: '🇺🇸 美国', value: 'US' },
  { label: '🇸🇬 新加坡', value: 'SG' },
  { label: '🇬🇧 英国', value: 'UK' },
  { label: '🇯🇵 日本', value: 'JP' },
  { label: '🇳🇿 新西兰', value: 'NZ' },
  { label: '🇦🇺 澳大利亚', value: 'AU' },
];

// 国家代码映射（用于展示）
const countryMap = {
  CN: { label: '中国大陆', color: 'red' },
  HK: { label: '中国香港', color: 'magenta' },
  US: { label: '美国', color: 'blue' },
  SG: { label: '新加坡', color: 'green' },
  UK: { label: '英国', color: 'purple' },
  JP: { label: '日本', color: 'orange' },
  NZ: { label: '新西兰', color: 'cyan' },
  AU: { label: '澳大利亚', color: 'gold' },
};

const BrokerManagement = () => {
  const [brokerData, setBrokerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null); // null 表示新增，否则为编辑
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 加载券商数据
  const loadBrokers = async () => {
    setLoading(true);
    try {
      const result = await fetchAllBrokers();
      if (result.status === 'SUCCESS') {
        const list = (result.data || []).map((item) => ({
          ...item,
          key: String(item.id),
        }));
        setBrokerData(list);
      } else {
        message.error(result.message || '查询券商数据失败');
      }
    } catch (error) {
      console.error('查询券商数据失败:', error);
      message.error('查询券商数据失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadBrokers();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '券商名称',
      dataIndex: 'brokerName',
      key: 'brokerName',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '国家/地区',
      dataIndex: 'country',
      key: 'country',
      render: (country) => {
        const info = countryMap[country] || { label: country, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
      filters: countryOptions.map((item) => ({ text: item.label, value: item.value })),
      onFilter: (value, record) => record.country === value,
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
      title: '关联邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span style={{ color: '#666' }}>{text || '-'}</span>,
    },
    {
      title: '关联电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => <span style={{ color: '#666' }}>{text || '-'}</span>,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
  ];

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingBroker(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 取消弹窗
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingBroker(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(async (values) => {
        setSubmitting(true);
        try {
          if (editingBroker) {
            // 编辑模式 - 暂不实现，表格无操作列
            message.info('编辑功能暂未开放');
          } else {
            // 新增模式 - 调用后端 API
            const result = await createBroker(values);
            if (result.status === 'SUCCESS') {
              message.success(`券商「${values.brokerName}」添加成功！`);
              loadBrokers(); // 重新加载数据
            } else {
              message.error(result.message || '新增券商失败');
            }
          }
          setIsModalOpen(false);
          setEditingBroker(null);
          form.resetFields();
        } catch (error) {
          console.error('操作失败:', error);
          const errorMsg = error.response?.data?.message || '操作失败，请稍后重试';
          message.error(errorMsg);
        } finally {
          setSubmitting(false);
        }
      })
      .catch((errorInfo) => {
        console.log('表单验证失败:', errorInfo);
      });
  };

  return (
    <Card
      title="券商账户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增券商
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={brokerData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        rowClassName={(record) => (!record.isActive ? 'inactive-row' : '')}
      />

      <Modal
        title={editingBroker ? '编辑券商信息' : '新增券商'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            {editingBroker ? '保存' : '提交'}
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
            label="券商名称"
            name="brokerName"
            rules={[
              { required: true, message: '请输入券商名称' },
              { max: 100, message: '券商名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入券商名称，如：富途证券" />
          </Form.Item>

          <Form.Item
            label="国家/地区"
            name="country"
            rules={[{ required: true, message: '请选择所属国家/地区' }]}
          >
            <Select
              placeholder="请选择所属国家/地区"
              options={countryOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入券商账户描述（选填）"
              rows={3}
              showCount
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="关联邮箱"
            name="email"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
              { max: 100, message: '邮箱不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入关联邮箱（选填）" />
          </Form.Item>

          <Form.Item
            label="关联电话"
            name="phone"
            rules={[{ max: 30, message: '电话号码不能超过30个字符' }]}
          >
            <Input placeholder="请输入关联电话（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BrokerManagement;
