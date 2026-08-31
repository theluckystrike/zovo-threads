/* @flow */
/* global chrome */

const KEY_RE = /^ZOVO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const VERIFY_URL = 'https://zgubxqomnbmxgbdhvwja.supabase.co/functions/v1/verify-extension-license';
const API_KEY = process.env.SUPABASE_ANON_KEY;
const LICENSE_KEY = 'ztThreadCanvas.license';

export function normalizeKey(raw: mixed): string {
	return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

export function keyHasValidShape(raw: mixed): boolean {
	return KEY_RE.test(normalizeKey(raw));
}

export async function getLicense(): Promise<{ valid: boolean, key: string }> {
	try {
		const result = await chrome.storage.sync.get(LICENSE_KEY);
		const saved = result[LICENSE_KEY];
		if (saved?.valid === true && keyHasValidShape(saved.key)) return saved;
	} catch (error) {
		console.warn('Could not read the saved licence.', error);
	}
	return { valid: false, key: '' };
}

export async function activateLicense(raw: mixed): Promise<'ok' | 'shape' | 'invalid' | 'offline'> {
	const key = normalizeKey(raw);
	if (!KEY_RE.test(key)) return 'shape';
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 8000);
	try {
		const response = await fetch(VERIFY_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				apikey: API_KEY,
				authorization: `Bearer ${API_KEY}`,
			},
			body: JSON.stringify({ license_key: key, extension: ['zovo', 'threads'].join('-') }),
			signal: controller.signal,
		});
		if (!response.ok) return 'offline';
		const body = await response.json();
		if (body?.valid !== true) return 'invalid';
		await chrome.storage.sync.set({ [LICENSE_KEY]: { key, valid: true, activatedAt: Date.now() } });
		return 'ok';
	} catch (_error) {
		return 'offline';
	} finally {
		clearTimeout(timer);
	}
}

export async function deactivateLicense(): Promise<void> {
	await chrome.storage.sync.remove(LICENSE_KEY);
}
