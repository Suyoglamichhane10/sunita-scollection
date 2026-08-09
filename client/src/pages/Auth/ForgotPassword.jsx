import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../Services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success(data.message || 'Password reset email sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-6">
      <div className="w-full max-w-md rounded-xl shadow-xl overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-pink-600 px-8 py-8 text-white text-center">
          <h1 className="text-2xl font-bold">Sunita's Collection</h1>
          <p className="mt-1 text-sm opacity-90">Forgot your password?</p>
        </div>
        <div className="p-8">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
              <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
              <p className="mt-3 text-sm text-gray-600">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:text-blue-500">Remembered? Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
