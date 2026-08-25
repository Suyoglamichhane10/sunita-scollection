import React from 'react';

const StockToggle = ({ stock, onChange, lowStockThreshold = 5 }) => {
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= lowStockThreshold;

  const getStatusConfig = () => {
    if (isOutOfStock) {
      return {
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-700 border-red-200',
        dot: 'bg-red-500',
        toggleColor: 'bg-red-500',
      };
    }
    if (isLowStock) {
      return {
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        dot: 'bg-yellow-500',
        toggleColor: 'bg-yellow-500',
      };
    }
    return {
      label: 'In Stock',
      color: 'bg-green-100 text-green-700 border-green-200',
      dot: 'bg-green-500',
      toggleColor: 'bg-green-500',
    };
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(isOutOfStock ? 1 : 0)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          isOutOfStock ? 'bg-gray-200' : config.toggleColor
        }`}
        title={isOutOfStock ? 'Click to mark as In Stock' : 'Click to mark as Out of Stock'}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            isOutOfStock ? 'translate-x-1' : 'translate-x-6'
          }`}
        />
      </button>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    </div>
  );
};

export default StockToggle;
