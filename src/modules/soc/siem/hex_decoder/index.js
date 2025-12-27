// src/modules/soc/siem/hex_decoder/index.js

import config from "./config";

export default function runHexDecoderModule(ctx) {
	const sel = config.selector;

	// =============================
	// 1. Check iframe context
	// =============================
	function isAllowedIframe() {
		if (!sel.iframeId || !sel.iframeId.length) return false;

		const frame = window.frameElement;
		if (!frame || !frame.id) return false;

		return sel.iframeId.includes(frame.id);
	}

	if (!isAllowedIframe()) {
		return;
	}

	// =============================
	// 2. State
	// =============================
	let enabled = false;

	const ORIGINAL_TEXT = new Map(); // element -> originalText

	// =============================
	// 3. Utils
	// =============================
	function isHexString(str) {
		if (!str) return false;
		const s = str.trim();
		return s.length >= 8 && s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s);
	}

	function hexToUtf8(hex) {
		try {
			const bytes = hex.match(/.{1,2}/g).map((b) => parseInt(b, 16));
			const decoder = new TextDecoder("utf-8", { fatal: false });
			return decoder.decode(new Uint8Array(bytes));
		} catch {
			return null;
		}
	}

	function decodeTextNode(el) {
		const raw = el.textContent;
		if (!raw) return false;

		// tìm các đoạn hex dài (>=8 ký tự)
		const hexChunks = raw.match(/[0-9a-fA-F]{8,}/g);
		if (!hexChunks) return false;

		let replaced = raw;
		let changed = false;

		hexChunks.forEach((hex) => {
			if (hex.length % 2 !== 0) return;

			const decoded = hexToUtf8(hex);
			if (!decoded || decoded.includes("\uFFFD")) return;

			replaced = replaced.replace(hex, decoded);
			changed = true;
		});

		if (!changed) return false;

		ORIGINAL_TEXT.set(el, raw);
		el.textContent = replaced;
		el.style.color = "yellow";
		el.style.fontWeight = "400";

		return true;
	}

	function restoreTextNode(el) {
		if (!ORIGINAL_TEXT.has(el)) return;

		el.textContent = ORIGINAL_TEXT.get(el);
		el.style.color = "";
		el.style.fontWeight = "";
	}

	// =============================
	// 4. Scan targets
	// =============================
	function getTargets() {
		const targets = [];

		// Event Viewer log
		sel.eventViewerLogContainerClass?.forEach((s) => {
			document.querySelectorAll(s).forEach((el) => targets.push(el));
		});

		// Event table cells
		sel.eventTableCells?.forEach((s) => {
			document.querySelectorAll(s).forEach((td) => {
				td.querySelectorAll("span").forEach((sp) => targets.push(sp));
			});
		});

		return targets;
	}

	// =============================
	// 5. Toggle logic
	// =============================
	function enableDecode() {
		getTargets().forEach((el) => {
			if (!ORIGINAL_TEXT.has(el)) {
				decodeTextNode(el);
			}
		});
	}

	function disableDecode() {
		ORIGINAL_TEXT.forEach((original, el) => {
			el.textContent = original;
			el.style.color = "";
			el.style.fontWeight = "";
		});
		ORIGINAL_TEXT.clear();
	}

	function toggle() {
		enabled = !enabled;
		enabled ? enableDecode() : disableDecode();
		updateButton();
	}

	// =============================
	// 6. Inject toolbar button
	// =============================
	let btn;

	function updateButton() {
		if (!btn) return;
		btn.style.background = enabled ? "#8b0000" : "";
		btn.style.color = enabled ? "#fff" : "";
	}

	function injectButton() {
		const toolbar = document.querySelector(sel.toolbarClass.map((c) => `.${c}`).join(","));
		if (!toolbar) return;

		btn = document.createElement("div");
		btn.textContent = "Hex Decode";
		btn.style.cssText = `
			display: inline-flex;
			align-items: center;
			padding: 2px 8px;
			margin-left: 6px;
			border: 1px solid #888;
			border-radius: 3px;
			cursor: pointer;
			font-size: 12px;
			user-select: none;
		`;

		btn.addEventListener("click", toggle);
		toolbar.appendChild(btn);
	}

	injectButton();
}
