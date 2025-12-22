// src/modules/soc/siem/log_prettier/index.js

const MAXX_ID = "MX_LOG_PRETTIER_PAGE";

/* =========================
   STYLE
========================= */
function injectStyle(doc) {
	if (doc.getElementById("mx-log-prettier-style")) return;

	const style = doc.createElement("style");
	style.id = "mx-log-prettier-style";
	style.textContent = `
		#${MAXX_ID} {
			width: 100%;
			height: 100%;
			overflow: auto;
			box-sizing: border-box;
			padding: 6px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 13px;
			line-height: 1.6;
		}

		.mx-row {
			display: flex;
			gap: 12px;
			padding: 2px 0;
		}

		.mx-key {
			min-width: 220px;
			font-weight: 600;
			white-space: nowrap;
			color: #334155;
		}

		.mx-divider {
			margin: 8px 0;
			border-top: 1px solid #cbd5e1;
		}
	`;
	doc.head.appendChild(style);
}

/* =========================
   UTIL
========================= */
function escapeHtml(s) {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* =========================
   PARSE & RENDER
========================= */
function parseKeyValue(raw) {
	const out = [];
	const re = /([A-Za-z0-9_.-]+)=([^\t\n\r]+)/g;
	let m;

	while ((m = re.exec(raw))) {
		out.push({ k: m[1], v: m[2] });
	}
	return out;
}

function renderPretty(raw) {
	const fields = parseKeyValue(raw);

	if (!fields.length) {
		return `<pre>${escapeHtml(raw)}</pre>`;
	}

	return `
		${fields
			.map(
				(f) => `
				<div class="mx-row">
					<span class="mx-key">${f.k}</span>
					<span>${escapeHtml(f.v)}</span>
				</div>`
			)
			.join("")}
		<hr class="mx-divider"/>
		<details>
			<summary>Raw</summary>
			<pre>${escapeHtml(raw)}</pre>
		</details>
	`;
}

/* =========================
   PAGECONTROL
========================= */
function waitForPagecontrol(win, cb, timeout = 5000) {
	const start = Date.now();
	const timer = setInterval(() => {
		let pc = null;
		try {
			pc = Object.values(win).find(
				(v) => v && typeof v.addPage === "function" && typeof v.assignElement === "function" && typeof v.setIndex === "function" && v._tabset
			);
		} catch {}

		if (pc) {
			clearInterval(timer);
			cb(pc);
			return;
		}

		if (Date.now() - start > timeout) {
			clearInterval(timer);
		}
	}, 100);
}

/* =========================
   STATE
========================= */
const state = {
	maxxIndex: -1,
	lastHTML: "",
};

/* =========================
   TAB INIT
========================= */
function hideMaxxNotebookPage(el) {
	const page = el.closest(".DA_NOTEBOOKPAGE, .da-notebookpage");
	if (page) page.style.display = "none";
}

function ensureMaxxTab(pc, doc) {
	if (state.maxxIndex !== -1) return;

	pc.addPage({ text: "maxx", type: "DIV" });
	state.maxxIndex = pc.pages.length - 1;

	let el = doc.getElementById(MAXX_ID);
	if (!el) {
		el = doc.createElement("div");
		el.id = MAXX_ID;
		el.textContent = "⏳ waiting log...";
		doc.body.appendChild(el);
	}

	pc.assignElement({
		id: MAXX_ID,
		index: state.maxxIndex,
	});

	// 🔴 quan trọng: KHÔNG cho maxx chiếm chỗ mặc định
	hideMaxxNotebookPage(el);
}

/* =========================
   NOTEBOOKPAGE VISIBILITY
========================= */
function isElementVisible(el) {
	if (!el) return false;
	const page = el.closest(".DA_NOTEBOOKPAGE, .da-notebookpage");
	if (!page) return false;
	if (page.style.display === "none") return false;
	return page.offsetWidth > 0 && page.offsetHeight > 0;
}

function hideOtherNotebookPages(doc, el) {
	const pages = doc.querySelectorAll(".DA_NOTEBOOKPAGE, .da-notebookpage");
	const myPage = el.closest(".DA_NOTEBOOKPAGE, .da-notebookpage");

	pages.forEach((p) => {
		p.style.display = p === myPage ? "" : "none";
	});
}

function restoreNotebookPages(doc) {
	const pages = doc.querySelectorAll(".DA_NOTEBOOKPAGE, .da-notebookpage");
	pages.forEach((p) => (p.style.display = ""));
}

/* =========================
   WATCH RAW LOG
========================= */
function watchElement(doc, selector, onChange) {
	let lastText = null;

	const scan = () => {
		const el = doc.querySelector(selector);
		if (!el) return;

		const text = el.textContent || "";
		if (text === lastText) return;

		lastText = text;
		onChange(el, text);
	};

	scan();

	new MutationObserver(scan).observe(doc.body, {
		childList: true,
		subtree: true,
		characterData: true,
	});
}

/* =========================
   IFRAME HELPERS
========================= */
function waitForIframe(targets, cb) {
	const fe = window.frameElement;
	if (fe && (targets.includes(fe.id) || targets.includes(fe.name))) {
		cb(fe);
		return;
	}

	const scan = () => {
		for (const i of document.querySelectorAll("iframe")) {
			if (targets.includes(i.id) || targets.includes(i.name)) {
				cb(i);
				return true;
			}
		}
		return false;
	};

	if (scan()) return;

	const obs = new MutationObserver(() => {
		if (scan()) obs.disconnect();
	});
	obs.observe(document.documentElement, { childList: true, subtree: true });
}

function waitForIframeDocument(iframe, cb) {
	const tryAttach = () => {
		try {
			const doc = iframe.contentDocument;
			if (doc && doc.body) {
				cb(doc);
				return true;
			}
		} catch {}
		return false;
	};

	if (tryAttach()) return;
	iframe.addEventListener("load", tryAttach);
}

/* =========================
   ENTRY
========================= */
function logPrettier() {
	waitForIframe(["PAGE_EVENTVIEWER", "mainPage"], (iframe) => {
		waitForIframeDocument(iframe, (doc) => {
			injectStyle(doc);

			watchElement(doc, "div.binaryWidget pre.utf", (_, rawText) => {
				const html = renderPretty(rawText);
				state.lastHTML = html;

				const win = doc.defaultView || window;
				waitForPagecontrol(win, (pc) => {
					ensureMaxxTab(pc, doc);

					const el = doc.getElementById(MAXX_ID);
					if (!el) return;

					// luôn render (giống bản stable)
					el.innerHTML = html;

					// chỉ khi user đang ở tab maxx thì mới chiếm layout
					if (isElementVisible(el)) {
						hideOtherNotebookPages(doc, el);
					} else {
						restoreNotebookPages(doc);
						hideMaxxNotebookPage(el);
					}
				});
			});
		});
	});
}

export default logPrettier;
