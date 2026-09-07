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

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${getFrontendUrl()}/login?error=google_auth_failed`,
    session: false,
  }, (err, user) => {
    if (err || !user) {
      console.error('[Google OAuth] Authentication failed:', err?.message || 'no user returned');
      return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
    }
    const token = user.getSignedJwtToken();
    res.redirect(`${getFrontendUrl()}/auth/google/success?token=${token}`);
  })(req, res, next);
});

module.exports = router;
