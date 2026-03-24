const CACHE_NAME = 'trading-simu-v1';

// 需要预先缓存的核心文件
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    // 缓存 ECharts CDN 资源，支持完全离线使用
    'https://cdn.bootcdn.net/ajax/libs/echarts/5.5.0/echarts.min.js' 
];

// 1. 安装阶段：将指定的文件存入缓存
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // 强制立即接管控制权
    self.skipWaiting(); 
});

// 2. 激活阶段：清理旧版本的缓存（方便以后代码更新）
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. 拦截网络请求：优先从缓存读取（Cache First 策略）
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果缓存里有，直接返回缓存的数据
                if (response) {
                    return response;
                }
                // 如果没有，正常发起网络请求
                return fetch(event.request);
            })
    );
});
