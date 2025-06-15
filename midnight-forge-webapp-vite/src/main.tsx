import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WalletProvider } from './contexts/WalletContext.tsx'
import pino from 'pino';

const logger = pino({
  level: import.meta.env.VITE_LOGGING_LEVEL || 'info',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletProvider logger={logger}>
      <App />
    </WalletProvider>
  </StrictMode>,
)
