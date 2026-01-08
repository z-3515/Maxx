// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      4.2
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
// module: hex-decoder module | aGV4LWRlY29kZXIgbW9kdWxl
// module: log-prettier module | bG9nLXByZXR0aWVyIG1vZHVsZQ==
// module: offense-whitelist-highlighter module | b2ZmZW5zZS13aGl0ZWxpc3QtaGlnaGxpZ2h0ZXIgbW9kdWxl
// module: close-ticket module | Y2xvc2UtdGlja2V0IG1vZHVsZQ==
// module: test-module | dGVzdC1tb2R1bGU=
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
        match: ["*://*.vnpt.vn/*"],
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
      whitelist: [
        "REC: Alert from IDPS of BO_KHCN containing",
        "Cang_HPG"
      ]
    },
    siem: {
      whitelist: [
        "EXE: Detect wscript or cscript execute vbs file",
        "REC: Web suspicious user agent containing HTTP 200 - OK",
        "REC:CVE-2019-10068 Kentico RCE",
        "REC: CVE-2023-22518 Exploitation Attempt - Vulnerable Endpoint Connection",
        "REC-Detect log4j payload",
        "REC: Exploit payload detection",
        "REC: No way PHP Strikes again CVE-2024-4577",
        "INT: Detect Account Administrator Login Success to the System containing POST",
        "INT: Web Exploit Detection",
        "INT: Detect Foreign IP Login Success to the system containing POST",
        "COL: Detection File Exchange Dropped containing Success Audit: A handle to an object was requested",
        "DEV: Common Webshell's name detected containing POST",
        "Detect ddos event",
        "Potential HTTP DoS Flooding containing HTTP 200 - Ok",
        "Suspicious Network Denial of Service dichvucong.gov.vn in Waf",
        "Supicious CVE-2021-44515 exploit",
        "High Number of Emails From Unauthorized Users",
        "Local UDP Scanner Detected containing Deny protocol src",
        "HTTP 200 - OK",
        "HTTP 403 - Forbidden",
        "HTTP 404 - Not Found",
        "HTTP 302 - Object Moved",
        "HTTP 304 - Not Modified",
        "POST",
        "GET",
        "HEAD"
      ]
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
  function resolveFormat(raw) {
    for (const rule of config_default4.formats || []) {
      try {
        if (rule.match(raw)) return rule.format(raw);
      } catch (e) {
        console.warn("[log-prettier]", rule.name, e);
      }
    }
    return null;
  }
  function createIcon(doc) {
    const icon = doc.createElement("span");
    icon.className = ICON_CLASS;
    const img = doc.createElement("img");
    img.src = "https://cdn-icons-png.flaticon.com/512/1828/1828911.png";
    img.alt = "format log";
    icon.appendChild(img);
    return icon;
  }
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
  function findPre(doc) {
    const { container, pre } = config_default4.selector;
    if (container) {
      const wrap = doc.querySelector(container);
      if (wrap) {
        const p = wrap.querySelector(pre || "pre");
        if (p) return p;
      }
    }
    return doc.querySelector("#GUID_6 pre, pre.utf, pre");
  }
  function observe(doc) {
    const scan = () => {
      const pre = findPre(doc);
      if (pre) attach(pre);
    };
    scan();
    new MutationObserver(scan).observe(doc.body, {
      childList: true,
      subtree: true
    });
  }
  function logPrettier() {
    try {
      const doc = document;
      if (!doc.body) return;
      injectStyle(doc);
      observe(doc);
    } catch {
    }
  }
  if (typeof __MAXX_DEV__ !== "undefined") {
    window.__MAXX_DEV_ENTRY__ = logPrettier;
  }

  // src/modules/soc/siem/hex_decoder/config.js
  var config_default5 = {
    name: "hex-decoder module",
    // module-id: aGV4LWRlY29kZXIgbW9kdWxl
    enabled: true,
    match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: true,
    once: true,
    priority: 10,
    selector: {
      iframeId: ["PAGE_EVENTVIEWER", "mainPage"],
      toolbarClass: ["shade"],
      eventViewerLogContainerClass: [".utf.text-wrap"],
      eventTableCells: ["#tableSection .grid.dashboard-grid tbody tr td"]
    }
  };

  // src/modules/soc/siem/hex_decoder/index.js
  function runHexDecoderModule(ctx) {
    const sel = config_default5.selector;
    function isAllowedIframe() {
      if (!sel.iframeId || !sel.iframeId.length) return false;
      const frame = window.frameElement;
      if (!frame || !frame.id) return false;
      return sel.iframeId.includes(frame.id);
    }
    if (!isAllowedIframe()) {
      return;
    }
    let enabled = false;
    const ORIGINAL_TEXT = /* @__PURE__ */ new Map();
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
      const hexChunks = raw.match(/[0-9a-fA-F]{8,}/g);
      if (!hexChunks) return false;
      let replaced = raw;
      let changed = false;
      hexChunks.forEach((hex) => {
        if (hex.length % 2 !== 0) return;
        const decoded = hexToUtf8(hex);
        if (!decoded || decoded.includes("�")) return;
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
    function getTargets() {
      const targets = [];
      sel.eventViewerLogContainerClass?.forEach((s) => {
        document.querySelectorAll(s).forEach((el) => targets.push(el));
      });
      sel.eventTableCells?.forEach((s) => {
        document.querySelectorAll(s).forEach((td) => {
          td.querySelectorAll("span").forEach((sp) => targets.push(sp));
        });
      });
      return targets;
    }
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

  // src/modules/soc/ticket/note_shift/config.js
  var config_default6 = {
    name: "test-module",
    // module-id: dGVzdC1tb2R1bGU=
    enabled: true,
    match: ["*://ticket.vnpt.vn/*", "*://dashboard-soc.vnpt.vn/ticket/*"],
    exclude: [],
    runAt: "document-end",
    iframe: false,
    once: true,
    priority: 10,
    style: {
      btnNoteShift: {
        width: "180px",
        padding: "10px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer"
      },
      screenNoteShift: {
        position: "fixed",
        top: "0px",
        right: "0px",
        width: "1000px",
        height: "800px"
      }
    },
    api: {
      all_ticket: "/api/v1/ticket_overviews?view=all_ticket"
    },
    mapping: {
      STATE_LABEL: {
        mss: {
          new: "Mới",
          open: "Chưa xử lý",
          resolve: "Đã xử lý",
          inprocess: "Đang xử lý"
        },
        siem: {
          new: "Mới",
          open: "Chưa xử lý",
          inprocess: "Đang xử lý",
          "pending reminder": "Chờ xử lý",
          "pending close": "Chờ đóng",
          resolve: "Đã xử lý",
          closed: "Đã đóng",
          merged: "Gộp ticket"
        }
      },
      SPECIAL_ORG: {
        125: "VNPOST",
        132: "CIC",
        3: "ABBank"
      }
    }
  };

  // src/modules/soc/ticket/helper/zammad_api.js
  async function zammadFetch(url, options = {}) {
    const fullUrl = url + (url.includes("?") ? "&" : "?") + "_=" + Date.now();
    const headers = {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers || {}
    };
    const res = await fetch(fullUrl, {
      method: options.method || "GET",
      credentials: "same-origin",
      headers,
      body: options.body
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `[ZammadFetch] ${res.status} ${res.statusText}
${text}`
      );
    }
    return res.json();
  }

  // src/modules/soc/ticket/helper/domObserver.js
  function observeWhenVisible(selector, callback, {
    root = document.body,
    debounce = 150,
    once = false,
    attributes = ["style", "class"]
  } = {}) {
    let lastEl = null;
    let lastVisible = false;
    let timer = null;
    let stopped = false;
    function isVisible(el) {
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
    }
    function trigger(el) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (stopped) return;
        callback(el);
        if (once) observer.disconnect();
      }, debounce);
    }
    const observer = new MutationObserver(() => {
      if (stopped) return;
      const el = root.querySelector(selector);
      if (!el) {
        lastEl = null;
        lastVisible = false;
        return;
      }
      const visible = isVisible(el);
      if (el !== lastEl) {
        lastEl = el;
        lastVisible = visible;
        if (visible) trigger(el);
        return;
      }
      if (!lastVisible && visible) {
        lastVisible = true;
        trigger(el);
        return;
      }
      if (visible) {
        trigger(el);
      }
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: attributes,
      characterData: true
    });
    return {
      stop() {
        stopped = true;
        observer.disconnect();
        clearTimeout(timer);
      }
    };
  }

  // src/modules/soc/ticket/note_shift/index.js
  async function fetchAllTickets(target) {
    const api = config_default6.api.all_ticket;
    return zammadFetch(api);
  }
  function injectNoteShiftStyle() {
    if (document.getElementById("maxx-note-style")) return;
    const style = document.createElement("style");
    style.id = "maxx-note-style";
    style.textContent = `
/* ===============================
   NOTE GIAO CA – THEME MATCH
================================ */

.maxx-note-shift-container {
    max-width: 960px;
    padding: 16px 20px;
    background: var(--background-secondary);
    color: var(--text-normal);
}

/* ===== Header ===== */
.maxx-note-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--header-primary);
    margin-bottom: 14px;
}

/* ===== Shift Buttons ===== */
.maxx-shift-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.maxx-shift-buttons button {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--button-background);
    color: var(--text-normal);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.maxx-shift-buttons button small {
    color: var(--text-muted);
    font-size: 11px;
}

.maxx-shift-buttons button:hover {
    background: var(--background-secondary-hover);
}

.maxx-shift-buttons button.active {
    background: var(--button-primary-background);
    color: var(--text-inverted);
    border-color: var(--button-primary-background);
}

/* ===== Time Row ===== */
.maxx-time-row {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 18px;
    flex-wrap: wrap;
}

.maxx-time-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.maxx-time-group label {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.3px;
}

/* ===== Input ===== */
.maxx-time-group input {
    height: 32px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-secondary);
    color: var(--text-normal);
}

.maxx-time-group input:focus {
    outline: none;
    border-color: var(--border-highlight);
}

/* ===== Confirm Button ===== */
.maxx-confirm-btn {
    height: 32px;
    padding: 0 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background: var(--button-primary-background);
    color: var(--button-primary-text);
    font-weight: 500;
}

.maxx-confirm-btn:hover {
    background: var(--button-primary-background-active);
}

/* ===== Output ===== */
.maxx-note-output {
    margin-top: 10px;
}

.maxx-note-output .title {
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--header-primary);
}

.maxx-note-text {
    width: 100%;
    min-height: 120px;
    resize: vertical;
    padding: 8px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
}

.maxx-note-text:focus {
    outline: none;
    border-color: var(--border-highlight);
}
    .maxx-note-preview {
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
    white-space: pre-wrap;
}

.maxx-note-preview a {
    color: var(--text-link);
    text-decoration: underline;
}

.maxx-note-preview a:hover {
    color: var(--highlight);
}
.maxx-note-output .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.maxx-copy-btn {
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--button-background);
    color: var(--text-normal);
    cursor: pointer;
}

.maxx-copy-btn:hover {
    background: var(--background-secondary-hover);
}

.maxx-note-editor {
    min-height: 140px;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
    white-space: pre-wrap;
    outline: none;
}

.maxx-note-editor a {
    color: var(--text-link);
    text-decoration: underline;
    cursor: pointer;
    user-select: text;
}


    `;
    document.head.appendChild(style);
  }
  function toggleOverviewHeaderTitle(isNoteShiftOn) {
    const titleEl = document.querySelector(
      ".overview-table .page-header .page-header-title h2"
    );
    if (!titleEl) return;
    if (!titleEl.dataset.maxxOriginTitle) {
      titleEl.dataset.maxxOriginTitle = titleEl.textContent;
    }
    if (isNoteShiftOn) {
      titleEl.textContent = "Note Giao Ca";
    } else {
      titleEl.textContent = titleEl.dataset.maxxOriginTitle;
    }
  }
  function toggleNoteShiftScreen() {
    const pageContent = document.querySelector(".overview-table .page-content");
    const tableOverview = pageContent?.querySelector(".table-overview");
    if (!pageContent || !tableOverview) return;
    let screen = pageContent.querySelector(".maxx-note-shift-screen");
    if (!screen) {
      screen = document.createElement("div");
      screen.className = "maxx-note-shift-screen";
      tableOverview.style.display = "none";
      pageContent.appendChild(screen);
      toggleOverviewHeaderTitle(true);
      injectNoteShiftStyle();
      renderNoteShiftTimePicker(screen, async ({ start, end }) => {
        return `✔ Note giao ca từ ${start} đến ${end}`;
      });
      return;
    }
    screen.remove();
    tableOverview.style.display = "";
    toggleOverviewHeaderTitle(false);
  }
  function noteShiftBtn(config, pageHeaderEl) {
    if (!pageHeaderEl) return;
    if (pageHeaderEl.querySelector(".maxx-btn-note-shift")) {
      return;
    }
    const btnNoteShift = document.createElement("button");
    btnNoteShift.innerText = "Note Giao Ca";
    btnNoteShift.className = "maxx-btn-note-shift";
    for (const [key, value] of Object.entries(config.style.btnNoteShift)) {
      btnNoteShift.style[key] = value;
    }
    pageHeaderEl.appendChild(btnNoteShift);
    btnNoteShift.onclick = () => {
      toggleNoteShiftScreen();
      btnNoteShift.classList.toggle("active");
      btnNoteShift.innerText = btnNoteShift.classList.contains("active") ? "Quay lại" : "Note Giao Ca";
    };
  }
  function getShiftTime(shift) {
    const now = /* @__PURE__ */ new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 864e5);
    let start, end;
    switch (shift) {
      case 1:
        start = new Date(today.setHours(6, 0, 0, 0));
        end = new Date(today.setHours(14, 0, 0, 0));
        break;
      case 2:
        start = new Date(today.setHours(14, 0, 0, 0));
        end = new Date(today.setHours(22, 0, 0, 0));
        break;
      case 3:
        start = new Date(yesterday.setHours(22, 0, 0, 0));
        end = new Date(today.setHours(6, 0, 0, 0));
        break;
    }
    return {
      start: toLocalDateTimeInput(start),
      end: toLocalDateTimeInput(end)
    };
  }
  var TZ_OFFSET_MIN = 0 * 60;
  function toLocalDateTimeInput(date) {
    const local = new Date(date.getTime() + TZ_OFFSET_MIN * 6e4);
    const pad = (n) => String(n).padStart(2, "0");
    return local.getFullYear() + "-" + pad(local.getMonth() + 1) + "-" + pad(local.getDate()) + "T" + pad(local.getHours()) + ":" + pad(local.getMinutes());
  }
  function renderNoteShiftTimePicker(screenEl) {
    screenEl.innerHTML = "";
    const container = document.createElement("div");
    container.className = "maxx-note-shift-container";
    container.innerHTML = `
        <div class="maxx-shift-buttons">
            <button data-shift="1">Ca 1<br><small>06:00 - 14:00</small></button>
            <button data-shift="2">Ca 2<br><small>14:00 - 22:00</small></button>
            <button data-shift="3">Ca 3<br><small>22:00 - 06:00</small></button>
        </div>

        <div class="maxx-time-row">
            <div class="maxx-time-group">
                <label>START TIME</label>
                <input type="datetime-local" class="maxx-start-time">
            </div>

            <div class="maxx-time-group">
                <label>END TIME</label>
                <input type="datetime-local" class="maxx-end-time">
            </div>

            <button class="maxx-confirm-btn">Xác nhận</button>
        </div>

        <div class="maxx-note-output">
            <div class="title">
                📄 Nội dung note giao ca
                <button class="maxx-copy-btn">Copy Note</button>
            </div>

            <div class="maxx-note-editor" tabindex="0"></div>

        </div>
    `;
    screenEl.appendChild(container);
    const startInput = container.querySelector(".maxx-start-time");
    const endInput = container.querySelector(".maxx-end-time");
    const noteText = container.querySelector(".maxx-note-text");
    container.querySelectorAll("[data-shift]").forEach((btn) => {
      btn.onclick = () => {
        container.querySelectorAll("[data-shift]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const { start, end } = getShiftTime(Number(btn.dataset.shift));
        startInput.value = start;
        endInput.value = end;
      };
    });
    container.querySelector(".maxx-confirm-btn").onclick = async () => {
      const start = startInput.value;
      const end = endInput.value;
      if (!start || !end) {
        alert("Vui lòng chọn đầy đủ thời gian");
        return;
      }
      const target = detectTargetByURL();
      if (!target) {
        alert("❌ Không xác định được hệ thống");
        return;
      }
      const shiftLabel = container.querySelector("[data-shift].active")?.innerText?.split("\n")[0] || "Ca";
      const editorEl = container.querySelector(".maxx-note-editor");
      const copyBtn = container.querySelector(".maxx-copy-btn");
      editorEl.textContent = "⏳ Đang crawl dữ liệu...";
      copyBtn.onclick = null;
      try {
        const { noteHTML, copyText } = await processData({
          target,
          startTime: start,
          endTime: end,
          shiftLabel
        });
        editorEl.innerHTML = noteHTML;
        copyBtn.onclick = async () => {
          if (!copyText) {
            alert("Không có nội dung để copy");
            return;
          }
          await navigator.clipboard.writeText(copyText);
          copyBtn.innerText = "Đã copy";
          setTimeout(() => copyBtn.innerText = "Copy Note", 1500);
        };
        editorEl.addEventListener("copy", (e) => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) return;
          e.preventDefault();
          e.clipboardData.setData("text/plain", sel.toString());
        });
      } catch (err) {
        editorEl.textContent = err.message === "SESSION_INVALID_OR_NOT_LOGIN" ? "❌ Bạn chưa đăng nhập hệ thống này" : "❌ Lỗi xử lý dữ liệu";
      }
    };
  }
  function filterCategory(target, ticket) {
    const title = ticket.title?.toLowerCase() || "";
    const base = () => {
      if (title.includes("scan web") || title.includes("lỗ hổng"))
        return "Scan Web";
      if (title.includes("bruteforce")) return "Bruteforce";
      if (title.includes("command") || title.includes("thực thi lệnh"))
        return "Command";
      if (title.includes("kata")) return "Kata alert";
      if (title.includes("đổi mật khẩu")) return "Change password";
      if (title.includes("mã độc") || title.includes("malware"))
        return "Malware";
      if (title.includes("ngừng đẩy log")) return "ngừng đẩy log";
      if (title.includes("tạo file") || title.includes("create file"))
        return "create file";
      if (title.includes("xác minh hành vi")) return "xác minh hành vi";
      return "re-check";
    };
    if (target === "mss") {
      if (title.includes("khóa tài khoản")) return "lock acc";
      if (title.includes("tạo mới tài khoản") || title.includes("create user"))
        return "create acc";
    }
    return base();
  }
  function groupTicketsString(target, tickets) {
    if (!tickets.length) return "";
    tickets.sort(
      (a, b) => filterCategory(target, a).localeCompare(filterCategory(target, b))
    );
    let result = "";
    let current = "";
    let temp = [];
    for (const t of tickets) {
      const cat = filterCategory(target, t);
      if (!current) current = cat;
      if (cat === current) {
        temp.push(buildTicketLink(target, t));
      } else {
        result += `${temp.join(", ")} ${current}; `;
        current = cat;
        temp = [buildTicketLink(target, t)];
      }
    }
    if (temp.length) {
      result += `${temp.join(", ")} ${current}`;
    }
    return result.trim();
  }
  function detectTargetByURL() {
    const host = location.hostname;
    if (host.includes("ticket.vnpt.vn")) return "siem";
    if (host.includes("dashboard-soc.vnpt.vn")) return "mss";
    return null;
  }
  function cleanTitle(title = "") {
    return String(title).replace(/\[[^\]]*\]/g, "").trim();
  }
  function buildTicketLink(target, ticket) {
    const id = ticket.id;
    const number = ticket.number;
    if (!id || !number) return number || "";
    if (target === "mss") {
      return `<a href="https://dashboard-soc.vnpt.vn/ticket/#ticket/zoom/${id}" target="_blank">${number}</a>`;
    }
    if (target === "siem") {
      return `<a href="https://ticket.vnpt.vn/#ticket/zoom/${id}" target="_blank">${number}</a>`;
    }
    return number;
  }
  async function processData({ target, startTime, endTime, shiftLabel }) {
    const { STATE_LABEL, SPECIAL_ORG } = config_default6.mapping;
    const data = await fetchAllTickets(target);
    if (!data || !data.assets || !data.assets.Ticket) {
      throw new Error("SESSION_INVALID_OR_NOT_LOGIN");
    }
    const ticketsAll = Object.values(data.assets.Ticket || {});
    const stateMap = data.assets.TicketState || {};
    if (!ticketsAll.length) {
      throw new Error("NO_TICKET_DATA");
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const tickets = ticketsAll.filter((t) => {
      const time = new Date(t.created_at || t.updated_at);
      return time >= start && time <= end;
    });
    const stateCount = {};
    tickets.forEach((t) => {
      const stateName = stateMap[t.state_id]?.name || `#${t.state_id}`;
      const label = STATE_LABEL[target]?.[stateName] || stateName;
      stateCount[label] = (stateCount[label] || 0) + 1;
    });
    let summaryHTML = "";
    let summaryText = "";
    let recheckHTML = "";
    const recheckTickets = [];
    if (target === "mss") {
      const MSS_list = [];
      const org_lists = {};
      tickets.forEach((t) => {
        if (![1, 2].includes(t.state_id)) return;
        const cat = filterCategory(target, t);
        if (cat === "re-check") recheckTickets.push(t);
        if (SPECIAL_ORG[t.organization_id]) {
          const org = SPECIAL_ORG[t.organization_id];
          if (!org_lists[org]) org_lists[org] = [];
          org_lists[org].push(t);
        } else {
          MSS_list.push(t);
        }
      });
      const mssHTML = groupTicketsString(target, MSS_list);
      const mssText = mssHTML.replace(/<[^>]+>/g, "");
      if (mssHTML) {
        summaryHTML += `MSS: ${mssHTML} chưa xử lý.
`;
        summaryText += `MSS: ${mssText} chưa xử lý.
`;
      }
      Object.entries(org_lists).forEach(([org, list]) => {
        const html = groupTicketsString(target, list);
        const text = html.replace(/<[^>]+>/g, "");
        if (html) {
          summaryHTML += `${org}: ${html} chưa xử lý.
`;
          summaryText += `${org}: ${text} chưa xử lý.
`;
        }
      });
    }
    if (target === "siem") {
      const list = [];
      tickets.forEach((t) => {
        if (![1, 2].includes(t.state_id)) return;
        const cat = filterCategory(target, t);
        if (cat === "re-check") recheckTickets.push(t);
        list.push(t);
      });
      const siemHTML = groupTicketsString(target, list);
      const siemText = siemHTML.replace(/<[^>]+>/g, "");
      if (siemHTML) {
        summaryHTML += `SIEM: ${siemHTML} chưa xử lý.
`;
        summaryText += `SIEM: ${siemText} chưa xử lý.
`;
      }
    }
    if (recheckTickets.length) {
      recheckHTML += `
------
Danh sách Re-check:
`;
      recheckTickets.forEach((t) => {
        recheckHTML += `- ${buildTicketLink(target, t)}: ${cleanTitle(
          t.title
        )}
`;
      });
    }
    const block = [];
    block.push(`=== NOTE ${target.toUpperCase()} (${shiftLabel}) ===`);
    block.push(summaryHTML.trim());
    if (recheckHTML) block.push(recheckHTML.trim());
    block.push(`
Tổng ticket lọc: ${tickets.length}`);
    block.push(`Thống kê trạng thái:`);
    Object.entries(stateCount).forEach(([s, c]) => block.push(`- ${s}: ${c}`));
    block.push(`Lần chạy: ${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN")}`);
    return {
      noteHTML: block.join("\n"),
      copyText: summaryText.trim()
      // ✅ CHỈ SUMMARY – KHÔNG HTML – KHÔNG RECHECK
    };
  }
  function noteShift(ctx) {
    if (!config_default6.enabled) return;
    observeWhenVisible(
      ".overview-table .page-header",
      (pageHeaderEl) => {
        noteShiftBtn(config_default6, pageHeaderEl);
      },
      {
        debounce: 150
      }
    );
    console.log("✅ Maxx Module Loaded: SOC Ticket Note Shift");
  }
  if (typeof __MAXX_DEV__ !== "undefined") {
    window.__MAXX_DEV_ENTRY__ = noteShift;
  }

  // src/modules/soc/ticket/close_ticket/config.js
  var config_default7 = {
    name: "close-ticket module",
    // module-id: Y2xvc2UtdGlja2V0IG1vZHVsZQ==
    enabled: true,
    match: ["*://ticket.vnpt.vn/*"],
    exclude: [],
    runAt: "document-end",
    iframe: false,
    once: true,
    priority: 10,
    options: {
      state: {
        closed: "4"
      },
      organization: {
        TT_ATTT: "18"
      }
    }
  };

  // src/modules/soc/ticket/close_ticket/index.js
  var domObserver = null;
  var currentTicketId = null;
  function getTicketId() {
    const el = document.querySelector(".ticket-number");
    return el ? el.textContent.trim() : null;
  }
  function injectStyleCSS() {
    if (document.getElementById("maxx-close-btn-style")) return;
    const style = document.createElement("style");
    style.id = "maxx-close-btn-style";
    style.innerHTML = `
    .tabsSidebar-action {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .tabsSidebar-action .close-icon {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
        color: #9aa5ad;
        user-select: none;
    }

    .tabsSidebar-action:hover {
        background-color: #eef2f3;
    }

    .tabsSidebar-action:hover .close-icon {
        color: #d9534f;
    }

    /* ===== DISABLED STATE ===== */
    .tabsSidebar-action.disabled {
        pointer-events: none;
        opacity: 0.4;
        cursor: not-allowed;
    }
  `;
    document.head.appendChild(style);
  }
  function injectCloseButton() {
    const tabsContainer = document.querySelector(".tabsSidebar-tabs");
    if (!tabsContainer) return;
    let closeBtn = tabsContainer.querySelector(".tabsSidebar-action");
    if (!closeBtn) {
      closeBtn = document.createElement("div");
      closeBtn.className = "tabsSidebar-tab tabsSidebar-action";
      closeBtn.title = "Close ticket";
      closeBtn.innerHTML = `<span class="close-icon">×</span>`;
      closeBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (closeBtn.classList.contains("disabled")) return;
        onCloseButtonClick();
      });
      tabsContainer.appendChild(closeBtn);
    }
    const shouldDisable = isTicketClosed() || !isAllowedGroup();
    closeBtn.classList.toggle("disabled", shouldDisable);
    if (!isAllowedGroup()) {
      closeBtn.title = "Kiểm tra trước khi đóng <<Organization not TT_ATTT>>";
    } else if (isTicketClosed()) {
      closeBtn.title = "Ticket đã được đóng";
    } else {
      closeBtn.title = "Close ticket";
    }
  }
  function onCloseButtonClick() {
    if (isTicketClosed()) return;
    if (!isAllowedGroup()) return;
    const stateControl = document.querySelector('.form-control[name="state_id"]');
    if (!stateControl) {
      console.warn('[close-ticket] Không tìm thấy <.form-control[name="state_id"]>');
      return;
    }
    stateControl.value = config_default7.options.state.closed;
    stateControl.dispatchEvent(new Event("change", { bubbles: true }));
    const updateButton = document.querySelector(".js-submitDropdown > button.js-submit");
    if (!updateButton) {
      console.warn("[close-ticket] Không tìm thấy nút <.js-submitDropdown > button.js-submit>");
      return;
    }
    updateButton.click();
    setTimeout(disconnectObserver, 500);
  }
  function isTicketClosed() {
    const stateControl = document.querySelector('.form-control[name="state_id"]');
    if (!stateControl) return false;
    return String(stateControl.value) === String(config_default7.options.state.closed);
  }
  function disconnectObserver() {
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
      console.log("[close-ticket] DOM observer disconnected");
    }
  }
  function isAllowedGroup() {
    const groupInput = document.querySelector('.form-group[data-attribute-name="group_id"] input.searchableSelect-shadow');
    if (!groupInput) {
      console.warn("[close-ticket] Không tìm thấy group_id input");
      return false;
    }
    const currentGroupId = String(groupInput.value);
    const allowedGroupId = String(config_default7.options.organization.TT_ATTT);
    return currentGroupId === allowedGroupId;
  }
  function observeDOM() {
    if (domObserver) return;
    let scheduled = false;
    domObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        const newTicketId = getTicketId();
        if (newTicketId && newTicketId !== currentTicketId) {
          console.log(`[close-ticket] Ticket changed: ${currentTicketId} → ${newTicketId}`);
          currentTicketId = newTicketId;
          injectCloseButton();
          return;
        }
        injectCloseButton();
      });
    });
    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function closeTicket(ctx) {
    if (!config_default7.enabled) return;
    injectStyleCSS();
    currentTicketId = getTicketId();
    injectCloseButton();
    observeDOM();
  }
  if (typeof __MAXX_DEV__ !== "undefined") {
    window.__MAXX_DEV_ENTRY__ = closeTicket;
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
    },
    {
      run: runHexDecoderModule,
      config: config_default5
    },
    {
      run: noteShift,
      config: config_default6
    },
    {
      run: closeTicket,
      config: config_default7
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

