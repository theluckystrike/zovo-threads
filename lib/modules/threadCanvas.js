/* @flow */

import { Module } from '../core/module';
import { Storage } from '../environment';

export const module: Module<*> = new Module('threadCanvas');

module.moduleName = 'Thread Canvas';
module.hidden = true;
module.include = ['d2x'];
module.shouldRun = () => /\/comments\/[a-z0-9]+(?:\/|$)/i.test(location.pathname);

const NS = 'ztThreadCanvas';
const COMMENT_SELECTOR = 'shreddit-comment, [thingid^="t1_"]';
const MEDIA_SELECTOR = 'a[href]';
const IMAGE_URL = /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i;

let activeIndex = -1;
let comments: HTMLElement[] = [];
let observer;
let toolbar;
let currentFilters: string[] = [];
let refreshScheduled = false;
let positionRestoreStarted = false;

const storage = {
	get(key: string): Promise<any> {
		return Storage.get(key);
	},
	async set(key: string, value: any): Promise<void> {
		await Storage.set(key, value);
	},
};

function subreddit(): string {
	return (location.pathname.match(/^\/r\/([^/]+)/i) || [])[1]?.toLowerCase() || 'frontpage';
}

function threadId(): string {
	return (location.pathname.match(/\/comments\/([a-z0-9]+)/i) || [])[1] || location.pathname;
}

function positionKey(): string {
	return `${NS}.position.${threadId()}`;
}

function filterKey(): string {
	return `${NS}.filters.${subreddit()}`;
}

function tagKey(author: string): string {
	return `${NS}.tag.${author.toLowerCase()}`;
}

function commentId(comment: HTMLElement): string {
	return comment.getAttribute('thingid') || comment.id || `comment-${comments.indexOf(comment)}`;
}

function commentAuthor(comment: HTMLElement): string {
	return comment.getAttribute('author') ||
		comment.querySelector('[data-testid="comment_author_link"], a[href^="/user/"]')?.textContent?.trim() || '';
}

function visibleComments(): HTMLElement[] {
	return comments.filter(comment => !comment.hidden && comment.offsetParent !== null);
}

function setActive(comment: HTMLElement, { scroll = true, remember = true } = {}) {
	document.querySelectorAll('.ztc-active').forEach(node => node.classList.remove('ztc-active'));
	comment.classList.add('ztc-active');
	comments = Array.from(document.querySelectorAll(COMMENT_SELECTOR));
	activeIndex = comments.indexOf(comment);
	if (scroll) comment.scrollIntoView({ block: 'center', behavior: 'smooth' });
	if (remember) {
		storage.set(positionKey(), {
			commentId: commentId(comment),
			scrollY: Math.round(window.scrollY),
			updatedAt: Date.now(),
		});
	}
}

function move(direction: number) {
	const visible = visibleComments();
	if (!visible.length) return;
	const current = comments[activeIndex];
	const visibleIndex = Math.max(-1, visible.indexOf(current));
	const nextIndex = direction > 0 ?
		Math.min(visible.length - 1, visibleIndex + 1) :
		Math.max(0, visibleIndex < 0 ? visible.length - 1 : visibleIndex - 1);
	setActive(visible[nextIndex]);
}

function isTyping(target: EventTarget | null): boolean {
	return target instanceof HTMLElement && (
		target.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
	);
}

function collapseMedia(comment: ?HTMLElement) {
	const scope = comment || document;
	scope.querySelectorAll('.ztc-media-frame').forEach(frame => frame.remove());
	scope.querySelectorAll('.ztc-media-toggle[aria-expanded="true"]').forEach(button => {
		button.setAttribute('aria-expanded', 'false');
		button.textContent = 'Expand media';
	});
}

function toggleMedia(button: HTMLButtonElement) {
	const existing = button.parentElement?.querySelector('.ztc-media-frame');
	if (existing) {
		existing.remove();
		button.setAttribute('aria-expanded', 'false');
		button.textContent = 'Expand media';
		return;
	}
	const url = button.dataset.url;
	if (!url) return;
	const frame = document.createElement('figure');
	frame.className = 'ztc-media-frame';
	const image = document.createElement('img');
	image.src = url;
	image.alt = 'Expanded thread media';
	image.loading = 'lazy';
	frame.append(image);
	button.after(frame);
	button.setAttribute('aria-expanded', 'true');
	button.textContent = 'Collapse media';
	storage.set(`${NS}.media.${threadId()}`, { url, expanded: true });
}

function decorateMedia(comment: HTMLElement) {
	comment.querySelectorAll(MEDIA_SELECTOR).forEach(link => {
		if (!(link instanceof HTMLAnchorElement) || link.dataset.ztcMediaReady) return;
		const url = link.href;
		if (!IMAGE_URL.test(url) && !/\b(?:i\.redd\.it|preview\.redd\.it)\b/i.test(url)) return;
		link.dataset.ztcMediaReady = 'true';
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'ztc-media-toggle';
		button.dataset.url = url;
		button.setAttribute('aria-expanded', 'false');
		button.textContent = 'Expand media';
		button.addEventListener('click', () => toggleMedia(button));
		link.after(button);
	});
}

