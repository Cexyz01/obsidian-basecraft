import type BasecraftPlugin from "../main";

export interface LicenseStatus {
	active: boolean;
	key: string | null;
	lastValidated: number | null;
}

export const DEFAULT_LICENSE: LicenseStatus = {
	active: false,
	key: null,
	lastValidated: null,
};

export function isPro(plugin: BasecraftPlugin): boolean {
	return plugin.settings.license.active;
}
