/*
 * 두근두근! 우정 타로! — 오프라인 대비
 * 한 번 열어 두면 부스 와이파이가 끊겨도 저장해 둔 화면으로 돌아가요.
 * 파일을 고쳐 올릴 때는 CACHE 이름 끝 숫자를 올려 주세요.
 */
const CACHE = 'friendship-tarot-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/cards.js',
  './js/art.js',
  './js/sound.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function save(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

// 인터넷이 되면 새 파일, 3초 안에 답이 없거나 끊기면 저장해 둔 파일
function networkFirst(req) {
  return new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(req, { ignoreSearch: true })
      .then((r) => r || caches.match('./index.html'))
      .then((r) => { if (!done && r) { done = true; resolve(r); } });
    const timer = setTimeout(fallback, 3000);
    fetch(req)
      .then((res) => { clearTimeout(timer); save(req, res); if (!done) { done = true; resolve(res); } })
      .catch(() => { clearTimeout(timer); fallback().then(() => { if (!done) { done = true; resolve(Response.error()); } }); });
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => save(req, res))));
  }
});
