const CACHE_NAME = 'trading-simu-v6';
const CORE = [
  './','./index.html','./styles.css','./manifest.json','./icons/icon-192.png','./icons/icon-512.png',
  './vendor/echarts.min.js',
  './js/app.mjs','./js/charts.mjs','./js/engine.mjs','./js/random.mjs','./js/kelly-sync.mjs','./js/simulation.worker.mjs'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok&&new URL(event.request.url).origin===self.location.origin){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy))}
    return response;
  })));
});
