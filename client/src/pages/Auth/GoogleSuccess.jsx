import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/Authcontext';

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      loginWithToken(token);
      navigate('/');
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [location, loginWithToken, navigate]);

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
