const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { sendPasswordReset } = require('../services/emailService');
const { getFrontendUrl } = require('../Utils/frontendUrl');

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

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

const exchangeCodeForToken = async (code, provider) => {
  let url, params;
  
  if (provider === 'facebook') {
    url = `${FACEBOOK_GRAPH_URL}/oauth/access_token`;
    params = {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
      code,
    };
  } else if (provider === 'google') {
    url = GOOGLE_TOKEN_URL;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/auth/google/callback`;
    params = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    };
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  try {
    const response = await axios.post(url, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });
    
    if (provider === 'facebook') {
      return response.data.access_token;
    } else {
      return response.data.access_token;
    }
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.error_description || error.response.data.error.message || `${provider} token exchange failed`);
    }
    throw error;
  }
};

const fetchSocialUser = async (accessToken, provider) => {
  let url;
  
  if (provider === 'facebook') {
    url = `${FACEBOOK_GRAPH_URL}/me?fields=id,name,email,picture.type(large)`;
  } else if (provider === 'google') {
    url = GOOGLE_USERINFO_URL;
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message || `${provider} user fetch failed`);
    }
    throw error;
  }
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
      return res.redirect(`${getFrontendUrl()}/login?error=facebook_auth_denied`);
    }

    const accessToken = await exchangeCodeForToken(code, 'facebook');
    const fbUser = await fetchSocialUser(accessToken, 'facebook');

    if (!fbUser.email) {
      return res.redirect(`${getFrontendUrl()}/login?error=facebook_email_required`);
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

    res.redirect(`${getFrontendUrl()}/login?token=${token}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${getFrontendUrl()}/login?error=facebook_auth_failed`);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('❌ GOOGLE_CLIENT_ID not set in environment');
      return res.redirect(`${getFrontendUrl()}/login?error=google_config_error`);
    }

    const googleAuthUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=profile%20email&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('🔵 Google Login initiated');
    console.log('🔵 Redirect URI:', redirectUri);
    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.redirect(`${getFrontendUrl()}/login?error=google_login_failed`);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(`${getFrontendUrl()}/login?error=no_code`);
    }

    console.log('🔵 Google callback received with code');

    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Google credentials not configured');
      return res.redirect(`${getFrontendUrl()}/login?error=google_config_error`);
    }

    // Exchange code for access token using axios
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    console.log('✅ Access token received');

    const { access_token } = tokenResponse.data;

    // Get user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 
        Authorization: `Bearer ${access_token}` 
      }
    });

    const { id, name, email, picture } = userInfoResponse.data;
    console.log('✅ Google user info received:', { id, name, email });

    // Find or create user - check socialId first
    let user = await User.findOne({ socialId: id, socialProvider: 'google' });

    if (!user) {
      // Check if user exists by email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // Link Google account to existing user
        existingUser.socialId = id;
        existingUser.socialProvider = 'google';
        existingUser.avatar = picture || existingUser.avatar;
        existingUser.isEmailVerified = true;
        await existingUser.save();
        user = existingUser;
        console.log('✅ Google account linked to existing user');
      } else {
        // Create new user
        user = new User({
          name: name || email.split('@')[0],
          email,
          socialId: id,
          socialProvider: 'google',
          avatar: picture || '',
          isEmailVerified: true,
          role: 'customer',
          password: Math.random().toString(36).slice(-8)
        });
        await user.save();
        console.log('✅ New user created from Google');
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ JWT token generated successfully');

    // Redirect to frontend with token
    const redirectUrl = `${getFrontendUrl()}/auth/google/success?token=${token}`;
    console.log('🔵 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Google callback error:', error.message);
    console.error('❌ Error details:', error.response?.data || error);
    res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`);
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

const resetUrl = `${getFrontendUrl()}/reset-password/${resetToken}`;

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
