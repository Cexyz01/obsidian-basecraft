import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type BasecraftPlugin from "./main";
import { activateKey, deactivateKey } from "./license/client";
import { BUY_URL, DEFAULT_LICENSE, type LicenseStatus } from "./license/gate";

export interface BasecraftSettings {
	license: LicenseStatus;
}

export const DEFAULT_SETTINGS: BasecraftSettings = {
	license: { ...DEFAULT_LICENSE },
};

export class BasecraftSettingTab extends PluginSettingTab {
	private keyInput = "";
	private busy = false;

	constructor(app: App, private plugin: BasecraftPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("p", {
			text: "Advanced views for Obsidian Bases. Built by Hewnpath.",
		});

		const license = this.plugin.settings.license;

		if (license.active && license.key) {
			new Setting(containerEl)
				.setName("Pro license")
				.setDesc(`Active — key ending in …${license.key.slice(-4)}`)
				.addButton((btn) =>
					btn
						.setButtonText("Deactivate")
						.setDisabled(this.busy)
						.onClick(() => void this.deactivate())
				);
		} else {
			new Setting(containerEl)
				.setName("Pro license key")
				.setDesc("Paste the key you received after purchasing Basecraft Pro.")
				.addText((text) =>
					text
						.setPlaceholder("XXXX-XXXX-XXXX-XXXX")
						.setValue(this.keyInput)
						.onChange((value) => {
							this.keyInput = value.trim();
						})
				)
				.addButton((btn) =>
					btn
						.setButtonText("Activate")
						.setCta()
						.setDisabled(this.busy)
						.onClick(() => void this.activate())
				);

			const buy = containerEl.createEl("p", { cls: "basecraft-settings-status" });
			buy.appendText("No key yet? ");
			buy.createEl("a", { text: "Get Basecraft Pro — $14 one-time", href: BUY_URL });
		}
	}

	private async activate(): Promise<void> {
		if (!this.keyInput) {
			new Notice("Paste a license key first.");
			return;
		}
		this.busy = true;
		const result = await activateKey(this.keyInput, `Obsidian — ${this.app.vault.getName()}`);
		this.busy = false;

		if (!result.valid) {
			new Notice(result.message ?? "Activation failed.");
			return;
		}

		this.plugin.settings.license = {
			active: true,
			key: this.keyInput,
			activationId: result.activationId ?? null,
			lastValidated: Date.now(),
		};
		await this.plugin.saveSettings();
		this.plugin.refreshActiveViews();
		new Notice("Basecraft Pro activated.");
		this.display();
	}

	private async deactivate(): Promise<void> {
		const { key, activationId } = this.plugin.settings.license;
		this.busy = true;
		if (key && activationId) await deactivateKey(key, activationId);
		this.busy = false;

		this.plugin.settings.license = { ...DEFAULT_LICENSE };
		this.keyInput = "";
		await this.plugin.saveSettings();
		this.plugin.refreshActiveViews();
		new Notice("Basecraft Pro deactivated on this device.");
		this.display();
	}
}
