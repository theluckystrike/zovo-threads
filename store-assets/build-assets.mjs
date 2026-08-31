/* @noflow */
/* eslint import/no-nodejs-modules: 0 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = path.resolve(import.meta.dirname, '..');
const captures = path.join(root, 'store-assets', 'captures');
const output = path.join(root, 'store-assets', 'out');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'zovo-threads-store-'));
fs.mkdirSync(output, { recursive: true });

const shots = [
	{
		name: 'screenshot-01.png', eyebrow: 'Keyboard-first reading',
		title: 'Move through comments with J and K',
		copy: 'Visible focus and per-thread position memory keep long conversations manageable.',
		image: path.join(captures, 'threadcanvas-feature-spike.png'),
	},
	{
		name: 'screenshot-02.png', eyebrow: 'Local context',
		title: 'Remember people with private tags',
		copy: 'Author labels stay in browser storage and never become public Reddit data.',
		image: path.join(captures, 'popup.light.png'),
	},
	{
		name: 'screenshot-03.png', eyebrow: 'Subreddit filters',
		title: 'Hide noise with scoped filters',
		copy: 'Phrase and author filters remain attached to the subreddit where you made them.',
		image: path.join(captures, 'threadcanvas-feature-spike.png'),
	},
	{
		name: 'screenshot-04.png', eyebrow: 'Controls that stay out of the way',
		title: 'A calm desk for every thread',
		copy: 'See local activity, open full settings, and manage your optional Pro licence.',
		image: path.join(captures, 'popup.dark.png'),
	},
];

function markup({ eyebrow, title, copy, image, promo = false }) {
	const imageUrl = pathToFileURL(image).href;
	return `<!doctype html><meta charset="utf-8"><style>
		*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
		body{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#eef8f3;color:#112d27}
		body:before{content:"";position:absolute;inset:-25% 48% 28% -12%;background:radial-gradient(circle,#ff8c72 0,#ffb29f 22%,transparent 68%);opacity:.42}
		body:after{content:"";position:absolute;inset:38% -15% -35% 45%;background:radial-gradient(circle,#61d6b1 0,#b6f0dc 28%,transparent 68%);opacity:.58}
		.shell{position:relative;z-index:1;width:100%;height:100%;padding:${promo ? '56px 74px' : '76px 86px'};display:grid;grid-template-columns:${promo ? '1fr .72fr' : '0.78fr 1.22fr'};gap:58px;align-items:center}
		.eyebrow{display:inline-flex;padding:9px 14px;border-radius:999px;background:#d9f4e9;color:#08684f;font-size:${promo ? 20 : 19}px;font-weight:800;letter-spacing:.03em}
		h1{font-size:${promo ? 54 : 62}px;line-height:1.02;letter-spacing:-.045em;margin:22px 0 18px;max-width:620px}
		p{font-size:${promo ? 23 : 25}px;line-height:1.45;color:#42635a;margin:0;max-width:570px}
		.brand{position:absolute;left:${promo ? 74 : 86}px;bottom:${promo ? 46 : 54}px;display:flex;align-items:center;gap:12px;font-size:${promo ? 22 : 20}px;font-weight:800;color:#08684f}
		.brand img{width:${promo ? 48 : 42}px;height:${promo ? 48 : 42}px;border-radius:12px}
		.frame{justify-self:end;width:100%;height:${promo ? '390px' : '650px'};display:flex;align-items:center;justify-content:center;padding:${promo ? 18 : 28}px;border:1px solid rgba(8,104,79,.15);border-radius:30px;background:rgba(255,255,255,.86);box-shadow:0 30px 80px rgba(17,45,39,.18);overflow:hidden}
		.frame img{display:block;max-width:100%;max-height:100%;object-fit:contain;border-radius:14px;box-shadow:0 8px 30px rgba(17,45,39,.16)}
	</style><main class="shell"><section><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${copy}</p></section><div class="frame"><img src="${imageUrl}"></div><div class="brand"><img src="${pathToFileURL(path.join(root, 'images', 'icon128.png')).href}">Zovo Threads · zovo.one</div></main>`;
}

function capture(name, width, height, html) {
	const page = path.join(temporary, `${name}.html`);
	fs.writeFileSync(page, html);
	execFileSync(chrome, [
		'--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
		'--force-device-scale-factor=1', `--window-size=${width},${height}`,
		'--virtual-time-budget=1500', `--screenshot=${path.join(output, name)}`, pathToFileURL(page).href,
	], { stdio: 'ignore' });
}

for (const shot of shots) capture(shot.name, 1280, 800, markup(shot));
capture('promo-marquee.png', 1400, 560, markup({
	eyebrow: 'GPL-3.0 · local-first', title: 'Read Reddit threads at your own pace.',
	copy: 'Keyboard navigation, private tags, scoped filters, inline media, and position memory.',
	image: shots[1].image, promo: true,
}));
capture('promo-small.png', 440, 280, `<!doctype html><meta charset="utf-8"><style>
	*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:linear-gradient(140deg,#e9f8f2,#fff1ec);color:#112d27;padding:32px;display:flex;flex-direction:column;justify-content:space-between}img{width:62px;height:62px;border-radius:16px}h1{font-size:35px;line-height:1;margin:0;letter-spacing:-.04em}p{font-size:16px;color:#08684f;margin:8px 0 0;font-weight:700}</style><img src="${pathToFileURL(path.join(root, 'images', 'icon128.png')).href}"><div><h1>Zovo Threads</h1><p>Own the conversation.</p></div>`);
fs.copyFileSync(path.join(root, 'images', 'icon128.png'), path.join(output, 'store-icon-128.png'));
fs.rmSync(temporary, { recursive: true });
console.log(`Built ${shots.length + 3} store assets in ${output}`);
