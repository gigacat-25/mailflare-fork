"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useSidebar } from "@/components/sidebar-state";
import { useBranding } from "@/components/branding-provider";

export function MobileNavDrawer({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const { mobileOpen, setMobileOpen } = useSidebar();
	const branding = useBranding();

	useEffect(() => {
		setMobileOpen(false);
	}, [pathname, setMobileOpen]);

	useEffect(() => {
		if (mobileOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileOpen]);

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape" && mobileOpen) {
				setMobileOpen(false);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [mobileOpen, setMobileOpen]);

	if (!mobileOpen) return null;

	return (
		<div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
				onClick={() => setMobileOpen(false)}
				aria-hidden="true"
			/>

			{/* Slide-over panel */}
			<div className="fixed inset-y-0 left-0 flex w-[290px] max-w-[85vw] flex-col bg-[#f6f8fc] shadow-2xl animate-in slide-in-from-left duration-250 ease-out">
				{/* Drawer Header */}
				<div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/60 px-4">
					<div className="flex items-center gap-2.5">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={branding.iconUrl} alt="" className="h-7 w-7 object-contain" />
						<span className="text-base font-semibold text-neutral-800">{branding.appName}</span>
					</div>
					<button
						type="button"
						onClick={() => setMobileOpen(false)}
						className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-800 transition-colors"
						aria-label="Close menu"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Scrollable Nav Content */}
				<div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 mobile-scroll">
					{children}
				</div>
			</div>
		</div>
	);
}
