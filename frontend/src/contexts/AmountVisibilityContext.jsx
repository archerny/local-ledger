import React, { createContext, useContext, useState } from 'react';

/**
 * 金额可见性上下文
 * 用于全局控制资金敏感数据的显示/隐藏
 */
const AmountVisibilityContext = createContext({
  amountVisible: true,
  toggleAmountVisible: () => {},
});

/**
 * 金额可见性 Provider
 */
export const AmountVisibilityProvider = ({ children }) => {
  const [amountVisible, setAmountVisible] = useState(true);

  const toggleAmountVisible = () => {
    setAmountVisible((prev) => !prev);
  };

  return (
    <AmountVisibilityContext.Provider value={{ amountVisible, toggleAmountVisible }}>
      {children}
    </AmountVisibilityContext.Provider>
  );
};

/**
 * 自定义 Hook：获取金额可见性状态
 */
export const useAmountVisibility = () => {
  return useContext(AmountVisibilityContext);
};

/**
 * 工具函数：根据可见性状态格式化敏感数据
 * @param {any} value - 原始值
 * @param {boolean} visible - 是否可见
 * @param {string} mask - 遮罩字符，默认 '****'
 * @returns {string} 格式化后的值
 */
export const formatSensitiveAmount = (value, visible, mask = '****') => {
  if (!visible) return mask;
  return value;
};

export default AmountVisibilityContext;
