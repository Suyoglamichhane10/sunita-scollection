import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth Pages
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));

// Customer Pages
const Home = lazy(() => import('../pages/customer/Home'));
const Shop = lazy(() => import('../pages/customer/Shop'));
const ProductDetail = lazy(() => import('../pages/customer/ProductDetail'));
const Cart = lazy(() => import('../pages/customer/Cart'));
const Checkout = lazy(() => import('../pages/customer/Checkout'));
const Orders = lazy(() => import('../pages/customer/Orders'));
const Messages = lazy(() => import('../pages/customer/Messages'));
const Profile = lazy(() => import('../pages/customer/Profile'));
const Wishlist = lazy(() => import('../pages/customer/Wishlist'));
const OrderSuccess = lazy(() => import('../pages/customer/OrderSuccess'));
const Dashboard = lazy(() => import('../pages/customer/Dashboard'));
const Rewards = lazy(() => import('../pages/customer/Rewards'));
const Social = lazy(() => import('../pages/customer/Social'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminCatalog = lazy(() => import('../pages/admin/AdminCatalog'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminMessages = lazy(() => import('../pages/admin/AdminMessages'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminReviews = lazy(() => import('../pages/admin/AdminReviews'));
const AdminChatbot = lazy(() => import('../pages/admin/AdminChatbot'));
const AdminConversations = lazy(() => import('../pages/admin/AdminConversations'));
const AdminGamification = lazy(() => import('../pages/admin/AdminGamification'));
const AdminMarketing = lazy(() => import('../pages/admin/AdminMarketing'));

// Layouts
import CustomerLayout from '../Layouts/Customerlayout';
import AdminLayout from '../Layouts/AdminLayout';

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50 p-10 text-center text-slate-600">Loading...</div>}>
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:resetToken" element={<ResetPassword />} />

      {/* Public Customer Routes */}
      <Route element={<CustomerLayout />}>
<Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Route>

      {/* Protected Customer Routes — require authentication */}
      <Route element={<CustomerLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social"
          element={
            <ProtectedRoute>
              <Social />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes — require admin role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminCatalog />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="chatbot" element={<AdminChatbot />} />
<Route path="conversations" element={<AdminConversations />} />
        <Route path="gamification" element={<AdminGamification />} />
        <Route path="marketing" element={<AdminMarketing />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
