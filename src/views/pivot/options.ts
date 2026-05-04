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
	rowDim: BasesPropertyId | null;
	colDim: BasesPropertyId | null;
	aggregation: PivotAggregation;
	valueProp: BasesPropertyId | null;
	showTotals: boolean;
	showPercentage: "none" | "total" | "row" | "col";
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

const FREE_AGGS: ReadonlySet<PivotAggregation> = new Set(["count", "sum"]);

export function isProAggregation(agg: PivotAggregation): boolean {
	return !FREE_AGGS.has(agg);
}

export function loadPivotConfig(config: BasesViewConfig): PivotConfig {
	const raw = (config.get("basecraft.pivot") as Partial<PivotConfig>) ?? {};
	return { ...DEFAULT_PIVOT_CONFIG, ...raw };
}
