// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      1.2
// @description  Maxx Script
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @noframes
// @grant        none
// @updateURL    https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// @downloadURL  https://raw.githubusercontent.com/z-3515/Maxx/main/dist/maxx.user.js
// ==/UserScript==


(() => {
  // src/modules/test/index.js
  function runTestModule(ctx) {
    console.log("\u2705 test module running", ctx);
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

  // src/registry.js
  var registry_default = [
    {
      run: runTestModule,
      config: config_default
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
        console.error(`\u274C Module ${config.name} error`, e);
      }
    });
  }
  bootstrap();
})();

