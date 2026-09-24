import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col md:flex-row gap-4 md:gap-8 min-h-[calc(100dvh-4rem)] bg-inherit">
			<div className="order-1 md:order-2 shrink-0">
				<SettingsNav />
			</div>
			<div className="min-w-0 flex-1 order-2 md:order-1 pt-1 md:pt-4">
				<div className="mx-auto w-full max-w-3xl">{children}</div>
			</div>
		</div>
	);
}
