import config from "./config.js";
import { waitForIframe, waitForIframeDocument, watchElement } from "../helper/siemObserver.js";
import { hookDomapi } from "../helper/domapi.js";

/* ==================================================
   DEBUG
================================================== */
const TAG = "[log-prettier]";
const log = (...a) => console.log(TAG, ...a);

/* ==================================================
   MODULE STATE (persist during lifecycle)
================================================== */
const state = {
	tabSet: null,
	tabInjected: false,
};

/* ==================================================
   STYLE
================================================== */
function injectStyle(doc) {
	if (!doc || !doc.head) return;
	if (doc.getElementById("mx-log-prettier-style")) return;

	const style = doc.createElement("style");
	style.id = "mx-log-prettier-style";
	style.textContent = `
		.mx-pretty-wrapper { margin-top: 8px; }
		.mx-pretty-block {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 13px;
			line-height: 1.6;
			padding: 10px;
			background: #f8fafc;
			border-radius: 6px;
			overflow: auto;
		}
		.mx-row { display: flex; gap: 12px; padding: 2px 0; }
		.mx-key {
			min-width: 220px;
			color: #475569;
			font-weight: 600;
			white-space: nowrap;
		}
		.mx-val { color: #0f172a; word-break: break-all; }
		.mx-divider {
			margin: 8px 0;
			border: none;
			border-top: 1px solid rgba(148,163,184,.4);
		}
		.mx-raw summary {
			cursor: pointer;
			color: #2563eb;
			font-weight: 600;
			margin-bottom: 6px;
		}
		.mx-ip-public {
			color: #dc2626;
			font-weight: 700;
			background: rgba(220,38,38,.12);
			border-radius: 4px;
			padding: 0 3px;
		}
		.mx-ip-private {
			color: #2563eb;
			font-weight: 700;
			background: rgba(37,99,235,.12);
			border-radius: 4px;
			padding: 0 3px;
		}
		.mx-ip-loopback {
			color: #64748b;
			font-weight: 600;
			background: rgba(100,116,139,.12);
			border-radius: 4px;
			padding: 0 3px;
		}
		.mx-ip-invalid {
			color: #7c3aed;
			font-weight: 600;
			background: rgba(124,58,237,.1);
			border-radius: 4px;
			padding: 0 3px;
		}
	`;
	doc.head.appendChild(style);
}

/* ==================================================
   PRETTY RENDER
================================================== */
const IP_REGEX = /\b(\d{1,3}\.){3}\d{1,3}\b/g;

function getIPType(ip) {
	const p = ip.split(".").map(Number);
	if (p.length !== 4 || p.some(Number.isNaN)) return "invalid";
	const [a, b] = p;
	if (a === 127) return "loopback";
	if (a === 10) return "private";
	if (a === 192 && b === 168) return "private";
	if (a === 172 && b >= 16 && b <= 31) return "private";
	return "public";
}

function highlightIP(text) {
	return text.replace(IP_REGEX, (ip) => {
		const type = getIPType(ip);
		return `<span class="mx-ip-${type}">${ip}</span>`;
	});
}

function escapeHtml(s) {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function parseKeyValue(raw) {
	const fields = [];
	const regex = /([A-Za-z0-9_.-]+)=([^\t\n\r]+)/g;
	let m;
	while ((m = regex.exec(raw))) {
		fields.push({ key: m[1], value: (m[2] || "").trim() });
	}
	return fields;
}

function renderPretty(rawText) {
	const safeRaw = escapeHtml(rawText);
	const fields = parseKeyValue(rawText);

	if (!fields.length) {
		return `<pre>${highlightIP(safeRaw)}</pre>`;
	}

	const rows = fields
		.map(
			(f) => `
			<div class="mx-row">
				<span class="mx-key">${escapeHtml(f.key)}</span>
				<span class="mx-val">${highlightIP(escapeHtml(f.value))}</span>
			</div>
		`
		)
		.join("");

	return `
		<div class="mx-pretty-block">
			${rows}
			<hr class="mx-divider"/>
			<details class="mx-raw">
				<summary>Raw message</summary>
				<pre>${highlightIP(safeRaw)}</pre>
			</details>
		</div>
	`;
}

/* ==================================================
   TABSET HANDLER
================================================== */
function ensureMaxxTab(tabSet, containerId) {
	try {
		if (!state.tabInjected) {
			try {
				tabSet.addPage({ text: "maxx", type: "DIV", index: 0 });
			} catch {}
			state.tabInjected = true;
		}
		tabSet.assignElement({ id: containerId, index: 0 });
		tabSet.setIndex(0);
	} catch (e) {
		console.warn("[log-prettier] tab error", e);
	}
}

/* ==================================================
   MODULE ENTRY
================================================== */
export default function logPrettier(ctx) {
	if (!config.enabled) return;
	if (config.iframe === false && ctx?.isIframe) return;

	waitForIframe(config.selector.frameTarget, (iframe) => {
		log("iframe found:", iframe.id || iframe.name);

		waitForIframeDocument(iframe, (doc) => {
			log("iframe document ready");

			const win = iframe.contentWindow;

			/* -------- domapi hook (tabset) -------- */
			hookDomapi(win, (tabSet) => {
				state.tabSet = tabSet;
				log("tabSet captured");

				const el = doc.querySelector(".mx-pretty-wrapper");
				if (el) ensureMaxxTab(tabSet, el.id);
			});

			/* -------- rawlog observer -------- */
			watchElement(doc, `${config.selector.rawlogContainer} ${config.selector.rawlogPre}`, (rawPre, rawText) => {
				injectStyle(doc);

				const widget = rawPre.closest(config.selector.rawlogContainer);
				if (!widget) return;

				let box = widget.querySelector(".mx-pretty-wrapper");
				if (!box) {
					box = doc.createElement("div");
					box.className = "mx-pretty-wrapper";
					box.id = "mx_pretty_container";
					widget.appendChild(box);
				}

				box.innerHTML = renderPretty(rawText);

				if (state.tabSet) {
					ensureMaxxTab(state.tabSet, box.id);
				}
			});
		});
	});
}
