const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {object} options - { to, subject, text, html }
 */
const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials not configured. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `Sunita'z Collection <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, message: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmation = async (user, order) => {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${item.name}${item.variantTitle ? ` (${item.variantTitle})` : ''}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Rs. ${item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#2563eb,#ec4899);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">Elegance for Every Woman</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">Order Confirmed 🎉</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Thank you for your order! Your order <strong>${order.orderNumber}</strong> has been received and is being processed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Item</th>
              <th style="padding:8px;border:1px solid #e5e7eb;">Qty</th>
              <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
        </table>
        <div style="background:#f9fafb;padding:16px;border-radius:12px;">
          <p style="display:flex;justify-content:space-between;margin:4px 0;"><span>Subtotal</span><span>Rs. ${order.subtotal}</span></p>
          <p style="display:flex;justify-content:space-between;margin:4px 0;"><span>Shipping</span><span>${order.shippingCost ? `Rs. ${order.shippingCost}` : 'Free'}</span></p>
          <p style="display:flex;justify-content:space-between;margin:4px 0;"><span>Tax</span><span>Rs. ${order.tax}</span></p>
          <p style="display:flex;justify-content:space-between;margin:8px 0 0;font-weight:bold;border-top:1px solid #e5e7eb;padding-top:8px;"><span>Total</span><span>Rs. ${order.totalAmount}</span></p>
        </div>
        <p style="margin-top:24px;">Payment Method: <strong>${order.paymentMethod.toUpperCase()}</strong></p>
        <p>Delivery to: ${order.shippingAddress.street}, ${order.shippingAddress.city}${order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}</p>
        <p style="margin-top:24px;color:#6b7280;font-size:14px;">Estimated delivery: 3-5 business days.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed: ${order.orderNumber} - Sunita'z Collection`,
    text: `Your order ${order.orderNumber} has been received. Total: Rs. ${order.totalAmount}`,
    html,
  });
};

// Send password reset email
const sendPasswordReset = async (user, resetUrl) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#2563eb,#ec4899);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2>Password Reset</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>You requested a password reset. Click the button below to set a new password. This link expires in 10 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#ec4899;color:white;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;margin-top:16px;">Reset Password</a>
        <p style="margin-top:24px;color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Password Reset - Sunita\'s Collection',
    text: `Click the link to reset your password: ${resetUrl}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPasswordReset,
};
