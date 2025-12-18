// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      3.5
// @description  Maxx Script
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @grant        none
// @charset      utf-8
// @updateURL    https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// @downloadURL  https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// ==/UserScript==

// module: selected-search module | c2VsZWN0ZWQtc2VhcmNoIG1vZHVsZQ==
// module: offense-whitelist-highlighter module | b2ZmZW5zZS13aGl0ZWxpc3QtaGlnaGxpZ2h0ZXIgbW9kdWxl
// module: test-module | dGVzdC1tb2R1bGU=


(() => {
  // src/modules/test/index.js
  function runTestModule(ctx) {
  }

  // src/modules/test/config.js
  var config_default = {
    name: "test-module",
    // module-id: dGVzdC1tb2R1bGU=
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

  // src/modules/selected_search/config.js
  var config_default2 = {
    name: "selected-search module",
    // module-id: c2VsZWN0ZWQtc2VhcmNoIG1vZHVsZQ==
    enabled: true,
    match: ["*://*/*"],
    iframe: true,
    ui: {
      offsetX: 8,
      offsetY: -10,
      zIndex: 999999
    },
    engines: {
      vt: {
        label: "VT",
        class: "mx-vt",
        priority: 100,
        url: (q) => `https://www.virustotal.com/gui/search/${q}`,
        match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
        condition: (text, { isHash: isHash2, isIP: isIP2, isDomain: isDomain2 }) => {
          return isHash2(text) || isIP2(text) || isDomain2(text);
        }
      },
      google: {
        label: "G",
        class: "mx-google",
        priority: 10,
        url: (q) => `https://www.google.com/search?q=${q}`,
        match: ["*://*/*"],
        condition: () => true
      }
    }
  };

  // src/modules/selected_search/index.js
  function isMatch(url, patterns = []) {
    if (!patterns || patterns.length === 0) return true;
    return patterns.some((p) => {
      const regex = new RegExp("^" + p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
      return regex.test(url);
    });
  }
  function isIP(text) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(text);
  }
  function isDomain(text) {
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(text);
  }
  function isHash(text) {
    return /^[a-f0-9]{32}$/i.test(text) || /^[a-f0-9]{40}$/i.test(text) || /^[a-f0-9]{64}$/i.test(text);
  }
  function selectedSearch(ctx) {
    if (!config_default2.enabled) return;
    const { engines, ui } = config_default2;
    const url = ctx?.url || location.href;
    let box = null;
    let initialized = false;
    let selectedText = "";
    let lastEngineKey = "";
    let scheduled = false;
    const engineCache = /* @__PURE__ */ new Map();
    function ensureUI() {
      if (initialized) return;
      initialized = true;
      if (!document.getElementById("mx-selected-search-style")) {
        const style = document.createElement("style");
        style.id = "mx-selected-search-style";
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
					transition: all .18s cubic-bezier(.25,.8,.25,1);
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
					transition: all .15s ease;
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
      }
      box = document.createElement("div");
      box.className = "mx-search-box";
      document.body.appendChild(box);
    }
    function getActiveEngines(text) {
      if (engineCache.has(text)) {
        return engineCache.get(text);
      }
      const result = Object.values(engines).filter((engine) => {
        if (engine.match && !isMatch(url, engine.match)) return false;
        if (engine.exclude && isMatch(url, engine.exclude)) return false;
        if (typeof engine.condition === "function") {
          if (!engine.condition(text, {
            isIP,
            isDomain,
            isHash
          })) {
            return false;
          }
        }
        return true;
      }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
      engineCache.set(text, result);
      return result;
    }
    function renderButtons(activeEngines) {
      const key = activeEngines.map((e) => e.label).join("|");
      if (key === lastEngineKey) return;
      lastEngineKey = key;
      box.innerHTML = "";
      activeEngines.forEach((engine) => {
        const btn = document.createElement("div");
        btn.className = `mx-btn ${engine.class || ""}`;
        btn.textContent = engine.label;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!selectedText) return;
          window.open(engine.url(encodeURIComponent(selectedText)), "_blank");
          hide();
        });
        box.appendChild(btn);
      });
    }
    function show(rect) {
      box.style.left = rect.right + (ui?.offsetX ?? 8) + "px";
      box.style.top = rect.top + (ui?.offsetY ?? -10) + "px";
      box.classList.add("show");
    }
    function hide() {
      if (!box) return;
      box.classList.remove("show");
      selectedText = "";
      lastEngineKey = "";
    }
    function handleSelection() {
      if (document.hidden) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        hide();
        return;
      }
      const text = sel.toString().trim();
      if (!text) {
        hide();
        return;
      }
      ensureUI();
      selectedText = text;
      const activeEngines = getActiveEngines(text);
      if (activeEngines.length === 0) {
        hide();
        return;
      }
      renderButtons(activeEngines);
      try {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (rect.width || rect.height) show(rect);
      } catch {
        hide();
      }
    }
    function scheduleSelectionCheck() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        handleSelection();
      });
    }
    document.addEventListener("mouseup", scheduleSelectionCheck);
    document.addEventListener("selectionchange", scheduleSelectionCheck);
    document.addEventListener("mousedown", (e) => {
      if (box && !box.contains(e.target)) hide();
    });
  }

  // src/modules/soc/siem/offense_whitelist_highlighter/config.js
  var config_default3 = {
    /* ==========================
            MODULE META
    ========================== */
    name: "offense-whitelist-highlighter module",
    // module-id: b2ZmZW5zZS13aGl0ZWxpc3QtaGlnaGxpZ2h0ZXIgbW9kdWxl
    enabled: true,
    match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: true,
    once: true,
    priority: 10,
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
  function isMatch2(url, patterns = []) {
    return patterns.some((p) => wildcardToRegExp(p).test(url));
  }

  // src/index.js
  function bootstrap() {
    const url = location.href;
    const isIframe = window.self !== window.top;
    registry_default.filter(({ config }) => config.enabled).sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0)).forEach(({ run, config }) => {
      if (config.iframe === false && isIframe) return;
      if (config.match && !isMatch2(url, config.match)) return;
      if (config.exclude && isMatch2(url, config.exclude)) return;
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

