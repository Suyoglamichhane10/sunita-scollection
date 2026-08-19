import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../../Services/api';
import toast from 'react-hot-toast';
import logo from '../../assets/LOGO!.png';

const ResetPassword = () => {
  const { resetToken } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${resetToken}`, { password });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="mesh-rose min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl shadow-luxury overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-6 py-8 text-white text-center sm:px-8">
          <img src={logo} alt="Brand logo" className="mx-auto mb-3 h-20 w-auto object-contain" />
          <p className="text-sm text-white/85">Set a new password</p>
        </div>
        <div className="p-6 sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-primary-800">New password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-gold/30 bg-cream/50 px-4 py-3 pr-10 text-ink placeholder-ink-light/60 shadow-sm outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-10 flex items-center text-ink-light hover:text-primary-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-primary-800">Confirm password</label>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-gold/30 bg-cream/50 px-4 py-3 pr-10 text-ink placeholder-ink-light/60 shadow-sm outline-none focus:ring-2 focus:ring-gold-400"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-10 flex items-center text-ink-light hover:text-primary-600"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-elegant w-full rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
            <div className="text-center text-sm text-ink-light">
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-800">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
