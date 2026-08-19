import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import deliveryApi from '../../Services/deliveryApi';
import { useAuth } from '../../Context/Authcontext';
import { useChat } from '../../Context/ChatContext';
import { FaMapMarkerAlt, FaLocationArrow, FaBox, FaTimes } from 'react-icons/fa';
import DeliveryMap from '../../components/common/Map';
import DeliveryTimeline from '../../components/common/DeliveryTimeline';

const DeliveryApp = () => {
  const { user, isAuthenticated } = useAuth();
  const { socketRef } = useChat();
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);

  const fetchMyDeliveries = useCallback(async () => {
    try {
      const { data } = await deliveryApi.getActiveDeliveries();
      if (data.success) {
        const mine = data.deliveries.filter((d) => d.deliveryPersonId?._id === user?._id);
        setDeliveries(mine);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isDeliveryPerson) {
      return;
    }
    fetchMyDeliveries();
    const interval = setInterval(fetchMyDeliveries, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.isDeliveryPerson, fetchMyDeliveries]);

  useEffect(() => {
    if (!socketRef?.current || !user?._id) return;
    const socket = socketRef.current;
    socket.emit('presence:online', { userId: user._id });

    const onStatus = (data) => {
      setSelectedDelivery((prev) => {
        if (!prev || prev.orderId !== data.orderId) return prev;
        return { ...prev, status: data.status, notes: data.note };
      });
      fetchMyDeliveries();
    };
    const onLocation = (data) => {
      setSelectedDelivery((prev) => {
        if (!prev || prev.orderId !== data.orderId) return prev;
        return {
          ...prev,
          currentLocation: { lat: data.lat, lng: data.lng, updatedAt: data.timestamp },
          route: [...(prev.route || []), { lat: data.lat, lng: data.lng, timestamp: data.timestamp }],
        };
      });
    };

    socket.on('delivery:status', onStatus);
    socket.on('delivery:location', onLocation);

    return () => {
      socket.off('delivery:status', onStatus);
      socket.off('delivery:location', onLocation);
    };
  }, [socketRef, user?._id, fetchMyDeliveries]);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (selectedDelivery) {
          try {
            await deliveryApi.updateLocation(selectedDelivery.orderId, latitude, longitude);
          } catch (error) {
            console.error('Location update failed:', error);
          }
        }
      },
      (error) => {
        console.error('Location error:', error);
        toast.error('Unable to get location. Please enable GPS.');
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 10000 }
    );
    return watchId;
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedDelivery) return;
    try {
      await deliveryApi.updateDeliveryStatus(selectedDelivery.orderId, newStatus, `Status updated to ${newStatus}`);
      toast.success('Status updated');
      setSelectedDelivery((prev) => ({ ...prev, status: newStatus }));
      fetchMyDeliveries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getRoutePoints = (delivery) => {
    return delivery?.route && delivery.route.length > 0 ? delivery.route : [];
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Please log in</h2>
            <p className="mt-3 text-gray-600">You need to be logged in as a delivery person.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user?.isDeliveryPerson) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-3 text-gray-600">You are not registered as a delivery person.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading deliveries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery App</h1>
        <p className="mt-1 text-gray-600">Manage your assigned deliveries</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {selectedDelivery ? (
              <>
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Order {selectedDelivery.orderId}</h2>
                    <button
                      onClick={() => { setSelectedDelivery(null); setTracking(false); }}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="mt-4">
                    <DeliveryTimeline status={selectedDelivery.status} />
                  </div>
                  <div className="mt-4">
                    <DeliveryMap
                      pickup={selectedDelivery.pickupLocation}
                      delivery={selectedDelivery.deliveryLocation}
                      currentLocation={selectedDelivery.currentLocation}
                      routePoints={getRoutePoints(selectedDelivery)}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!tracking ? (
                      <button
                        onClick={startTracking}
                        className="flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-700"
                      >
                        <FaMapMarkerAlt /> Start Tracking
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                        <FaMapMarkerAlt /> Tracking Active
                      </span>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDelivery.deliveryLocation?.lat},${selectedDelivery.deliveryLocation?.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <FaLocationArrow /> Navigate
                    </a>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900">Update Status</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={selectedDelivery.status === s}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          selectedDelivery.status === s ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <FaBox className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-900">Select a delivery</h2>
                <p className="mt-2 text-gray-600">Choose an order from the list to start tracking.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">My Deliveries</h2>
              {deliveries.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">No active deliveries assigned to you.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {deliveries.map((delivery) => (
                    <div
                      key={delivery._id}
                      onClick={() => setSelectedDelivery(delivery)}
                      className={`cursor-pointer rounded-2xl border p-4 transition ${
                        selectedDelivery?.orderId === delivery.orderId ? 'border-pink-600 bg-pink-50' : 'border-gray-100 hover:border-pink-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">Order {delivery.orderId}</p>
                        <span className="rounded-full bg-pink-100 px-2 py-1 text-[10px] font-semibold capitalize text-pink-700">{delivery.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{delivery.deliveryLocation?.address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryApp;
