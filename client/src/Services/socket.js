import { io } from 'socket.io-client';

// The socket must connect to the BACKEND (which serves socket.io), not the
// Vite dev server. Prefer an explicit VITE_SOCKET_URL; otherwise derive the
// backend origin from VITE_API_URL, falling back to the local API server.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

// Singleton socket instance. Multiple contexts/components (ChatContext,
// AdminMessages, etc.) share ONE socket connection.
let socket = null;

// Reference count for consumers using the socket.
let refCount = 0;

export const createSocket = () => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });
  }
  refCount += 1;
  return socket;
};

// Release a reference held by a consumer (e.g. on component unmount).
//
// IMPORTANT: this does NOT disconnect the socket. React StrictMode runs
// effect mount -> cleanup -> mount synchronously during development, so if we
// disconnected as soon as refCount hit 0 we would see a constant
// connect/disconnect/connect churn in the server logs. The socket is only
// truly torn down when the user logs out (see disconnectSocket).
export const releaseSocket = () => {
  if (refCount > 0) refCount -= 1;
};

// Forcefully tear down the shared socket connection. Call this on logout so a
// new (clean) connection is created for the next logged-in user.
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    try {
      socket.disconnect();
    } catch (e) {
      // ignore
    }
    socket = null;
  }
  refCount = 0;
};
