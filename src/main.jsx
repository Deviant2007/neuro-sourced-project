import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill window.storage for standalone use (uses localStorage)
if (!window.storage) {
  window.storage = {
    async get(key) {
      try {
        const val = localStorage.getItem('ns_' + key);
        return val ? { key: key, value: val } : null;
      } catch { return null; }
    },
    async set(key, value) {
      try {
        localStorage.setItem('ns_' + key, value);
        return { key: key, value: value };
      } catch { return null; }
    },
    async delete(key) {
      try {
        localStorage.removeItem('ns_' + key);
        return { key: key, deleted: true };
      } catch { return null; }
    },
    async list(prefix) {
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith('ns_' + (prefix || ''))) {
            keys.push(k.replace('ns_', ''));
          }
        }
        return { keys: keys };
      } catch { return { keys: [] }; }
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
