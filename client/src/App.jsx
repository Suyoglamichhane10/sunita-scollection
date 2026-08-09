import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './Routes/AppRoutes';
import { AuthProvider, useAuth } from './Context/Authcontext';
import { CartProvider } from './Context/CartContext';
import { ChatProvider } from './Context/ChatContext';
import ChatbotWidget from './components/chat/ChatbotWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Chatbot is rendered globally, but only actually appears for authenticated
// users (the widget itself guards against unauthenticated access).
const GlobalChatbot = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) return null;
  return <ChatbotWidget />;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
              <AppRoutes />
              <GlobalChatbot />
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
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
