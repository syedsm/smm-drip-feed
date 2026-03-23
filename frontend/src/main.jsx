// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0e1628',
            color: '#e2e8f0',
            border: '1px solid rgba(99,179,237,0.2)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#0e1628' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0e1628' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
