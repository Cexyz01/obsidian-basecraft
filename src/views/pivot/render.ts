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

export interface PropertyChoice {
	id: string;
	label: string;
}

export interface ToolbarHandlers {
	onRowDimChange: (propId: string | null) => void;
	onColDimChange: (propId: string | null) => void;
	onAggregationChange: (agg: string) => void;
	onValuePropChange: (propId: string | null) => void;
}

function fmt(n: number): string {
	return Number.isInteger(n) ? n.toString() : n.toFixed(2);
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
		containerEl
			.createDiv({ cls: "basecraft-pivot-empty" })
			.setText("No data to pivot. Pick row and column properties in the toolbar.");
		return;
	}

	const table = containerEl.createEl("table", { cls: "basecraft-pivot" });
	const thead = table.createEl("thead");
	const tbody = table.createEl("tbody");

	const head = thead.createEl("tr");
	head.createEl("th", { cls: "basecraft-pivot-corner" }).setText(
		`${ctx.rowDimLabel} \\ ${ctx.colDimLabel}`
	);
	for (const c of result.cols) head.createEl("th").setText(c);
	if (config.showTotals) {
		head.createEl("th", { cls: "basecraft-pivot-total" }).setText("Total");
	}

	for (const r of result.rows) {
		const tr = tbody.createEl("tr");
		tr.createEl("th").setText(r);
		const rowMap = result.cells.get(r);
		for (const c of result.cols) {
			const cell = rowMap?.get(c);
			const td = tr.createEl("td", { cls: "basecraft-pivot-cell" });
			td.setText(fmt(cell?.value ?? 0));
			if (cell && cell.entries.length > 0 && ctx.onCellClick) {
				td.addClass("basecraft-pivot-cell-clickable");
				td.onClickEvent(() => ctx.onCellClick?.(r, c));
			}
		}
		if (config.showTotals) {
			tr.createEl("td", { cls: "basecraft-pivot-total" }).setText(
				fmt(result.rowTotals.get(r) ?? 0)
			);
		}
	}

	if (config.showTotals) {
		const totalTr = tbody.createEl("tr", { cls: "basecraft-pivot-total-row" });
		totalTr.createEl("th").setText("Total");
		for (const c of result.cols) {
			totalTr
				.createEl("td", { cls: "basecraft-pivot-total" })
				.setText(fmt(result.colTotals.get(c) ?? 0));
		}
		totalTr
			.createEl("td", { cls: "basecraft-pivot-total" })
			.setText(fmt(result.grandTotal));
	}
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

	const select = (
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

	select("Rows", config.rowDim, propOpts, handlers.onRowDimChange);
	select("Columns", config.colDim, propOpts, handlers.onColDimChange);

	const aggOpts = [
		{ value: "count", label: "Count" },
		{ value: "sum", label: "Sum" },
		{ value: "avg", label: isPro ? "Average" : "Average — Pro", disabled: !isPro },
		{ value: "min", label: isPro ? "Min" : "Min — Pro", disabled: !isPro },
		{ value: "max", label: isPro ? "Max" : "Max — Pro", disabled: !isPro },
		{ value: "median", label: isPro ? "Median" : "Median — Pro", disabled: !isPro },
		{ value: "distinct", label: isPro ? "Distinct count" : "Distinct — Pro", disabled: !isPro },
	];

	select("Aggregation", config.aggregation, aggOpts, (v) =>
		handlers.onAggregationChange(v ?? "count")
	);
	select("Value", config.valueProp, propOpts, handlers.onValuePropChange);

	if (!isPro) {
		containerEl
			.createDiv({ cls: "basecraft-pivot-upgrade" })
			.setText("Get Basecraft Pro for advanced aggregations, drill-down, export and more");
	}
}
