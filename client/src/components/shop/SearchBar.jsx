import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import api from '../../Services/api';

const DEBOUNCE_DELAY = 300;

const highlightMatch = (text, query) => {
  if (!text || !query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-gold-200 px-0.5 text-primary-800">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const SearchBar = ({
  placeholder = 'Search products...',
  className = '',
  onSearch,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/products/suggestions', {
        params: { q: searchTerm, limit: 8 },
      });
      setSuggestions(data.suggestions || []);
      setActiveIndex(-1);
    } catch (err) {
      console.error('Search suggestions error:', err);
      setError('Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, DEBOUNCE_DELAY);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (query.trim() && suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  };

  const handleSelect = useCallback((suggestion) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery(suggestion.name);

    if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.id}`);
    } else if (suggestion.type === 'category') {
      navigate(`/shop?category=${suggestion.id}`);
    }

    if (onSearch) {
      onSearch(suggestion.name);
    }
  }, [navigate, onSearch]);

  const handleSearchSubmit = useCallback(() => {
    if (!query.trim()) return;

    setIsOpen(false);
    setActiveIndex(-1);

    if (onSearch) {
      onSearch(query.trim());
    }

    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
  }, [navigate, onSearch, query]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelect(suggestions[activeIndex]);
        } else if (query.trim()) {
          handleSearchSubmit();
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
      }
    },
    [isOpen, suggestions, activeIndex, query, handleSelect, handleSearchSubmit]
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-full border border-gold/30 bg-white py-3.5 pl-11 pr-20 text-sm shadow-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-200"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
              aria-label="Clear search"
            >
              <FaTimes size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gold-600"
          >
            Search
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-ink-light">
              <svg className="h-4 w-4 animate-spin text-gold-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Searching...
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-center text-sm text-red-500">{error}</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                    index === activeIndex ? 'bg-cream' : 'hover:bg-cream'
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(suggestion)}
                >
                  {suggestion.image && (
                    <img
                      src={suggestion.image}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink">
                        {highlightMatch(suggestion.name, query)}
                      </p>
                      {suggestion.type === 'product' && (
                        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold text-gold-700">Product</span>
                      )}
                      {suggestion.type === 'category' && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">Category</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-ink-light">
                      {suggestion.category && `${suggestion.category} • `}
                      {suggestion.price != null && `Rs. ${suggestion.price}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="px-4 py-6 text-center text-sm text-ink-light">
              No suggestions found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
