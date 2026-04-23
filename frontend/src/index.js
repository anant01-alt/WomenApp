import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SOSProvider } from './context/SOSContext';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SOSProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1a1a2e', color: '#fff', border: '1px solid #e91e8c33' },
            error: { style: { background: '#2d0a1e', border: '1px solid #e91e8c' } },
            success: { style: { background: '#0a2d1e', border: '1px solid #22c55e' } },
          }}
        />
      </SOSProvider>
    </AuthProvider>
  </React.StrictMode>
);
