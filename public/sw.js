const CACHE_NAME = "af4-static-v1";

// No pre-caching on install — just activate immediately
self.addEventListener("install", (event) => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => key !== CACHE_NAME)
						.map((key) => caches.delete(key)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (url.hostname.includes("supabase")) return;
	if (url.pathname.startsWith("/_next/webpack-hmr")) return;
	if (url.pathname.startsWith("/__nextjs")) return;

	event.respondWith(
		caches.match(request).then((cached) => {
			if (cached) return cached;

			return fetch(request)
				.then((response) => {
					if (
						!response ||
						response.status !== 200 ||
						request.method !== "GET"
					) {
						return response;
					}

					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, responseToCache);
					});

					return response;
				})
				.catch(() => {
					if (request.mode === "navigate") {
						return caches.match("/");
					}
				});
		}),
	);
});
