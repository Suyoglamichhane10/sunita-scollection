import React, { useEffect, useState } from 'react';
import api from '../../Services/api';
import { useAuth } from '../../Context/Authcontext';
import { FaTrophy } from 'react-icons/fa';

const AdminGamification = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isAdmin) return;
    const fetchData = async () => {
      try {
        const { data } = await api.get('/loyalty/analytics');
        setAnalytics(data.analytics);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, isAuthenticated, isAdmin]);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 p-10 text-center text-gray-600">Loading gamification analytics...</div>;
  }

  const tiers = [
    { name: 'Bronze', color: 'bg-amber-700', count: analytics?.tierBreakdown?.Bronze || 0 },
    { name: 'Silver', color: 'bg-gray-400', count: analytics?.tierBreakdown?.Silver || 0 },
    { name: 'Gold', color: 'bg-yellow-500', count: analytics?.tierBreakdown?.Gold || 0 },
    { name: 'Platinum', color: 'bg-slate-500', count: analytics?.tierBreakdown?.Platinum || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900">Gamification Analytics</h1>
        <p className="mt-1 text-sm text-gray-600">Loyalty program performance across tiers.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase text-gray-500">Total Members</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics?.totalMembers || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase text-gray-500">Total Points Issued</p>
            <p className="mt-1 text-3xl font-bold text-pink-600">{analytics?.totalPoints || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs uppercase text-gray-500">Avg Points / Member</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{analytics?.avgPoints || 0}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Tier Distribution</h2>
          <div className="space-y-4">
            {tiers.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.color} text-white`}>
                  <FaTrophy />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{t.name}</span>
                    <span className="text-gray-500">{t.count} members</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full rounded-full ${t.color}`} style={{ width: `${analytics?.totalMembers ? Math.round((t.count / analytics.totalMembers) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGamification;
