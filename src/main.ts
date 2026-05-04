import { Plugin, Notice } from "obsidian";
import {
	BasecraftSettingTab,
	DEFAULT_SETTINGS,
	type BasecraftSettings,
} from "./settings";
import { PivotView, PIVOT_VIEW_ID } from "./views/pivot/pivot-view";

export default class BasecraftPlugin extends Plugin {
	settings!: BasecraftSettings;

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
			new Notice(
				"Basecraft: Bases view registration failed. Is the Bases core plugin enabled?"
			);
		}
	}

	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as
			| Partial<BasecraftSettings>
			| null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...(stored ?? {}),
			license: {
				...DEFAULT_SETTINGS.license,
				...(stored?.license ?? {}),
			},
		};
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
