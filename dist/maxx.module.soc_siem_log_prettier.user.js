// ==UserScript==
// @name         MAXX [DEV] log-prettier module
// @namespace    maxx-dev
// @version      0.0.0-dev
// @description  Dev build for module: log-prettier module
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @grant        none
// @charset      utf-8
// ==/UserScript==

// module: log-prettier module | bG9nLXByZXR0aWVyIG1vZHVsZQ==


(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/modules/soc/siem/log_prettier/config.js
  var config_default = {
    name: "log-prettier module",
    // module-id: bG9nLXByZXR0aWVyIG1vZHVsZQ==
    enabled: true,
    match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: true,
    once: false,
    priority: 10,
    selector: {
      container: "div.binaryWidget",
      pre: "pre.utf"
    },
    /**
     * =========================
     * FORMAT RULES
     * =========================
     * - match(raw): boolean
     * - format(raw): string
     */
    formats: [
      {
        name: "sysmon-operational",
        match(raw) {
          return raw.includes("Microsoft-Windows-Sysmon/Operational");
        },
        format(raw) {
          return raw.replace(/^<\d+>.*?\s(?=\w+=)/, (m) => m + "\n\n").replace(/[\r\n\t]+/g, " ").replace(/\s+(?=\w+=)/g, "\n").replace(
            /Message=([\s\S]*?)(?=\n[A-Z][a-zA-Z]+=?|$)/,
            (_, msg) => "Message:\n" + msg.replace(/\s+(?=[A-Z][a-zA-Z]+:)/g, "\n  ").replace(/:\s+/g, ": ").replace(/\s+(?=Parent)/g, "\n  ")
          ).replace(/(CommandLine:)\s*(.+)/g, (_, k, v) => `${k}
    ${v}`).replace(/(ParentCommandLine:)\s*(.+)/g, (_, k, v) => `${k}
    ${v}`).replace(
            /Hashes:\s*([^\n]+)/,
            (_, hashes) => "Hashes:\n" + hashes.split(",").map((h) => "  " + h.trim()).join("\n")
          ).replace(/(ParentProcessGuid:[^\n]+)/, (m) => m.includes("Parent Process:") ? m : "\nParent Process:\n  " + m).replace(/(ParentProcessId:[^\n]+)/, "  $1").replace(/(ParentImage:[^\n]+)/, "  $1").replace(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, "[IP:$&]").replace(/(CommandLine:\n\s+)(.+)/g, (_, k, v) => `${k}▶ ${v}`).replace(/([A-Z]:\\[^\s\n]+)/g, "📁 $1");
        }
      }
    ]
  };

  // src/modules/soc/siem/log_prettier/index.js
  var ICON_CLASS = "mx-log-format-icon";
  var ICON_DATA = "data-mx-raw";
  var STYLE_ID = "mx-log-prettier-style";
  function injectStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
		.mx-log-wrap {
			position: relative;
		}

		.${ICON_CLASS} {
			position: absolute;
			top: 6px;
			right: 6px;
			width: 18px;
			height: 18px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			opacity: 0.55;
			border-radius: 50%;
			background: rgba(37, 99, 235, 0.08);
			transition: all 0.15s ease;
		}

		.${ICON_CLASS}:hover {
			opacity: 1;
			background: rgba(37, 99, 235, 0.18);
			transform: rotate(90deg);
		}

		.${ICON_CLASS} img {
			width: 12px;
			height: 12px;
			pointer-events: none;
		}

		pre.mx-formatted {
			white-space: pre-wrap;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 13px;
			line-height: 1.65;
		}
	`;
    doc.head.appendChild(style);
  }
  __name(injectStyle, "injectStyle");
  function resolveFormat(raw) {
    for (const rule of config_default.formats || []) {
      try {
        if (rule.match(raw)) return rule.format(raw);
      } catch (e) {
        console.warn("[log-prettier]", rule.name, e);
      }
    }
    return null;
  }
  __name(resolveFormat, "resolveFormat");
  function createIcon(doc) {
    const icon = doc.createElement("span");
    icon.className = ICON_CLASS;
    const img = doc.createElement("img");
    img.src = "https://cdn-icons-png.flaticon.com/512/1828/1828911.png";
    img.alt = "format log";
    icon.appendChild(img);
    return icon;
  }
  __name(createIcon, "createIcon");
  function attach(pre) {
    if (!pre || pre.dataset.mxBound === "1") return;
    pre.dataset.mxBound = "1";
    const doc = pre.ownerDocument;
    let wrap = pre.parentElement;
    if (!wrap.classList.contains("mx-log-wrap")) {
      wrap = doc.createElement("div");
      wrap.className = "mx-log-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);
    }
    if (wrap.querySelector(`.${ICON_CLASS}`)) return;
    const icon = createIcon(doc);
    wrap.appendChild(icon);
    icon.addEventListener("click", () => {
      const raw = pre.getAttribute(ICON_DATA);
      if (!raw) {
        const original = pre.textContent;
        const formatted = resolveFormat(original);
        if (!formatted) return;
        pre.setAttribute(ICON_DATA, original);
        pre.textContent = formatted;
        pre.classList.add("mx-formatted");
      } else {
        pre.textContent = raw;
        pre.removeAttribute(ICON_DATA);
        pre.classList.remove("mx-formatted");
      }
    });
  }
  __name(attach, "attach");
  function findPre(doc) {
    const { container, pre } = config_default.selector;
    if (container) {
      const wrap = doc.querySelector(container);
      if (wrap) {
        const p = wrap.querySelector(pre || "pre");
        if (p) return p;
      }
    }
    return doc.querySelector("#GUID_6 pre, pre.utf, pre");
  }
  __name(findPre, "findPre");
  function observe(doc) {
    const scan = /* @__PURE__ */ __name(() => {
      const pre = findPre(doc);
      if (pre) attach(pre);
    }, "scan");
    scan();
    new MutationObserver(scan).observe(doc.body, {
      childList: true,
      subtree: true
    });
  }
  __name(observe, "observe");
  function logPrettier() {
    try {
      const doc = document;
      if (!doc.body) return;
      injectStyle(doc);
      observe(doc);
    } catch {
    }
  }
  __name(logPrettier, "logPrettier");
  if (true) {
    window.__MAXX_DEV_ENTRY__ = logPrettier;
  }
})();



;(() => {
	const run = window.__MAXX_DEV_ENTRY__;

	if (typeof run !== "function") {
		console.warn("[MAXX DEV] Không tìm thấy entry function");
		return;
	}

	const ctx = {
		mode: "dev",
		source: "build_module",
	};

	if (document.readyState !== "loading") {
		run(ctx);
	} else {
		window.addEventListener("DOMContentLoaded", () => run(ctx), {
			once: true,
		});
	}
})();
