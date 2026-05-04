/**
 * DOM rendering for the pivot grid.
 * Pure DOM, no framework. Receives a precomputed PivotResult and draws it.
 */

import type { App } from "obsidian";
import type { PivotResult } from "./compute";
import type { PivotConfig } from "./options";

export interface RenderContext {
	app: App;
	rowDimLabel: string;
	colDimLabel: string;
	aggregationLabel: string;
	onCellClick?: (row: string, col: string) => void;
}

function formatNumber(n: number): string {
	if (Number.isInteger(n)) return n.toString();
	return n.toFixed(2);
}

export function renderPivot(
	containerEl: HTMLElement,
	result: PivotResult,
	config: PivotConfig,
	ctx: RenderContext
): void {
	containerEl.empty();
	containerEl.addClass("basecraft-pivot-container");

	if (result.rows.length === 0 || result.cols.length === 0) {
		const empty = containerEl.createDiv({ cls: "basecraft-pivot-empty" });
		empty.setText(
			"No data to pivot. Configure row and column properties in the toolbar above."
		);
		return;
	}

	const table = containerEl.createEl("table", { cls: "basecraft-pivot" });
	const thead = table.createEl("thead");
	const tbody = table.createEl("tbody");

	const headerRow = thead.createEl("tr");
	const corner = headerRow.createEl("th", { cls: "basecraft-pivot-corner" });
	corner.setText(`${ctx.rowDimLabel} \\ ${ctx.colDimLabel}`);

	for (const c of result.cols) {
		headerRow.createEl("th").setText(c);
	}
	if (config.showTotals) {
		headerRow.createEl("th", { cls: "basecraft-pivot-total" }).setText("Total");
	}

	for (const r of result.rows) {
		const tr = tbody.createEl("tr");
		tr.createEl("th").setText(r);
		const rowMap = result.cells.get(r);
		for (const c of result.cols) {
			const cell = rowMap?.get(c);
			const td = tr.createEl("td", { cls: "basecraft-pivot-cell" });
			const value = cell?.value ?? 0;
			td.setText(formatNumber(value));
			if (cell && cell.entries.length > 0 && ctx.onCellClick) {
				td.addClass("basecraft-pivot-cell-clickable");
				td.onClickEvent(() => ctx.onCellClick && ctx.onCellClick(r, c));
			}
		}
		if (config.showTotals) {
			const totalTd = tr.createEl("td", { cls: "basecraft-pivot-total" });
			totalTd.setText(formatNumber(result.rowTotals.get(r) ?? 0));
		}
	}

	if (config.showTotals) {
		const totalTr = tbody.createEl("tr", { cls: "basecraft-pivot-total-row" });
		totalTr.createEl("th").setText("Total");
		for (const c of result.cols) {
			totalTr
				.createEl("td", { cls: "basecraft-pivot-total" })
				.setText(formatNumber(result.colTotals.get(c) ?? 0));
		}
		totalTr
			.createEl("td", { cls: "basecraft-pivot-total" })
			.setText(formatNumber(result.grandTotal));
	}
}

export interface ToolbarHandlers {
	onRowDimChange: (propId: string | null) => void;
	onColDimChange: (propId: string | null) => void;
	onAggregationChange: (agg: string) => void;
	onValuePropChange: (propId: string | null) => void;
}

export interface PropertyChoice {
	id: string;
	label: string;
}

export function renderToolbar(
	containerEl: HTMLElement,
	config: PivotConfig,
	properties: PropertyChoice[],
	isPro: boolean,
	handlers: ToolbarHandlers
): void {
	containerEl.empty();
	containerEl.addClass("basecraft-pivot-toolbar");

	const mkSelect = (
		labelText: string,
		current: string | null,
		options: { value: string; label: string; disabled?: boolean }[],
		onChange: (v: string | null) => void
	) => {
		const wrap = containerEl.createDiv({ cls: "basecraft-pivot-toolbar-item" });
		wrap.createEl("label").setText(labelText);
		const sel = wrap.createEl("select");
		const noneOpt = sel.createEl("option");
		noneOpt.value = "";
		noneOpt.text = "(none)";
		if (current == null) noneOpt.selected = true;
		for (const o of options) {
			const opt = sel.createEl("option");
			opt.value = o.value;
			opt.text = o.label;
			if (o.disabled) opt.disabled = true;
			if (current === o.value) opt.selected = true;
		}
		sel.addEventListener("change", () => {
			onChange(sel.value === "" ? null : sel.value);
		});
	};

	const propOpts = properties.map((p) => ({ value: p.id, label: p.label }));

	mkSelect("Rows", config.rowDim, propOpts, handlers.onRowDimChange);
	mkSelect("Columns", config.colDim, propOpts, handlers.onColDimChange);

	const aggOpts = [
		{ value: "count", label: "Count" },
		{ value: "sum", label: "Sum" },
		{ value: "avg", label: isPro ? "Average" : "Average — Pro", disabled: !isPro },
		{ value: "min", label: isPro ? "Min" : "Min — Pro", disabled: !isPro },
		{ value: "max", label: isPro ? "Max" : "Max — Pro", disabled: !isPro },
		{ value: "median", label: isPro ? "Median" : "Median — Pro", disabled: !isPro },
		{ value: "distinct", label: isPro ? "Distinct count" : "Distinct — Pro", disabled: !isPro },
	];

	mkSelect("Aggregation", config.aggregation, aggOpts, (v) =>
		handlers.onAggregationChange(v ?? "count")
	);
	mkSelect("Value", config.valueProp, propOpts, handlers.onValuePropChange);

	if (!isPro) {
		const upgrade = containerEl.createDiv({ cls: "basecraft-pivot-upgrade" });
		upgrade.setText("Unlock advanced aggregations, drill-down, export & more — get Basecraft Pro");
	}
}
