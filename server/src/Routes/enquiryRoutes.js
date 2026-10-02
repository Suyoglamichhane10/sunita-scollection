const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  createEnquiry,
  getMyEnquiries,
  getAllEnquiries,
  getEnquiry,
  adminReply,
  adminSharePrice,
  adminSuggestNewPrice,
  adminCallToConfirm,
  adminUpdateFinalPrice,
  customerAgreeWithPrice,
  customerCounterOffer,
  customerRequestCall,
  rejectEnquiry,
  deleteEnquiry,
  updateEnquiry,
  getUnreadCount,
  getAdminUnreadCount,
  markAllRead,
  markOneReadAsAdmin,
  markOneReadAsCustomer,
  getApprovedProducts,
  updateEnquiryStatus,
  getEnquiryStats,
  sendFollowUp,
  incrementAgreeCount,
} = require('../controllers/enquiryController');
const { protect, authorize } = require('../Middleware/auth');

// Polling limiter for read-only endpoints. These are fetched by a single shared
// provider for the whole app, so the ceiling only needs to cover that plus
// socket-driven refreshes.
const pollLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});

// Standard limiter for write operations on this resource
const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.post('/', protect, enquiryLimiter, createEnquiry);
router.get('/my', protect, pollLimiter, getMyEnquiries);
router.get('/', protect, authorize('admin'), enquiryLimiter, getAllEnquiries);
// Read-only endpoint; served from the shared provider, so keep it on the
// polling limiter rather than the stricter write limiter.
router.get('/approved-products', protect, pollLimiter, getApprovedProducts);
router.get('/unread-count', protect, pollLimiter, getUnreadCount);
router.get('/admin-unread-count', protect, authorize('admin'), pollLimiter, getAdminUnreadCount);
router.get('/stats', protect, authorize('admin'), enquiryLimiter, getEnquiryStats);
router.get('/:id', protect, enquiryLimiter, getEnquiry);
router.put('/:id/read-admin', protect, authorize('admin'), enquiryLimiter, markOneReadAsAdmin);
router.put('/:id/read-customer', protect, enquiryLimiter, markOneReadAsCustomer);
router.put('/read-all', protect, enquiryLimiter, markAllRead);
router.put('/:id/status', protect, authorize('admin'), enquiryLimiter, updateEnquiryStatus);
router.post('/:id/agree', protect, authorize('admin'), enquiryLimiter, incrementAgreeCount);

// Admin actions
router.post('/:id/share-price', protect, authorize('admin'), enquiryLimiter, adminSharePrice);
router.post('/:id/suggest-price', protect, authorize('admin'), enquiryLimiter, adminSuggestNewPrice);
router.post('/:id/call', protect, authorize('admin'), enquiryLimiter, adminCallToConfirm);
router.post('/:id/update-final-price', protect, authorize('admin'), enquiryLimiter, adminUpdateFinalPrice);
router.post('/:id/reject', protect, authorize('admin'), enquiryLimiter, rejectEnquiry);
router.delete('/:id', protect, enquiryLimiter, deleteEnquiry);

// Customer actions
router.post('/:id/customer-agree', protect, enquiryLimiter, customerAgreeWithPrice);
router.post('/:id/counter', protect, enquiryLimiter, customerCounterOffer);
router.post('/:id/request-call', protect, enquiryLimiter, customerRequestCall);
router.put('/:id', protect, enquiryLimiter, updateEnquiry);

// Admin general reply
router.post('/:id/reply', protect, authorize('admin'), enquiryLimiter, adminReply);

// Follow-up
router.post('/:id/followup', protect, authorize('admin'), enquiryLimiter, sendFollowUp);

module.exports = router;