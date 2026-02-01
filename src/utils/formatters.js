// Formatting helpers shared across UI components
export const formatCurrencyFromThousands = (value) => {
  const num = Number(value) || 0;
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}M`;
  }
  return `$${num.toLocaleString()}k`;
};

export const formatNumber = (value, options = {}) => {
  const num = Number(value) || 0;
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  return num.toLocaleString(undefined, { minimumFractionDigits, maximumFractionDigits });
};

export const formatPercent = (value, decimals = 0) => {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
};
