// Polar customer-portal license client. These endpoints are unauthenticated
// by design; safe to call from a desktop plugin.
// https://polar.sh/docs/api-reference/customer-portal/license-keys

import { requestUrl } from "obsidian";

const API_BASE = "https://api.polar.sh/v1/customer-portal/license-keys";
const ORG_ID = "42ddac45-db43-4f26-98fa-5fb6dccb8caf";

export interface ValidateResult {
	valid: boolean;
	offline?: boolean;
	message?: string;
	expiresAt?: number | null;
}

export interface ActivateResult {
	valid: boolean;
	activationId?: string;
	message?: string;
}

async function post(path: string, body: Record<string, unknown>) {
	return requestUrl({
		url: `${API_BASE}${path}`,
		method: "POST",
		contentType: "application/json",
		body: JSON.stringify({ organization_id: ORG_ID, ...body }),
		throw: false,
	});
}

export async function activateKey(key: string, label: string): Promise<ActivateResult> {
	const trimmed = key.trim();
	if (!trimmed) return { valid: false, message: "Empty key" };
	try {
		const res = await post("/activate", { key: trimmed, label });
		if (res.status === 200) {
			const { id } = res.json as { id: string };
			return { valid: true, activationId: id };
		}
		if (res.status === 403) {
			return { valid: false, message: "Activation limit reached. Deactivate Basecraft on another device first." };
		}
		if (res.status === 404) {
			return { valid: false, message: "License key not found. Check for typos." };
		}
		return { valid: false, message: `License server returned ${res.status}. Try again later.` };
	} catch {
		return { valid: false, message: "Could not reach the license server. Check your connection and try again." };
	}
}

export async function validateKey(key: string, activationId: string | null): Promise<ValidateResult> {
	const trimmed = key.trim();
	if (!trimmed) return { valid: false, message: "Empty key" };
	try {
		const res = await post("/validate", {
			key: trimmed,
			...(activationId ? { activation_id: activationId } : {}),
		});
		if (res.status === 200) {
			const { status, expires_at } = res.json as { status: string; expires_at: string | null };
			if (status !== "granted") {
				return { valid: false, message: `License is ${status}.` };
			}
			const expiresAt = expires_at ? Date.parse(expires_at) : null;
			if (expiresAt !== null && expiresAt < Date.now()) {
				return { valid: false, message: "License has expired." };
			}
			return { valid: true, expiresAt };
		}
		if (res.status === 404) {
			return { valid: false, message: "License key not found." };
		}
		return { valid: false, message: `License server returned ${res.status}.` };
	} catch {
		return { valid: false, offline: true };
	}
}

export async function deactivateKey(key: string, activationId: string): Promise<boolean> {
	try {
		const res = await post("/deactivate", { key: key.trim(), activation_id: activationId });
		return res.status === 204 || res.status === 200;
	} catch {
		return false;
	}
}
