// =======================================================
// Maxx – Log Prettier (QRadar / SIEM)
// FINAL CLEAN VERSION
// =======================================================

const MAXX_TAB_ID = "MX_LOG_PRETTIER_PAGE";

/* =========================
   UTIL
========================= */
function escapeHtml(s) {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* =========================
   STYLE
========================= */
function injectStyle(doc) {
	if (doc.getElementById("mx-log-prettier-style")) return;

	const style = doc.createElement("style");
	style.id = "mx-log-prettier-style";
	style.textContent = `
    .mx-pretty-wrap {
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 6px;
      box-sizing: border-box;
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
   PARSE & RENDER
========================= */
function parseKeyValue(raw) {
	const out = [];
	const re = /([A-Za-z0-9_.-]+)=([^\t\r\n]+)/g;
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
   PAGECONTROL HELPERS
========================= */
function waitForPagecontrol(win, cb, timeout = 5000) {
	const start = Date.now();
	const timer = setInterval(() => {
		let pc;
		try {
			pc = Object.values(win).find(
				(v) => v && typeof v.addPage === "function" && typeof v.assignElement === "function" && typeof v.setIndex === "function" && v._tabset
			);
		} catch {}

		if (pc) {
			clearInterval(timer);
			cb(pc);
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
	index: -1,
	container: null,
	lastHTML: "",
	hooked: false,
};

/* =========================
   TAB INIT
========================= */
function ensureMaxxTab(pc, doc) {
	if (state.index !== -1) return;

	pc.addPage({ text: "maxx", type: "DIV" });
	state.index = pc.pages.length - 1;

	let container = doc.getElementById(MAXX_TAB_ID);
	if (!container) {
		container = doc.createElement("div");
		container.id = MAXX_TAB_ID;
		container.className = "mx-pretty-wrap";
		doc.body.appendChild(container);
	}

	pc.assignElement({
		id: MAXX_TAB_ID,
		index: state.index,
	});

	state.container = container;
}

/* =========================
   SYNC TAB STATE (CRITICAL)
========================= */
function hookSetIndex(pc) {
	if (state.hooked) return;
	state.hooked = true;

	const orig = pc.setIndex;
	pc.setIndex = function (i) {
		const ret = orig.apply(this, arguments);

		if (i === state.index && state.container) {
			state.container.innerHTML = state.lastHTML || "";
		}

		return ret;
	};
}

/* =========================
   WATCH RAW LOG
========================= */
function watchRawLog(doc, cb) {
	let last = null;

	const scan = () => {
		const pre = doc.querySelector("div.binaryWidget pre.utf");
		if (!pre) return;

		const text = pre.textContent || "";
		if (text === last) return;

		last = text;
		cb(text);
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

	new MutationObserver(() => {
		if (scan()) this.disconnect?.();
	}).observe(document.documentElement, { childList: true, subtree: true });
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

			watchRawLog(doc, (raw) => {
				const html = renderPretty(raw);
				state.lastHTML = html;

				const win = doc.defaultView || window;
				waitForPagecontrol(win, (pc) => {
					ensureMaxxTab(pc, doc);
					hookSetIndex(pc);

					// chỉ render nếu tab đang active
					if (pc.tabIndex === state.index && state.container) {
						state.container.innerHTML = html;
					}
				});
			});
		});
	});
}

export default logPrettier;
