import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';
import logo from '../../assets/LOGO!.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    setSubmitting(false);

    if (result.success) {
      navigate('/dashboard');
      return;
    }
    toast.error(result.error || 'Registration failed');
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
            <h2 className="font-serif text-3xl font-bold text-gold-200 text-center">Join the Collection</h2>
            <p className="mt-3 leading-7 text-white/80 text-center">
              Create your account to explore our trendy collection and enjoy a seamless shopping experience.
            </p>
            <div className="mt-8 space-y-3 text-sm text-white/80">
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Simple, secure & fast signup</p>
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Earn rewards on every order</p>
              <p className="flex items-center gap-2"><span className="text-gold-300">✦</span> Real-time order tracking</p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="w-full md:w-1/2 p-8 bg-white">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 md:hidden">
              <img src={logo} alt="Brand logo" className="mx-auto mb-3 h-20 w-auto object-contain" />
            </div>

            <h2 className="font-serif text-center text-2xl font-bold text-primary-800 mb-1">Create account</h2>
            <p className="text-center text-sm text-ink-light mb-7">Join the trendy fashion movement</p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" />
                <input
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-gold/30 bg-cream/50 py-3 pl-11 pr-4 text-ink placeholder-ink-light/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

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

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-xl border border-gold/30 bg-cream/50 py-3 pl-11 pr-11 text-ink placeholder-ink-light/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-light hover:text-primary-600"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-elegant w-full rounded-xl py-3 font-semibold disabled:opacity-60"
              >
                {submitting ? 'Creating account...' : 'Register'}
              </button>

              <div className="text-center text-sm text-ink-light">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-gold-600 hover:text-gold-700">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
