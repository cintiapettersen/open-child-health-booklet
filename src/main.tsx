import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro do Service Worker para suporte PWA e funcionamento offline
if (
  'serviceWorker' in navigator &&
  (window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Notificação de ciclo de vida para atualização de cache
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nova versão do aplicativo disponível no cache.');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('Falha ao registrar Service Worker:', err);
      });
  });
}
