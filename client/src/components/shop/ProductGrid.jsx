import React from 'react';

const ProductGrid = ({ products, loading, renderCard }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl border border-gold/20 bg-white p-4 shadow-card"
          >
            <div className="h-64 w-full rounded-2xl bg-cream" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-3/4 rounded bg-cream" />
              <div className="h-4 w-1/2 rounded bg-cream" />
              <div className="h-10 w-full rounded-full bg-cream" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-gold/20 bg-white p-10 text-center shadow-card">
        <p className="text-ink-light">No products found. Try a different search or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => renderCard(product))}
    </div>
  );
};

export default ProductGrid;
