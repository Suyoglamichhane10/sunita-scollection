const allowedOrigins = () =>
  (process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const getFrontendUrl = () => {
  const origins = allowedOrigins();
  return origins[0] || 'https://sunitacollection-frontend.vercel.app';
};

// Password reset links are opened from whatever browser the customer is
// currently using, so the request's own Origin is a better guess than the first
// configured origin - otherwise local testing always bounces to production. The
// Origin still has to be a configured origin, so this cannot be used to send a
// reset link to an attacker's site.
const resolveFrontendUrl = (req) => {
  const allowed = allowedOrigins();
  const header = req?.headers?.origin || req?.headers?.referer;

  if (header) {
    try {
      const candidate = new URL(header).origin;
      if (allowed.includes(candidate)) return candidate;
    } catch {
      // Malformed Origin/Referer - fall through to the configured default.
    }
  }

  return getFrontendUrl();
};

module.exports = { getFrontendUrl, resolveFrontendUrl };