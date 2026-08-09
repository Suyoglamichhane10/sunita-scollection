// Loyalty & gamification service: points, tiers, badges, challenges,
// spin-to-win wheel, birthday rewards, and referrals.

const Gamification = require('../Models/Gamification');
const User = require('../Models/User');

const TIER_THRESHOLDS = {
  Bronze: { min: 0, discount: 0, color: '#CD7F32' },
  Silver: { min: 500, discount: 3, color: '#C0C0C0' },
  Gold: { min: 1500, discount: 5, color: '#FFD700' },
  Platinum: { min: 4000, discount: 8, color: '#E5E4E2' },
};

const badgeDefinitions = [
  { code: 'first_purchase', name: 'First Steps', description: 'Completed your first purchase', icon: '👣' },
  { code: 'reviewer', name: 'Voice of the Customer', description: 'Reviewed a product', icon: '✍️' },
  { code: 'referrer', name: 'Community Builder', description: 'Referred a friend', icon: '🤝' },
  { code: 'bronze_loyal', name: 'Bronze Loyalist', description: 'Reached Bronze tier', icon: '🥉' },
  { code: 'silver_loyal', name: 'Silver Loyalist', description: 'Reached Silver tier', icon: '🥈' },
  { code: 'gold_loyal', name: 'Gold Loyalist', description: 'Reached Gold tier', icon: '🥇' },
  { code: 'platinum_loyal', name: 'Platinum Member', description: 'Reached Platinum tier', icon: '💎' },
  { code: 'spinner', name: 'Lucky Spinner', description: 'Spun the wheel', icon: '🎡' },
];

const challengeDefinitions = [
  { code: 'first_purchase', name: 'Make your first purchase', target: 1, rewardPoints: 100 },
  { code: 'place_3_orders', name: 'Place 3 orders', target: 3, rewardPoints: 150 },
  { code: 'write_review', name: 'Write a review', target: 1, rewardPoints: 50 },
  { code: 'refer_1_friend', name: 'Refer a friend', target: 1, rewardPoints: 200 },
  { code: 'spend_5000', name: 'Spend Rs. 5,000', target: 5000, rewardPoints: 300 },
];

exports.getOrCreateGamification = async (userId) => {
  let gam = await Gamification.findOne({ user: userId });
  if (!gam) {
    gam = await Gamification.create({
      user: userId,
      points: 0,
      tier: 'Bronze',
      badges: [],
      challenges: challengeDefinitions.map((c) => ({
        code: c.code,
        name: c.name,
        target: c.target,
        progress: 0,
        completed: false,
        rewardPoints: c.rewardPoints,
      })),
      rewards: [],
      spinWheel: { lastSpinAt: null, spinsToday: 0, totalSpins: 0 },
      referrals: [],
    });
    await User.findByIdAndUpdate(userId, { loyalty: gam._id });
  }
  return gam;
};

const computeTier = (points) => {
  if (points >= TIER_THRESHOLDS.Platinum.min) return 'Platinum';
  if (points >= TIER_THRESHOLDS.Gold.min) return 'Gold';
  if (points >= TIER_THRESHOLDS.Silver.min) return 'Silver';
  return 'Bronze';
};

const tierUpgradeBadges = {
  Bronze: 'bronze_loyal',
  Silver: 'silver_loyal',
  Gold: 'gold_loyal',
  Platinum: 'platinum_loyal',
};

exports.awardPoints = async (userId, points, reason = 'activity') => {
  const gam = await this.getOrCreateGamification(userId);
  gam.points += points;
  gam.lifetimePoints += points;
  const newTier = computeTier(gam.points);
  if (newTier !== gam.tier) {
    gam.tier = newTier;
    const badgeCode = tierUpgradeBadges[newTier];
    if (badgeCode && !gam.badges.some((b) => b.code === badgeCode)) {
      const def = badgeDefinitions.find((b) => b.code === badgeCode);
      gam.badges.push({ ...def, earnedAt: Date.now() });
    }
  }
  await gam.save();
  return gam;
};

exports.awardBadge = async (userId, code) => {
  const gam = await this.getOrCreateGamification(userId);
  if (gam.badges.some((b) => b.code === code)) return gam;
  const def = badgeDefinitions.find((b) => b.code === code);
  if (def) gam.badges.push({ ...def, earnedAt: Date.now() });
  await gam.save();
  return gam;
};

exports.updateChallengeProgress = async (userId, code, increment = 1) => {
  const gam = await this.getOrCreateGamification(userId);
  const challenge = gam.challenges.find((c) => c.code === code);
  if (!challenge) return gam;
  if (challenge.completed) return gam;
  challenge.progress = Math.min(challenge.target, challenge.progress + increment);
  if (challenge.progress >= challenge.target) {
    challenge.completed = true;
    challenge.completedAt = Date.now();
    gam.points += challenge.rewardPoints;
    gam.lifetimePoints += challenge.rewardPoints;
    const newTier = computeTier(gam.points);
    if (newTier !== gam.tier) {
      gam.tier = newTier;
      const bCode = tierUpgradeBadges[newTier];
      if (bCode && !gam.badges.some((b) => b.code === bCode)) {
        const def = badgeDefinitions.find((b) => b.code === bCode);
        gam.badges.push({ ...def, earnedAt: Date.now() });
      }
    }
  }
  await gam.save();
  return gam;
};

