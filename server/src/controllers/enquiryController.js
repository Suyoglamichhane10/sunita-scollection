const Enquiry = require('../Models/Enquiry');
const User = require('../Models/User');
const Product = require('../Models/Product');
const { rejectInvalidPhone } = require('../Utils/phoneValidator');
const {
  sendEnquiryNotification,
  sendEnquiryReply,
  sendEnquiryDealClosed,
  sendFollowUp,
} = require('../services/emailService');

const populateEnquiry = (query) =>
  query.populate('productId', 'name images price stock').populate('userId', 'name email phone');

const emitEnquiry = (req, event, enquiry, targetUserId = null) => {
  try {
    const io = req.app && req.app.get('io');
    if (!io) return;
    const payload = { enquiry, unreadCount: null };
    if (targetUserId) {
      io.to(`user_${targetUserId}`).emit(event, payload);
    } else {
      io.to('admins').emit(event, payload);
    }
  } catch (error) {
    console.error('Enquiry socket emit failed:', error.message);
  }
};

const notifyAdmins = async (enquiry, product) => {
  const admins = await User.find({ role: 'admin' }).select('name email');
  if (!admins.length) return;
  await Promise.allSettled(
    admins.map((admin) => sendEnquiryNotification(admin, enquiry, product))
  );
};

const notifyCustomer = async (enquiry, product, subject, html) => {
  if (!enquiry.email) return;
  try {
    await sendFollowUp(
      { name: enquiry.name, email: enquiry.email },
      { productName: product?.name || enquiry.productName || 'your product', message: html || enquiry.adminReply || '' },
      undefined
    );
  } catch (error) {
    console.error('Enquiry customer email failed:', error.message);
  }
};

// Customer actions that need a human on our side: a callback request or a
// counter offer. Pushes into the admin notification bell both live (socket)
// and on reload (persisted on each admin's user record).
const notifyAdminsOfCustomerAction = async (req, enquiry, actionLabel) => {
  const productName = enquiry.productId?.name || enquiry.productName || 'a product';
  const message = `${actionLabel} — ${enquiry.name} (${enquiry.phone}) about ${productName}`;
  // One timestamp for both the live push and the persisted copy so the admin
  // bell can recognise them as the same notification and not show it twice.
  const at = new Date();
  const link = `/admin/enquiries?enquiry=${enquiry._id}`;
  const payload = {
    id: `enquiry-${actionLabel.toLowerCase().replace(/\s+/g, '-')}-${enquiry._id}`,
    message,
    type: 'enquiry',
    action: actionLabel.toLowerCase().replace(/\s+/g, '_'),
    enquiryId: enquiry._id.toString(),
    link,
    createdAt: at.getTime(),
  };

  try {
    const io = req.app && req.app.get('io');
    if (io) {
      io.to('admins').emit('notification:new', payload);
    }
  } catch (error) {
    console.error('Admin enquiry notification failed:', error.message);
  }

  try {
    await User.updateMany(
      { role: 'admin' },
      {
        $push: {
          notifications: {
            message,
            type: 'enquiry',
            action: payload.action,
            enquiryId: enquiry._id,
            link,
            read: false,
            createdAt: at,
          },
        },
      }
    );
  } catch (error) {
    console.error('Admin enquiry notification persist failed:', error.message);
  }
};

const getAdminUnreadFilter = () => ({ readByAdmin: { $ne: true } });

