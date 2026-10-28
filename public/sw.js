/**
 * Service Worker — First 1,000 Days (PWA Offline Real)
 * 
 * Estratégia:
 * 1. Shell e Assets Estáticos: Cache-First com Stale-While-Revalidate e fallback offline.
 * 2. Navegação HTML: Network-First com fallback para o shell index.html em cache.
 * 3. EXCLUSÃO ESTRITA DE PRIVACIDADE:
 *    - Requisições para /api/*, gateway local (porta 8787) ou POST/PUT NUNCA são cacheadas.
 *    - Perguntas pessoais, registros de saúde ou tokens não passam por cache HTTP.
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `first-1000-days-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  // Ativação imediata para atualização fluida
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpeza atômica de versões antigas do cache
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. EXCLUSÃO ESTRITA: Dados de API / Gateway / Métodos não-GET NUNCA são cacheados
  const isApiRequest = url.pathname.startsWith('/api') || url.port === '8787';
  const isMutation = request.method !== 'GET';

  if (isApiRequest || isMutation) {
    event.respondWith(
      fetch(request).catch(() => {
        // Se a rede falhar, retorna erro HTTP sem armazenar nada em cache
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'offline',
            message: 'O dispositivo está sem conexão à internet para acessar o assistente online.'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. Navegação de páginas HTML (SPA): Network-First com fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 3. Assets estáticos (JS, CSS, Imagens, Fontes): Cache-First com Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Dispara revalidação em segundo plano se houver conexão
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // Continua usando o cachedResponse em caso de falha de rede
          });
        return cachedResponse;
      }

      // Se não estiver em cache, busca na rede e guarda no cache
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => {
          // Se for imagem ou recurso visual opcional, silencia erro
          return new Response('', { status: 408, statusText: 'Request Timeout' });
        });
    })
  );
});
