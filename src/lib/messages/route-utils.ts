/**
 * Determines whether the given pathname represents an individual message view
 * (e.g. /inbox/:id, /sent/:id, /folders/:folderId/:id, etc.).
 */
export function isMessageDetailRoute(pathname: string | null | undefined): boolean {
	if (!pathname) return false;
	// Custom folders: /folders/:folderId/:messageId
	if (/^\/folders\/[^/]+\/[^/]+$/.test(pathname)) return true;
	// Standard folders: /inbox/:messageId, /sent/:messageId, etc.
	if (/^\/(inbox|starred|snoozed|sent|drafts|archived|spam|trash)\/[^/]+$/.test(pathname)) return true;
	return false;
}
