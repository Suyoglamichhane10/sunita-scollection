import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import deliveryApi from '../../Services/deliveryApi';
import { FaEye, FaTimes, FaTruck, FaUser, FaChartBar, FaCheckCircle, FaTrash } from 'react-icons/fa';
import DeliveryMap from '../../components/common/Map';
import DeliveryTimeline from '../../components/common/DeliveryTimeline';

const AdminDelivery = () => {
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, byStatus: [] });
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalReady, setModalReady] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [deliveriesRes, statsRes] = await Promise.all([
        deliveryApi.getActiveDeliveries(),
        deliveryApi.getDeliveryStats(),
      ]);
      if (deliveriesRes.success) {
        let filtered = deliveriesRes.deliveries;
        if (filterStatus !== 'all') {
          filtered = filtered.filter((d) => d.status === filterStatus);
        }
        setActiveDeliveries(filtered);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load delivery data');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (selectedDelivery) {
      setModalReady(false);
      const timer = setTimeout(() => setModalReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setModalReady(false);
    }
  }, [selectedDelivery]);

  const getOrderId = (orderId) => {
    if (!orderId) return null;
    if (typeof orderId === 'object' && orderId._id) return String(orderId._id);
    return String(orderId);
  };

  const handleAssign = async (orderId) => {
    const personId = prompt('Enter delivery person user ID:');
    if (!personId) return;
    const id = getOrderId(orderId);
    if (!id) return;
    try {
      const { data } = await deliveryApi.assignDeliveryPerson(id, personId);
      if (data.success) {
        toast.success('Delivery person assigned');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign delivery person');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    if (updating) return;
    const id = getOrderId(orderId);
    if (!id) return;
    setUpdating(true);
    try {
      await deliveryApi.updateDeliveryStatus(id, status, `Status updated to ${status}`);
      toast.success('Status updated');
      fetchData();
      const currentId = getOrderId(selectedDelivery?.orderId);
      if (currentId === id) {
        setSelectedDelivery((prev) => ({ ...prev, status }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = async (delivery) => {
    const id = getOrderId(delivery.orderId);
    if (!id) return;
    try {
      const { data } = await deliveryApi.trackDelivery(id);
      if (data.success) {
        setSelectedDelivery({ delivery: data.delivery, order: data.order });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load details');
    }
  };

  const handleDelete = async (delivery) => {
    const orderNumber = delivery.orderId?.orderNumber || delivery.orderId;
    if (!window.confirm(`Delete delivery for order ${orderNumber}? This cannot be undone.`)) return;
    const id = getOrderId(delivery.orderId);
    console.log('Delete delivery - raw delivery:', delivery);
    console.log('Delete delivery - extracted id:', id);
    if (!id) {
      toast.error('Unable to determine order ID for deletion');
      return;
    }
    try {
      const { data } = await deliveryApi.deleteDelivery(id);
      console.log('Delete delivery - response:', data);
      if (data.success) {
        toast.success('Delivery deleted');
        setActiveDeliveries((current) => current.filter((d) => getOrderId(d.orderId) !== id));
        if (selectedDelivery && getOrderId(selectedDelivery.orderId) === id) {
          setSelectedDelivery(null);
        }
      }
    } catch (error) {
      console.error('Delete delivery failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete delivery');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom px-4 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">Loading delivery data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom px-4 lg:px-8">
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"><FaTruck /></div>
              <div>
                <p className="text-sm text-gray-600">Active Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><FaCheckCircle /></div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600"><FaChartBar /></div>
              <div>
                <p className="text-sm text-gray-600">Total Statuses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byStatus.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'list' ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-700'}`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === 'map' ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-700'}`}
            >
              Map View
            </button>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-pink-600"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
          </select>
        </section>

        {viewMode === 'map' && (
          <section className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Active Deliveries Map</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeDeliveries.map((delivery) => (
                <div key={delivery._id} className="rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Order {delivery.orderId?.orderNumber}</p>
                    <span className="rounded-full px-2 py-1 text-[10px] font-semibold capitalize bg-pink-100 text-pink-700">{delivery.status}</span>
                  </div>
                  {delivery.currentLocation && (
                    <div className="mt-2 h-48">
                      <DeliveryMap
                        pickup={delivery.pickupLocation}
                        delivery={delivery.deliveryLocation}
                        currentLocation={delivery.currentLocation}
                        routePoints={delivery.route || []}
                      />
                    </div>
                  )}
                  <button
                    onClick={() => handleViewDetails(delivery)}
                    className="mt-2 w-full rounded-full bg-pink-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-pink-700"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {viewMode === 'list' && (
          <section className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-3 py-3">Order #</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Delivery Person</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeDeliveries.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No active deliveries found.</td></tr>
                ) : (
                  activeDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="border-b border-gray-100">
                      <td className="px-3 py-3 font-medium text-gray-900">{delivery.orderId?.orderNumber}</td>
                      <td className="px-3 py-3 text-gray-600">{delivery.orderId?.user?.name || 'Guest'}</td>
                      <td className="px-3 py-3 text-gray-600">
                        {delivery.deliveryPersonName ? (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {delivery.deliveryPersonName}
                          </div>
                        ) : (
                          'Unassigned'
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold capitalize text-pink-700">{delivery.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(delivery)}
                            className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            <FaEye /> Details
                          </button>
                          {!delivery.deliveryPersonId && (
                            <button
                              onClick={() => handleAssign(delivery.orderId)}
                              className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              <FaTruck /> Assign
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(delivery)}
                            className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedDelivery(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
              <button type="button" onClick={() => setSelectedDelivery(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <FaTimes />
              </button>
            </div>

             <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">Order</p>
                <p className="mt-2 font-semibold text-gray-900">Order {selectedDelivery.order.orderNumber}</p>
                <p className="text-sm text-gray-600">Total: Rs. {selectedDelivery.order.totalAmount}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">Delivery Status</p>
                <DeliveryTimeline status={selectedDelivery.delivery.status} />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-500">Live Map</p>
              <div className="mt-3">
                 {modalReady ? (
                   <DeliveryMap
                     pickup={selectedDelivery.delivery.pickupLocation}
                     delivery={selectedDelivery.delivery.deliveryLocation}
                     currentLocation={selectedDelivery.delivery.currentLocation}
                     routePoints={selectedDelivery.delivery.route || []}
                   />
                 ) : (
                   <div className="flex h-[300px] sm:h-[400px] items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                     Loading map...
                   </div>
                 )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-500">Update Status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                 {['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusUpdate(getOrderId(selectedDelivery.delivery.orderId), s)}
                    disabled={updating || selectedDelivery.delivery.status === s}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selectedDelivery.delivery.status === s ? 'bg-pink-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Danger Zone</p>
              <p className="mt-1 text-xs text-red-600">This will permanently remove the delivery record for this order.</p>
              <button
                type="button"
                onClick={() => handleDelete({ orderId: selectedDelivery.delivery.orderId })}
                className="mt-3 flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <FaTrash /> Delete Delivery
              </button>
            </div>

            {selectedDelivery.delivery.deliveryPersonName && (
              <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-500">Delivery Person</p>
                <p className="mt-2 font-semibold text-gray-900">{selectedDelivery.delivery.deliveryPersonName}</p>
                <p className="text-sm text-gray-600">{selectedDelivery.delivery.deliveryPersonPhone}</p>
                <p className="text-sm text-gray-600">{selectedDelivery.delivery.deliveryPersonVehicle}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDelivery;
