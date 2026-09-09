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

// Google OAuth routes moved to authRoutes.js to avoid Passport session issues.
// This file is intentionally left as a no-op so app.js imports remain valid.

module.exports = router;
