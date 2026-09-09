import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/Authcontext';
import toast from 'react-hot-toast';

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔵 GoogleSuccess component mounted');
    console.log('🔵 Current URL:', window.location.href);

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    console.log('🔵 Token from URL:', token ? 'Received ✅' : 'Missing ❌');

    if (token) {
      console.log('✅ Token found, calling loginWithToken...');
      loginWithToken(token)
        .then((result) => {
          if (result.success) {
            console.log('✅ Login successful, redirecting to home...');
            toast.success('Logged in with Google successfully!');
            navigate('/');
          } else {
            console.error('❌ Login failed:', result.error);
            setError('Failed to login with Google');
            toast.error('Login failed. Please try again.');
            navigate('/login?error=google_login_failed');
          }
        })
        .catch((err) => {
          console.error('❌ Login error:', err);
          setError(err.message);
          toast.error('Login failed. Please try again.');
          navigate('/login?error=google_login_failed');
        });
    } else {
      console.error('❌ No token found in URL');
      setError('No authentication token received');
      toast.error('Google authentication failed. Please try again.');
      navigate('/login?error=no_token');
    }
  }, [location, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-rose min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
        <p className="mt-4 text-sm text-ink-light">Completing Google sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;
