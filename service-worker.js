const cachePrefix = 'floodintel-app-';
const cacheName = cachePrefix + version;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) =>
    cache.addAll(files.map((url) => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(cacheName);
      return await cache.match('/index.html') ?? Response.error();
    }));
  } else if (!url.search && files.includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      return await cache.match(request) ?? fetch(request);
    })());
  }
});
