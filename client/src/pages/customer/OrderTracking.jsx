import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import deliveryApi from '../../Services/deliveryApi';
import { useAuth } from '../../Context/Authcontext';
import { useChat } from '../../Context/ChatContext';
import { FaPhone, FaWhatsapp, FaMapMarkerAlt, FaLocationArrow, FaClock } from 'react-icons/fa';
import DeliveryTimeline from '../../components/common/DeliveryTimeline';
import DeliveryMap from '../../components/common/Map';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { socketRef } = useChat();
  const [delivery, setDelivery] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTracking = useCallback(async () => {
    try {
      const { data } = await deliveryApi.trackDelivery(orderId);
      if (data?.success) {
        setDelivery(data.delivery);
        setOrder(data.order);
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Failed to load tracking details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTracking();
  }, [isAuthenticated, navigate, fetchTracking]);

  useEffect(() => {
    if (!socketRef?.current) return;
    const socket = socketRef.current;
    socket.emit('join-delivery-room', orderId);

    const onStatus = (data) => {
      if (data.orderId === orderId) {
        fetchTracking();
      }
    };
    const onLocation = (data) => {
      if (data.orderId === orderId) {
        setDelivery((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentLocation: { lat: data.lat, lng: data.lng, updatedAt: data.timestamp },
            route: [...prev.route, { lat: data.lat, lng: data.lng, timestamp: data.timestamp }],
          };
        });
      }
    };

    socket.on('delivery:status', onStatus);
    socket.on('delivery:location', onLocation);

    return () => {
      socket.off('delivery:status', onStatus);
      socket.off('delivery:location', onLocation);
      socket.emit('leave-order', orderId);
    };
  }, [orderId, socketRef, fetchTracking]);

  const getEstimatedTime = () => {
    if (!delivery?.estimatedDeliveryTime) return 'Calculating...';
    const now = new Date();
    const est = new Date(delivery.estimatedDeliveryTime);
    const diff = est - now;
    if (diff <= 0) return 'Due soon';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const mapsUrl = (() => {
    const { currentLocation: c, pickupLocation: p, deliveryLocation: d } = delivery || {};
    const target = c || p || d;
    if (!target) return null;
    return `https://www.google.com/maps?q=${target.lat},${target.lng}`;
  })();

  const directionsUrl = (() => {
    const { deliveryLocation: d } = delivery || {};
    if (!d || !Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            Loading tracking details...
          </div>
        </div>
      </div>
    );
  }

  if (!delivery || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Tracking not available</h2>
            <p className="mt-3 text-gray-600">{error || 'Delivery tracking will be available once the order is confirmed.'}</p>
            <button onClick={() => navigate('/orders')} className="mt-6 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-700">
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const routePoints = delivery.route && delivery.route.length > 0 ? delivery.route : [];

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom px-4 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
            <p className="mt-1 text-gray-600">Order {order.orderNumber}</p>
          </div>
          <button onClick={() => navigate('/orders')} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
            Back to Orders
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Live Location</h2>
              <p className="mt-1 text-sm text-gray-600">
                {delivery.currentLocation
                  ? `Last updated: ${new Date(delivery.currentLocation.updatedAt).toLocaleTimeString()}`
                  : 'Waiting for location update...'}
              </p>
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {delivery.pickupLocation && (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pickup</p>
                      <p className="mt-1 font-medium text-gray-900">{delivery.pickupLocation.address || 'Store location'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {Number.isFinite(delivery.pickupLocation.lat) && Number.isFinite(delivery.pickupLocation.lng)
                          ? `${delivery.pickupLocation.lat.toFixed(5)}, ${delivery.pickupLocation.lng.toFixed(5)}`
                          : 'Waiting for coordinates'}
                      </p>
                    </div>
                  )}
                  {delivery.deliveryLocation && (
                    <div className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Delivery</p>
                      <p className="mt-1 font-medium text-gray-900">{delivery.deliveryLocation.address || 'Customer address'}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {Number.isFinite(delivery.deliveryLocation.lat) && Number.isFinite(delivery.deliveryLocation.lng)
                          ? `${delivery.deliveryLocation.lat.toFixed(5)}, ${delivery.deliveryLocation.lng.toFixed(5)}`
                          : 'Waiting for coordinates'}
                      </p>
                    </div>
                  )}
                </div>
                {delivery.currentLocation && Number.isFinite(delivery.currentLocation.lat) && Number.isFinite(delivery.currentLocation.lng) && (
                  <div className="mt-3 rounded-xl border border-pink-200 bg-pink-50 p-3 text-sm text-pink-800">
                    <p className="text-xs font-semibold uppercase tracking-wide">Current Location</p>
                    <p className="mt-1 font-medium">
                      {delivery.currentLocation.lat.toFixed(5)}, {delivery.currentLocation.lng.toFixed(5)}
                    </p>
                    <p className="mt-1 text-xs text-pink-600">
                      Last updated: {new Date(delivery.currentLocation.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                {routePoints.length > 0 && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Route Points</p>
                    <p className="mt-1">{routePoints.length} updates recorded</p>
                    <p className="text-xs text-gray-500">Latest: {new Date(routePoints[routePoints.length - 1].timestamp).toLocaleTimeString()}</p>
                  </div>
                )}

                <div className="mt-4">
                  <DeliveryMap
                    pickup={delivery.pickupLocation}
                    delivery={delivery.deliveryLocation}
                    currentLocation={delivery.currentLocation}
                    routePoints={routePoints}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
                    >
                      <FaMapMarkerAlt /> View on Map
                    </a>
                  )}
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <FaLocationArrow /> Directions
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Delivery Status</h2>
              <DeliveryTimeline status={delivery.status} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Estimated Delivery</h2>
              <div className="mt-3 flex items-center gap-2 text-gray-600">
                <FaClock />
                <p className="text-2xl font-bold text-pink-600">{getEstimatedTime()}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {delivery.estimatedDeliveryTime
                  ? new Date(delivery.estimatedDeliveryTime).toLocaleString()
                  : 'Calculating...'}
              </p>
            </div>

            {delivery.deliveryPersonName && (
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Delivery Person</h2>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-2xl font-bold text-pink-700">
                    {delivery.deliveryPersonName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{delivery.deliveryPersonName}</p>
                    <p className="text-sm text-gray-600">{delivery.deliveryPersonVehicle}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {delivery.deliveryPersonPhone && (
                    <a
                      href={`tel:${delivery.deliveryPersonPhone}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <FaPhone /> Call
                    </a>
                  )}
                  {delivery.deliveryPersonPhone && (
                    <a
                      href={`https://wa.me/${delivery.deliveryPersonPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
                    >
                      <FaWhatsapp /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p><span className="font-semibold">Total:</span> Rs. {order.totalAmount}</p>
                <p><span className="font-semibold">Payment:</span> {order.paymentMethod?.toUpperCase()}</p>
                <p><span className="font-semibold">Address:</span> {order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
