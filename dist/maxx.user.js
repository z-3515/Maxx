// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      2.5
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
    console.log("✅ test module running", ctx);
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
       MODULE META (GIỮ NGUYÊN)
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
       FEATURE CONFIG (MỚI)
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
    console.log("✅ selected_search loaded", ctx);
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

