import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                registration.waiting &&
                (registration.waiting.state === 'installed' ||
                 registration.waiting.state === 'activated')
              ) {
                if (window.confirm('New version available! Reload to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });

        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_UPDATED') {
            window.location.reload();
          }
        });
      })
      .catch((err) => console.error('SW registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
