import React from 'react';

const SizeGuide = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sizes = [
    { label: 'XS', bust: '32"', waist: '24"', hip: '34"' },
    { label: 'S', bust: '34"', waist: '26"', hip: '36"' },
    { label: 'M', bust: '36"', waist: '28"', hip: '38"' },
    { label: 'L', bust: '38"', waist: '30"', hip: '40"' },
    { label: 'XL', bust: '40"', waist: '32"', hip: '42"' },
    { label: 'XXL', bust: '42"', waist: '34"', hip: '44"' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] max-w-lg w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Size Guide</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">All measurements are in inches. Please check your measurements before ordering.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 text-left font-semibold text-gray-700">Size</th>
                <th className="pb-2 text-left font-semibold text-gray-700">Bust</th>
                <th className="pb-2 text-left font-semibold text-gray-700">Waist</th>
                <th className="pb-2 text-left font-semibold text-gray-700">Hip</th>
              </tr>
            </thead>
            <tbody>
              {sizes.map((size) => (
                <tr key={size.label} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-2 font-medium text-gray-900">{size.label}</td>
                  <td className="py-2 text-gray-600">{size.bust}</td>
                  <td className="py-2 text-gray-600">{size.waist}</td>
                  <td className="py-2 text-gray-600">{size.hip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 rounded-2xl bg-pink-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Need help?</span> Between sizes? We recommend sizing up for a comfortable fit. Free exchanges within 7 days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
