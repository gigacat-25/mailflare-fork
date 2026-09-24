"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActiveSettingsPath, settingsNavSections } from "./settings-nav-utils";

export function SettingsNav() {
	const pathname = usePathname();

	return (
		<>
			{/* Mobile Settings Navigation Tabs */}
			<div className="flex md:hidden w-full overflow-x-auto gap-2 pb-2.5 pt-1 px-1 scrollbar-none mobile-scroll border-b border-neutral-200/80 shrink-0">
				{settingsNavSections
					.flatMap((section) => section.items)
					.map((item) => {
						const active = isActiveSettingsPath(pathname, item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0",
									active
										? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
										: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 active:bg-neutral-200",
								)}
							>
								{item.label}
							</Link>
						);
					})}
			</div>

			{/* Desktop Settings Sidebar */}
			<aside className="hidden md:block min-h-full border-l border-neutral-200/80 px-4 py-8 w-60 shrink-0">
				<div className="sticky top-6 space-y-7">
					{settingsNavSections.map((section) => (
						<div key={section.label} className="space-y-3">
							<h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
								{section.label}
							</h2>
							<nav className="space-y-1">
								{section.items.map((item) => {
									const active = isActiveSettingsPath(pathname, item.href);
									return (
										<Link
											key={item.href}
											href={item.href}
											className={cn(
												"block rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
												active
													? "bg-blue-100 font-semibold text-blue-900"
													: "text-neutral-600 hover:bg-white/70 hover:text-neutral-900",
											)}
										>
											{item.label}
										</Link>
									);
								})}
							</nav>
						</div>
					))}
				</div>
			</aside>
		</>
	);
}
