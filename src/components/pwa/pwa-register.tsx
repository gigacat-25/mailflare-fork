"use client";

import { useEffect } from "react";

export function PwaRegister() {
	useEffect(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator) {
			window.addEventListener("load", () => {
				navigator.serviceWorker
					.register("/sw.js")
					.then((reg) => {
						// Check for updates
						reg.onupdatefound = () => {
							const installingWorker = reg.installing;
							if (installingWorker) {
								installingWorker.onstatechange = () => {
									if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
										// New content is available
									}
								};
							}
						};
					})
					.catch((err) => {
						console.debug("PWA service worker registration failed:", err);
					});
			});
		}
	}, []);

	return null;
}
