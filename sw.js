// Offline support. Keeps a copy of the pages and the libraries they load, so the input app
// opens and works with no internet. Game data itself is saved by the page (localStorage) and
// uploaded when the connection comes back.
//
// Site files: network first (so updates show up when online), cached copy when offline.
// Library files (pinned CDN versions): cached copy first.
const CACHE = 'vtlt-v3';
const SITE = ['./', 'index.html', 'live.html', 'game.html', 'display.html', 'combinations.html',
    'config.js', 'lineup-core.js', 'play-log.js', 'ui.jsx', 'firebase.js'];
const LIBS = [
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone@7.26.4/babel.min.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
];
const LIB_HOSTS = ['cdn.tailwindcss.com', 'unpkg.com', 'www.gstatic.com', 'a.espncdn.com']; // espncdn = team logos

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // One failed download shouldn't stop the rest from being cached.
        await Promise.all([...SITE, ...LIBS].map(url => cache.add(url).catch(() => {})));
        self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
        await self.clients.claim();
    })());
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    if (LIB_HOSTS.includes(url.hostname)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE);
            const hit = await cache.match(req, { ignoreVary: true });
            if (hit) return hit;
            const res = await fetch(req);
            if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
            return res;
        })());
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE);
            try {
                const res = await withTimeout(fetch(req), 4000);
                if (res.ok) cache.put(req, res.clone());
                return res;
            } catch {
                const hit = await cache.match(req, { ignoreSearch: true });
                if (hit) return hit;
                if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
                return Response.error();
            }
        })());
    }
    // Everything else (the Firebase database connection) goes straight to the network.
});
