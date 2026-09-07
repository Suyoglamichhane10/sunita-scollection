const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../Models/User');
const bcrypt = require('bcrypt');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ socialId: profile.id, socialProvider: 'google' });

        if (!user) {
          const existingUser = await User.findOne({ email: profile.emails[0].value });
          if (existingUser) {
            existingUser.socialId = profile.id;
            existingUser.socialProvider = 'google';
            existingUser.isEmailVerified = true;
            if (existingUser.avatar === 'default-avatar.png' && profile.photos[0]?.value) {
              existingUser.avatar = profile.photos[0].value;
            }
            await existingUser.save();
            return done(null, existingUser);
          }

          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
            socialProvider: 'google',
            socialId: profile.id,
            isEmailVerified: true,
            avatar: profile.photos[0]?.value || 'default-avatar.png',
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
