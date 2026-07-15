import type BasecraftPlugin from "./main";

export const STAR_URL = "https://github.com/Cexyz01/obsidian-basecraft";

const FIRST_PROMPT_AT = 5;
const REPEAT_AFTER = 5;
const MAX_PROMPTS = 2;

export interface ReviewState {
	renders: number;
	prompts: number;
	done: boolean;
}

export const DEFAULT_REVIEW: ReviewState = {
	renders: 0,
	prompts: 0,
	done: false,
};

function nextThreshold(prompts: number): number {
	return FIRST_PROMPT_AT + prompts * REPEAT_AFTER;
}

export async function recordSuccessfulRender(plugin: BasecraftPlugin): Promise<void> {
	const review = plugin.settings.review;
	if (review.done || review.prompts >= MAX_PROMPTS) return;
	review.renders += 1;
	await plugin.saveSettings();
}

export function shouldPromptReview(plugin: BasecraftPlugin): boolean {
	const review = plugin.settings.review;
	if (review.done || review.prompts >= MAX_PROMPTS) return false;
	return review.renders >= nextThreshold(review.prompts);
}

async function markPromptShown(plugin: BasecraftPlugin): Promise<void> {
	plugin.settings.review.prompts += 1;
	await plugin.saveSettings();
}

async function dismissForGood(plugin: BasecraftPlugin): Promise<void> {
	plugin.settings.review.done = true;
	await plugin.saveSettings();
}

export function renderReviewBanner(
	containerEl: HTMLElement,
	plugin: BasecraftPlugin,
	onClose: () => void
): void {
	void markPromptShown(plugin);

	const banner = containerEl.createDiv({ cls: "basecraft-review" });
	banner
		.createDiv({ cls: "basecraft-review-text" })
		.setText("Enjoying Basecraft? A star on GitHub helps other people find it.");

	const actions = banner.createDiv({ cls: "basecraft-review-actions" });

	const star = actions.createEl("a", {
		cls: "basecraft-review-star",
		text: "Star on GitHub",
		href: STAR_URL,
	});
	star.addEventListener("click", () => {
		void dismissForGood(plugin);
		onClose();
	});

	actions
		.createEl("button", { cls: "basecraft-review-later", text: "Maybe later" })
		.addEventListener("click", onClose);

	actions
		.createEl("button", { cls: "basecraft-review-dismiss", text: "No thanks" })
		.addEventListener("click", () => {
			void dismissForGood(plugin);
			onClose();
		});
}
