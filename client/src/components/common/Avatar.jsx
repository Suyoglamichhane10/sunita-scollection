import React, { useState } from 'react';
import { FaUser } from 'react-icons/fa';

const AVATAR_COLORS = [
  'from-pink-500 to-rose-600',
  'from-red-500 to-pink-600',
  'from-purple-500 to-pink-600',
  'from-rose-500 to-red-600',
  'from-fuchsia-500 to-pink-600',
  'from-pink-600 to-rose-500',
  'from-red-600 to-pink-500',
  'from-rose-600 to-pink-500',
];

const SIZE_MAP = {
  xs: 'h-8 w-8 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const getInitials = (name) => {
  if (!name || name.trim() === '') return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

const getColorFromName = (name) => {
  if (!name || name.trim() === '') return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const Avatar = ({
  src,
  name,
  size = 'md',
  className = '',
  onClick,
  showBorder = true,
  borderColor = 'border-white',
  shadow = true,
  alt = 'Avatar',
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  const isValidImageUrl = (url) => {
    if (!url || url.trim() === '') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/uploads');
  };

  const shouldShowImage = isValidImageUrl(src) && !imgError;

  const baseClasses = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white select-none ${sizeClass} ${className}`;

  const borderClasses = showBorder ? `border-2 ${borderColor}` : 'border-0';
  const shadowClasses = shadow ? 'shadow-md' : '';

  const content = (
    <>
      {shouldShowImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : null}
      {!shouldShowImage && initials ? (
        <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${colorClass} ${shouldShowImage ? 'hidden' : 'flex'}`}>
          {initials}
        </span>
      ) : null}
      {!shouldShowImage && !initials ? (
        <span className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 ${shouldShowImage ? 'hidden' : 'flex'}`}>
          <FaUser size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 32} />
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${borderClasses} ${shadowClasses} transition hover:opacity-80 cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={`${baseClasses} ${borderClasses} ${shadowClasses}`}>
      {content}
    </span>
  );
};

export default Avatar;
