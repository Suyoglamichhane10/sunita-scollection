import React from 'react';

const SortDropdown = ({ sort, onChange }) => {
  return (
    <div className="min-w-[180px]">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-light">
        Sort by
      </label>
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-full border border-gold/30 bg-cream/50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="popular">Most Popular</option>
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gold-500">
          ▾
        </span>
      </div>
    </div>
  );
};

export default SortDropdown;
