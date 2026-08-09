import { io } from 'socket.io-client';

// The socket must connect to the BACKEND (which serves socket.io), not the
// Vite dev server. Prefer an explicit VITE_SOCKET_URL; otherwise derive the
// backend origin from VITE_API_URL, falling back to the local API server.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

export const createSocket = () => io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});
