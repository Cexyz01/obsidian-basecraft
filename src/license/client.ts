// Lemon Squeezy License API client.
// Filled with real fetch calls once the store is approved and a Pro product exists.
// For now: any non-empty key is treated as valid so the UI flows can be exercised.

export interface ValidateResult {
	valid: boolean;
	message?: string;
	expiresAt?: number | null;
}

export interface ActivateResult {
	valid: boolean;
	instanceId?: string;
	message?: string;
}

export async function validateKey(key: string): Promise<ValidateResult> {
	if (!key || !key.trim()) return { valid: false, message: "Empty key" };
	return { valid: true, expiresAt: null };
}

export async function activateKey(key: string, instanceName: string): Promise<ActivateResult> {
	if (!key || !key.trim()) return { valid: false, message: "Empty key" };
	return { valid: true, instanceId: `local-${instanceName}` };
}

export async function deactivateKey(_key: string, _instanceId: string): Promise<boolean> {
	return true;
}
