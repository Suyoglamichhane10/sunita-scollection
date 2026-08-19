import React from 'react';
import { FaCheckCircle, FaMotorcycle, FaBox, FaTruck, FaMapMarkerAlt, FaHome } from 'react-icons/fa';

const STEPS = [
  { key: 'pending', label: 'Order Placed', icon: FaBox },
  { key: 'confirmed', label: 'Confirmed', icon: FaCheckCircle },
  { key: 'picked_up', label: 'Picked Up', icon: FaMotorcycle },
  { key: 'in_transit', label: 'In Transit', icon: FaTruck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FaMapMarkerAlt },
  { key: 'delivered', label: 'Delivered', icon: FaHome },
];

const DeliveryTimeline = ({ status }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const displayIndex = currentIndex === -1 ? 0 : currentIndex;

  if (status === 'cancelled') {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        This delivery was cancelled.
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="flex items-center">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <div
                className={`h-1 flex-1 rounded ${
                  index <= displayIndex ? 'bg-pink-600' : 'bg-gray-200'
                }`}
              />
            )}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  index <= displayIndex ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < displayIndex ? <FaCheckCircle /> : <step.icon />}
              </div>
              <span
                className={`mt-2 hidden text-[10px] font-medium uppercase tracking-wide sm:block ${
                  index <= displayIndex ? 'text-pink-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-3 flex justify-between sm:hidden">
        <span className="text-[10px] font-semibold uppercase text-pink-700">{status}</span>
      </div>
    </div>
  );
};

export default DeliveryTimeline;
