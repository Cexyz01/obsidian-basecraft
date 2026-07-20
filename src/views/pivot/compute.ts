import type { BasesEntry, BasesPropertyId } from "obsidian";
import type { DateBucket, PivotAggregation, PivotConfig } from "./options";

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

const EMPTY = "(empty)";

// Date-only strings must not shift a day depending on the vault's timezone,
// so parse them as local dates instead of letting Date treat them as UTC.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;

function parseDate(s: string): Date | null {
	const m = s.match(DATE_ONLY);
	if (m) {
		const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Bucket labels are zero-padded so the pivot's lexicographic sort is also
 * chronological: "2026", "2026-Q3", "2026-07".
 */
export function bucketLabel(raw: string, bucket: DateBucket): string {
	if (bucket === "none") return raw;
	const d = parseDate(raw);
	if (!d) return raw;
	const year = d.getFullYear().toString();
	if (bucket === "year") return year;
	if (bucket === "quarter") return `${year}-Q${Math.floor(d.getMonth() / 3) + 1}`;
	return `${year}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

function label(entry: BasesEntry, prop: BasesPropertyId | null, bucket: DateBucket = "none"): string {
	if (!prop) return "";
	const v = entry.getValue(prop);
	if (v == null) return EMPTY;
	const s = v.toString();
	if (s.length === 0) return EMPTY;
	return bucketLabel(s, bucket);
}

function num(entry: BasesEntry, prop: BasesPropertyId | null): number | null {
	if (!prop) return null;
	const v = entry.getValue(prop);
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
		const seen = new Set<string>();
		for (const e of entries) seen.add(label(e, valueProp));
		return seen.size;
	}

	const xs: number[] = [];
	for (const e of entries) {
		const n = num(e, valueProp);
		if (n != null) xs.push(n);
	}
	if (xs.length === 0) return 0;

	switch (agg) {
		case "sum":
			return xs.reduce((a, b) => a + b, 0);
		case "avg":
			return xs.reduce((a, b) => a + b, 0) / xs.length;
		case "min":
			return Math.min(...xs);
		case "max":
			return Math.max(...xs);
		case "median": {
			xs.sort((a, b) => a - b);
			const mid = Math.floor(xs.length / 2);
			return xs.length % 2 ? xs[mid]! : (xs[mid - 1]! + xs[mid]!) / 2;
		}
		default:
			return 0;
	}
}

export function computePivot(entries: BasesEntry[], config: PivotConfig): PivotResult {
	const { rowDim, colDim, aggregation, valueProp } = config;
	const rowBucket = config.rowBucket ?? "none";
	const colBucket = config.colBucket ?? "none";

	const rowSet = new Set<string>();
	const colSet = new Set<string>();
	const groups = new Map<string, BasesEntry[]>();

	for (const entry of entries) {
		const r = label(entry, rowDim, rowBucket);
		const c = label(entry, colDim, colBucket);
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
