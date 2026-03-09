import React from 'react';
import { Breadcrumb, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

/**
 * 面包屑组件 —— 在 AppLayout 灰色背景区域渲染
 */
export const PageHeaderBreadcrumb = ({ breadcrumbs = [] }) => {
  const breadcrumbItems = breadcrumbs.map((crumb, index) => {
    const isLast = index === breadcrumbs.length - 1;
    const item = { title: crumb.label };
    if (!isLast && crumb.href) {
      item.href = crumb.href;
    }
    return item;
  });

  if (breadcrumbItems.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <Breadcrumb items={breadcrumbItems} />
    </div>
  );
};

/**
 * 标题栏组件 —— 在白色内容卡片内部渲染
 * 提供「返回按钮 + 标题 + 额外内容」布局。
 */
export const PageHeaderTitle = ({ title, breadcrumbs = [], onBack, extra }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const parentCrumb = breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2] : null;
    if (parentCrumb?.href) {
      window.location.hash = parentCrumb.href;
    } else {
      window.history.back();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        style={{ marginRight: 8, padding: '4px 8px', color: '#1677ff' }}
      />
      <span style={{ fontSize: 20, fontWeight: 600, marginRight: 12 }}>{title}</span>
      {extra && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extra}</div>}
    </div>
  );
};

/**
 * 完整 PageHeader（面包屑 + 标题栏），保留默认导出以兼容
 */
const PageHeader = ({ title, breadcrumbs = [], onBack, extra }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <PageHeaderBreadcrumb breadcrumbs={breadcrumbs} />
      <PageHeaderTitle title={title} breadcrumbs={breadcrumbs} onBack={onBack} extra={extra} />
    </div>
  );
};

export default PageHeader;
