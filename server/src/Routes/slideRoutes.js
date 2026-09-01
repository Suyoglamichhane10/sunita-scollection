const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getSlides,
  getSlide,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
} = require('../controllers/slideController');
const { protect, authorize } = require('../Middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `slide-${unique}${path.extname(file.originalname)}`);
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Public route - active slides only
router.get('/', getSlides);

// Admin routes
router.get('/admin', protect, authorize('admin'), getSlides);
router.get('/:id', protect, authorize('admin'), getSlide);
router.post('/', protect, authorize('admin'), upload.single('image'), createSlide);
router.put('/:id', protect, authorize('admin'), upload.single('image'), updateSlide);
router.delete('/:id', protect, authorize('admin'), deleteSlide);
router.put('/reorder', protect, authorize('admin'), reorderSlides);

module.exports = router;
