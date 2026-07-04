// Minimal XLSX writer. An .xlsx file is a zip of XML parts; we emit exactly
// the parts Excel needs (inline strings, one sheet, a small style table)
// through fflate instead of pulling in exceljs and its dependency tree.
import { strToU8, zipSync } from "fflate";
import type { PivotConfig, PercentMode } from "../views/pivot/options";
import type { PivotResult } from "../views/pivot/compute";

const ACCENT = "FF6E4FE6";
const ACCENT_LIGHT = "FFEDE7FB";
const TOTAL = "FFF1EFF8";
const HEAT_BASE = { r: 0x6e, g: 0x4f, b: 0xe6 };

function heatColor(t: number): string {
	const clamped = Math.max(0, Math.min(1, t));
	const start = { r: 255, g: 255, b: 255 };
	const hex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
	const r = Math.round(start.r + (HEAT_BASE.r - start.r) * clamped * 0.85);
	const g = Math.round(start.g + (HEAT_BASE.g - start.g) * clamped * 0.85);
	const b = Math.round(start.b + (HEAT_BASE.b - start.b) * clamped * 0.85);
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

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function colRef(n: number): string {
	let ref = "";
	while (n > 0) {
		const rem = (n - 1) % 26;
		ref = String.fromCharCode(65 + rem) + ref;
		n = Math.floor((n - 1) / 26);
	}
	return ref;
}

// ──────────── style registry ────────────

interface StyleSpec {
	bold?: boolean;
	white?: boolean;
	fill?: string; // ARGB
	align?: "left" | "right" | "center";
	pct?: boolean;
}

class Styles {
	private fonts = ["<font><sz val=\"11\"/><name val=\"Calibri\"/></font>"];
	private fontKeys = new Map<string, number>([["", 0]]);
	private fills = [
		"<fill><patternFill patternType=\"none\"/></fill>",
		"<fill><patternFill patternType=\"gray125\"/></fill>",
	];
	private fillKeys = new Map<string, number>();
	private xfs = ["<xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/>"];
	private xfKeys = new Map<string, number>([["", 0]]);

	id(spec: StyleSpec): number {
		const key = [spec.bold ? "b" : "", spec.white ? "w" : "", spec.fill ?? "", spec.align ?? "", spec.pct ? "p" : ""].join("|");
		const hit = this.xfKeys.get(key);
		if (hit !== undefined) return hit;

		const fontKey = `${spec.bold ? "b" : ""}${spec.white ? "w" : ""}`;
		let fontId = this.fontKeys.get(fontKey);
		if (fontId === undefined) {
			fontId = this.fonts.length;
			this.fonts.push(
				`<font>${spec.bold ? "<b/>" : ""}${spec.white ? "<color rgb=\"FFFFFFFF\"/>" : ""}<sz val="11"/><name val="Calibri"/></font>`
			);
			this.fontKeys.set(fontKey, fontId);
		}

		let fillId = 0;
		if (spec.fill) {
			const cached = this.fillKeys.get(spec.fill);
			if (cached !== undefined) {
				fillId = cached;
			} else {
				fillId = this.fills.length;
				this.fills.push(
					`<fill><patternFill patternType="solid"><fgColor rgb="${spec.fill}"/><bgColor indexed="64"/></patternFill></fill>`
				);
				this.fillKeys.set(spec.fill, fillId);
			}
		}

		const numFmtId = spec.pct ? 164 : 0;
		const align = spec.align ? `<alignment horizontal="${spec.align}"${spec.align === "center" ? " vertical=\"center\"" : ""}/>` : "";
		const id = this.xfs.length;
		this.xfs.push(
			`<xf numFmtId="${numFmtId}" fontId="${fontId}" fillId="${fillId}" borderId="0"` +
			`${spec.pct ? " applyNumberFormat=\"1\"" : ""}${fontId ? " applyFont=\"1\"" : ""}${fillId ? " applyFill=\"1\"" : ""}${align ? " applyAlignment=\"1\"" : ""}>` +
			`${align}</xf>`
		);
		this.xfKeys.set(key, id);
		return id;
	}

	xml(): string {
		return (
			"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
			"<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
			"<numFmts count=\"1\"><numFmt numFmtId=\"164\" formatCode=\"0.0%\"/></numFmts>" +
			`<fonts count="${this.fonts.length}">${this.fonts.join("")}</fonts>` +
			`<fills count="${this.fills.length}">${this.fills.join("")}</fills>` +
			"<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>" +
			"<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
			`<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>` +
			"<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
			"</styleSheet>"
		);
	}
}

type Cell = { v: string | number; s: number };

function cellXml(cell: Cell, row: number, col: number): string {
	const ref = `${colRef(col)}${row}`;
	if (typeof cell.v === "number") {
		return `<c r="${ref}" s="${cell.s}"><v>${cell.v}</v></c>`;
	}
	return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell.v)}</t></is></c>`;
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
	const styles = new Styles();
	const grid: Cell[][] = [];

	const isPercent = config.percentMode !== "none";
	const useRange = config.heatmap ? findRange(result) : null;
	const span = useRange ? Math.max(useRange.max - useRange.min, 1) : 1;

	const headerStyle = styles.id({ bold: true, white: true, fill: ACCENT, align: "center" });
	const rowHeadStyle = styles.id({ bold: true, fill: ACCENT_LIGHT, align: "left" });
	const totalHeadStyle = styles.id({ bold: true, fill: TOTAL, align: "left" });
	const dataStyle = styles.id({ align: "right", pct: isPercent });
	const totalCellStyle = styles.id({ bold: true, fill: TOTAL, align: "right" });

	const header: Cell[] = [
		{ v: neutralize(`${rowLabel} \\ ${colLabel}`), s: headerStyle },
		...result.cols.map((c) => ({ v: neutralize(c), s: headerStyle })),
	];
	if (config.showTotals) header.push({ v: "Total", s: headerStyle });
	grid.push(header);

	for (const r of result.rows) {
		const rowMap = result.cells.get(r);
		const rowTotal = result.rowTotals.get(r) ?? 0;
		const cells: Cell[] = [{ v: neutralize(r), s: rowHeadStyle }];
		for (const c of result.cols) {
			const raw = rowMap?.get(c)?.value ?? 0;
			let v: number;
			if (isPercent) {
				const denom = denomFor(
					config.percentMode,
					rowTotal,
					result.colTotals.get(c) ?? 0,
					result.grandTotal
				);
				v = denom === 0 ? 0 : raw / denom;
			} else {
				v = round2(raw);
			}
			let s = dataStyle;
			if (config.heatmap && useRange) {
				const t = (raw - useRange.min) / span;
				s = styles.id({ align: "right", pct: isPercent, fill: heatColor(t) });
			}
			cells.push({ v, s });
		}
		if (config.showTotals) cells.push({ v: round2(rowTotal), s: totalCellStyle });
		grid.push(cells);
	}

	if (config.showTotals) {
		const totals: Cell[] = [{ v: "Total", s: totalHeadStyle }];
		for (const c of result.cols) totals.push({ v: round2(result.colTotals.get(c) ?? 0), s: totalCellStyle });
		totals.push({ v: round2(result.grandTotal), s: totalCellStyle });
		grid.push(totals);
	}

	const totalCols = header.length;
	const widths = header.map((h) => String(h.v).length);
	for (const row of grid.slice(1)) {
		row.forEach((cell, i) => {
			const len = String(cell.v).length;
			if (len > (widths[i] ?? 0)) widths[i] = len;
		});
	}
	const cols = widths
		.map((len, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(len + 2, 10), 28)}" customWidth="1"/>`)
		.join("");

	const rowsXml = grid
		.map((row, ri) => `<row r="${ri + 1}">${row.map((cell, ci) => cellXml(cell, ri + 1, ci + 1)).join("")}</row>`)
		.join("");

	const sheet =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
		`<dimension ref="A1:${colRef(totalCols)}${grid.length}"/>` +
		"<sheetViews><sheetView workbookViewId=\"0\">" +
		"<pane xSplit=\"1\" ySplit=\"1\" topLeftCell=\"B2\" activePane=\"bottomRight\" state=\"frozen\"/>" +
		"</sheetView></sheetViews>" +
		"<sheetFormatPr defaultRowHeight=\"18\"/>" +
		`<cols>${cols}</cols>` +
		`<sheetData>${rowsXml}</sheetData>` +
		"</worksheet>";

	const workbook =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" " +
		"xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
		"<sheets><sheet name=\"Pivot\" sheetId=\"1\" r:id=\"rId1\"/></sheets>" +
		"</workbook>";

	const workbookRels =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
		"<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/>" +
		"<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
		"</Relationships>";

	const rootRels =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
		"<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
		"<Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>" +
		"</Relationships>";

	const contentTypes =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
		"<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
		"<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
		"<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
		"<Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>" +
		"<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
		"<Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>" +
		"</Types>";

	const core =
		"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>" +
		"<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" " +
		"xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" " +
		"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">" +
		"<dc:creator>Basecraft by Hewnpath</dc:creator>" +
		`<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>` +
		"</cp:coreProperties>";

	const zipped = zipSync({
		"[Content_Types].xml": strToU8(contentTypes),
		"_rels/.rels": strToU8(rootRels),
		"docProps/core.xml": strToU8(core),
		"xl/workbook.xml": strToU8(workbook),
		"xl/_rels/workbook.xml.rels": strToU8(workbookRels),
		"xl/styles.xml": strToU8(styles.xml()),
		"xl/worksheets/sheet1.xml": strToU8(sheet),
	});

	return zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength);
}

export function downloadBuffer(filename: string, buffer: ArrayBuffer, mime: string): void {
	const blob = new Blob([buffer], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = activeDocument.createElement("a");
	a.href = url;
	a.download = filename;
	activeDocument.body.appendChild(a);
	a.click();
	activeDocument.body.removeChild(a);
	URL.revokeObjectURL(url);
}
