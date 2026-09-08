const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const User = require('../Models/User');

// ✅ Guard: only register GoogleStrategy if env vars are present.
// Without this guard, a missing GOOGLE_CLIENT_ID crashes the entire server
// (app.js requires this module at the top level), resulting in 404 for ALL routes.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          // Look up by socialId (matches User model field) instead of googleId
          let user = await User.findOne({ socialId: profile.id });

          if (!user) {
            // Check if user exists by email (link Google to existing account)
            const existingUser = await User.findOne({ email: profile.emails[0].value });
            if (existingUser) {
              existingUser.socialId = profile.id;
              existingUser.socialProvider = 'google';
              await existingUser.save();
              return done(null, existingUser);
            }

            // Create new Google user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: crypto.randomBytes(20).toString('hex'), // required field, random value
              socialProvider: 'google',
              socialId: profile.id,
              isEmailVerified: true,
              avatar: profile.photos[0]?.value || '',
              role: 'customer',
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('✅ GoogleStrategy registered successfully');
} else {
  console.warn('⚠️  Google OAuth environment variables not set (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Google Strategy NOT registered. /api/auth/google will not work until these are configured.');
}

module.exports = passport;
