export const getCloudinaryOptimizedUrl = (url, width = 800) => {
  if (!url || typeof url !== 'string') return null;

  if (url.includes('res.cloudinary.com') || url.includes('cloudinary.com')) {
    try {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;
      const transformations = `c_scale,w_${Math.round(width)},q_auto,f_auto,dpr_auto`;
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    } catch {
      return url;
    }
  }

  if (url.startsWith('/')) return url;
  return url;
};

export const getCloudinaryThumbnailUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('res.cloudinary.com') || url.includes('cloudinary.com')) {
    try {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return url;
      const transformations = 'c_scale,w_200,q_auto,f_auto,dpr_auto';
      return `${parts[0]}/upload/${transformations}/${parts[1]}`;
    } catch {
      return url;
    }
  }
  if (url.startsWith('/')) return url;
  return url;
};

const escapeSvgText = (text) =>
  String(text)
    .slice(0, 24)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Local inline SVG instead of via.placeholder.com, which is unreliable
// (frequent ERR_CONNECTION_CLOSED) and adds a third-party request per image.
export const getFallbackImage = (text = 'Product') => {
  const label = escapeSvgText(text || 'Product');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3f4f6"/><text x="200" y="196" font-family="system-ui,sans-serif" font-size="20" font-weight="600" fill="#6b7280" text-anchor="middle">${label}</text><text x="200" y="224" font-family="system-ui,sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">No image</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const getAbsoluteImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) {
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      (import.meta.env.VITE_API_URL || import.meta.env.API_URL || '').replace(/\/api\/?$/, '');
    if (backendUrl) {
      return `${backendUrl.replace(/\/$/, '')}${url}`;
    }
    return url;
  }
  return url;
};

export const getMainImage = (images, fallbackText = 'Product') => {
  if (!images || !images.length) return { url: getFallbackImage(fallbackText), isMain: true };
  const main = images.find((img) => img.isMain);
  return main || images[0];
};

export const getVariantImage = (variant, productImages, fallbackText = 'Product') => {
  const variantImg = variant?.images?.find((img) => img.isMain) || variant?.images?.[0];
  if (variantImg) return variantImg;
  return getMainImage(productImages, fallbackText);
};

export const IMAGE_ON_ERROR_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="200" y="210" font-size="16" text-anchor="middle" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

export const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = IMAGE_ON_ERROR_FALLBACK;
};
