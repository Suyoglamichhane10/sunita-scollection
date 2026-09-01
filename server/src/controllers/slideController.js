const Slide = require('../Models/Slide');
const cloudinary = require('../config/cloudinary');
const path = require('path');

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_API_KEY.includes('your_')
  );

// @desc    Get all slides (admin - all, public - active only)
// @route   GET /api/slides
// @access  Public (returns active only)
exports.getSlides = async (req, res, next) => {
  try {
    const isAdminRoute = req.query.includeInactive === 'true';
    const query = isAdminRoute ? {} : { isActive: true };

    const slides = await Slide.find(query).sort({ order: 1 });

    res.status(200).json({ success: true, slides });
  } catch (error) {
    console.error('getSlides error:', error);
    next(error);
  }
};

// @desc    Get single slide
// @route   GET /api/slides/:id
// @access  Private/Admin
exports.getSlide = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }
    res.status(200).json({ success: true, slide });
  } catch (error) {
    next(error);
  }
};

// @desc    Create slide
// @route   POST /api/slides
// @access  Private/Admin
exports.createSlide = async (req, res, next) => {
  try {
    const { title, subtitle, buttonText, buttonLink, order, isActive } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'sunitas-collection/slides',
            use_filename: true,
            resource_type: 'auto',
          });
          imageUrl = result.secure_url;
          imagePublicId = result.public_id;
        } catch (cloudinaryError) {
          console.warn('Cloudinary upload failed, falling back to local:', cloudinaryError.message);
          imageUrl = `/uploads/${path.basename(req.file.path)}`;
          imagePublicId = null;
        }
      } else {
        imageUrl = `/uploads/${path.basename(req.file.path)}`;
        imagePublicId = null;
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const slide = await Slide.create({
      imageUrl,
      imagePublicId,
      title: title.trim(),
      subtitle: subtitle?.trim() || '',
      buttonText: buttonText?.trim() || 'Shop Now',
      buttonLink: buttonLink?.trim() || '/shop',
      order: Number(order) || 1,
      isActive: isActive === 'true' || isActive === true,
    });

    res.status(201).json({ success: true, data: slide });
  } catch (error) {
    next(error);
  }
};

// @desc    Update slide
// @route   PUT /api/slides/:id
// @access  Private/Admin
exports.updateSlide = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    const { title, subtitle, buttonText, buttonLink, order, isActive } = req.body;

    if (title !== undefined) slide.title = title.trim();
    if (subtitle !== undefined) slide.subtitle = subtitle.trim();
    if (buttonText !== undefined) slide.buttonText = buttonText.trim();
    if (buttonLink !== undefined) slide.buttonLink = buttonLink.trim();
    if (order !== undefined) slide.order = Number(order);
    if (isActive !== undefined) slide.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      if (slide.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(slide.imagePublicId);
        } catch (err) {
          console.warn('Failed to delete old slide image:', err.message);
        }
      }

      if (isCloudinaryConfigured()) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'sunitas-collection/slides',
            use_filename: true,
            resource_type: 'auto',
          });
          slide.imageUrl = result.secure_url;
          slide.imagePublicId = result.public_id;
        } catch (cloudinaryError) {
          console.warn('Cloudinary upload failed, falling back to local:', cloudinaryError.message);
          slide.imageUrl = `/uploads/${path.basename(req.file.path)}`;
          slide.imagePublicId = null;
        }
      } else {
        slide.imageUrl = `/uploads/${path.basename(req.file.path)}`;
        slide.imagePublicId = null;
      }
    }

    await slide.save();

    res.status(200).json({ success: true, data: slide });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete slide
// @route   DELETE /api/slides/:id
// @access  Private/Admin
exports.deleteSlide = async (req, res, next) => {
  try {
    const slide = await Slide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    if (slide.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(slide.imagePublicId);
      } catch (err) {
        console.warn('Failed to delete slide image from Cloudinary:', err.message);
      }
    }

    await slide.deleteOne();

    res.status(200).json({ success: true, message: 'Slide deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder slides
// @route   PUT /api/slides/reorder
// @access  Private/Admin
exports.reorderSlides = async (req, res, next) => {
  try {
    const { ordered } = req.body;

    if (!Array.isArray(ordered)) {
      return res.status(400).json({ success: false, message: 'Ordered array is required' });
    }

    await Promise.all(
      ordered.map((item) =>
        Slide.findByIdAndUpdate(item.id, { order: Number(item.order) })
      )
    );

    res.status(200).json({ success: true, message: 'Slides reordered successfully' });
  } catch (error) {
    next(error);
  }
};
