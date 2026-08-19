const Delivery = require('../Models/Delivery');
const Order = require('../Models/Order');
const User = require('../Models/User');

exports.createDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const existing = await Delivery.findOne({ orderId: order._id });
    if (existing) {
      return res.status(200).json({ success: true, delivery: existing, message: 'Delivery already exists' });
    }

    const delivery = await Delivery.create({
      orderId: order._id,
      status: 'pending',
      pickupLocation: {
        lat: 27.7172,
        lng: 85.324,
        address: order.shippingAddress?.street || '',
      },
      deliveryLocation: {
        lat: 27.7172,
        lng: 85.324,
        address: `${order.shippingAddress?.street}, ${order.shippingAddress?.city}`,
      },
      estimatedDeliveryTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    });

    await Order.findByIdAndUpdate(order._id, {
      'delivery.assigned': false,
      'delivery.status': 'pending',
      'delivery.estimatedTime': delivery.estimatedDeliveryTime,
      'delivery.pickupLocation': delivery.pickupLocation,
      'delivery.deliveryLocation': delivery.deliveryLocation,
    });

    res.status(201).json({ success: true, delivery });
  } catch (error) {
    next(error);
  }
};

exports.assignDeliveryPerson = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { deliveryPersonId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    let deliveryPerson = null;
    if (deliveryPersonId) {
      deliveryPerson = await User.findById(deliveryPersonId);
      if (!deliveryPerson) {
        return res.status(404).json({ success: false, message: 'Delivery person not found' });
      }
      if (!deliveryPerson.isDeliveryPerson) {
        return res.status(400).json({ success: false, message: 'User is not a delivery person' });
      }
      if (!deliveryPerson.isAvailable) {
        return res.status(400).json({ success: false, message: 'Delivery person is not available' });
      }
    }

    if (deliveryPerson) {
      delivery.deliveryPersonId = deliveryPerson._id;
      delivery.deliveryPersonName = deliveryPerson.name;
      delivery.deliveryPersonPhone = deliveryPerson.phone || '';
      delivery.deliveryPersonVehicle = deliveryPerson.vehicle || '';
      delivery.deliveryPersonPhoto = deliveryPerson.avatar || '';
      delivery.status = 'confirmed';
    }

    await delivery.save();

    await Order.findByIdAndUpdate(order._id, {
      'delivery.assigned': !!deliveryPersonId,
      'delivery.deliveryPersonId': deliveryPersonId || null,
      'delivery.status': delivery.status,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('delivery:assigned', {
        orderId: order._id,
        delivery: {
          deliveryPersonName: delivery.deliveryPersonName,
          deliveryPersonPhone: delivery.deliveryPersonPhone,
          deliveryPersonVehicle: delivery.deliveryPersonVehicle,
          deliveryPersonPhoto: delivery.deliveryPersonPhoto,
        },
      });
    }

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    next(error);
  }
};

exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'supplier' && req.user._id.toString() !== delivery.deliveryPersonId?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update delivery status' });
    }

    delivery.status = status;
    if (note) delivery.notes = note;
    if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.orderStatus = 'delivered';
      order.statusHistory.push({
        status: 'delivered',
        note: note || 'Order delivered',
        updatedBy: req.user?._id,
      });
      await order.save();
    }

    await delivery.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('delivery:status', {
        orderId: order._id,
        status: delivery.status,
        note: delivery.notes,
        updatedAt: new Date().toISOString(),
      });
    }

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { orderId, lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    if (req.user.role !== 'admin' && req.user._id.toString() !== delivery.deliveryPersonId?.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update location' });
    }

    delivery.currentLocation = { lat, lng, updatedAt: new Date() };
    delivery.route.push({ lat, lng, timestamp: new Date() });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        currentLocation: { lat, lng, updatedAt: new Date() },
      });
    }

    await delivery.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('delivery:location', {
        orderId: order._id,
        lat,
        lng,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({ success: true, location: { lat, lng } });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found for this order' });
    }

    res.status(200).json({ success: true, delivery, order });
  } catch (error) {
    next(error);
  }
};

exports.getActiveDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.find({
      status: { $nin: ['delivered', 'cancelled'] },
    })
      .populate('deliveryPersonId', 'name phone avatar vehicle vehicleNumber')
      .populate('orderId', 'orderNumber totalAmount shippingAddress orderStatus items')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, deliveries });
  } catch (error) {
    next(error);
  }
};

exports.getNearbyDeliveryPersons = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    const persons = await User.find({
      isDeliveryPerson: true,
      isAvailable: true,
      currentLocation: { $ne: null },
    }).select('name phone avatar vehicle vehicleNumber currentLocation');

    const nearby = persons.filter((p) => {
      if (!p.currentLocation?.lat || !p.currentLocation?.lng) return false;
      const distance = getDistanceFromLatLonInKm(
        parseFloat(lat),
        parseFloat(lng),
        p.currentLocation.lat,
        p.currentLocation.lng
      );
      return distance <= radius;
    });

    res.status(200).json({ success: true, nearby });
  } catch (error) {
    next(error);
  }
};

exports.trackDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'delivery'
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found for this order' });
    }

    res.status(200).json({ success: true, delivery, order });
  } catch (error) {
    next(error);
  }
};

exports.deliveryHistory = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const delivery = await Delivery.findOne({ orderId }).populate(
      'deliveryPersonId',
      'name phone avatar vehicle vehicleNumber'
    );

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    next(error);
  }
};

exports.updateEstimatedTime = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { estimatedDeliveryTime } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    delivery.estimatedDeliveryTime = estimatedDeliveryTime;
    await delivery.save();

    await Order.findByIdAndUpdate(order._id, {
      'delivery.estimatedTime': estimatedDeliveryTime,
    });

    res.status(200).json({ success: true, delivery });
  } catch (error) {
    next(error);
  }
};

exports.getDeliveryStats = async (req, res, next) => {
  try {
    const stats = await Delivery.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const activeCount = await Delivery.countDocuments({
      status: { $nin: ['delivered', 'cancelled'] },
    });

    const completedCount = await Delivery.countDocuments({ status: 'delivered' });

    res.status(200).json({
      success: true,
      stats: {
        byStatus: stats,
        active: activeCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const delivery = await Delivery.findOne({ orderId: order._id });
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    await Delivery.findOneAndDelete({ orderId: order._id });

    await Order.findByIdAndUpdate(order._id, {
      'delivery.assigned': false,
      'delivery.status': null,
      'delivery.deliveryPersonId': null,
      'delivery.deliveryPersonName': '',
      'delivery.deliveryPersonPhone': '',
      'delivery.deliveryPersonVehicle': '',
      'delivery.pickupLocation': { lat: 27.7172, lng: 85.324, address: '' },
      'delivery.deliveryLocation': { lat: 27.7172, lng: 85.324, address: '' },
      'delivery.estimatedTime': null,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('delivery:deleted', {
        orderId: order._id,
        message: 'Delivery record has been removed',
      });
    }

    res.status(200).json({ success: true, message: 'Delivery deleted successfully' });
  } catch (error) {
    next(error);
  }
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
