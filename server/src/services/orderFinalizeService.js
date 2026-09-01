const User = require('../Models/User');
const { decrementStock } = require('./stockService');
const { sendOrderConfirmation } = require('./emailService');
const loyaltyService = require('./loyaltyService');
const automationService = require('./automationService');

/**
 * Finalize an order after successful payment verification.
 * - Decrements stock (only once per order)
 * - Marks payment as paid and order as confirmed
 * - Sends a confirmation email to the customer
 * - Awards loyalty points and triggers automation
 *
 * @param {object} order - The mongoose order document
 * @param {object} paymentDetails - { transactionId, paymentId, paymentDate }
 * @param {string} userId - The customer user id (for email/loyalty)
 * @returns {Promise<object>} the updated order
 */
const finalizePaidOrder = async (order, paymentDetails, userId) => {
  // Guard against double-finalization
  if (order.isPaid && order.orderStatus === 'confirmed') {
    return order;
  }

  // 1. Decrement stock only after successful payment verification
  await decrementStock(order.items);

  // 2. Update order payment + status
  order.paymentStatus = 'paid';
  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentDetails = {
    transactionId: paymentDetails.transactionId,
    paymentId: paymentDetails.paymentId,
    paymentDate: paymentDetails.paymentDate || new Date(),
    gateway: paymentDetails.gateway,
  };
  order.orderStatus = 'confirmed';
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'confirmed',
    note: `Payment verified via ${paymentDetails.gateway}; order confirmed`,
    timestamp: new Date(),
  });
  await order.save();

  // 3. Send confirmation email (non-blocking)
  try {
    const user = await User.findById(userId);
    if (user) {
      await sendOrderConfirmation(user, order);
    }
  } catch (emailErr) {
    console.error('Confirmation email send failed:', emailErr.message);
  }

  // 3.1 Notify admins of payment confirmation
  try {
    const app = require('../app');
    const io = app.get('io');
    if (io) {
      io.to('admins').emit('notification:new', {
        message: `Payment verified for order #${order._id.toString().slice(-6)} — Rs. ${order.totalAmount}`,
        type: 'payment',
        createdAt: Date.now(),
      });
    }
  } catch (socketErr) {
    console.error('Admin payment notification emit failed:', socketErr.message);
  }

  // 4. Loyalty points & automation (non-blocking)
  setImmediate(async () => {
    try {
      const points = Math.round(order.totalAmount / 10);
      await loyaltyService.awardPoints(userId, points, 'purchase');
      await loyaltyService.updateChallengeProgress(userId, 'first_purchase');
      await loyaltyService.updateChallengeProgress(userId, 'place_3_orders');
      await automationService.onOrderStatusChange(order);
    } catch (err) {
      console.error('Loyalty/automation error after payment:', err.message);
    }
  });

  return order;
};

/**
 * Mark an order as failed due to unsuccessful/cancelled payment.
 * @param {object} order - The mongoose order document
 * @param {string} reason - Failure reason
 * @returns {Promise<object>} the updated order
 */
const failOrder = async (order, reason) => {
  order.paymentStatus = 'failed';
  order.orderStatus = 'cancelled';
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'cancelled',
    note: `Payment failed: ${reason}`,
    timestamp: new Date(),
  });
  await order.save();
  return order;
};

module.exports = { finalizePaidOrder, failOrder };
