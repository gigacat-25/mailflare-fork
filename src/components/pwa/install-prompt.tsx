"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

function useIsMounted() {
	return useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);
}

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [isStandalone] = useState(() => {
		if (typeof window === "undefined") return false;
		return (
			window.matchMedia("(display-mode: standalone)").matches ||
			// @ts-expect-error - iOS Safari specific property
			window.navigator.standalone === true
		);
	});
	const [isIos] = useState(() => {
		if (typeof window === "undefined") return false;
		return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
	});
	const [canInstall, setCanInstall] = useState(() => {
		if (typeof window === "undefined") return false;
		const isRunningStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			// @ts-expect-error - iOS Safari specific property
			window.navigator.standalone === true;
		const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
		return isIosDevice && !isRunningStandalone;
	});

	useEffect(() => {
		if (typeof window === "undefined" || isStandalone) return;

		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setCanInstall(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		};
	}, [isStandalone]);

	async function install() {
		if (deferredPrompt) {
			await deferredPrompt.prompt();
			const choiceResult = await deferredPrompt.userChoice;
			if (choiceResult.outcome === "accepted") {
				setDeferredPrompt(null);
				setCanInstall(false);
			}
		}
	}

	return { isStandalone, isIos, canInstall, install, hasPromptEvent: !!deferredPrompt };
}

export function PwaInstallBanner() {
	const mounted = useIsMounted();
	const { isStandalone, isIos, canInstall, install, hasPromptEvent } = usePwaInstall();
	const [dismissed, setDismissed] = useState(() => {
		if (typeof window === "undefined") return true;
		return localStorage.getItem("mailflare-pwa-dismissed") === "true";
	});
	const [showIosInstructions, setShowIosInstructions] = useState(false);

	function handleDismiss() {
		setDismissed(true);
		localStorage.setItem("mailflare-pwa-dismissed", "true");
	}

	if (!mounted || isStandalone || dismissed || !canInstall) return null;

	return (
		<aside aria-label="Install App" className="fixed bottom-16 md:bottom-6 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
			<div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/icon-96.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain shadow-xs" />
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-neutral-900">Install Mailflare</p>
					<p className="text-xs text-neutral-500 truncate">Add to home screen for faster email access</p>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					{hasPromptEvent ? (
						<Button size="sm" onClick={install} className="h-8 gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700">
							<Download className="h-3.5 w-3.5" />
							Install
						</Button>
					) : isIos ? (
						<Button size="sm" onClick={() => setShowIosInstructions(true)} className="h-8 gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700">
							<Share className="h-3.5 w-3.5" />
							Install
						</Button>
					) : null}
					<button
						type="button"
						onClick={handleDismiss}
						className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
						aria-label="Dismiss banner"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>

			{showIosInstructions && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
						<div className="flex items-center justify-between pb-3">
							<h3 className="text-base font-semibold text-neutral-900">Install on iPhone / iPad</h3>
							<button
								type="button"
								onClick={() => setShowIosInstructions(false)}
								className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-3.5 text-sm text-neutral-600">
							<div className="flex items-start gap-3">
								<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
								<p>
									Tap the <span className="inline-flex items-center gap-1 font-semibold text-neutral-800"><Share className="inline h-4 w-4" /> Share</span> button at the bottom of Safari.
								</p>
							</div>
							<div className="flex items-start gap-3">
								<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
								<p>
									Scroll down and tap <span className="inline-flex items-center gap-1 font-semibold text-neutral-800"><PlusSquare className="inline h-4 w-4" /> Add to Home Screen</span>.
								</p>
							</div>
							<div className="flex items-start gap-3">
								<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
								<p>Tap <span className="font-semibold text-neutral-800">Add</span> in the top right corner. Mailflare will now open as a native app!</p>
							</div>
						</div>
						<Button onClick={() => setShowIosInstructions(false)} className="mt-5 w-full rounded-2xl bg-neutral-900 py-2.5 text-white hover:bg-neutral-800">
							Got it
						</Button>
					</div>
				</div>
			)}
		</aside>
	);
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
	const mounted = useIsMounted();
	const { isStandalone, isIos, canInstall, install, hasPromptEvent } = usePwaInstall();
	const [showIosModal, setShowIosModal] = useState(false);

	if (!mounted || isStandalone || !canInstall) return null;

	return (
		<>
			<button
				type="button"
				onClick={() => {
					if (hasPromptEvent) void install();
					else if (isIos) setShowIosModal(true);
				}}
				className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors ${className}`}
			>
				<Download className="h-4 w-4 text-blue-600" />
				<span>Install App</span>
			</button>

			{showIosModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
					<div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
						<div className="flex items-center justify-between pb-3">
							<h3 className="text-base font-semibold text-neutral-900">Install on iOS</h3>
							<button
								type="button"
								onClick={() => setShowIosModal(false)}
								className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<p className="text-xs text-neutral-500 mb-3">Install Mailflare to your home screen for full standalone experience:</p>
						<ol className="space-y-3 text-xs text-neutral-700">
							<li className="flex items-center gap-2">
								<span className="font-bold text-blue-600">1.</span> Tap Safari&apos;s Share button <Share className="inline h-3.5 w-3.5" />
							</li>
							<li className="flex items-center gap-2">
								<span className="font-bold text-blue-600">2.</span> Choose &quot;Add to Home Screen&quot; <PlusSquare className="inline h-3.5 w-3.5" />
							</li>
							<li className="flex items-center gap-2">
								<span className="font-bold text-blue-600">3.</span> Tap &quot;Add&quot;
							</li>
						</ol>
						<Button onClick={() => setShowIosModal(false)} className="mt-4 w-full rounded-xl">
							Close
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
