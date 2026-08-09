const path = require('path');
const cloudinary = require('../config/cloudinary');

// Determine whether Cloudinary is properly configured
const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

// @desc    Upload images to Cloudinary (with local fallback)
// @route   POST /api/upload/image
// @access  Private/Admin
// Expects multipart/form-data with field 'images' (can be multiple)

exports.uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

// If Cloudinary is not configured, return the local file path so the
    // product can still be saved and the image can be served from /uploads.
    if (!isCloudinaryConfigured()) {
      const images = req.files.map((file) => ({
        url: `/uploads/${path.basename(file.path)}`,
        publicId: null,
      }));
      return res.status(200).json({ success: true, images, local: true });
    }

    // Try uploading to Cloudinary. If it fails for any reason (bad/expired
    // credentials, network issues, quota, etc.), gracefully fall back to
    // serving the file from the local /uploads directory so the product can
    // always be created without a server error.
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

      return res.status(200).json({ success: true, images });
    } catch (cloudinaryError) {
      console.warn('⚠️ Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);

      const images = req.files.map((file) => ({
        url: `/uploads/${path.basename(file.path)}`,
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
