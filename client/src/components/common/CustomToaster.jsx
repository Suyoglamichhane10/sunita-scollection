import React from 'react';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { FaTimes } from 'react-icons/fa';

const toastStyle = {
  error: { background: '#b91c1c', color: '#fff' },
  success: { background: '#16a34a', color: '#fff' },
  default: { background: '#363636', color: '#fff' },
};

const CustomToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: toastStyle.default,
    }}
  >
    {(t) => (
      <ToastBar toast={t} style={toastStyle[t.type] || toastStyle.default}>
        {({ icon, message }) => (
          <>
            {icon}
            <div className="flex-1 px-2 py-1 text-sm">{message}</div>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="ml-2 rounded-md text-white/80 hover:bg-white/20 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/40 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Dismiss"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </>
        )}
      </ToastBar>
    )}
  </Toaster>
);

export default CustomToaster;
