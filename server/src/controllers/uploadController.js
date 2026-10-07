const path = require('path');
const cloudinary = require('../config/cloudinary');
const User = require('../Models/User');
const { getAbsoluteUrl } = require('../Utils/getAbsoluteUrl');

// Determine whether Cloudinary is properly configured
const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_API_KEY.includes('your_')
  );

const isProduction = () => process.env.NODE_ENV === 'production';

// @desc    Upload images to Cloudinary (with local fallback in dev only)
// @route   POST /api/upload/image
// @access  Private/Admin
// Expects multipart/form-data with field 'images' (can be multiple)

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    // In production, Cloudinary is REQUIRED. Reject if not configured.
    if (!isCloudinaryConfigured()) {
      if (isProduction()) {
        return res.status(500).json({
          success: false,
          message: 'Image storage is not configured. Please contact the administrator.',
        });
      }
      // Development: warn and fall back to local storage
      console.warn('⚠️ Cloudinary not configured, using local storage (image will not persist on restart)');
      const images = req.files.map((file) => ({
        url: getAbsoluteUrl(req, `/uploads/${path.basename(file.path)}`),
        publicId: null,
      }));
      return res.status(200).json({ success: true, images, local: true });
    }

    // Try uploading to Cloudinary.
    try {
      const uploadPromises = req.files.map((file) => {
        return cloudinary.uploader.upload(file.path, {
          folder: 'sunitas-collection',
          use_filename: true,
          resource_type: 'auto',
        });
      });

      const results = await Promise.all(uploadPromises);

      const images = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      // Log success in non-production
      if (!isProduction()) {
        results.forEach((result) => {
          console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
        });
      } else {
        console.log(`✅ ${results.length} image(s) uploaded to Cloudinary`);
      }

      return res.status(200).json({ success: true, images });
    } catch (cloudinaryError) {
      // Cloudinary configured but upload failed - in production, this is an error
      console.error('❌ Cloudinary upload failed:', cloudinaryError.message);
      if (isProduction()) {
        return res.status(500).json({
          success: false,
          message: 'Image upload failed. Please try again.',
        });
      }
      // Development: fall back to local storage
      console.warn('⚠️ Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
      const images = req.files.map((file) => ({
        url: getAbsoluteUrl(req, `/uploads/${path.basename(file.path)}`),
        publicId: null,
      }));
      return res.status(200).json({ success: true, images, local: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private/Admin
exports.deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;
    if (!publicId || publicId === 'null' || publicId === 'undefined') {
      // Nothing to delete from Cloudinary (image was stored locally).
      return res.status(200).json({ success: true, result: { deleted: false, local: true } });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload a profile avatar for the logged-in user
// @route   POST /api/upload/avatar
// @access  Private
// Expects multipart/form-data with field 'avatar' (single image)
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No avatar uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old avatar from Cloudinary if it exists and is not default
    if (user.avatarPublicId && user.avatarPublicId !== 'default-avatar') {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.warn('Failed to delete old avatar:', err.message);
      }
    }

    let avatarUrl;
    let publicId;

    // In production, Cloudinary is REQUIRED. Reject if not configured.
    if (!isCloudinaryConfigured()) {
      if (isProduction()) {
        return res.status(500).json({
          success: false,
          message: 'Image storage is not configured. Please contact the administrator.',
        });
      }
      // Development: warn and fall back to local storage
      console.warn('⚠️ Cloudinary not configured, using local storage (image will not persist on restart)');
      avatarUrl = getAbsoluteUrl(req, `/uploads/${path.basename(req.file.path)}`);
      publicId = null;
    } else {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'sunitas-collection/avatars',
          use_filename: true,
          resource_type: 'auto',
          transformation: [{ width: 400, height: 400, crop: 'limit', gravity: 'face' }],
        });
        avatarUrl = result.secure_url;
        publicId = result.public_id;
        if (!isProduction()) {
          console.log(`✅ Uploaded avatar to Cloudinary: ${avatarUrl}`);
        } else {
          console.log('✅ Avatar uploaded to Cloudinary');
        }
      } catch (cloudinaryError) {
        console.error('❌ Avatar Cloudinary upload failed:', cloudinaryError.message);
        if (isProduction()) {
          return res.status(500).json({
            success: false,
            message: 'Image upload failed. Please try again.',
          });
        }
        // Development: fall back to local storage
        console.warn('⚠️ Avatar Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
        avatarUrl = getAbsoluteUrl(req, `/uploads/${path.basename(req.file.path)}`);
        publicId = null;
      }
    }

    user.avatar = avatarUrl;
    user.avatarPublicId = publicId || '';
    await user.save();

    user.password = undefined;

    res.status(200).json({ success: true, avatar: avatarUrl, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Check Cloudinary configuration and connectivity
// @route   GET /api/health/cloudinary
// @access  Public (or Private - accessible for monitoring)
exports.checkCloudinaryHealth = async (req, res, next) => {
  try {
    const configured = isCloudinaryConfigured();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || null;

    if (!configured) {
      return res.status(200).json({
        configured: false,
        reachable: false,
        cloudName: null,
        error: 'Cloudinary credentials not set',
      });
    }

    // Ping Cloudinary API to verify credentials work
    let reachable = false;
    let error = null;
    try {
      await cloudinary.api.ping();
      reachable = true;
    } catch (pingError) {
      error = pingError.message || 'Invalid credentials';
    }

    res.status(200).json({
      configured: true,
      reachable,
      cloudName,
      error,
    });
  } catch (error) {
    next(error);
  }
};
