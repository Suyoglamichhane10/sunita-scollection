const getAbsoluteUrl = (req, relativePath) => {
  if (!relativePath) return relativePath;
  if (relativePath.startsWith('http')) return relativePath;
  const host = req.get('host');
  const protocol = req.protocol;
  return `${protocol}://${host}${relativePath}`;
};

module.exports = { getAbsoluteUrl };
