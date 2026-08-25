import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext();

export const useCompare = () => useContext(CompareContext);

const COMPARE_KEY = 'compare_items';

export const CompareProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(COMPARE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCompare = (product) => {
    setItems((prev) => {
      if (prev.find((p) => p._id === product._id)) {
        return prev;
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId) => {
    setItems((prev) => prev.filter((p) => p._id !== productId));
  };

  const clearCompare = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, addToCompare, removeFromCompare, clearCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export default CompareProvider;
