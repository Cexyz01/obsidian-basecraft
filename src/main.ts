import { Plugin, Notice } from "obsidian";
import {
	BasecraftSettingTab,
	DEFAULT_SETTINGS,
	type BasecraftSettings,
} from "./settings";
import { PivotView, PIVOT_VIEW_ID } from "./views/pivot/pivot-view";
import { revalidateIfStale } from "./license/gate";

export default class BasecraftPlugin extends Plugin {
	settings!: BasecraftSettings;
	private activeViews = new Set<PivotView>();

	registerActiveView(view: PivotView): void {
		this.activeViews.add(view);
	}

	unregisterActiveView(view: PivotView): void {
		this.activeViews.delete(view);
	}

	refreshActiveViews(): void {
		for (const view of this.activeViews) view.refresh();
	}

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new BasecraftSettingTab(this.app, this));

		const ok = this.registerBasesView(PIVOT_VIEW_ID, {
			name: "Pivot",
			icon: "table-2",
			factory: (controller, containerEl) =>
				new PivotView(controller, containerEl, this),
		});

		if (!ok) {
			new Notice("Basecraft: failed to register the pivot view. Make sure the Bases core plugin is enabled.");
		}

		this.app.workspace.onLayoutReady(() => {
			void revalidateIfStale(this);
		});
	}

	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as Partial<BasecraftSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...(stored ?? {}),
			license: { ...DEFAULT_SETTINGS.license, ...(stored?.license ?? {}) },
			review: { ...DEFAULT_SETTINGS.review, ...(stored?.review ?? {}) },
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
