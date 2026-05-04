/**
 * Pivot aggregation engine.
 *
 * Pure functions over BasesEntry[] — no DOM, no Obsidian rendering coupling.
 * This is the part with the highest test value; keep it framework-free.
 */

import type { BasesEntry, BasesPropertyId } from "obsidian";
import type { PivotAggregation, PivotConfig } from "./options";

export interface PivotCell {
	value: number;
	count: number;
	entries: BasesEntry[];
}

export interface PivotResult {
	rows: string[];
	cols: string[];
	cells: Map<string, Map<string, PivotCell>>;
	rowTotals: Map<string, number>;
	colTotals: Map<string, number>;
	grandTotal: number;
}

const EMPTY_LABEL = "(empty)";

function entryToLabel(
	entry: BasesEntry,
	propId: BasesPropertyId | null
): string {
	if (!propId) return "";
	const v = entry.getValue(propId);
	if (v == null) return EMPTY_LABEL;
	const s = v.toString();
	return s.length === 0 ? EMPTY_LABEL : s;
}

function entryToNumber(
	entry: BasesEntry,
	propId: BasesPropertyId | null
): number | null {
	if (!propId) return null;
	const v = entry.getValue(propId);
	if (v == null) return null;
	const n = parseFloat(v.toString());
	return Number.isFinite(n) ? n : null;
}

function aggregate(
	entries: BasesEntry[],
	agg: PivotAggregation,
	valueProp: BasesPropertyId | null
): number {
	if (entries.length === 0) return 0;

	if (agg === "count") return entries.length;

	if (agg === "distinct") {
		if (!valueProp) return 0;
		const set = new Set<string>();
		for (const e of entries) set.add(entryToLabel(e, valueProp));
		return set.size;
	}

	const nums: number[] = [];
	for (const e of entries) {
		const n = entryToNumber(e, valueProp);
		if (n != null) nums.push(n);
	}
	if (nums.length === 0) return 0;

	switch (agg) {
		case "sum":
			return nums.reduce((a, b) => a + b, 0);
		case "avg":
			return nums.reduce((a, b) => a + b, 0) / nums.length;
		case "min":
			return Math.min(...nums);
		case "max":
			return Math.max(...nums);
		case "median": {
			const sorted = [...nums].sort((a, b) => a - b);
			const mid = Math.floor(sorted.length / 2);
			if (sorted.length % 2 === 0) {
				return (sorted[mid - 1]! + sorted[mid]!) / 2;
			}
			return sorted[mid]!;
		}
		default:
			return 0;
	}
}

export function computePivot(
	entries: BasesEntry[],
	config: PivotConfig
): PivotResult {
	const { rowDim, colDim, aggregation, valueProp } = config;

	const rowSet = new Set<string>();
	const colSet = new Set<string>();
	const groups = new Map<string, BasesEntry[]>(); // key = `${row}|||${col}`

	for (const entry of entries) {
		const r = entryToLabel(entry, rowDim);
		const c = entryToLabel(entry, colDim);
		rowSet.add(r);
		colSet.add(c);
		const key = `${r}|||${c}`;
		const bucket = groups.get(key);
		if (bucket) bucket.push(entry);
		else groups.set(key, [entry]);
	}

	const rows = [...rowSet].sort();
	const cols = [...colSet].sort();

	const cells = new Map<string, Map<string, PivotCell>>();
	const rowTotals = new Map<string, number>();
	const colTotals = new Map<string, number>();
	let grandTotal = 0;

	for (const r of rows) {
		const rowMap = new Map<string, PivotCell>();
		let rowSum = 0;
		for (const c of cols) {
			const bucket = groups.get(`${r}|||${c}`) ?? [];
			const value = aggregate(bucket, aggregation, valueProp);
			rowMap.set(c, { value, count: bucket.length, entries: bucket });
			rowSum += value;
			colTotals.set(c, (colTotals.get(c) ?? 0) + value);
		}
		cells.set(r, rowMap);
		rowTotals.set(r, rowSum);
		grandTotal += rowSum;
	}

	return { rows, cols, cells, rowTotals, colTotals, grandTotal };
}
