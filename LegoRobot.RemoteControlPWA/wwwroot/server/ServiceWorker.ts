export { }
declare const self: ServiceWorkerGlobalScope


self.addEventListener('install', (e: ExtendableEvent) => {
    console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e: FetchEvent) => {
    console.log(`[Service Worker] Fetched resource ${e.request.url}`);
    e.respondWith(fetch(e.request));
});
