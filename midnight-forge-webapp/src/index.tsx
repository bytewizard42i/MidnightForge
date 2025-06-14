/**
 * Midnight Forge WebApp - A React application for managing Midnight Forge contracts
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import pino from 'pino';
import { WalletProvider } from './contexts/WalletContext';

console.log('🔧 Environment NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 Starting Midnight Forge WebApp...');

// Create logger
const logger = pino({
  level: process.env.REACT_APP_LOGGING_LEVEL || 'info',
});

// Log the logger
logger.info('🔧 Logger initialized');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <WalletProvider logger={logger}>
      <App />
    </WalletProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
