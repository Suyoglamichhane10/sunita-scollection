const Coupon = require('../Models/Coupon');
const ActivityLog = require('../Models/ActivityLog');

/**
 * @desc    Get all coupons (admin)
 * @route   GET /api/marketing/coupons
 */
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a coupon / flash sale / bundle (admin)
 * @route   POST /api/marketing/coupons
 */
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);

    await ActivityLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_COUPON',
      resource: 'Coupon',
      resourceId: coupon._id.toString(),
      description: `Created coupon ${coupon.code}`,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a coupon (admin)
 * @route   PUT /api/marketing/coupons/:id
 */
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await ActivityLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_COUPON',
      resource: 'Coupon',
      resourceId: coupon._id.toString(),
      description: `Updated coupon ${coupon.code}`,
    });

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a coupon (admin)
 * @route   DELETE /api/marketing/coupons/:id
 */
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await ActivityLog.create({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE_COUPON',
      resource: 'Coupon',
      resourceId: req.params.id,
      description: `Deleted coupon ${coupon.code}`,
    });

    res.status(200).json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate a coupon (public, for checkout)
 * @route   POST /api/marketing/coupons/validate
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, userId } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const now = Date.now();
    if (coupon.endDate && now > coupon.endDate.getTime()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }
    if (coupon.startDate && now < coupon.startDate.getTime()) {
      return res.status(400).json({ success: false, message: 'Coupon is not active yet' });
    }
    if (subtotal && subtotal < coupon.minOrderAmount) {
      return res
        .status(400)
        .json({ success: false, message: `Minimum order amount is Rs. ${coupon.minOrderAmount}` });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    if (userId && coupon.perUserLimit) {
      const userUse = coupon.usersUsed.find((u) => u.user.toString() === userId);
      if (userUse && userUse.count >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, message: 'Coupon already used by this user' });
      }
    }

    let discount = 0;
    const base = subtotal || 0;
    if (coupon.type === 'percentage') {
      discount = (base * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }
    if (discount > base) discount = base;

    res.status(200).json({ success: true, coupon, discount });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity/audit logs (admin)
 * @route   GET /api/marketing/activity
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