exports.createEnquiry = async (req, res, next) => {
  try {
    const { productId, productName, name, phone, email, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    if (rejectInvalidPhone(res, phone)) return;

    // A product is optional so the same endpoint serves the general enquiry
    // form in the footer, which has no product context.
    let product = null;
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
    }

    const userId = req.user?.id || null;
    if (productId) {
      const existing = await Enquiry.findOne({ productId, userId }).sort({ createdAt: -1 });
      if (existing && ['pending', 'price_shared', 'negotiating', 'customer_agreed'].includes(existing.status)) {
        return res.status(400).json({ success: false, message: 'You already have an active enquiry for this product' });
      }
    }

    const enquiry = await Enquiry.create({
      productId: productId || null,
      userId,
      productName: product?.name || (productName || '').trim() || null,
      name,
      phone,
      email: email || null,
      message,
      status: 'pending',
      readByAdmin: false,
      readByCustomer: true,
      messages: [
        {
          sender: 'customer',
          text: message,
          price: null,
          type: 'reply',
          createdAt: new Date(),
        },
      ],
    });

    const populated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:new', populated);
    await notifyAdminsOfCustomerAction(req, populated, 'New enquiry');
    await notifyAdmins(populated, product);

    res.status(201).json({ success: true, enquiry: populated });
  } catch (error) {
    next(error);
  }
};

exports.getMyEnquiries = async (req, res, next) => {
  try {
    const enquiries = await populateEnquiry(
      Enquiry.find({ userId: req.user.id }).sort({ createdAt: -1 })
    );
    res.status(200).json({ success: true, enquiries });
  } catch (error) {
    next(error);
  }
};

