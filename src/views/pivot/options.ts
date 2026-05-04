/**
 * PivotView configuration schema and defaults.
 * Stored in the .base view config so each Bases view can have its own pivot setup.
 */

import type { BasesPropertyId, BasesViewConfig } from "obsidian";

export type PivotAggregation =
	| "count"
	| "sum"
	| "avg"
	| "min"
	| "max"
	| "median"
	| "distinct";

export interface PivotConfig {
	/** Property whose unique values become row headers. null = no rows (single row). */
	rowDim: BasesPropertyId | null;
	/** Property whose unique values become column headers. null = no cols (single col). */
	colDim: BasesPropertyId | null;
	/** Aggregation function applied to each cell's matching entries. */
	aggregation: PivotAggregation;
	/** Property to aggregate. Required for sum/avg/min/max/median. Ignored for count/distinct. */
	valueProp: BasesPropertyId | null;
	/** Show row/col/grand totals. */
	showTotals: boolean;
	/** Pro: percentage display mode. */
	showPercentage: "none" | "total" | "row" | "col";
	/** Pro: heatmap conditional formatting on cells. */
	conditionalFormatting: boolean;
}

export const DEFAULT_PIVOT_CONFIG: PivotConfig = {
	rowDim: null,
	colDim: null,
	aggregation: "count",
	valueProp: null,
	showTotals: true,
	showPercentage: "none",
	conditionalFormatting: false,
};

/** Aggregations available in the free tier. */
export const FREE_AGGREGATIONS: ReadonlySet<PivotAggregation> = new Set([
	"count",
	"sum",
]);

export function isProAggregation(agg: PivotAggregation): boolean {
	return !FREE_AGGREGATIONS.has(agg);
}

export function loadPivotConfig(config: BasesViewConfig): PivotConfig {
	const raw = (config.get("basecraft.pivot") as Partial<PivotConfig>) ?? {};
	return { ...DEFAULT_PIVOT_CONFIG, ...raw };
}
