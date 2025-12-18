// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      2.15
// @description  Maxx Script
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @grant        none
// @charset      utf-8
// @updateURL    https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// @downloadURL  https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// ==/UserScript==


(() => {
  // src/modules/test/index.js
  function runTestModule(ctx) {
  }

  // src/modules/test/config.js
  var config_default = {
    name: "test-module",
    enabled: true,
    // 🔥 bật / tắt nhanh
    match: ["*://*.google.com/*", "*://localhost/*"],
    exclude: ["*://mail.google.com/*"],
    runAt: "document-end",
    // document-start | document-end | idle
    iframe: false,
    // false = chỉ chạy top window
    once: true,
    // true = chỉ chạy 1 lần / page
    priority: 10
    // số lớn chạy trước (dùng khi tool phụ thuộc nhau)
  };

  // src/modules/soc/siem/selected_search/config.js
  var config_default2 = {
    /* ==========================
            MODULE META
    ========================== */
    name: "virustotal-search module",
    enabled: true,
    match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: true,
    once: true,
    priority: 10,
    /* ==========================
            FEATURE CONFIG
    ========================== */
    ui: {
      offsetX: 8,
      offsetY: -10,
      zIndex: 999999,
      animation: true
    },
    engines: {
      google: {
        label: "G",
        url: (q) => `https://www.google.com/search?q=${q}`,
        class: "mx-google"
      },
      vt: {
        label: "VT",
        url: (q) => `https://www.virustotal.com/gui/search/${q}`,
        class: "mx-vt"
      }
    }
  };

  // src/modules/soc/siem/selected_search/index.js
  function selectedSearch(ctx) {
    if (!config_default2.enabled) return;
    const { engines, ui } = config_default2;
    const style = document.createElement("style");
    style.textContent = `
		.mx-search-box {
			position: fixed;
			display: flex;
			gap: 6px;
			padding: 6px;
			background: rgba(15,23,42,.85);
			backdrop-filter: blur(6px);
			border-radius: 999px;
			box-shadow: 0 10px 30px rgba(0,0,0,.4);
			transform: scale(.6);
			opacity: 0;
			pointer-events: none;
			transition: all .2s cubic-bezier(.25,.8,.25,1);
			z-index: ${ui?.zIndex ?? 999999};
		}

		.mx-search-box.show {
			transform: scale(1);
			opacity: 1;
			pointer-events: auto;
		}

		.mx-btn {
			width: 34px;
			height: 34px;
			border-radius: 50%;
			display: grid;
			place-items: center;
			cursor: pointer;
			font-weight: 700;
			font-size: 13px;
			color: #fff;
			user-select: none;
			transition: all .2s ease;
		}

		.mx-btn:hover {
			transform: scale(1.15) rotate(6deg);
			box-shadow: 0 0 12px currentColor;
		}

		.mx-google {
			background: radial-gradient(circle,#60a5fa,#2563eb);
		}

		.mx-vt {
			background: radial-gradient(circle,#34d399,#059669);
		}
	`;
    document.head.appendChild(style);
    const box = document.createElement("div");
    box.className = "mx-search-box";
    let selectedText = "";
    Object.values(engines).forEach((engine) => {
      const btn = document.createElement("div");
      btn.className = `mx-btn ${engine.class}`;
      btn.textContent = engine.label;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!selectedText) return;
        window.open(engine.url(encodeURIComponent(selectedText)), "_blank");
        hide();
      });
      box.appendChild(btn);
    });
    document.body.appendChild(box);
    function show(rect) {
      box.style.left = rect.right + (ui?.offsetX ?? 8) + "px";
      box.style.top = rect.top + (ui?.offsetY ?? -10) + "px";
      box.classList.add("show");
    }
    function hide() {
      box.classList.remove("show");
      selectedText = "";
    }
    document.addEventListener("mouseup", () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return hide();
      const text = sel.toString().trim();
      if (!text) return hide();
      selectedText = text;
      try {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (rect.width || rect.height) show(rect);
      } catch {
        hide();
      }
    });
    document.addEventListener("mousedown", (e) => {
      if (!box.contains(e.target)) hide();
    });
  }

  // src/modules/soc/siem/offense_whitelist_highlighter/config.js
  var config_default3 = {
    /* ==========================
            MODULE META
    ========================== */
    name: "offense-whitelist-highlighter module",
    enabled: true,
    match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: true,
    once: true,
    priority: 10,
    /* ==========================
            FEATURE CONFIG
    ========================== */
    selector: {
      frameName: "PAGE_SEM",
      table: "#tableSection table#defaultTable",
      thead: "#tableSection table#defaultTable thead",
      tbody: "#tableSection table#defaultTable tbody",
      rows: "#tableSection table#defaultTable tbody tr"
    },
    mss: {
      whitelist: ["REC: Alert from IDPS of BO_KHCN containing", "Cang_HPG"]
    },
    siem: {
      whitelist: ["VNPT Media EXE: Detect wscript or cscript execute vbs file"]
    }
  };

  // src/modules/soc/siem/helper/iframe.js
  function isActiveIframe() {
    return document.body && document.body.offsetHeight > 0;
  }

  // src/modules/soc/siem/helper/observe.js
  function observeElement(target, callback, options = {}) {
    if (!target) return null;
    const observer = new MutationObserver((mutations) => {
      callback(mutations);
    });
    observer.observe(target, {
      childList: true,
      subtree: true,
      ...options
    });
    return observer;
  }

  // src/modules/soc/siem/offense_whitelist_highlighter/index.js
  function offenseWhitelistHighlighter(ctx) {
    if (!config_default3.enabled) return;
    if (config_default3.iframe && !isActiveIframe()) return;
    const url = ctx.url || location.href;
    const isMSS = url.includes("mss.");
    const rawWhitelist = isMSS ? config_default3.mss.whitelist : config_default3.siem.whitelist;
    if (!Array.isArray(rawWhitelist) || rawWhitelist.length === 0) return;
    const whitelist = rawWhitelist.map((k) => k?.toLowerCase().trim()).filter(Boolean);
    if (whitelist.length === 0) return;
    const style = document.createElement("style");
    style.textContent = `
		tr.mx-offense-whitelist-row {
			outline: 1px solid rgba(148,163,184,.45);
			outline-offset: -1px;
			box-shadow: inset 3px 0 0 rgba(148,163,184,.7);
		}

		tr.mx-offense-whitelist-row td[propertyname="offenseId"] {
			color: #dc2626 !important;
			font-weight: 600;
		}

		tr.mx-offense-whitelist-row.datarowselected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.is-selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row[aria-selected="true"] td[propertyname="offenseId"] {
			color: #fecaca !important;
		}

		.mx-whitelist-badge {
			margin-left: 6px;
			padding: 1px 6px;
			border-radius: 999px;
			font-size: 11px;
			border: 1px solid rgba(148,163,184,.5);
			background: rgba(148,163,184,.12);
			color: #334155;
			user-select: none;
			white-space: nowrap;
		}
	`;
    document.head.appendChild(style);
    let processedRows = /* @__PURE__ */ new WeakMap();
    function getRowSearchText(tr) {
      const tds = tr.querySelectorAll("td");
      if (!tds || tds.length === 0) return "";
      let s = Array.from(tds).map((td) => (td.textContent || "").trim()).join(" ");
      s = s.replace(/\s+/g, " ").replace(/dynamicpopupmenu\s*\([^)]*\)\s*;?/gi, " ").replace(/domapi\.getelm\s*\([^)]*\)/gi, " ").replace(/\s+/g, " ").trim();
      return s.toLowerCase();
    }
    function processRow(tr) {
      if (processedRows.has(tr)) return;
      const text = getRowSearchText(tr);
      const matched = [];
      for (const k of whitelist) {
        if (text.includes(k)) matched.push(k);
      }
      processedRows.set(tr, matched);
      if (matched.length === 0) return;
      tr.classList.add("mx-offense-whitelist-row");
      const firstTd = tr.querySelector("td");
      if (!firstTd) return;
      const badge = document.createElement("span");
      badge.className = "mx-whitelist-badge";
      const show = matched.slice(0, 2);
      const more = matched.length > 2 ? ` +${matched.length - 2}` : "";
      badge.textContent = `WL: ${show.join(", ")}${more}`;
      badge.title = `Whitelist: ${matched.join(", ")}`;
      firstTd.appendChild(badge);
    }
    function processAddedRows(mutations) {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.matches?.("tr")) {
            processRow(node);
          } else {
            node.querySelectorAll?.("tr").forEach(processRow);
          }
        });
      }
    }
    function initObserver() {
      const tbody = document.querySelector(config_default3.selector.tbody);
      if (!tbody) return;
      let scheduled = false;
      observeElement(tbody, (mutations) => {
        if (document.hidden) return;
        if (mutations.some((m) => m.removedNodes.length)) {
          processedRows = /* @__PURE__ */ new WeakMap();
        }
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          processAddedRows(mutations);
        });
      });
    }
    let retry = 0;
    const timer = setInterval(() => {
      const table = document.querySelector(config_default3.selector.table);
      if (table) {
        clearInterval(timer);
        document.querySelectorAll(config_default3.selector.rows).forEach(processRow);
        initObserver();
      }
      if (++retry > 20) clearInterval(timer);
    }, 500);
  }

  // src/registry.js
  var registry_default = [
    {
      run: runTestModule,
      config: config_default
    },
    {
      run: selectedSearch,
      config: config_default2
    },
    {
      run: offenseWhitelistHighlighter,
      config: config_default3
    }
  ];

  // src/helper/match.js
  function wildcardToRegExp(pattern) {
    return new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
  }
  function isMatch(url, patterns = []) {
    return patterns.some((p) => wildcardToRegExp(p).test(url));
  }

  // src/index.js
  function bootstrap() {
    const url = location.href;
    const isIframe = window.self !== window.top;
    registry_default.filter(({ config }) => config.enabled).sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0)).forEach(({ run, config }) => {
      if (config.iframe === false && isIframe) return;
      if (config.match && !isMatch(url, config.match)) return;
      if (config.exclude && isMatch(url, config.exclude)) return;
      try {
        run({
          url,
          isIframe,
          env: "tampermonkey"
        });
      } catch (e) {
        console.error(`❌ Module ${config.name} error`, e);
      }
    });
  }
  bootstrap();
})();

