import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { InterruptionProvider } from './context/InterruptionContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <InterruptionProvider>
        <App />
      </InterruptionProvider>
    </ErrorBoundary>
  </StrictMode>,
);
