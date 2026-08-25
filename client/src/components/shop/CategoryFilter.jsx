import React from 'react';

const CategoryFilter = ({ categories, selected, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          !selected
            ? 'bg-primary-600 text-white shadow-md'
            : 'border border-gold/30 bg-white text-ink hover:border-gold-400'
        }`}
      >
        All Products
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          type="button"
          onClick={() => onChange(cat._id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            selected === cat._id
              ? 'bg-primary-600 text-white shadow-md'
              : 'border border-gold/30 bg-white text-ink hover:border-gold-400'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
