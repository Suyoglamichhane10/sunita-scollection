const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
  }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
    const token = user.getSignedJwtToken();
    res.redirect(`${process.env.FRONTEND_URL}/auth/google/success?token=${token}`);
  })(req, res, next);
});

module.exports = router;
