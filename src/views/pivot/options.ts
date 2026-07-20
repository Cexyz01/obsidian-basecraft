import type { BasesPropertyId, BasesViewConfig } from "obsidian";

export type PivotAggregation =
	| "count"
	| "sum"
	| "avg"
	| "min"
	| "max"
	| "median"
	| "distinct";

export type PercentMode = "none" | "total" | "row" | "col";

export type DateBucket = "none" | "year" | "quarter" | "month";

export interface PivotConfig {
	rowDim: BasesPropertyId | null;
	colDim: BasesPropertyId | null;
	rowBucket: DateBucket;
	colBucket: DateBucket;
	aggregation: PivotAggregation;
	valueProp: BasesPropertyId | null;
	showTotals: boolean;
	percentMode: PercentMode;
	heatmap: boolean;
}

export const DEFAULT_PIVOT_CONFIG: PivotConfig = {
	rowDim: null,
	colDim: null,
	rowBucket: "none",
	colBucket: "none",
	aggregation: "count",
	valueProp: null,
	showTotals: true,
	percentMode: "none",
	heatmap: false,
};

const FREE_AGGS: ReadonlySet<PivotAggregation> = new Set(["count", "sum"]);

export function isProAggregation(agg: PivotAggregation): boolean {
	return !FREE_AGGS.has(agg);
}

export function loadPivotConfig(config: BasesViewConfig): PivotConfig {
	const raw = (config.get("basecraft.pivot") as Partial<PivotConfig>) ?? {};
	return { ...DEFAULT_PIVOT_CONFIG, ...raw };
}
