"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Star, Send, Settings, PenSquare } from "lucide-react";
import { useCompose } from "@/components/compose/compose-context";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { getFolderNavCount } from "@/components/dashboard-nav-utils";

export function MobileBottomBar() {
	const pathname = usePathname();
	const { openNewComposer } = useCompose();
	const { selectedMailbox, isLoading } = useSelectedMailbox();
	const { counts } = useMessageCounts(selectedMailbox?.id, !isLoading);
	const inboxUnread = getFolderNavCount("inbox", counts.folders);

	const tabs = [
		{
			href: "/inbox",
			label: "Inbox",
			icon: Inbox,
			active: pathname === "/inbox" || pathname.startsWith("/inbox/"),
			badge: inboxUnread,
		},
		{
			href: "/starred",
			label: "Starred",
			icon: Star,
			active: pathname === "/starred" || pathname.startsWith("/starred/"),
		},
		{
			href: "/sent",
			label: "Sent",
			icon: Send,
			active: pathname === "/sent" || pathname.startsWith("/sent/"),
		},
		{
			href: "/settings/account",
			label: "Settings",
			icon: Settings,
			active: pathname.startsWith("/settings"),
		},
	];

	return (
		<>
			{/* Floating Compose Button (FAB) on mobile */}
			<aside aria-label="Compose actions" className="fixed bottom-20 right-4 z-40 md:hidden">
				<button
					type="button"
					onClick={() => openNewComposer()}
					className="flex h-14 items-center gap-2.5 rounded-2xl bg-blue-600 px-5 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-700"
					aria-label="Compose new email"
				>
					<PenSquare className="h-5 w-5" />
					<span className="font-semibold text-sm">Compose</span>
				</button>
			</aside>

			{/* Docked Bottom Navigation Bar */}
			<nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-neutral-200/80 bg-white/95 pb-safe backdrop-blur-md md:hidden">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					return (
						<Link
							key={tab.href}
							href={tab.href}
							className={`relative flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
								tab.active ? "text-blue-600" : "text-neutral-500 hover:text-neutral-800"
							}`}
						>
							<div className="relative">
								<Icon className={`h-5 w-5 ${tab.active ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
								{tab.badge && tab.badge > 0 ? (
									<span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-2xs">
										{tab.badge > 99 ? "99+" : tab.badge}
									</span>
								) : null}
							</div>
							<span>{tab.label}</span>
						</Link>
					);
				})}
			</nav>
		</>
	);
}
