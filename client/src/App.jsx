import React, { useEffect } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './Routes/AppRoutes';
import { AuthProvider } from './Context/Authcontext';
import { CartProvider } from './Context/CartContext';
import { ChatProvider } from './Context/ChatContext';
import { WishlistProvider } from './Context/WishlistContext';
import { CompareProvider } from './Context/CompareContext';
import { EnquiryDataProvider } from './Context/EnquiryDataContext';
import { EnquiryProvider } from './Context/EnquiryContext';
import EnquiryModal from './components/common/EnquiryModal';
import WhatsAppChatWidget from './components/chat/WhatsAppChatWidget';
import ErrorBoundary from './components/common/ErrorBoundary';
import ScrollToTop from './components/common/ScrollToTop';
import CustomToaster from './components/common/CustomToaster';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  useEffect(() => {
    const path = location.pathname;
    let title = 'Sunita\'z Collection';
    if (path.startsWith('/admin')) {
      const adminLabel = path.split('/')[2] || 'Admin';
      const labels = {
        '': 'Overview',
        products: 'Products',
        inventory: 'Inventory',
        categories: 'Categories',
        orders: 'Orders',
        enquiries: 'Enquiries',
        slideshow: 'Slideshow',
        messages: 'Messages',
        users: 'Customers',
        reports: 'Reports',
        profile: 'My Profile',
      };
      title = `${labels[adminLabel] || 'Admin'} | Sunita'z Collection Admin`;
    } else if (path === '/dashboard') {
      title = 'Dashboard | Sunita\'z Collection';
    } else if (path === '/cart') {
      title = 'Shopping Cart | Sunita\'z Collection';
    } else if (path === '/checkout') {
      title = 'Checkout | Sunita\'z Collection';
    } else if (path.startsWith('/product/')) {
      title = 'Product Details | Sunita\'z Collection';
    } else if (path === '/shop') {
      title = 'Shop | Sunita\'z Collection';
    } else if (path === '/wishlist') {
      title = 'Wishlist | Sunita\'z Collection';
    } else if (path === '/orders') {
      title = 'My Orders | Sunita\'z Collection';
    } else if (path === '/profile') {
      title = 'My Profile | Sunita\'z Collection';
    } else if (path === '/messages') {
      title = 'Messages | Sunita\'z Collection';
    }
    document.title = title;
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <AppRoutes />
      {!isAdminRoute && !isAuthRoute && <WhatsAppChatWidget />}
      <CustomToaster />
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
              <EnquiryDataProvider>
                <WishlistProvider>
                  <CompareProvider>
                    <EnquiryProvider>
                      <AppContent />
                      <EnquiryModal />
                    </EnquiryProvider>
                  </CompareProvider>
                </WishlistProvider>
              </EnquiryDataProvider>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;