exports.addReward = async (userId, reward) => {
  const gam = await this.getOrCreateGamification(userId);
  gam.rewards.push({ ...reward, claimedAt: Date.now() });
  await gam.save();
  return gam;
};

// Spin-to-win wheel: segments with discount chances
exports.spinWheel = async (userId) => {
  const gam = await this.getOrCreateGamification(userId);
  const today = new Date().toDateString();
  const lastSpin = gam.spinWheel.lastSpinAt ? new Date(gam.spinWheel.lastSpinAt).toDateString() : null;

  if (lastSpin === today && gam.spinWheel.spinsToday >= 1) {
    return { success: false, message: 'You can spin the wheel once per day.' };
  }

  const segments = [
    { label: '10% OFF', type: 'discount', value: 10, weight: 15 },
    { label: '20% OFF', type: 'discount', value: 20, weight: 8 },
    { label: '50 Points', type: 'points_bonus', value: 50, weight: 20 },
    { label: '100 Points', type: 'points_bonus', value: 100, weight: 12 },
    { label: 'Free Shipping', type: 'free_shipping', value: 0, weight: 15 },
    { label: '5% OFF', type: 'discount', value: 5, weight: 20 },
    { label: 'Try Again', type: 'discount', value: 0, weight: 10 },
  ];

  const totalWeight = segments.reduce((s, sg) => s + sg.weight, 0);
  let roll = Math.random() * totalWeight;
  let picked = segments[0];
  for (const seg of segments) {
    roll -= seg.weight;
    if (roll <= 0) {
      picked = seg;
      break;
    }
  }

  let reward = null;
  if (picked.type === 'points_bonus' && picked.value > 0) {
    await this.awardPoints(userId, picked.value, 'spin_wheel');
    reward = { ...picked, applied: true };
  } else if (picked.type === 'discount' && picked.value > 0) {
    const code = `SPIN${picked.value}${Date.now().toString().slice(-4)}`;
    await this.addReward(userId, {
      type: 'discount',
      title: `${picked.value}% OFF (Spin)`,
      description: `Use code ${code} at checkout`,
      value: picked.value,
      code,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    reward = { ...picked, code, applied: true };
  } else if (picked.type === 'free_shipping') {
    const code = `SHIP${Date.now().toString().slice(-4)}`;
    await this.addReward(userId, {
      type: 'free_shipping',
      title: 'Free Shipping',
      description: `Use code ${code} at checkout`,
      value: 0,
      code,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    reward = { ...picked, code, applied: true };
  } else {
    reward = { ...picked, applied: false };
  }

  gam.spinWheel.lastSpinAt = Date.now();
  gam.spinWheel.spinsToday = lastSpin === today ? gam.spinWheel.spinsToday + 1 : 1;
  gam.spinWheel.totalSpins += 1;
  await gam.save();

  await this.awardBadge(userId, 'spinner');

  return { success: true, reward, gamification: gam };
};

// Birthday reward
exports.checkBirthday = async (userId, birthMonth, birthDay) => {
  const now = new Date();
  if (now.getMonth() + 1 !== birthMonth || now.getDate() !== birthDay) {
    return { isBirthday: false };
  }
  const gam = await this.getOrCreateGamification(userId);
  if (gam.birthdayReward.year === now.getFullYear() && gam.birthdayReward.claimed) {
    return { isBirthday: true, alreadyClaimed: true };
  }
  const code = `BDAY${now.getFullYear()}`;
  await this.addReward(userId, {
    type: 'discount',
    title: 'Happy Birthday! 15% OFF',
    description: `Your birthday gift — use code ${code}`,
    value: 15,
    code,
    expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
  });
  gam.birthdayReward.year = now.getFullYear();
  gam.birthdayReward.claimed = true;
  gam.birthdayReward.claimedAt = Date.now();
  await gam.save();
  return { isBirthday: true, alreadyClaimed: false, code };
};

exports.getLoyaltySummary = async (userId) => {
  const gam = await this.getOrCreateGamification(userId);
  const nextTier = computeTier(gam.points) === 'Platinum' ? null : this.getNextTier(gam.points);
  return {
    gamification: gam,
    tier: gam.tier,
    points: gam.points,
    lifetimePoints: gam.lifetimePoints,
    nextTier,
    progressToNext: nextTier ? Math.min(100, Math.round((gam.points / nextTier.min) * 100)) : 100,
    tierBenefits: TIER_THRESHOLDS[gam.tier],
  };
};

exports.getNextTier = (points) => {
  if (points < TIER_THRESHOLDS.Silver.min) return TIER_THRESHOLDS.Silver;
  if (points < TIER_THRESHOLDS.Gold.min) return TIER_THRESHOLDS.Gold;
  if (points < TIER_THRESHOLDS.Platinum.min) return TIER_THRESHOLDS.Platinum;
  return null;
};

exports.TIER_THRESHOLDS = TIER_THRESHOLDS;
exports.badgeDefinitions = badgeDefinitions;
exports.challengeDefinitions = challengeDefinitions;
