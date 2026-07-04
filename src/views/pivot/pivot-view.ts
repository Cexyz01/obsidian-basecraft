import {
	BasesView,
	Notice,
	type BasesPropertyId,
	type QueryController,
	type TFile,
} from "obsidian";
import type BasecraftPlugin from "../../main";
import { isPro } from "../../license/gate";
import {
	loadPivotConfig,
	type PivotConfig,
	type PivotAggregation,
	isProAggregation,
} from "./options";
import { computePivot, type PivotCell } from "./compute";
import { renderPivot, renderToolbar, type PropertyChoice } from "./render";
import { DrillDownModal } from "../../lib/drill-down";
import { downloadFile, pivotToCsv } from "../../lib/csv";
import { downloadBuffer, pivotToXlsx } from "../../lib/xlsx";

export const PIVOT_VIEW_ID = "basecraft-pivot";

export class PivotView extends BasesView {
	type = PIVOT_VIEW_ID;

	private toolbarEl!: HTMLElement;
	private bodyEl!: HTMLElement;
	private currentConfig: PivotConfig | null = null;

	constructor(
		controller: QueryController,
		private hostEl: HTMLElement,
		private plugin: BasecraftPlugin
	) {
		super(controller);
	}

	onload(): void {
		this.hostEl.empty();
		this.hostEl.addClass("basecraft-view");
		this.toolbarEl = this.hostEl.createDiv({ cls: "basecraft-pivot-toolbar-wrapper" });
		this.bodyEl = this.hostEl.createDiv({ cls: "basecraft-pivot-body" });
		this.plugin.registerActiveView(this);
	}

	onunload(): void {
		this.plugin.unregisterActiveView(this);
		this.hostEl.empty();
	}

	refresh(): void {
		this.onDataUpdated();
	}

	onDataUpdated(): void {
		try {
			const cfg = loadPivotConfig(this.config);
			const proActive = isPro(this.plugin);

			if (!proActive) {
				if (isProAggregation(cfg.aggregation)) cfg.aggregation = "count";
				if (cfg.percentMode !== "none") cfg.percentMode = "none";
				if (cfg.heatmap) cfg.heatmap = false;
			}

			this.currentConfig = cfg;
			const props = this.collectProperties();
			this.drawToolbar(cfg, props, proActive);
			this.drawBody(cfg);
		} catch (err) {
			console.error("Basecraft pivot render failed:", err);
			this.bodyEl.empty();
			this.bodyEl
				.createDiv({ cls: "basecraft-pivot-empty" })
				.setText("Could not render pivot. Check the developer console for details.");
		}
	}

	private collectProperties(): PropertyChoice[] {
		const order = this.config.getOrder() ?? [];
		const seen = new Set<string>(order);
		const rest = (this.allProperties ?? []).filter((p) => !seen.has(p));
		return [...order, ...rest].map((id) => ({
			id,
			label: this.config.getDisplayName(id) ?? id,
		}));
	}

	private drawToolbar(cfg: PivotConfig, props: PropertyChoice[], proActive: boolean): void {
		renderToolbar(this.toolbarEl, cfg, props, proActive, {
			onRowDimChange: (v) => this.update({ rowDim: v as BasesPropertyId | null }),
			onColDimChange: (v) => this.update({ colDim: v as BasesPropertyId | null }),
			onAggregationChange: (v) => {
				const agg = v as PivotAggregation;
				if (isProAggregation(agg) && !proActive) {
					this.notifyProRequired("That aggregation");
					return;
				}
				this.update({ aggregation: agg });
			},
			onValuePropChange: (v) => this.update({ valueProp: v as BasesPropertyId | null }),
			onPercentModeChange: (mode) => {
				if (mode !== "none" && !proActive) {
					this.notifyProRequired("Percentage display");
					return;
				}
				this.update({ percentMode: mode });
			},
			onHeatmapToggle: (enabled) => {
				if (enabled && !proActive) {
					this.notifyProRequired("Heatmap");
					return;
				}
				this.update({ heatmap: enabled });
			},
			onExportCsv: () => {
				if (!proActive) {
					this.notifyProRequired("CSV export");
					return;
				}
				this.exportCsv();
			},
			onExportXlsx: () => {
				if (!proActive) {
					this.notifyProRequired("Excel export");
					return;
				}
				void this.exportXlsx();
			},
		});
	}

	private drawBody(cfg: PivotConfig): void {
		const entries = this.data?.data ?? [];
		const result = computePivot(entries, cfg);

		const rowDimLabel = cfg.rowDim
			? this.config.getDisplayName(cfg.rowDim) ?? cfg.rowDim
			: "—";
		const colDimLabel = cfg.colDim
			? this.config.getDisplayName(cfg.colDim) ?? cfg.colDim
			: "—";

		renderPivot(this.bodyEl, result, cfg, {
			app: this.app,
			rowDimLabel,
			colDimLabel,
			aggregationLabel: cfg.aggregation,
			onCellClick: isPro(this.plugin)
				? (row, col, cell) => this.openDrillDown(row, col, cell)
				: undefined,
		});
	}

	private update(patch: Partial<PivotConfig>): void {
		const next = { ...(this.currentConfig ?? loadPivotConfig(this.config)), ...patch };
		this.currentConfig = next;
		try {
			this.config.set("basecraft.pivot", next);
		} catch (err) {
			console.error("Basecraft: failed to persist pivot config", err);
		}
		this.drawBody(next);
	}

	private openDrillDown(row: string, col: string, cell: PivotCell): void {
		const files: TFile[] = cell.entries.map((e) => e.file);
		new DrillDownModal(this.app, `${row} × ${col} — ${files.length} note(s)`, files).open();
	}

	private exportCsv(): void {
		const cfg = this.currentConfig;
		if (!cfg) return;
		const entries = this.data?.data ?? [];
		const result = computePivot(entries, cfg);
		const rowLabel = cfg.rowDim
			? this.config.getDisplayName(cfg.rowDim) ?? cfg.rowDim
			: "Row";
		const colLabel = cfg.colDim
			? this.config.getDisplayName(cfg.colDim) ?? cfg.colDim
			: "Column";
		const csv = pivotToCsv(result, cfg, rowLabel, colLabel);
		const stamp = new Date().toISOString().slice(0, 10);
		downloadFile(`basecraft-pivot-${stamp}.csv`, csv, "text/csv");
		new Notice("Pivot exported to CSV.");
	}

	private async exportXlsx(): Promise<void> {
		const cfg = this.currentConfig;
		if (!cfg) return;
		try {
			const entries = this.data?.data ?? [];
			const result = computePivot(entries, cfg);
			const rowLabel = cfg.rowDim
				? this.config.getDisplayName(cfg.rowDim) ?? cfg.rowDim
				: "Row";
			const colLabel = cfg.colDim
				? this.config.getDisplayName(cfg.colDim) ?? cfg.colDim
				: "Column";
			const buffer = await pivotToXlsx(result, cfg, rowLabel, colLabel);
			const stamp = new Date().toISOString().slice(0, 10);
			downloadBuffer(
				`basecraft-pivot-${stamp}.xlsx`,
				buffer,
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			);
			new Notice("Pivot exported to Excel.");
		} catch (err) {
			console.error("Basecraft: Excel export failed", err);
			new Notice("Excel export failed. Check the developer console.");
		}
	}

	private notifyProRequired(feature: string): void {
		new Notice(`${feature} requires Basecraft Pro ($14).`);
	}
}
