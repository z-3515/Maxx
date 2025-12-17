// ==UserScript==
// @name         Maxx Custom Script
// @namespace    maxx
// @version      1.1
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
  // src/modules/test.js
  function test() {
    console.log("module test is working!");
  }

  // src/index.js
  function bootstrap() {
    console.log("Maxx script is running!");
    test();
  }
  bootstrap();
})();

