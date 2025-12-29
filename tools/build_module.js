import fs from "fs";
import path from "path";
import esbuild from "esbuild";

/* ===============================
   CONSTANTS
================================ */
const MODULE_ROOT = "./src/modules";
const DIST_DIR = "./dist";

/* ===============================
   CLI
================================ */
const modulePath = process.argv[2];

if (!modulePath) {
	console.error("❌ Usage: node tools/build_module.js <module-path>");
	console.error("VD: node tools/build_module.js soc/ticket/note_shift");
	process.exit(1);
}

/* ===============================
   PATH RESOLVE
================================ */
const moduleDir = path.join(MODULE_ROOT, modulePath);
const entryFile = path.join(moduleDir, "index.js");
const configFile = path.join(moduleDir, "config.js");

if (!fs.existsSync(entryFile)) {
	console.error("❌ Không tìm thấy index.js:", entryFile);
	process.exit(1);
}

if (!fs.existsSync(configFile)) {
	console.error("❌ Không tìm thấy config.js:", configFile);
	process.exit(1);
}

/* ===============================
   UTILS
================================ */
function encodeBase64(str) {
	return Buffer.from(str, "utf8").toString("base64");
}

function extractModuleName(content) {
	const match = content.match(/name\s*:\s*["'`](.+?)["'`]/);
	return match ? match[1].trim() : null;
}

/* ===============================
   READ CONFIG
================================ */
const configContent = fs.readFileSync(configFile, "utf8");
const moduleName =
	extractModuleName(configContent) || modulePath.split("/").pop();

const moduleId = encodeBase64(moduleName);

/* ===============================
   USERSCRIPT META (DEV ONLY)
================================ */
const meta = `// ==UserScript==
// @name         MAXX [DEV] ${moduleName}
// @namespace    maxx-dev
// @version      0.0.0-dev
// @description  Dev build for module: ${moduleName}
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @grant        none
// @charset      utf-8
// ==/UserScript==

// module: ${moduleName} | ${moduleId}
`;

/* ===============================
   BOOTSTRAP (GỌN – DỄ ĐỌC)
================================ */
const bootstrap = `
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
`;

/* ===============================
   BUILD
================================ */
esbuild
	.build({
		entryPoints: [entryFile],
		bundle: true,
		write: false,
		format: "iife",
		platform: "browser",
		minify: false,
		keepNames: true,
		treeShaking: false,
		charset: "utf8",
		define: {
			__MAXX_DEV__: "true",
		},
		loader: {
			".css": "text",
		},
	})
	.then((result) => {
		const code = result.outputFiles[0].text;

		const outFile = path.join(
			DIST_DIR,
			`maxx.module.${modulePath.replace(/[\\/]/g, "_")}.user.js`
		);

		fs.writeFileSync(
			outFile,
			`${meta}\n\n${code}\n\n${bootstrap}`,
			"utf8"
		);

		console.log("🎯 Build module DEV thành công");
		console.log("📦 Module:", modulePath);
		console.log("📄 Output:", outFile);
	})
	.catch((err) => {
		console.error("❌ Build module lỗi:", err);
		process.exit(1);
	});
