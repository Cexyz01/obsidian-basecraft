import { App, PluginSettingTab, Setting } from "obsidian";
import type BasecraftPlugin from "./main";
import { DEFAULT_LICENSE, type LicenseStatus } from "./license/gate";

export interface BasecraftSettings {
	license: LicenseStatus;
}

export const DEFAULT_SETTINGS: BasecraftSettings = {
	license: { ...DEFAULT_LICENSE },
};

export class BasecraftSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: BasecraftPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Basecraft" });
		containerEl.createEl("p", {
			text: "Advanced views for Obsidian Bases. Built by Hewnpath.",
		});

		new Setting(containerEl)
			.setName("Pro license key")
			.setDesc("Paste the key you received after purchasing Basecraft Pro. Leave empty to stay on the free tier.")
			.addText((text) =>
				text
					.setPlaceholder("XXXX-XXXX-XXXX-XXXX")
					.setValue(this.plugin.settings.license.key ?? "")
					.onChange(async (value) => {
						const trimmed = value.trim();
						this.plugin.settings.license.key = trimmed || null;
						this.plugin.settings.license.active = trimmed.length > 0;
						await this.plugin.saveSettings();
						this.plugin.refreshActiveViews();
						this.display();
					})
			);

		const status = containerEl.createEl("p", { cls: "basecraft-settings-status" });
		status.setText(
			this.plugin.settings.license.active
				? "Pro: active"
				: "Pro: inactive — running on the free tier"
		);
	}
}
