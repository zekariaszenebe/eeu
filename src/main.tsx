import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { InterruptionProvider } from './context/InterruptionContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InterruptionProvider>
      <App />
    </InterruptionProvider>
  </StrictMode>,
);
