import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './Routes/AppRoutes';
import { AuthProvider } from './Context/Authcontext';
import { CartProvider } from './Context/CartContext';
import { ChatProvider } from './Context/ChatContext';
import WhatsAppChatWidget from './components/chat/WhatsAppChatWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      {!isAdminRoute && !isAuthRoute && <WhatsAppChatWidget />}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <AppContent />
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
