import React, { useRef, useEffect } from 'react';

const highlightMatch = (text, query) => {
  if (!text || !query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-gold-200 px-0.5 text-primary-800">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const AutocompleteDropdown = ({
  suggestions,
  loading,
  query,
  onSelect,
  activeIndex,
  setActiveIndex,
}) => {
  const listRef = useRef(null);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  if (!query || (!suggestions.length && !loading)) return null;

  return (
    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-xl">
      {loading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-ink-light">
          <svg className="h-4 w-4 animate-spin text-gold-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Searching...
        </div>
      ) : (
        <ul ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                index === activeIndex ? 'bg-cream' : 'hover:bg-cream'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => onSelect(suggestion)}
            >
              {suggestion.image && (
                <img
                  src={suggestion.image}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {highlightMatch(suggestion.name, query)}
                </p>
                <p className="truncate text-xs text-ink-light">
                  {suggestion.category}
                  {suggestion.price != null && ` • Rs. ${suggestion.price}`}
                </p>
              </div>
            </li>
          ))}
          {!suggestions.length && !loading && (
            <li className="px-4 py-6 text-center text-sm text-ink-light">
              No suggestions found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteDropdown;
