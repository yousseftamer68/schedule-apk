// sw.js
const CACHE_NAME = "mazakrati-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap",
  "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"
];

// تثبيت الـ SW وتخزين الملفات الأساسية
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// تفعيل الـ SW وتنظيف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية: استخدم الكاش أولاً، ثم الشبكة (Cache First)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // تجاهل طلبات Firebase و Google و APIs الخارجية
  if (
    url.origin.includes("googleapis") ||
    url.origin.includes("firebase") ||
    url.origin.includes("gstatic") ||
    url.pathname.startsWith("/__/") // مسارات Firebase SDK
  ) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            // ذاكّر الملفات الجديدة في الخلفية
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // عرض صفحة أونلاين لو حصل مشكلة (اختياري)
            return new Response("❌ غير متصل بالإنترنت", { status: 503 });
          })
      );
    })
  );
});