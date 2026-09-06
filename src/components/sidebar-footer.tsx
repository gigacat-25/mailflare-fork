import packageJson from "../../package.json";
import { useBranding } from "./branding-provider";
import { useSidebar } from "./sidebar-state";

export function SidebarFooter() {
	const { minimal } = useSidebar();
	const branding = useBranding();
	if (minimal) return null;
  return (
    <p className="px-3 pt-3 text-xs text-neutral-400">
      {branding.appName} v{packageJson.version}
    </p>
  );
}
