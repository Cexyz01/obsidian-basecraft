import type { App } from "obsidian";
import type { PivotResult, PivotCell } from "./compute";
import type { PivotConfig, PercentMode } from "./options";

export interface RenderContext {
	app: App;
	rowDimLabel: string;
	colDimLabel: string;
	aggregationLabel: string;
	onCellClick?: (row: string, col: string, cell: PivotCell) => void;
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
	onPercentModeChange: (mode: PercentMode) => void;
	onHeatmapToggle: (enabled: boolean) => void;
	onExportCsv: () => void;
	onExportXlsx: () => void;
}

function fmt(n: number): string {
	return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

function pct(n: number): string {
	return `${(n * 100).toFixed(1)}%`;
}

function cellDisplay(value: number, mode: PercentMode, denom: number): string {
	if (mode === "none" || denom === 0) return fmt(value);
	return pct(value / denom);
}

function findCellRange(result: PivotResult): { min: number; max: number } {
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

	const range = config.heatmap ? findCellRange(result) : null;
	const span = range ? Math.max(range.max - range.min, 1) : 1;

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
		const rowTotal = result.rowTotals.get(r) ?? 0;

		for (const c of result.cols) {
			const cell = rowMap?.get(c);
			const td = tr.createEl("td", { cls: "basecraft-pivot-cell" });
			const value = cell?.value ?? 0;

			let denom = 1;
			if (config.percentMode === "total") denom = result.grandTotal;
			else if (config.percentMode === "row") denom = rowTotal;
			else if (config.percentMode === "col") denom = result.colTotals.get(c) ?? 0;

			td.setText(cellDisplay(value, config.percentMode, denom));

			if (config.heatmap && range) {
				const t = (value - range.min) / span;
				td.style.setProperty("--basecraft-heat", t.toFixed(3));
				td.addClass("basecraft-pivot-heat");
			}

			if (cell && cell.entries.length > 0 && ctx.onCellClick) {
				td.addClass("basecraft-pivot-cell-clickable");
				td.onClickEvent(() => ctx.onCellClick?.(r, c, cell));
			}
		}

		if (config.showTotals) {
			tr.createEl("td", { cls: "basecraft-pivot-total" }).setText(fmt(rowTotal));
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

	const pctOpts = [
		{ value: "none", label: "Raw values" },
		{ value: "total", label: isPro ? "% of total" : "% of total — Pro", disabled: !isPro },
		{ value: "row", label: isPro ? "% of row" : "% of row — Pro", disabled: !isPro },
		{ value: "col", label: isPro ? "% of column" : "% of column — Pro", disabled: !isPro },
	];
	select("Display", config.percentMode, pctOpts, (v) =>
		handlers.onPercentModeChange((v ?? "none") as PercentMode)
	);

	const actions = containerEl.createDiv({ cls: "basecraft-pivot-toolbar-actions" });

	const heatToggle = actions.createEl("button", {
		cls: "basecraft-pivot-toggle",
		text: config.heatmap ? "Heatmap: on" : "Heatmap: off",
	});
	if (!isPro) {
		heatToggle.disabled = true;
		heatToggle.setText("Heatmap — Pro");
	}
	heatToggle.addEventListener("click", () => handlers.onHeatmapToggle(!config.heatmap));

	const csvBtn = actions.createEl("button", { cls: "basecraft-pivot-toggle", text: "Export CSV" });
	if (!isPro) {
		csvBtn.disabled = true;
		csvBtn.setText("CSV — Pro");
	}
	csvBtn.addEventListener("click", () => handlers.onExportCsv());

	const xlsxBtn = actions.createEl("button", { cls: "basecraft-pivot-toggle", text: "Export Excel" });
	if (!isPro) {
		xlsxBtn.disabled = true;
		xlsxBtn.setText("Excel — Pro");
	}
	xlsxBtn.addEventListener("click", () => handlers.onExportXlsx());

	if (!isPro) {
		containerEl
			.createDiv({ cls: "basecraft-pivot-upgrade" })
			.setText("Get Basecraft Pro — $14 one-time — for advanced aggregations, drill-down, heatmap, percentages and export");
	}
}
