const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  facebookLogin,
  facebookCallback,
} = require('../controllers/authController');
const { protect } = require('../Middleware/auth');
const { validateRegister, validateLogin, validate } = require('../Middleware/validator');

// Public routes
router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/facebook', facebookLogin);
router.get('/facebook/callback', facebookCallback);

// Protected routes
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
