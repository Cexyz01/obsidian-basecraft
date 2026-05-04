import type { PivotConfig } from "../views/pivot/options";
import type { PivotResult } from "../views/pivot/compute";

function escape(field: string): string {
	if (/[",\n\r]/.test(field)) {
		return `"${field.replace(/"/g, '""')}"`;
	}
	return field;
}

function fmt(n: number): string {
	return Number.isInteger(n) ? n.toString() : n.toFixed(4);
}

const BOM = "﻿";

export function pivotToCsv(
	result: PivotResult,
	config: PivotConfig,
	rowLabel: string,
	colLabel: string
): string {
	const lines: string[] = ["sep=,"];

	const header = [escape(`${rowLabel} \\ ${colLabel}`)];
	for (const c of result.cols) header.push(escape(c));
	if (config.showTotals) header.push("Total");
	lines.push(header.join(","));

	for (const r of result.rows) {
		const cells = [escape(r)];
		const rowMap = result.cells.get(r);
		for (const c of result.cols) {
			const cell = rowMap?.get(c);
			cells.push(fmt(cell?.value ?? 0));
		}
		if (config.showTotals) cells.push(fmt(result.rowTotals.get(r) ?? 0));
		lines.push(cells.join(","));
	}

	if (config.showTotals) {
		const totals = ["Total"];
		for (const c of result.cols) totals.push(fmt(result.colTotals.get(c) ?? 0));
		totals.push(fmt(result.grandTotal));
		lines.push(totals.join(","));
	}

	return BOM + lines.join("\r\n");
}

export function downloadFile(filename: string, contents: string, mime: string): void {
	const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
