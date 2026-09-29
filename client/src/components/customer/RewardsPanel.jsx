import React from 'react';
import { useAuth } from '../../Context/Authcontext';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import { FaGift, FaCopy, FaTrophy, FaMedal, FaClock, FaHistory, FaCheckCircle } from 'react-icons/fa';

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const RewardsPanel = ({ loyalty, referralCode, onCopyReferral, onRedeem, actionLoading }) => {
  const { updateUser } = useAuth();

  const copyReferral = async () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/r/${referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    } catch { toast.error('Could not copy link'); }
  };

  if (!loyalty) return null;

  return (
    <div className="space-y-6">
      {/* Points Card */}
      <div className="rounded-3xl border border-gold/20 bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6 shadow-card sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-ink">Loyalty Points</h2>
            <p className="mt-1 text-3xl font-bold text-primary">{loyalty.points || 0} pts</p>
            <p className="mt-1 text-sm text-ink-light">
              {loyalty.tier || 'Bronze'} Tier · {loyalty.nextTierTarget || 500} pts for next tier
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-card">
            <FaGift className="text-2xl text-pink-600" />
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">Available Rewards</p>
              <p className="text-xs text-ink-light">{loyalty.availableRewards?.length || 0} rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Program */}
      <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-ink mb-4">Referral Program</h2>
        <p className="mb-4 text-sm text-ink-light">
          Share your referral link and earn <span className="font-bold text-primary">{loyalty.referralReward || '50'} points</span> for every friend who makes a purchase.
        </p>
        {referralCode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-ink break-all">
              {`${window.location.origin}/r/${referralCode}`}
            </div>
            <button onClick={copyReferral} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark">
              <FaCopy className="text-xs" /> Copy
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-light">No referral code available yet.</p>
        )}
        {loyalty.referralCount !== undefined && (
          <div className="mt-4 flex items-center gap-6">
            <div className="text-center">
              <p className="text-xl font-bold text-ink">{loyalty.referralCount}</p>
              <p className="text-xs text-ink-light">Friends Referred</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-ink">{loyalty.referralEarnings || 0}</p>
              <p className="text-xs text-ink-light">Points Earned</p>
            </div>
          </div>
        )}
      </div>

      {/* Available Rewards */}
      {loyalty.availableRewards?.length > 0 && (
        <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold text-ink mb-4">Available Rewards</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loyalty.availableRewards.map((reward) => (
              <div key={reward._id || reward.id || Math.random()} className="relative overflow-hidden rounded-2xl border border-gold/20 bg-cream/60 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FaMedal className="text-xl text-amber-500" />
                  <span className="text-sm font-semibold text-ink">{reward.name || reward.title}</span>
                </div>
                <p className="text-xs text-ink-light mb-3 line-clamp-2">{reward.description || ''}</p>
                <button
                  disabled={!reward.claimed && (loyalty.points || 0) < (reward.cost || 0)}
                  onClick={() => onRedeem(reward._id || reward.id)}
                  className={`w-full rounded-full px-4 py-2 text-xs font-semibold transition ${
                    reward.claimed
                      ? 'bg-green-100 text-green-800 cursor-default'
                      : 'bg-primary text-white hover:bg-primary-dark disabled:opacity-50'
                  }`}
                >
                  {actionLoading === (reward._id || reward.id)
                    ? 'Claiming...'
                    : reward.claimed
                      ? 'Claimed'
                      : `Claim for ${reward.cost || 0} pts`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redemption History */}
      {loyalty.redemptionHistory?.length > 0 && (
        <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <FaHistory className="text-pink-600" /> Redemption History
          </h2>
          <div className="space-y-2">
            {loyalty.redemptionHistory.slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-gold/10 bg-cream/60 p-3">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-green-500" />
                  <div>
                    <p className="font-semibold text-ink">{h.rewardName || h.name}</p>
                    <p className="text-xs text-ink-light">{new Date(h.redeemedAt).toLocaleDateString()} · {h.pointsCost} pts</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  h.status === 'used' ? 'bg-green-100 text-green-700' :
                  h.status === 'expired' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {h.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History */}
      {loyalty.pointsHistory?.length > 0 && (
        <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <FaClock className="text-pink-600" /> Points History
          </h2>
          <div className="space-y-2">
            {loyalty.pointsHistory.slice(0, 10).map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-gold/10 bg-cream/60 p-3">
                <div className="flex items-center gap-3">
                  <FaTrophy className={h.type === 'earned' ? 'text-amber-500' : 'text-gray-400'} />
                  <div>
                    <p className="font-semibold text-ink">{h.description || (h.type === 'earned' ? 'Points Earned' : 'Points Redeemed')}</p>
                    <p className="text-xs text-ink-light">{new Date(h.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${h.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                  {h.type === 'earned' ? '+' : '-'}{h.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPanel;