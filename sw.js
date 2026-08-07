const CACHE_NAME = 'trading-simu-v3';
const CORE = [
  './','./index.html','./styles.css','./manifest.json','./icons/icon-192.png','./icons/icon-512.png',
  './js/app.mjs','./js/charts.mjs','./js/engine.mjs','./js/random.mjs','./js/kelly-sync.mjs','./js/simulation.worker.mjs'
];
const ECHARTS = 'https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js';

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    await cache.addAll(CORE);
    try{await cache.add(ECHARTS)}catch(error){console.warn('ECharts CDN 未能预缓存',error)}
  }));
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
