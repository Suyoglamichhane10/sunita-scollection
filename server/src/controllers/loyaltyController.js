const loyaltyService = require('../services/loyaltyService');
const User = require('../Models/User');
const crypto = require('crypto');

// Get loyalty summary for current user
exports.getLoyalty = async (req, res, next) => {
  try {
    const summary = await loyaltyService.getLoyaltySummary(req.user.id);
    res.status(200).json({ success: true, ...summary });
  } catch (error) {
    next(error);
  }
};

// Spin the wheel
exports.spinWheel = async (req, res, next) => {
  try {
    const result = await loyaltyService.spinWheel(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Check & claim birthday reward
exports.checkBirthday = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const month = req.body.month || (user.address ? null : null);
    const birthMonth = req.body.month || user.birthMonth;
    const birthDay = req.body.day || user.birthDay;
    if (!birthMonth || !birthDay) {
      return res.status(200).json({ success: true, isBirthday: false, message: 'Birthday not set' });
    }
    const result = await loyaltyService.checkBirthday(req.user.id, birthMonth, birthDay);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// Redeem a reward using its code
exports.redeemReward = async (req, res, next) => {
  try {
    const { code } = req.body;
    const gam = await loyaltyService.getOrCreateGamification(req.user.id);
    const reward = gam.rewards.find((r) => r.code === code && !r.isUsed);
    if (!reward) {
      return res.status(404).json({ success: false, message: 'Reward not found or already used' });
    }
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reward has expired' });
    }
    reward.isUsed = true;
    await gam.save();
    res.status(200).json({ success: true, reward });
  } catch (error) {
    next(error);
  }
};

// Generate a referral code for the user
exports.getReferral = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user.referralCode) {
      user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      await user.save();
    }
    res.status(200).json({ success: true, referralCode: user.referralCode });
  } catch (error) {
    next(error);
  }
};

// Submit a referral (link a referred user)
exports.submitReferral = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }
    const referrer = await User.findOne({ referralCode: code.toUpperCase() });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }
    if (referrer._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot refer yourself' });
    }
    // Award points to referrer
    await loyaltyService.awardPoints(referrer._id, 200, 'referral');
    await loyaltyService.awardBadge(referrer._id, 'referrer');
    await loyaltyService.updateChallengeProgress(referrer._id, 'refer_1_friend');
    res.status(200).json({ success: true, message: 'Referral applied! Your friend earned points.' });
  } catch (error) {
    next(error);
  }
};

// Admin: gamification analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const Gamification = require('../Models/Gamification');
    const [totalMembers, agg] = await Promise.all([
      Gamification.countDocuments(),
      Gamification.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
      ]),
    ]);
    const tierBreakdown = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    let totalPoints = 0;
    agg.forEach((g) => {
      tierBreakdown[g._id] = g.count;
      totalPoints += g.totalPoints;
    });
    const avgPoints = totalMembers ? Math.round(totalPoints / totalMembers) : 0;
    res.status(200).json({
      success: true,
      analytics: { totalMembers, tierBreakdown, avgPoints, totalPoints },
    });
  } catch (error) {
    next(error);
  }
};
