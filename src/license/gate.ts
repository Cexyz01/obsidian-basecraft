/**
 * License gate.
 *
 * V0.1 placeholder: returns false (Pro features locked) unless a debug flag is set.
 * Real Lemon Squeezy License API integration will land in a follow-up commit
 * once the LS store KYC is approved and a Pro product is created.
 */

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
	return plugin.settings.license.active === true;
}

/** Pro-only feature names — used in UI to label gated controls. */
export const PRO_FEATURES = {
	multiDimRows: "Multi-dimensional rows",
	multiDimCols: "Multi-dimensional columns",
	advancedAggregations: "Avg / min / max / median / distinct",
	conditionalFormatting: "Heatmap conditional formatting",
	percentageOfTotal: "Percentage of total / row / column",
	drillDown: "Drill-down (cell click → filtered notes)",
	exportCsvPng: "Export pivot to CSV / PNG",
	savedPresets: "Saved presets per base",
} as const;
