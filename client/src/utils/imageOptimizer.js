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

export const getFallbackImage = (text = 'Product') => {
  return `https://via.placeholder.com/800x800?text=${encodeURIComponent(text)}`;
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