async function renderTag(comment: HTMLElement, author: string, container: HTMLElement) {
	const value = await storage.get(tagKey(author));
	let chip = container.querySelector('.ztc-tag-chip');
	if (!value) {
		chip?.remove();
		return;
	}
	if (!chip) {
		chip = document.createElement('span');
		chip.className = 'ztc-tag-chip';
		container.prepend(chip);
	}
	chip.textContent = value;
	comment.dataset.ztcTag = value.toLowerCase();
}

function openTagEditor(comment: HTMLElement, author: string, container: HTMLElement) {
	if (container.querySelector('.ztc-tag-editor')) return;
	const editor = document.createElement('form');
	editor.className = 'ztc-tag-editor';
	editor.innerHTML = '<label>Local tag <input maxlength="40" autocomplete="off"></label><button type="submit">Save</button><button type="button" data-cancel>Cancel</button>';
	const input = editor.querySelector('input');
	storage.get(tagKey(author)).then(value => {
		input.value = value || '';
		input.focus();
	});
	editor.addEventListener('submit', async event => {
		event.preventDefault();
		await storage.set(tagKey(author), input.value.trim());
		await renderTag(comment, author, container);
		editor.remove();
	});
	editor.querySelector('[data-cancel]').addEventListener('click', () => editor.remove());
	container.append(editor);
}

function decorateTag(comment: HTMLElement) {
	if (comment.dataset.ztcTagReady) return;
	const author = commentAuthor(comment);
	if (!author) return;
	comment.dataset.ztcTagReady = 'true';
	const container = document.createElement('div');
	container.className = 'ztc-tag-tools';
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'ztc-tag-button';
	button.textContent = `Tag ${author}`;
	button.addEventListener('click', () => openTagEditor(comment, author, container));
	container.append(button);
	comment.prepend(container);
	renderTag(comment, author, container);
}

function applyFilters() {
	comments.forEach(comment => {
		const haystack = `${commentAuthor(comment)} ${comment.textContent || ''}`.toLowerCase();
		comment.hidden = currentFilters.some(filter => haystack.includes(filter.toLowerCase()));
	});
	if (toolbar) {
		const count = toolbar.querySelector('.ztc-filter-count');
		count.textContent = currentFilters.length ? `${currentFilters.length} active` : 'No filters';
	}
}

async function addFilter(value: string) {
	const filter = value.trim();
	if (!filter || currentFilters.some(item => item.toLowerCase() === filter.toLowerCase())) return;
	currentFilters.push(filter);
	await storage.set(filterKey(), currentFilters);
	applyFilters();
}

function createToolbar() {
	if (document.querySelector('.ztc-toolbar')) return;
	toolbar = document.createElement('aside');
	toolbar.className = 'ztc-toolbar';
	toolbar.setAttribute('aria-label', 'Thread reader tools');
	toolbar.innerHTML = `
		<strong>Thread reader</strong>
		<span class="ztc-keys"><kbd>J</kbd>/<kbd>K</kbd> move · <kbd>E</kbd> expand · <kbd>X</kbd> collapse</span>
		<form class="ztc-filter-form">
			<label>Hide in r/${subreddit()} <input name="filter" placeholder="author or phrase" autocomplete="off"></label>
			<button type="submit">Add filter</button>
		</form>
		<span class="ztc-filter-count">No filters</span>
	`;
	toolbar.querySelector('form').addEventListener('submit', async event => {
		event.preventDefault();
		const input = toolbar.querySelector('input');
		await addFilter(input.value);
		input.value = '';
		input.blur();
	});
	document.body.prepend(toolbar);
}

function refresh() {
	comments = Array.from(document.querySelectorAll(COMMENT_SELECTOR));
	if (!comments.length) return;
	createToolbar();
	if (!positionRestoreStarted) {
		positionRestoreStarted = true;
		restorePosition();
	}
	comments.forEach(comment => {
		decorateTag(comment);
		decorateMedia(comment);
	});
	document.querySelectorAll('shreddit-post').forEach(post => decorateMedia(post));
	applyFilters();
}

async function restorePosition() {
	const saved = await storage.get(positionKey());
	if (!saved) return;
	const target = comments.find(comment => commentId(comment) === saved.commentId);
	if (target) setActive(target, { scroll: false, remember: false });
	if (typeof saved.scrollY === 'number') window.scrollTo(0, saved.scrollY);
}

function onKeydown(event: KeyboardEvent) {
	if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
	const key = event.key.toLowerCase();
	if (key === 'j' || key === 'k') {
		event.preventDefault();
		move(key === 'j' ? 1 : -1);
	} else if (key === 'e') {
		const current = comments[activeIndex];
		current?.querySelector('.ztc-media-toggle:not([aria-expanded="true"])')?.click();
	} else if (key === 'x') {
		collapseMedia(null);
	}
}

module.go = async () => {
	currentFilters = await storage.get(filterKey()) || [];
	refresh();
	window.addEventListener('keydown', onKeydown, true);
	observer = new MutationObserver(() => {
		if (refreshScheduled) return;
		refreshScheduled = true;
		requestAnimationFrame(() => {
			refreshScheduled = false;
			refresh();
		});
	});
	observer.observe(document.body, { childList: true, subtree: true });
};
