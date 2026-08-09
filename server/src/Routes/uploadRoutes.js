const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadImages, deleteImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../Middleware/auth');

// Configure multer storage (temp local storage before Cloudinary upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter,
});

// Admin routes
router.post('/image', protect, authorize('admin'), upload.array('images', 10), uploadImages);
router.delete('/image/:publicId', protect, authorize('admin'), deleteImage);

module.exports = router;
