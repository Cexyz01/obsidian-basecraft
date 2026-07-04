import ExcelJS from "exceljs";
import type { PivotConfig, PercentMode } from "../views/pivot/options";
import type { PivotResult } from "../views/pivot/compute";

const ACCENT_HEX = "FF6E4FE6";
const ACCENT_LIGHT_HEX = "FFEDE7FB";
const TOTAL_HEX = "FFF1EFF8";
const HEAT_BASE = { r: 0x6e, g: 0x4f, b: 0xe6 };

function heatColor(t: number): string {
	const clamped = Math.max(0, Math.min(1, t));
	const start = { r: 255, g: 255, b: 255 };
	const r = Math.round(start.r + (HEAT_BASE.r - start.r) * clamped * 0.85);
	const g = Math.round(start.g + (HEAT_BASE.g - start.g) * clamped * 0.85);
	const b = Math.round(start.b + (HEAT_BASE.b - start.b) * clamped * 0.85);
	const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
	return `FF${hex(r)}${hex(g)}${hex(b)}`;
}

function neutralize(label: string): string {
	if (label.length === 0) return label;
	const first = label[0];
	if (first === "=" || first === "+" || first === "-" || first === "@" || first === "\t") {
		return `'${label}`;
	}
	return label;
}

function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

function findRange(result: PivotResult): { min: number; max: number } {
	let min = Infinity;
	let max = -Infinity;
	for (const rowMap of result.cells.values()) {
		for (const cell of rowMap.values()) {
			if (cell.value < min) min = cell.value;
			if (cell.value > max) max = cell.value;
		}
	}
	if (min === Infinity) return { min: 0, max: 0 };
	return { min, max };
}

function denomFor(
	mode: PercentMode,
	rowTotal: number,
	colTotal: number,
	grandTotal: number
): number {
	if (mode === "total") return grandTotal;
	if (mode === "row") return rowTotal;
	if (mode === "col") return colTotal;
	return 1;
}

export async function pivotToXlsx(
	result: PivotResult,
	config: PivotConfig,
	rowLabel: string,
	colLabel: string
): Promise<ArrayBuffer> {
	const wb = new ExcelJS.Workbook();
	wb.creator = "Basecraft by Hewnpath";
	wb.created = new Date();
	const sheet = wb.addWorksheet("Pivot", {
		properties: { defaultRowHeight: 18 },
		views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
	});

	const headerRow = [
		neutralize(`${rowLabel} \\ ${colLabel}`),
		...result.cols.map(neutralize),
	];
	if (config.showTotals) headerRow.push("Total");
	sheet.addRow(headerRow);

	const useRange = config.heatmap ? findRange(result) : null;
	const span = useRange ? Math.max(useRange.max - useRange.min, 1) : 1;
	const isPercent = config.percentMode !== "none";

	for (const r of result.rows) {
		const rowMap = result.cells.get(r);
		const rowValues: (string | number)[] = [neutralize(r)];
		const rowTotal = result.rowTotals.get(r) ?? 0;
		for (const c of result.cols) {
			const cell = rowMap?.get(c);
			const value = cell?.value ?? 0;
			if (isPercent) {
				const denom = denomFor(
					config.percentMode,
					rowTotal,
					result.colTotals.get(c) ?? 0,
					result.grandTotal
				);
				rowValues.push(denom === 0 ? 0 : value / denom);
			} else {
				rowValues.push(round2(value));
			}
		}
		if (config.showTotals) rowValues.push(round2(rowTotal));
		sheet.addRow(rowValues);
	}

	if (config.showTotals) {
		const totalsRow: (string | number)[] = ["Total"];
		for (const c of result.cols) totalsRow.push(round2(result.colTotals.get(c) ?? 0));
		totalsRow.push(round2(result.grandTotal));
		sheet.addRow(totalsRow);
	}

	const totalCols = headerRow.length;
	const totalRowsRendered = sheet.rowCount;

	const headerStyle = {
		font: { bold: true, color: { argb: "FFFFFFFF" } },
		fill: {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: ACCENT_HEX },
		} as ExcelJS.FillPattern,
		alignment: { horizontal: "center" as const, vertical: "middle" as const },
	};

	for (let col = 1; col <= totalCols; col++) {
		const cell = sheet.getRow(1).getCell(col);
		cell.font = headerStyle.font;
		cell.fill = headerStyle.fill;
		cell.alignment = headerStyle.alignment;
	}

	for (let r = 2; r <= totalRowsRendered; r++) {
		const isTotalRow = config.showTotals && r === totalRowsRendered;
		const rowHeader = sheet.getRow(r).getCell(1);
		rowHeader.font = { bold: true };
		rowHeader.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: isTotalRow ? TOTAL_HEX : ACCENT_LIGHT_HEX },
		};
		rowHeader.alignment = { horizontal: "left" };

		for (let c = 2; c <= totalCols; c++) {
			const cell = sheet.getRow(r).getCell(c);
			const isTotalCol = config.showTotals && c === totalCols;

			if (isPercent && !isTotalRow && !isTotalCol) {
				cell.numFmt = "0.0%";
			}

			cell.alignment = { horizontal: "right" };

			if ((isTotalRow || isTotalCol) && !(isTotalRow && c === 1)) {
				cell.font = { bold: true };
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: TOTAL_HEX },
				};
			} else if (config.heatmap && useRange && !isTotalRow && !isTotalCol) {
				const cellResult = result.cells.get(result.rows[r - 2] ?? "");
				const v = cellResult?.get(result.cols[c - 2] ?? "")?.value ?? 0;
				const t = (v - useRange.min) / span;
				cell.fill = {
					type: "pattern",
					pattern: "solid",
					fgColor: { argb: heatColor(t) },
				};
			}
		}
	}

	const lengths = headerRow.map((h) => String(h).length);
	for (let r = 2; r <= totalRowsRendered; r++) {
		for (let c = 1; c <= totalCols; c++) {
			const v = sheet.getRow(r).getCell(c).value;
			const len = typeof v === "string" || typeof v === "number" ? String(v).length : 0;
			if (len > (lengths[c - 1] ?? 0)) lengths[c - 1] = len;
		}
	}
	sheet.columns = lengths.map((len) => ({ width: Math.min(Math.max(len + 2, 10), 28) }));

	return wb.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export function downloadBuffer(filename: string, buffer: ArrayBuffer, mime: string): void {
	const blob = new Blob([buffer], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
