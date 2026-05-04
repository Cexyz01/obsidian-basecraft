import {
	BasesView,
	Notice,
	type BasesPropertyId,
	type QueryController,
} from "obsidian";
import type BasecraftPlugin from "../../main";
import { isPro } from "../../license/gate";
import {
	loadPivotConfig,
	type PivotConfig,
	type PivotAggregation,
	isProAggregation,
} from "./options";
import { computePivot } from "./compute";
import { renderPivot, renderToolbar, type PropertyChoice } from "./render";

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
	}

	onunload(): void {
		this.hostEl.empty();
	}

	onDataUpdated(): void {
		const cfg = loadPivotConfig(this.config);
		const proActive = isPro(this.plugin);

		if (!proActive && isProAggregation(cfg.aggregation)) {
			cfg.aggregation = "count";
		}

		this.currentConfig = cfg;
		const props = this.collectProperties();
		this.drawToolbar(cfg, props, proActive);
		this.drawBody(cfg);
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
					new Notice("That aggregation requires Basecraft Pro.");
					return;
				}
				this.update({ aggregation: agg });
			},
			onValuePropChange: (v) => this.update({ valueProp: v as BasesPropertyId | null }),
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
				? (row, col) => this.drillDown(row, col)
				: undefined,
		});
	}

	private update(patch: Partial<PivotConfig>): void {
		const next = { ...(this.currentConfig ?? loadPivotConfig(this.config)), ...patch };
		this.currentConfig = next;
		this.config.set("basecraft.pivot", next);
		this.drawBody(next);
	}

	private drillDown(row: string, col: string): void {
		new Notice(`Drill-down: ${row} × ${col} — coming in Pro.`);
	}
}
