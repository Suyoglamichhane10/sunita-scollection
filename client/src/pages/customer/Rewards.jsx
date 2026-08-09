import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrophy, FaMedal, FaGift, FaStar, FaCopy, FaCogs, FaCalendarAlt } from 'react-icons/fa';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';

const SPIN_SEGMENTS = [
  { label: '100 pts', value: 100 },
  { label: '5% off', value: '5' },
  { label: 'Free ship', value: 'ship' },
  { label: '50 pts', value: 50 },
  { label: '10% off', value: '10' },
  { label: '200 pts', value: 200 },
  { label: 'Gift', value: 'gift' },
  { label: '25 pts', value: 25 },
];

const Rewards = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loyalty, setLoyalty] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const [loyaltyRes, referralRes] = await Promise.all([
          api.get('/loyalty'),
          api.get('/loyalty/referral'),
        ]);
        setLoyalty(loyaltyRes.data);
        setReferralCode(referralRes.data.referralCode || '');
      } catch (error) {
        console.error(error);
        toast.error('Unable to load rewards');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isAuthenticated, navigate]);

  const handleSpin = async () => {
    setSpinning(true);
    setSpinResult(null);
    try {
      const { data } = await api.post('/loyalty/spin');
      setSpinResult(data);
      setLoyalty((cur) => ({ ...cur, points: data.points ?? cur.points, rewards: data.rewards ?? cur.rewards }));
      toast.success(`You won: ${data.reward?.title || data.message || 'a reward'}!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to spin');
    } finally {
      setSpinning(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard?.writeText(referralCode);
    toast.success('Referral code copied!');
  };

  const checkBirthday = async () => {
    try {
      const { data } = await api.post('/loyalty/birthday', { month: 1, day: 1 });
      if (data.isBirthday) {
        toast.success('Happy Birthday! Reward claimed 🎉');
      } else {
        toast.success(data.message || 'Birthday reward checked');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to check birthday');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading rewards...</div>
        </div>
      </div>
    );
  }

  const tiers = [
    { name: 'Bronze', min: 0, color: 'bg-amber-700', icon: FaMedal },
    { name: 'Silver', min: 500, color: 'bg-gray-400', icon: FaMedal },
    { name: 'Gold', min: 1500, color: 'bg-yellow-500', icon: FaTrophy },
    { name: 'Platinum', min: 3000, color: 'bg-slate-500', icon: FaCogs },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container-custom px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Rewards & Loyalty</h1>
        <p className="mt-2 text-gray-600">Earn points, unlock tiers, and enjoy exclusive perks.</p>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
          {['overview', 'spin', 'referral', 'badges'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Points & tier */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FaTrophy className="text-3xl text-yellow-500" />
                    <div>
                      <p className="text-sm text-gray-500">Current Points</p>
                      <p className="text-3xl font-bold text-gray-900">{loyalty?.points || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Your Tier: <span className="font-bold text-pink-600">{loyalty?.tier || 'Bronze'}</span></p>
                    {loyalty?.nextTier && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">{loyalty.progressToNext}% to {loyalty.nextTier}</p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-pink-600" style={{ width: `${loyalty.progressToNext}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tier ladder */}
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-gray-900">Tier Benefits</h3>
                  <div className="space-y-3">
                    {tiers.map((t) => (
                      <div key={t.name} className={`flex items-center justify-between rounded-2xl p-3 ${loyalty?.tier === t.name ? `${t.color} text-white` : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                          <t.icon />
                          <span className="font-semibold">{t.name}</span>
                        </div>
                        <span className="text-sm">{t.min}+ points</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rewards earned */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Your Rewards</h3>
                {loyalty?.rewards?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {loyalty.rewards.map((r) => (
                      <div key={r.code} className={`rounded-2xl border p-4 ${r.isUsed ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-pink-200 bg-pink-50'}`}>
                        <div className="flex items-center gap-2">
                          <FaGift className="text-pink-600" />
                          <p className="font-semibold text-gray-900">{r.title || r.type}</p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{r.description}</p>
                        {r.code && (
                          <p className="mt-2 rounded-lg bg-white px-3 py-1 text-center font-mono text-sm font-bold text-pink-600">{r.code}</p>
                        )}
                        {r.isUsed && <p className="mt-1 text-xs font-semibold text-green-600">Used</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">
                    No rewards yet. Spin the wheel or earn points to unlock rewards!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'spin' && (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Spin to Win!</h3>
              <p className="mt-1 text-sm text-gray-500">Spin the wheel to win points, discounts, and free shipping.</p>

              {/* Wheel */}
              <div className="relative mx-auto mt-8 h-64 w-64">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 p-2 shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
                    <div className="text-center">
                      <div className="relative flex h-40 w-40 items-center justify-center">
                        {SPIN_SEGMENTS.map((s, i) => (
                          <div key={i} style={{ transform: `rotate(${i * 45}deg)` }} className="absolute inset-0 flex items-start justify-center">
                            <span className="mt-1 text-[10px] font-bold text-gray-700">{s.label}</span>
                          </div>
                        ))}
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-600 text-white">
                          <FaStar />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning}
                className="mt-6 rounded-full bg-pink-600 px-8 py-3 font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {spinning ? 'Spinning...' : 'Spin Now'}
              </button>

              {spinResult && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4 text-green-700">
                  <p className="font-semibold">🎉 {spinResult.reward?.title || spinResult.message}</p>
                  {spinResult.reward?.code && <p className="mt-1 font-mono">Code: {spinResult.reward.code}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'referral' && (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Refer a Friend</h3>
              <p className="mt-1 text-sm text-gray-500">Share your code and earn 200 points when your friend joins!</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 rounded-3xl border-2 border-dashed border-pink-300 bg-pink-50 px-6 py-4 text-center">
                  <span className="font-mono text-2xl font-bold tracking-widest text-pink-600">{referralCode || '----'}</span>
                </div>
                <button type="button" onClick={copyReferral} className="flex items-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-sm font-semibold text-white hover:bg-pink-700">
                  <FaCopy /> Copy
                </button>
              </div>
              <p className="mt-4 text-sm text-gray-500">Have a friend&apos;s code? Use it during signup to get rewarded.</p>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Your Badges</h3>
              <p className="mt-1 text-sm text-gray-500">Badges unlock as you shop and engage.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loyalty?.gamification?.badges?.length ? (
                  loyalty.gamification.badges.map((b) => (
                    <div key={b.code} className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                      <FaMedal className="text-2xl text-yellow-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-500">{b.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                    No badges yet. Make your first purchase, leave a review, and refer friends to earn badges!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rewards;
