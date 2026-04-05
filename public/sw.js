const CACHE_NAME = "autofocus-v3";

self.addEventListener("install", (event) => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
				),
			),
	);
	self.clients.claim();
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== "GET") return;

	// Skip Supabase API calls
	if (url.hostname.includes("supabase")) return;

	// Skip webpack HMR
	if (url.pathname.includes("webpack") || url.pathname.includes("hot-update"))
		return;

	event.respondWith(
		fetch(request)
			.then((response) => {
				// Cache successful responses
				if (response && response.status === 200) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			})
			.catch(() => {
				// Network failed - try cache
				return caches.match(request).then((cached) => {
					if (cached) return cached;
					// Return offline page for navigation requests
					if (request.mode === "navigate") {
						return new Response(
							"<!DOCTYPE html><html><body><h1>Offline</h1><p>Please connect to the internet</p></body></html>",
							{ headers: { "Content-Type": "text/html" } },
						);
					}
					return new Response("Offline", { status: 503 });
				});
			}),
	);
});
