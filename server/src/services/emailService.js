const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

const sendOrderConfirmation = async (user, order) => {
  const itemsList = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${item.name}${item.variantTitle ? ` (${item.variantTitle})` : ''}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${item.isDeal ? 'Rs. ' + item.price + ' (Deal)' : 'Rs. ' + item.price}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#2563eb,#ec4899);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">Order Confirmed 🎉</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">Hi <strong>${user.name}</strong>,</h2>
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

const sendEnquiryNotification = async (admin, enquiry, product) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#8B1E3F,#D4AF37);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">New Enquiry Notification</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">New Product Enquiry</h2>
        <p>A customer has enquired about <strong>${product?.name || 'a product'}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Name</td><td style="padding:8px;border:1px solid #e5e7eb;">${enquiry.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Phone</td><td style="padding:8px;border:1px solid #e5e7eb;">${enquiry.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Email</td><td style="padding:8px;border:1px solid #e5e7eb;">${enquiry.email || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Status</td><td style="padding:8px;border:1px solid #e5e7eb;"><span style="background:#fef3c7;padding:2px 8px;border-radius:4px;font-size:12px;">${(enquiry.status || 'pending').toUpperCase()}</span></td></tr>
        </table>
        <p style="margin-top:8px;color:#6b7280;"><strong>Message:</strong> ${enquiry.message}</p>
        <p style="margin-top:16px;"><a href="${process.env.FRONTEND_URL}/admin/enquiries" style="display:inline-block;background:#8B1E3F;color:white;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">View in Admin Panel</a></p>
      </div>
    </div>
  `;

  return sendEmail({
    to: admin.email,
    subject: `New Enquiry: ${product?.name || 'Product'} - Sunita'z Collection`,
    text: `New enquiry from ${enquiry.name} (${enquiry.phone}) about ${product?.name}. Message: ${enquiry.message}`,
    html,
  });
};

const sendEnquiryReply = async (customer, enquiry, product) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#8B1E3F,#D4AF37);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">Reply to Your Enquiry</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">Hi ${customer.name},</h2>
        <p>Thank you for your enquiry about <strong>${product?.name || enquiry.productName || 'our products'}</strong>.</p>
        <div style="background:#fef3c7;padding:16px;border-radius:12px;margin:16px 0;">
          <p style="font-size:14px;color:#92400e;margin-bottom:4px;"><strong>Admin Reply:</strong></p>
          <p style="font-size:15px;color:#111827;">${enquiry.adminReply || enquiry.message}</p>
          ${enquiry.quotedPrice ? `<p style="font-size:16px;font-weight:bold;color:#8B1E3F;margin-top:8px;">Quoted Price: Rs. ${enquiry.quotedPrice}</p>` : ''}
        </div>
        <p style="color:#6b7280;font-size:14px;">If you have any questions, feel free to reply to this enquiry.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Reply to Your Enquiry - Sunita'z Collection`,
    text: `Your enquiry about ${product?.name || enquiry.productName} has been reviewed. ${enquiry.adminReply || ''}`,
    html,
  });
};

const sendEnquiryDealClosed = async (customer, enquiry, product) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#8B1E3F,#D4AF37);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">Deal Confirmed!</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">🎉 Deal Confirmed!</h2>
        <p>Hi ${customer.name},</p>
        <p>Great news! Your enquiry about <strong>${product?.name || enquiry.productName || 'our products'}</strong> has been finalized.</p>
        <div style="background:#dcfce7;padding:16px;border-radius:12px;margin:16px 0;text-align:center;">
          <p style="font-size:14px;color:#166534;margin-bottom:4px;">Agreed Deal Price</p>
          <p style="font-size:28px;font-weight:bold;color:#15803d;">Rs. ${enquiry.dealPrice || enquiry.quotedPrice}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;margin-top:16px;">You can now add this item to your cart at the agreed price, or use "Buy Now" to proceed directly to checkout.</p>
        <p style="margin-top:24px;"><a href="${process.env.FRONTEND_URL}/product/${enquiry.productId?._id || ''}" style="display:inline-block;background:#8B1E3F;color:white;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">View Product</a></p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Deal Confirmed: ${product?.name || 'Product'} - Sunita'z Collection`,
    text: `Your enquiry about ${product?.name || enquiry.productName} has been confirmed. Deal price: Rs. ${enquiry.dealPrice || enquiry.quotedPrice}`,
    html,
  });
};

const sendFollowUp = async (customer, enquiry, offerCode) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(90deg,#8B1E3F,#D4AF37);padding:24px;color:white;text-align:center;">
        <h1 style="margin:0;">Sunita'z Collection</h1>
        <p style="margin:4px 0 0;opacity:0.9;">Follow-Up: Your Enquiry</p>
      </div>
      <div style="padding:24px;color:#111827;">
        <h2 style="margin-top:0;">Hi ${customer.name},</h2>
        <p>Thank you for your interest in <strong>${enquiry?.productName || 'our products'}</strong>. We've reviewed your enquiry and would like to offer you a special discount!</p>
        <div style="background:#fef3c7;padding:16px;border-radius:12px;text-align:center;margin:16px 0;">
          <p style="font-size:14px;color:#92400e;">Use this code for your next order:</p>
          <p style="font-size:28px;font-weight:bold;color:#8B1E3F;letter-spacing:2px;">${offerCode}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">This code is valid for 7 days. Feel free to reach out if you have any questions.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customer.email,
    subject: `Special Offer for Your Enquiry - Sunita'z Collection`,
    text: `Your enquiry about ${enquiry?.productName || 'our products'} has been reviewed. Use code ${offerCode} for a special discount.`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPasswordReset,
  sendEnquiryNotification,
  sendEnquiryReply,
  sendEnquiryDealClosed,
  sendFollowUp,
};
