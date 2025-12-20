import config from "./config.js";
import { waitForIframe, waitForIframeDocument, watchElement } from "../helper/siemObserver.js";

/* ==================================================
   DEBUG
================================================== */
const TAG = "[log-prettier]";
const log = (...a) => console.log(TAG, ...a);

/* ==================================================
   STYLE
================================================== */
function injectStyle(doc) {
	if (!doc || !doc.head) return;
	if (doc.getElementById("mx-log-prettier-style")) return;

	const style = doc.createElement("style");
	style.id = "mx-log-prettier-style";
	style.textContent = `
		.mx-pretty-block {
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 13px;
			line-height: 1.6;
			padding: 8px;
		}

		.mx-row {
			display: flex;
			gap: 12px;
			padding: 2px 0;
		}

		.mx-key {
			min-width: 220px;
			color: #475569;
			font-weight: 600;
			white-space: nowrap;
		}

		.mx-val {
			color: #0f172a;
			word-break: break-all;
		}

		.mx-divider {
			margin: 8px 0;
			border: none;
			border-top: 1px solid rgba(148,163,184,.4);
		}

		.mx-raw summary {
			cursor: pointer;
			color: #2563eb;
			font-weight: 600;
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
		return `<span class="mx-ip-${getIPType(ip)}">${ip}</span>`;
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
   TAB / PAGE HANDLER (DOM LEVEL – SIEM SAFE)
================================================== */
function ensureMaxxTab(tabHeader) {
	if (tabHeader.querySelector("li[data-mx='maxx']")) return;

	const li = document.createElement("li");
	li.className = "DA_TAB DA_TAB_RIGHTEND";
	li.dataset.mx = "maxx";

	const span = document.createElement("span");
	span.textContent = "maxx";
	li.appendChild(span);

	tabHeader.appendChild(li);
}

function ensureMaxxPage(notebook, html) {
	let page = notebook.querySelector(".DA_NOTEBOOKPAGE[data-mx='maxx']");
	if (!page) {
		page = document.createElement("div");
		page.className = "DA_NOTEBOOKPAGE";
		page.dataset.mx = "maxx";
		page.style.cssText = `
			display: none;
			height: 100%;
			overflow: auto;
			padding: 4px;
		`;
		notebook.appendChild(page);
	}
	page.innerHTML = html;
	return page;
}

function wireTabSwitch(tabHeader, notebook) {
	const tabs = Array.from(tabHeader.children);
	const pages = Array.from(notebook.children);

	tabs.forEach((tab, idx) => {
		tab.onclick = () => {
			tabs.forEach((t) => t.classList.remove("DA_TAB_SELECTED"));
			tab.classList.add("DA_TAB_SELECTED");

			pages.forEach((p) => (p.style.display = "none"));
			if (pages[idx]) pages[idx].style.display = "block";
		};
	});
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

			watchElement(doc, `${config.selector.rawlogContainer} ${config.selector.rawlogPre}`, (rawPre, rawText) => {
				injectStyle(doc);

				const widget = rawPre.closest("div.binaryWidget");
				if (!widget) return;

				const tabHeader = widget.querySelector("ul.DA_ROW");
				const notebook = widget.querySelector(".DA_NOTEBOOK");
				if (!tabHeader || !notebook) return;

				ensureMaxxTab(tabHeader);

				const html = renderPretty(rawText);
				ensureMaxxPage(notebook, html);

				wireTabSwitch(tabHeader, notebook);
			});
		});
	});
}
