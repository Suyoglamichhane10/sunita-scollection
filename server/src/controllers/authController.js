const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordReset } = require('../services/emailService');

const https = require('https');

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('token', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

const fetchFacebookUser = async (accessToken) => {
  return new Promise((resolve, reject) => {
    https.get(
      `${FACEBOOK_GRAPH_URL}/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'Facebook fetch failed'));
            }
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        });
      }
    ).on('error', reject);
  });
};

const exchangeCodeForToken = async (code) => {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
      code,
    });

    https.get(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?${params.toString()}`,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'Facebook token exchange failed'));
            }
            resolve(parsed.access_token);
          } catch (err) {
            reject(err);
          }
        });
      }
    ).on('error', reject);
  });
};

const postForm = (url, formParams) =>
  new Promise((resolve, reject) => {
    const payload = new URLSearchParams(formParams).toString();
    const req = https.request(
      url,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.error_description || parsed.error.message || 'Token exchange failed'));
            }
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

const fetchGoogleUser = async (accessToken) => {
  return new Promise((resolve, reject) => {
    https.get(
      `${GOOGLE_USERINFO_URL}?access_token=${accessToken}`,
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'Google fetch failed'));
            }
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        });
      }
    ).on('error', reject);
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.facebookLogin = async (req, res, next) => {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const callbackUrl = process.env.FACEBOOK_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/facebook/callback`;
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=email,public_profile&display=popup`;
    res.redirect(facebookAuthUrl);
  } catch (error) {
    next(error);
  }
};

exports.facebookCallback = async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_denied`);
    }

    const accessToken = await exchangeCodeForToken(code);
    const fbUser = await fetchFacebookUser(accessToken);

    if (!fbUser.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_email_required`);
    }

    let user = await User.findOne({ email: fbUser.email });

    if (!user) {
      user = await User.create({
        name: fbUser.name,
        email: fbUser.email,
        password: crypto.randomBytes(20).toString('hex'),
        socialProvider: 'facebook',
        socialId: fbUser.id,
        avatar: fbUser.picture?.data?.url || null,
      });
    } else if (!user.socialProvider) {
      user.socialProvider = 'facebook';
      user.socialId = fbUser.id;
      if (!user.avatar && fbUser.picture?.data?.url) {
        user.avatar = fbUser.picture.data.url;
      }
      await user.save();
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user);

    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=openid%20profile%20email&access_type=offline&prompt=consent`;
    res.redirect(googleAuthUrl);
  } catch (error) {
    next(error);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_denied`);
    }

    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;
    const tokenResponse = await postForm(GOOGLE_TOKEN_URL, {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    });

    const googleUser = await fetchGoogleUser(tokenResponse.access_token);

    if (!googleUser.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_email_required`);
    }

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        password: crypto.randomBytes(20).toString('hex'),
        socialProvider: 'google',
        socialId: googleUser.sub,
        avatar: googleUser.picture || null,
      });
    } else if (!user.socialProvider) {
      user.socialProvider = 'google';
      user.socialId = googleUser.sub;
      if (!user.avatar && googleUser.picture) {
        user.avatar = googleUser.picture;
      }
      await user.save();
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user);

    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishlist')
      .populate('cart.product');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send password reset email (non-blocking)
    try {
      await sendPasswordReset(user, resetUrl);
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetToken,
      resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
