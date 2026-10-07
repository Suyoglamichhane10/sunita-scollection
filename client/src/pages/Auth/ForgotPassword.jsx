import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import logo from '../../assets/LOGO!.png';

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
    <div className="mesh-rose min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl shadow-luxury overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-8 text-white text-center sm:px-8">
          <img src={logo} alt="Brand logo" className="mx-auto mb-3 h-20 w-auto object-contain" />
          <p className="text-sm text-white/85">Forgot your password?</p>
        </div>
        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush-100 text-2xl text-primary-600">✓</div>
              <h2 className="font-serif text-xl font-semibold text-primary-800">Check your email</h2>
              <p className="mt-3 text-sm text-ink-light">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn-elegant mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold">
                Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-primary-800">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-gold/30 bg-cream/50 px-4 py-3 text-ink placeholder-ink-light/60 shadow-sm outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-elegant w-full rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <div className="text-center text-sm text-ink-light">
                <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-800">Remembered? Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
