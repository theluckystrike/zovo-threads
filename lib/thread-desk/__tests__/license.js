/* @flow */

import test from 'ava';

import { activateLicense, keyHasValidShape, normalizeKey } from '../license.js';

const GOOD_KEY = 'ZOVO-AB12-CD34-EF56-GH78';

test('normalizes and validates the exact Zovo key shape', t => {
	t.is(normalizeKey('  zovo-ab12-cd34-ef56-gh78  '), GOOD_KEY);
	t.true(keyHasValidShape(GOOD_KEY));
	t.false(keyHasValidShape('ZOVO-AB12-CD34-EF56'));
	t.false(keyHasValidShape('OTHER-AB12-CD34-EF56-GH78'));
	t.false(keyHasValidShape('ZOVO-AB!2-CD34-EF56-GH78'));
});

test.serial('does not grant Pro from a tier name without valid true', async t => {
	let saved = false;
	global.chrome = { storage: { sync: { set: () => { saved = true; return Promise.resolve(); } } } };
	global.fetch = () => Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ valid: false, tier: 'pro' }),
	});

	t.is(await activateLicense(GOOD_KEY), 'invalid');
	t.false(saved);
});

test.serial('grants Pro only when the server returns valid true', async t => {
	let saved;
	global.chrome = { storage: { sync: { set: value => { saved = value; return Promise.resolve(); } } } };
	global.fetch = () => Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ valid: true, tier: 'free' }),
	});

	t.is(await activateLicense(GOOD_KEY), 'ok');
	t.true(saved['ztThreadCanvas.license'].valid);
	t.is(saved['ztThreadCanvas.license'].key, GOOD_KEY);
});
