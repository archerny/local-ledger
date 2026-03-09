import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * PageHeader 上下文
 * 子页面通过 usePageHeader() 将面包屑、标题等配置「上报」给 AppLayout，
 * 由 AppLayout 在灰色背景区域（白色内容卡片外部）统一渲染 PageHeader。
 */
const PageHeaderContext = createContext(null);

export const PageHeaderProvider = ({ children }) => {
  const [config, setConfig] = useState(null);

  const setPageHeader = useCallback((cfg) => {
    setConfig(cfg);
  }, []);

  const clearPageHeader = useCallback(() => {
    setConfig(null);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ config, setPageHeader, clearPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
};

/**
 * 供子页面使用的 hook
 *
 * @example
 * const { setPageHeader, clearPageHeader } = usePageHeader();
 *
 * useEffect(() => {
 *   setPageHeader({
 *     title: '交易详情',
 *     breadcrumbs: [{ label: '交易记录', href: '#/trades' }, { label: '交易详情' }],
 *     onBack: () => { window.location.hash = '#/trades'; },
 *     extra: <Tag>股票</Tag>,
 *   });
 *   return () => clearPageHeader();
 * }, []);
 */
export const usePageHeader = () => {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error('usePageHeader 必须在 PageHeaderProvider 内使用');
  }
  return ctx;
};

export default PageHeaderContext;
