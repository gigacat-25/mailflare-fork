const CACHE_NAME = "mailflare-pwa-v1";
const STATIC_ASSETS = [
	"/icon-192.png",
	"/icon-512.png",
	"/icon-maskable-512.png",
	"/apple-touch-icon.png",
	"/icon.svg",
	"/favicon.ico",
	"/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		}).then(() => self.skipWaiting())
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.map((key) => {
					if (key !== CACHE_NAME) {
						return caches.delete(key);
					}
				})
			);
		}).then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Never intercept non-GET requests or WebSocket upgrades
	if (event.request.method !== "GET") return;
	if (url.pathname.startsWith("/api/realtime")) return;

	// For APIs, JMAP, auth, and dynamic endpoints, always fetch from network directly
	if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/jmap/") || url.pathname.startsWith("/.well-known/")) {
		return;
	}

	// For static assets (icons, images, fonts)
	if (
		url.pathname.endsWith(".png") ||
		url.pathname.endsWith(".svg") ||
		url.pathname.endsWith(".ico") ||
		url.pathname.endsWith(".woff2") ||
		url.pathname.startsWith("/_next/static/")
	) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) {
					// Return cached and refresh in background
					fetch(event.request).then((res) => {
						if (res && res.status === 200) {
							caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res));
						}
					}).catch(() => {});
					return cached;
				}
				return fetch(event.request).then((networkRes) => {
					if (networkRes && networkRes.status === 200) {
						const clone = networkRes.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
					}
					return networkRes;
				});
			})
		);
		return;
	}

	// For navigation (page loads), use network first
	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request).catch(async () => {
				const cached = await caches.match(event.request);
				if (cached) return cached;
				return new Response(
					"<!DOCTYPE html><html><head><title>Offline</title><meta name='viewport' content='width=device-width, initial-scale=1.0'></head><body style='font-family:system-ui,sans-serif;padding:2rem;text-align:center;'><h2>You are offline</h2><p>Please check your internet connection to access Mailflare.</p></body></html>",
					{ headers: { "Content-Type": "text/html" } }
				);
			})
		);
	}
});
