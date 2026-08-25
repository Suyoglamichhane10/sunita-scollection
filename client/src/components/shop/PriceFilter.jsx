import React from 'react';

const PriceFilter = ({ minPrice, maxPrice, onMinChange, onMaxChange, onApply }) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-light">
          Min price (Rs.)
        </label>
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="0"
          className="w-full rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
        />
      </div>
      <span className="pb-2.5 text-ink-light">—</span>
      <div className="flex-1 min-w-[120px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-light">
          Max price (Rs.)
        </label>
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="5000"
          className="w-full rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
        />
      </div>
      <button
        type="button"
        onClick={onApply}
        className="rounded-full bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        Apply
      </button>
    </div>
  );
};

export default PriceFilter;
