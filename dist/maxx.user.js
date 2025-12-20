// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      3.23
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
// module: log-prettier module | bG9nLXByZXR0aWVyIG1vZHVsZQ==
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
      },
      // AlienVault OTX engine
      otx: {
        label: "OTX",
        class: "mx-otx",
        priority: 90,
        url: (q, { isIP: isIP2, isDomain: isDomain2, isHash: isHash2 }) => {
          if (isIP2(q)) {
            return `https://otx.alienvault.com/indicator/ip/${q}`;
          }
          if (isDomain2(q)) {
            return `https://otx.alienvault.com/indicator/domain/${q}`;
          }
          if (isHash2(q)) {
            return `https://otx.alienvault.com/indicator/file/${q}`;
          }
          return `https://otx.alienvault.com/browse/global/indicators`;
        },
        match: ["*://*/*"],
        condition: (t, { isIP: isIP2, isDomain: isDomain2, isHash: isHash2 }) => isIP2(t) || isDomain2(t) || isHash2(t)
      },
      // Hybrid Analysis engine
      ha: {
        label: "HA",
        class: "mx-ha",
        priority: 85,
        url: (q) => `https://www.hybrid-analysis.com/search?query=${q}`,
        match: ["*://*/*"],
        condition: (t, { isHash: isHash2 }) => isHash2(t)
      },
      // MalwareBazaar engine
      mb: {
        label: "MB",
        class: "mx-mb",
        priority: 80,
        url: (q) => `https://bazaar.abuse.ch/browse.php?search=${q}`,
        match: ["*://*/*"],
        condition: (t, { isHash: isHash2 }) => isHash2(t)
      },
      // Whois Lookup engine
      whois: {
        label: "WHO",
        class: "mx-whois",
        priority: 40,
        url: (q) => `https://www.viewdns.info/whois/?domain=${q}`,
        match: ["*://*/*"],
        condition: (t, { isDomain: isDomain2 }) => isDomain2(t)
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
          window.open(engine.url(encodeURIComponent(selectedText), { isIP, isDomain, isHash }), "_blank");
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

  // src/modules/soc/siem/log_prettier/config.js
  var config_default4 = {
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
      frameTarget: ["PAGE_EVENTVIEWER", "mainPage"],
      rawlogContainer: "div.binaryWidget",
      rawlogPre: "pre.utf"
    }
  };

  // src/modules/soc/siem/helper/siemObserver.js
  function waitForIframe(targets, callback) {
    const fe = window.frameElement;
    if (fe && (targets.includes(fe.id) || targets.includes(fe.name))) {
      callback(fe);
      return;
    }
    const match = (iframe) => targets.includes(iframe.id) || targets.includes(iframe.name);
    const scan = () => {
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        if (match(iframe)) {
          callback(iframe);
          return true;
        }
      }
      return false;
    };
    if (scan()) return;
    const obs = new MutationObserver(() => {
      if (scan()) obs.disconnect();
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  function waitForIframeDocument(iframe, callback) {
    const attach = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body) {
          callback(doc);
          return true;
        }
      } catch {
      }
      return false;
    };
    if (attach()) return;
    iframe.addEventListener("load", () => {
      attach();
    });
  }
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
    const obs = new MutationObserver(scan);
    obs.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    return obs;
  }

  // src/modules/soc/siem/log_prettier/index.js
  var TAG = "[log-prettier]";
  var log = (...a) => console.log(TAG, ...a);
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
  var IP_REGEX = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
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
    while (m = regex.exec(raw)) {
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
    const rows = fields.map(
      (f) => `
			<div class="mx-row">
				<span class="mx-key">${escapeHtml(f.key)}</span>
				<span class="mx-val">${highlightIP(escapeHtml(f.value))}</span>
			</div>
		`
    ).join("");
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
        pages.forEach((p) => p.style.display = "none");
        if (pages[idx]) pages[idx].style.display = "block";
      };
    });
  }
  function logPrettier(ctx) {
    if (!config_default4.enabled) return;
    if (config_default4.iframe === false && ctx?.isIframe) return;
    waitForIframe(config_default4.selector.frameTarget, (iframe) => {
      log("iframe found:", iframe.id || iframe.name);
      waitForIframeDocument(iframe, (doc) => {
        log("iframe document ready");
        watchElement(doc, `${config_default4.selector.rawlogContainer} ${config_default4.selector.rawlogPre}`, (rawPre, rawText) => {
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
    },
    {
      run: logPrettier,
      config: config_default4
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
    const isIframe = window.self !== window.top;
    const url = isIframe ? window.top.location.href : location.href;
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

