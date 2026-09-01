import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import logo from '../../assets/LOGO!.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login, loading, facebookLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }

    const token = searchParams.get('token');
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error).replace(/_/g, ' '));
    }
    if (token) {
      facebookLogin(token);
    }
  }, [searchParams, facebookLogin]);

  if (loading) {
    return (
      <div className="mesh-rose min-h-screen flex items-center justify-center">
        <p className="text-sm text-ink-light">Loading...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(formData);
    setSubmitting(false);

    if (result.success) {
      if (rememberMe) localStorage.setItem('rememberedEmail', formData.email);
      else localStorage.removeItem('rememberedEmail');

      const loggedInUser = result.user;
      const target = loggedInUser?.role === 'admin' ? '/admin' : '/dashboard';
      navigate(target, { replace: true });
      return;
    }
    toast.error(result.error || 'Login failed');
  };

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  return (
    <div className="mesh-rose min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl rounded-3xl shadow-luxury overflow-hidden flex flex-col md:flex-row bg-white">
        {/* Left brand panel */}
        <div className="glow-panel hidden md:flex md:w-1/2 flex-col justify-center px-10 py-12 bg-gradient-to-b from-primary-800 to-primary-950 text-white relative">
          <div className="relative">
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Brand logo" className="h-28 w-auto object-contain" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-gold-200 text-center">Welcome Back</h2>
            <p className="mt-3 leading-7 text-white/80 text-center">
              Sign in to access your account, track your orders, and continue shopping with our trendy collection.
            </p>
            <div className="mt-8 space-y-3 text-sm text-white/80">
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Track your orders in real time</p>
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Manage your wishlist & rewards</p>
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Secure & delightful experience</p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="w-full md:w-1/2 p-8 bg-white">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 md:hidden">
              <img src={logo} alt="Brand logo" className="mx-auto mb-3 h-20 w-auto object-contain" />
            </div>

            <h2 className="font-serif text-center text-2xl font-bold text-primary-800 mb-1">Sign in</h2>
            <p className="text-center text-sm text-ink-light mb-7">Welcome back to trendy fashion</p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" />
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-gold/30 bg-cream/50 py-3 pl-11 pr-4 text-ink placeholder-ink-light/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl border border-gold/30 bg-cream/50 py-3 pl-11 pr-11 text-ink placeholder-ink-light/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-light hover:text-primary-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-ink-light">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gold accent-gold-500"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-800">
                  Forgot password?
                </Link>
              </div>

               <button
                type="submit"
                disabled={submitting}
                className="btn-elegant w-full rounded-xl py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gold/20"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-ink-light">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFacebookLogin}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                Continue with Facebook
              </button>

              <div className="text-center text-sm text-ink-light">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-gold-600 hover:text-gold-700">
                  Register
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
