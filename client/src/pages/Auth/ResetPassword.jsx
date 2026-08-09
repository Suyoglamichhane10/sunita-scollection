import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import api from '../../Services/api';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 p-6">
      <div className="w-full max-w-md rounded-xl shadow-xl overflow-hidden bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-pink-600 px-8 py-8 text-white text-center">
          <h1 className="text-2xl font-bold">Sunita's Collection</h1>
          <p className="mt-1 text-sm opacity-90">Set a new password</p>
        </div>
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">New password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 pr-10 text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-10 flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-4 py-3 pr-10 text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-10 flex items-center text-gray-500 hover:text-gray-700"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
            <div className="text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:text-blue-500">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
