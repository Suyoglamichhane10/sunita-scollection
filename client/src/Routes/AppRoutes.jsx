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
const OrderSuccess = lazy(() => import('../pages/customer/OrderSuccess'));
const PaymentFailure = lazy(() => import('../pages/customer/PaymentFailure'));
const Dashboard = lazy(() => import('../pages/customer/Dashboard'));
const AboutUs = lazy(() => import('../pages/customer/AboutUs'));
const Contact = lazy(() => import('../pages/customer/Contact'));
const OrderTracking = lazy(() => import('../pages/customer/OrderTracking'));
const DeliveryApp = lazy(() => import('../pages/delivery/DeliveryApp'));
const Wishlist = lazy(() => import('../pages/customer/Wishlist'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminCatalog = lazy(() => import('../pages/admin/AdminCatalog'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminMessages = lazy(() => import('../pages/admin/AdminMessages'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('../pages/admin/AdminCategories'));
const AdminInventory = lazy(() => import('../pages/admin/AdminInventory'));
const AdminReports = lazy(() => import('../pages/admin/AdminReports'));
const AdminConversations = lazy(() => import('../pages/admin/AdminConversations'));
const AdminMarketing = lazy(() => import('../pages/admin/AdminMarketing'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));
const AdminDelivery = lazy(() => import('../pages/admin/AdminDelivery'));
const AdminSlideshow = lazy(() => import('../pages/admin/AdminSlideshow'));

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
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
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
          path="/payment-failure/:orderId"
          element={
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-order/:orderId"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <DeliveryApp />
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
        <Route path="delivery" element={<AdminDelivery />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="slideshow" element={<AdminSlideshow />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="conversations" element={<AdminConversations />} />
        <Route path="marketing" element={<AdminMarketing />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* 404 - Not Found */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
