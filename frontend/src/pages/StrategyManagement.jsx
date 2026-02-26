import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Modal, Form, Input, Tooltip, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchAllStrategies, createStrategy, updateStrategy, deleteStrategy } from '../services/strategyApi';

const StrategyManagement = () => {
  const [strategyData, setStrategyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState(null); // null 表示新增，否则为编辑
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // 加载策略数据
  const loadStrategies = async () => {
    setLoading(true);
    try {
      const result = await fetchAllStrategies();
      if (result.status === 'SUCCESS') {
        const list = (result.data || []).map((item) => ({
          ...item,
          key: String(item.id),
        }));
        setStrategyData(list);
      } else {
        message.error(result.message || '查询策略数据失败');
      }
    } catch (error) {
      console.error('查询策略数据失败:', error);
      message.error('查询策略数据失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    loadStrategies();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '策略名称',
      dataIndex: 'strategyName',
      key: 'strategyName',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '策略描述',
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
      sorter: (a, b) => dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <a onClick={() => handleEdit(record)}>编辑</a>
          <Popconfirm
            title="确认删除"
            description={`确定要删除策略「${record.strategyName}」吗？`}
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 打开编辑弹窗
  const handleEdit = (record) => {
    setEditingStrategy(record);
    form.setFieldsValue({
      strategyName: record.strategyName,
      description: record.description,
    });
    setIsModalOpen(true);
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingStrategy(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // 取消弹窗
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingStrategy(null);
    form.resetFields();
  };

  // 删除策略
  const handleDelete = async (record) => {
    try {
      const result = await deleteStrategy(record.id);
      if (result.status === 'SUCCESS') {
        message.success(`策略「${record.strategyName}」已删除`);
        loadStrategies();
      } else {
        message.error(result.message || '删除策略失败');
      }
    } catch (error) {
      console.error('删除策略失败:', error);
      const errorMsg = error.response?.data?.message || '删除策略失败，请稍后重试';
      message.error(errorMsg);
    }
  };

  // 提交表单
  const handleSubmit = () => {
    form.validateFields()
      .then(async (values) => {
        setSubmitting(true);
        try {
          if (editingStrategy) {
            // 编辑模式
            const result = await updateStrategy(editingStrategy.id, values);
            if (result.status === 'SUCCESS') {
              message.success(`策略「${values.strategyName}」更新成功！`);
              loadStrategies();
            } else {
              message.error(result.message || '更新策略失败');
            }
          } else {
            // 新增模式
            const result = await createStrategy(values);
            if (result.status === 'SUCCESS') {
              message.success(`策略「${values.strategyName}」添加成功！`);
              loadStrategies();
            } else {
              message.error(result.message || '新增策略失败');
            }
          }
          setIsModalOpen(false);
          setEditingStrategy(null);
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
      title="交易策略管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增策略
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={strategyData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingStrategy ? '编辑策略' : '新增策略'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
            {editingStrategy ? '保存' : '提交'}
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
            label="策略名称"
            name="strategyName"
            rules={[
              { required: true, message: '请输入策略名称' },
              { max: 200, message: '策略名称不能超过200个字符' },
            ]}
          >
            <Input placeholder="请输入策略名称，如：网格交易、价值投资" />
          </Form.Item>

          <Form.Item
            label="策略描述"
            name="description"
            rules={[{ max: 500, message: '策略描述不能超过500个字符' }]}
          >
            <Input.TextArea
              placeholder="请输入策略描述（选填），描述该策略的核心逻辑和适用场景"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default StrategyManagement;
