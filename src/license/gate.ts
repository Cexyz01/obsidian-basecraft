import type BasecraftPlugin from "../main";
import { validateKey } from "./client";

export const BUY_URL = "https://hewnpath.com";

// Re-check against Polar every 3 days; if the server is unreachable, keep Pro
// unlocked for up to 30 days since the last successful validation.
const REVALIDATE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const OFFLINE_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

export interface LicenseStatus {
	active: boolean;
	key: string | null;
	activationId: string | null;
	lastValidated: number | null;
}

export const DEFAULT_LICENSE: LicenseStatus = {
	active: false,
	key: null,
	activationId: null,
	lastValidated: null,
};

export function isPro(plugin: BasecraftPlugin): boolean {
	return plugin.settings.license.active;
}

export async function revalidateIfStale(plugin: BasecraftPlugin): Promise<void> {
	const license = plugin.settings.license;
	if (!license.key || !license.active) return;
	if (license.lastValidated && Date.now() - license.lastValidated < REVALIDATE_AFTER_MS) return;

	const result = await validateKey(license.key, license.activationId);

	if (result.offline) {
		const expired =
			!license.lastValidated || Date.now() - license.lastValidated > OFFLINE_GRACE_MS;
		if (!expired) return;
	}

	license.active = result.valid;
	if (result.valid) license.lastValidated = Date.now();
	await plugin.saveSettings();
	plugin.refreshActiveViews();
}
