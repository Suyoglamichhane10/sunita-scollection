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
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      loginWithToken(token)
        .then((result) => {
          if (result.success) {
            toast.success('Welcome! You are now logged in.');
            navigate('/dashboard', { replace: true });
          } else {
            setError('Failed to login with Google');
            navigate('/login?error=google_login_failed', { replace: true });
          }
        })
        .catch((err) => {
          setError(err.message);
          navigate('/login?error=google_login_failed', { replace: true });
        });
    } else {
      setError('No authentication token received');
      navigate('/login?error=no_token', { replace: true });
    }
  }, [location, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600"></div>
        <p className="mt-4 text-gray-600">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default GoogleSuccess;
