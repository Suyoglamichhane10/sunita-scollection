const getFrontendUrl = () => {
  const origins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return origins[0] || 'https://sunitacollection-frontend.vercel.app';
};

module.exports = { getFrontendUrl };