exports.getAllEnquiries = async (req, res, next) => {
  try {
    const { status, productId, userId, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const enquiries = await populateEnquiry(Enquiry.find(filter).sort({ createdAt: -1 }));
    
    const enriched = enquiries.map((e) => {
      const obj = e.toObject ? e.toObject() : e;
      const customerName = obj.name || 'Customer';
      const productName = obj.productId?.name || obj.productName || 'the product';
      obj.suggestedReply = `Hello ${customerName}, thank you for your interest in ${productName}. The price for this product is Rs. ______ including delivery. Please confirm if you would like to proceed. If you have any questions, feel free to reply here or call us at our contact number.`;
      return obj;
    });
    
    res.status(200).json({ success: true, enquiries: enriched });
  } catch (error) {
    next(error);
  }
};

exports.getEnquiry = async (req, res, next) => {
  try {
    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    const isOwner = enquiry.userId && enquiry.userId.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    
    const obj = enquiry.toObject ? enquiry.toObject() : enquiry;
    const customerName = obj.name || 'Customer';
    const productName = obj.productId?.name || obj.productName || 'the product';
    obj.suggestedReply = `Hello ${customerName}, thank you for your interest in ${productName}. The price for this product is Rs. ______ including delivery. Please confirm if you would like to proceed. If you have any questions, feel free to reply here or call us at our contact number.`;
    
    res.status(200).json({ success: true, enquiry: obj });
  } catch (error) {
    next(error);
  }
};

exports.adminReply = async (req, res, next) => {
  try {
    const message = req.body.message ?? req.body.text;
    const price = req.body.price;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const normalizedPrice = price === undefined || price === null || price === '' ? null : Number(price);
    if (normalizedPrice !== null && (!Number.isFinite(normalizedPrice) || normalizedPrice < 0)) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }

    enquiry.messages.push({
      sender: 'admin',
      text: String(message).trim(),
      price: normalizedPrice,
      type: 'reply',
      createdAt: new Date(),
    });
    enquiry.adminReply = String(message).trim();
    enquiry.repliedAt = new Date();
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;

    if (normalizedPrice !== null && normalizedPrice > 0) {
      enquiry.quotedPrice = normalizedPrice;
      if (enquiry.status === 'pending') {
        enquiry.status = 'price_shared';
      }
    }

    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await notifyCustomer(updated, product);

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.adminSharePrice = async (req, res, next) => {
  try {
    const { price, message = 'Price shared' } = req.body;
    const normalizedPrice = price === undefined || price === null || price === '' ? null : Number(price);
    if (normalizedPrice === null || !Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.messages.push({
      sender: 'admin',
      text: String(message).trim(),
      price: normalizedPrice,
      type: 'reply',
      createdAt: new Date(),
    });
    enquiry.quotedPrice = normalizedPrice;
    enquiry.status = 'price_shared';
    enquiry.repliedAt = new Date();
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    await enquiry.save();

    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await notifyCustomer(updated, product);

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.adminSuggestNewPrice = async (req, res, next) => {
  try {
    const { price, message = 'Consider this price' } = req.body;
    const normalizedPrice = price === undefined || price === null || price === '' ? null : Number(price);
    if (normalizedPrice === null || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid price is required' });
    }

    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.messages.push({
      sender: 'admin',
      text: String(message).trim(),
      price: normalizedPrice,
      type: 'reply',
      createdAt: new Date(),
    });
    enquiry.quotedPrice = normalizedPrice;
    enquiry.counterPrice = normalizedPrice;
    enquiry.status = 'negotiating';
    enquiry.repliedAt = new Date();
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    await enquiry.save();

    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await notifyCustomer(updated, product);

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.adminCallToConfirm = async (req, res, next) => {
  try {
    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    const text = 'We are calling you to confirm the price';
    enquiry.messages.push({
      sender: 'admin',
      text,
      price: null,
      type: 'call',
      createdAt: new Date(),
    });
    enquiry.adminReply = text;
    enquiry.repliedAt = new Date();
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    if (['pending', 'price_shared', 'negotiating'].includes(enquiry.status)) {
      enquiry.status = 'negotiating';
    }
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await notifyCustomer(updated, product);

    res.status(200).json({ success: true, enquiry: updated, phoneNumber: enquiry.phone });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdateFinalPrice = async (req, res, next) => {
  try {
    const { price, message = 'Final price confirmed' } = req.body;
    const normalizedPrice = price === undefined || price === null || price === '' ? null : Number(price);
    if (normalizedPrice === null || !Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Valid deal price is required' });
    }

    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    enquiry.messages.push({
      sender: 'admin',
      text: String(message).trim(),
      price: normalizedPrice,
      type: 'final',
      createdAt: new Date(),
    });
    enquiry.dealPrice = normalizedPrice;
    enquiry.quotedPrice = normalizedPrice;
    enquiry.status = 'deal_closed';
    enquiry.approvedAt = new Date();
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    await enquiry.save();

    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:deal_closed', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await sendEnquiryDealClosed({ name: enquiry.name, email: enquiry.email }, updated, product).catch(() => {});

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.customerAgreeWithPrice = async (req, res, next) => {
  try {
    const { message = 'I agree with the price' } = req.body;
    const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user.id });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    if (!enquiry.quotedPrice) {
      return res.status(400).json({ success: false, message: 'No quoted price to agree with' });
    }

    enquiry.messages.push({
      sender: 'customer',
      text: String(message).trim(),
      price: enquiry.quotedPrice,
      type: 'agree',
      createdAt: new Date(),
    });
    enquiry.status = 'deal_closed';
    enquiry.dealPrice = enquiry.quotedPrice;
    enquiry.approvedAt = new Date();
    enquiry.readByAdmin = true;
    enquiry.readByCustomer = true;
    await enquiry.save();

    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:deal_closed', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.customerCounterOffer = async (req, res, next) => {
  try {
    const message = req.body.message ?? req.body.text;
    const price = req.body.price;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Counter-offer message is required' });
    }
    const normalizedPrice = price === undefined || price === null || price === '' ? null : Number(price);
    if (normalizedPrice === null || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Counter-offer price is required' });
    }

    const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user.id });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    enquiry.messages.push({
      sender: 'customer',
      text: String(message).trim(),
      price: normalizedPrice,
      type: 'counter',
      createdAt: new Date(),
    });
    enquiry.counterPrice = normalizedPrice;
    enquiry.status = 'negotiating';
    enquiry.readByAdmin = false;
    enquiry.readByCustomer = true;
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    // Keep the customer's own open tabs in sync with the thread.
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    // A revised offer needs a human, so raise it in the admin bell too.
    await notifyAdminsOfCustomerAction(req, updated, 'Counter offer');

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.customerRequestCall = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user.id });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    const text = req.body.message ?? req.body.text ?? 'Please call me to fix the price';
    enquiry.messages.push({
      sender: 'customer',
      text,
      price: null,
      type: 'call',
      createdAt: new Date(),
    });
    enquiry.status = enquiry.status === 'pending' ? 'negotiating' : enquiry.status;
    enquiry.readByAdmin = false;
    enquiry.readByCustomer = true;
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    // Keep the customer's own open tabs in sync with the thread.
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    // A callback request needs a human, so raise it in the admin bell too.
    await notifyAdminsOfCustomerAction(req, updated, 'Call request');

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update own enquiry (customer) - before admin reply
// @route   PUT /api/enquiries/:id
// @access  Private
exports.updateEnquiry = async (req, res, next) => {
  try {
    const { message, phone, email } = req.body;
    
    const enquiry = await Enquiry.findOne({ _id: req.params.id, userId: req.user.id });
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    
    // Only allow editing before admin has replied
    if (enquiry.adminReply) {
      return res.status(400).json({ success: false, message: 'Cannot edit enquiry after admin has replied' });
    }
    
    if (rejectInvalidPhone(res, phone)) return;

    if (message && String(message).trim()) {
      // Update the first message (original enquiry message)
      if (enquiry.messages && enquiry.messages.length > 0) {
        enquiry.messages[0].text = String(message).trim();
      }
      enquiry.message = String(message).trim();
    }
    
    if (phone) enquiry.phone = phone;
    if (email !== undefined) enquiry.email = email || null;
    
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    
    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.rejectEnquiry = async (req, res, next) => {
  try {
    const { message } = req.body;
    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    enquiry.messages.push({
      sender: 'admin',
      text: String(message || 'We are unable to proceed with this enquiry.').trim(),
      price: null,
      type: 'disagree',
      createdAt: new Date(),
    });
    enquiry.adminReply = String(message || 'We are unable to proceed with this enquiry.').trim();
    enquiry.repliedAt = new Date();
    enquiry.status = 'rejected';
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    const product = await Product.findById(enquiry.productId);
    await notifyCustomer(updated, product);

    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (req.user.role !== 'admin') {
      if (enquiry.userId && enquiry.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      if (enquiry.status === 'converted') {
        return res.status(400).json({ success: false, message: 'Cannot delete an enquiry that has been converted to an order' });
      }
    }

    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Enquiry deleted successfully', enquiry: deleted });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Enquiry.countDocuments({ userId: req.user.id, readByCustomer: { $ne: true } });
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

exports.getAdminUnreadCount = async (req, res, next) => {
  try {
    const count = await Enquiry.countDocuments(getAdminUnreadFilter());
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? getAdminUnreadFilter() : { userId: req.user.id };
    await Enquiry.updateMany(filter, { $set: { readByAdmin: true, readByCustomer: true } });
    res.status(200).json({ success: true, message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.markOneReadAsAdmin = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    enquiry.readByAdmin = true;
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    res.status(200).json({ success: true, enquiry: updated, unreadCount: await Enquiry.countDocuments(getAdminUnreadFilter()) });
  } catch (error) {
    next(error);
  }
};

exports.markOneReadAsCustomer = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { readByCustomer: true } },
      { new: true }
    );
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.status(200).json({ success: true, enquiry });
  } catch (error) {
    next(error);
  }
};

exports.getApprovedProducts = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find({
      userId: req.user.id,
      status: { $in: ['deal_closed', 'customer_agreed', 'converted'] },
      dealPrice: { $ne: null },
      productId: { $ne: null },
    }).select('productId dealPrice quotedPrice status');

    const productIds = enquiries
      .filter((enquiry) => enquiry.productId)
      .map((enquiry) => enquiry.productId.toString());
    res.status(200).json({ success: true, productIds, enquiries });
  } catch (error) {
    next(error);
  }
};

exports.updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status, adminNote, adminReply, quotedPrice } = req.body;
    if (!['pending', 'price_shared', 'negotiating', 'customer_agreed', 'deal_closed', 'rejected', 'converted', 'approved', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const enquiry = await populateEnquiry(Enquiry.findById(req.params.id));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    enquiry.status = status;
    if (['approved', 'deal_closed', 'customer_agreed', 'converted'].includes(status)) {
      enquiry.approvedAt = new Date();
    }
    if (adminNote) enquiry.adminNote = adminNote;
    if (adminReply !== undefined) {
      enquiry.adminReply = adminReply;
      enquiry.repliedAt = new Date();
    }
    if (quotedPrice !== undefined) enquiry.quotedPrice = Number(quotedPrice);
    enquiry.readByCustomer = false;
    enquiry.readByAdmin = true;
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    emitEnquiry(req, 'enquiry:new', updated);
    res.status(200).json({ success: true, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.incrementAgreeCount = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { $inc: { agreeCount: 1 } },
      { new: true }
    );
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:new', updated);
    res.status(200).json({ success: true, agreeCount: updated.agreeCount, enquiry: updated });
  } catch (error) {
    next(error);
  }
};

exports.getEnquiryStats = async (req, res, next) => {
  try {
    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    const priceShared = await Enquiry.countDocuments({ status: 'price_shared' });
    const negotiating = await Enquiry.countDocuments({ status: 'negotiating' });
    const customerAgreed = await Enquiry.countDocuments({ status: 'customer_agreed' });
    const dealClosed = await Enquiry.countDocuments({ status: 'deal_closed' });
    const rejected = await Enquiry.countDocuments({ status: 'rejected' });
    const converted = await Enquiry.countDocuments({ status: 'converted' });
    const daily = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const weekly = await Enquiry.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    const mostEnquired = await Enquiry.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          name: { $ifNull: ['$product.name', 'Unknown'] },
          count: 1,
        },
      },
    ]);
    const conversionRate = total > 0 ? Math.round(((dealClosed + converted) / total) * 100) : 0;
    res.status(200).json({
      success: true,
      data: {
        total,
        daily: daily[0]?.count || 0,
        weekly: weekly[0]?.count || 0,
        pending,
        priceShared,
        negotiating,
        customerAgreed,
        dealClosed,
        rejected,
        converted,
        conversionRate,
        mostEnquired,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.sendFollowUp = async (req, res, next) => {
  try {
    const { enquiryId, message, offerCode } = req.body;
    if (!enquiryId) {
      return res.status(400).json({ success: false, message: 'Enquiry ID is required' });
    }
    const enquiry = await populateEnquiry(Enquiry.findById(enquiryId));
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    const productName = enquiry.productId?.name || enquiry.productName || 'our products';
    if (enquiry.email) {
      await sendFollowUp(
        { name: enquiry.name, email: enquiry.email },
        { productName, message: message || enquiry.adminReply || '' },
        offerCode
      );
    }
    if (message) {
      enquiry.messages.push({ sender: 'admin', text: message, price: null, type: 'reply', createdAt: new Date() });
      enquiry.adminReply = message;
      enquiry.repliedAt = new Date();
      enquiry.readByCustomer = false;
    }
    if (offerCode) {
      enquiry.adminNote = (enquiry.adminNote ? `${enquiry.adminNote}\n` : '') + `Offer code: ${offerCode}`;
    }
    await enquiry.save();
    const updated = await populateEnquiry(Enquiry.findById(enquiry._id));
    emitEnquiry(req, 'enquiry:reply', updated, enquiry.userId?.toString());
    res.status(200).json({ success: true, message: 'Follow-up sent successfully', enquiry: updated });
  } catch (error) {
    next(error);
  }
};
