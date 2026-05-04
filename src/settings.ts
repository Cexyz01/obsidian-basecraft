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
			.setDesc(
				"Paste the license key you received after purchasing Basecraft Pro. Leave empty to use the free tier."
			)
			.addText((text) =>
				text
					.setPlaceholder("XXXX-XXXX-XXXX-XXXX")
					.setValue(this.plugin.settings.license.key ?? "")
					.onChange(async (value) => {
						const trimmed = value.trim();
						this.plugin.settings.license.key = trimmed.length
							? trimmed
							: null;
						// V0.1: trust the key blindly. Real validation against
						// Lemon Squeezy License API is wired up in a follow-up.
						this.plugin.settings.license.active = trimmed.length > 0;
						await this.plugin.saveSettings();
					})
			);

		const statusEl = containerEl.createEl("p", {
			cls: "basecraft-settings-status",
		});
		statusEl.setText(
			this.plugin.settings.license.active
				? "Pro: ACTIVE (V0.1 trusts any non-empty key — server validation lands later)"
				: "Pro: INACTIVE — running in free tier"
		);
	}
}
