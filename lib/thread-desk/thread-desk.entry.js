/* @flow */
/* global chrome */

import { activateLicense, deactivateLicense, getLicense } from './license';

const NS = 'ztThreadCanvas';

function setText(id: string, value: string) {
	const node = document.getElementById(id);
	if (node) node.textContent = value;
}

async function currentThreadId(): Promise<string> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	return (tab?.url?.match(/\/comments\/([a-z0-9]+)/i) || [])[1] || '';
}

async function render() {
	const [local, license] = await Promise.all([
		chrome.storage.local.get(null),
		getLicense(),
	]);
	const keys = Object.keys(local);
	const tagCount = keys.filter(key => key.startsWith(`${NS}.tag.`) && local[key]).length;
	const filterCount = keys
		.filter(key => key.startsWith(`${NS}.filters.`))
		.reduce((total, key) => total + (Array.isArray(local[key]) ? local[key].length : 0), 0);
	const positionCount = keys.filter(key => key.startsWith(`${NS}.position.`)).length;
	setText('tagCount', String(tagCount));
	setText('filterCount', String(filterCount));
	setText('positionCount', String(positionCount));
	setText('tierBadge', license.valid ? 'Pro active' : 'Free');
	document.body.dataset.tier = license.valid ? 'pro' : 'free';
	const keyInput = document.querySelector('#licenseKey');
	if (keyInput instanceof HTMLInputElement && license.key) keyInput.value = license.key;
}

document.querySelector('#openSettings')?.addEventListener('click', () => chrome.runtime.openOptionsPage());

document.querySelector('#clearPosition')?.addEventListener('click', async () => {
	const id = await currentThreadId();
	if (!id) {
		setText('actionStatus', 'Open a Reddit thread first.');
		return;
	}
	await chrome.storage.local.remove(`${NS}.position.${id}`);
	setText('actionStatus', 'Reading position cleared for this thread.');
	await render();
});

document.querySelector('#licenseForm')?.addEventListener('submit', async event => {
	event.preventDefault();
	const input = document.querySelector('#licenseKey');
	if (!(input instanceof HTMLInputElement)) return;
	setText('licenseStatus', 'Checking…');
	const outcome = await activateLicense(input.value);
	const message = {
		ok: 'Pro is active on this browser.',
		shape: 'Use the format ZOVO-XXXX-XXXX-XXXX-XXXX.',
		invalid: 'That key was not recognised.',
		offline: 'Could not reach licence verification. Try again online.',
	}[outcome];
	setText('licenseStatus', message);
	await render();
});

document.querySelector('#deactivate')?.addEventListener('click', async () => {
	await deactivateLicense();
	setText('licenseStatus', 'Licence removed from this browser.');
	await render();
});

render();
