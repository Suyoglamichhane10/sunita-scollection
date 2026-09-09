const express = require('express');
const router = express.Router();
const passport = require('passport');

const getFrontendUrl = () => {
  const origins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins[0] || 'https://sunitacollection-frontend.vercel.app';
};

// Check whether the 'google' strategy was registered
const isGoogleConfigured = () => {
  return passport._strategies && !!passport._strategies['google'];
};

// @route   GET /api/auth/google
// @desc    Authenticate with Google
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    console.error('[Google OAuth] Strategy not registered - check GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars on Render');
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    console.error('[Google OAuth] Strategy not registered - cannot process callback');
    return res.redirect(`${getFrontendUrl()}/login?error=google_not_configured`);
  }
  passport.authenticate('google', {
    failureRedirect: `${getFrontendUrl()}/login?error=google_auth_failed`,
    session: false,
  }, (err, user) => {
    if (err || !user) {
      console.error('[Google OAuth] Authentication failed:', err?.message || 'no user returned');
      return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
    }
    console.log('✅ Google OAuth callback received user:', user.email);

    try {
      const token = user.getSignedJwtToken();
      console.log('✅ JWT token generated for user:', user.email);
      const redirectUrl = `${getFrontendUrl()}/auth/google/success?token=${token}`;
      console.log('🔵 Redirecting to frontend:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[Google OAuth] Token generation error:', error.message);
      res.redirect(`${getFrontendUrl()}/login?error=token_generation_failed`);
    }
  })(req, res, next);
});

module.exports = router;
