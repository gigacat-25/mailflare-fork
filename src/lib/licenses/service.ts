import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { licenseSettings } from "@/db/schema";
import type { LicenseEntitlements, LicensePlan, LicenseStatus } from "./types";

const LICENSE_SETTINGS_ID = "default";

async function getOrCreateLicenseSettings(env: CloudflareEnv) {
	const db = getDb(env);
	await db
		.insert(licenseSettings)
		.values({ id: LICENSE_SETTINGS_ID, instanceId: crypto.randomUUID() })
		.onConflictDoNothing({ target: licenseSettings.id });
	const [settings] = await db
		.select()
		.from(licenseSettings)
		.where(eq(licenseSettings.id, LICENSE_SETTINGS_ID))
		.limit(1);
	if (!settings) throw new Error("Unable to initialize license settings");
	return settings;
}

export async function getLicenseStatus(env: CloudflareEnv): Promise<LicenseStatus> {
	let settings: typeof licenseSettings.$inferSelect | undefined;
	try {
		settings = await getOrCreateLicenseSettings(env);
	} catch {
		// database might be initializing
	}
	return {
		plan: "team",
		state: "active",
		features: ["branding", "accounts", "forwarding", "sharing"],
		instanceId: settings?.instanceId ?? "self-hosted",
		instanceUrl: settings?.instanceUrl ?? null,
		active: true,
		activatedAt: settings?.activatedAt ?? new Date(0),
		validatedAt: new Date(),
	};
}

export async function getLicenseEntitlements(_env: CloudflareEnv): Promise<LicenseEntitlements> {
	return {
		plan: "team",
		canCustomizeBranding: true,
		canManageAccounts: true,
		canForwardEmail: true,
	};
}

export async function activateLicense(
	env: CloudflareEnv,
	_licenseKey: string,
	instanceUrl: string,
	_plan: Exclude<LicensePlan, "community">,
): Promise<LicenseStatus> {
	const db = getDb(env);
	await db
		.update(licenseSettings)
		.set({
			plan: "team",
			state: "active",
			instanceUrl,
			validatedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(licenseSettings.id, LICENSE_SETTINGS_ID));
	return getLicenseStatus(env);
}

export async function validateLicense(env: CloudflareEnv, _licenseKey: string, _instanceUrl: string): Promise<LicenseStatus> {
	return getLicenseStatus(env);
}

export async function deactivateLicense(env: CloudflareEnv): Promise<LicenseStatus> {
	return getLicenseStatus(env);
}
