import { App, Modal, TFile } from "obsidian";

export class DrillDownModal extends Modal {
	constructor(app: App, private title: string, private files: TFile[]) {
		super(app);
	}

	onOpen(): void {
		const { contentEl, titleEl } = this;
		titleEl.setText(this.title);
		contentEl.empty();
		contentEl.addClass("basecraft-drilldown");

		if (this.files.length === 0) {
			contentEl.createEl("p", { text: "No matching notes." });
			return;
		}

		const list = contentEl.createEl("ul", { cls: "basecraft-drilldown-list" });
		for (const file of this.files) {
			const item = list.createEl("li");
			const link = item.createEl("a", { text: file.basename, cls: "basecraft-drilldown-link" });
			link.addEventListener("click", (e) => {
				e.preventDefault();
				this.app.workspace.openLinkText(file.path, "", false);
				this.close();
			});
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
