import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const Breadcrumb = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center gap-1 hover:text-pink-600 transition">
        <FaHome className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <FaChevronRight className="h-3 w-3 text-gray-400" />
          {item.href ? (
            <Link to={item.href} className="hover:text-pink-600 transition">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-800" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
