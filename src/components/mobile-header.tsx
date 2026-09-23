"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/components/sidebar-state";
import { MailSearchInput } from "@/components/mail-search/mail-search-input";
import { MailboxSelector } from "@/components/mailbox-selector";

export function MobileHeader({ showSearch = true }: { showSearch?: boolean }) {
	const { toggleMobile } = useSidebar();

	return (
		<header className="flex h-14 w-full shrink-0 items-center gap-2 border-b border-neutral-200/80 bg-[#f6f8fc] px-3 pt-safe md:hidden">
			<button
				type="button"
				onClick={toggleMobile}
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200/80 transition-colors"
				aria-label="Open navigation menu"
			>
				<Menu className="h-5 w-5" />
			</button>

			<div className="flex min-w-0 flex-1 items-center">
				{showSearch ? (
					<MailSearchInput />
				) : (
					<span className="font-semibold text-neutral-900 text-base">Mailflare</span>
				)}
			</div>

			<div className="shrink-0 flex items-center">
				<MailboxSelector />
			</div>
		</header>
	);
}
