import fs from "fs";
import path from "path";
import esbuild from "esbuild";

const META_FILE = "./dist/meta.js";
const OUTPUT_FILE = "./dist/maxx.user.js";
const ENTRY_FILE = "./src/index.js";
const MODULE_DIR = "./src/modules";

/* ===============================
   UTILS
================================ */
function encodeBase64(str) {
	return Buffer.from(str, "utf8").toString("base64");
}

function walk(dir, files = []) {
	for (const f of fs.readdirSync(dir)) {
		const p = path.join(dir, f);
		if (fs.statSync(p).isDirectory()) {
			walk(p, files);
		} else if (f === "config.js") {
			files.push(p);
		}
	}
	return files;
}

function extractModuleName(configPath) {
	const content = fs.readFileSync(configPath, "utf8");
	const match = content.match(/name\s*:\s*["'`](.+?)["'`]/);
	return match ? match[1].trim() : null;
}

/**
 * Patch base64 marker vào config.js
 * - chỉ chèn 1 lần
 * - chỉ sửa comment FEATURE CONFIG
 */
function patchConfigWithBase64(configPath, moduleName) {
	const content = fs.readFileSync(configPath, "utf8");
	const b64 = encodeBase64(moduleName);

	// đã có rồi → bỏ qua
	if (content.includes(b64)) return;

	// tìm block FEATURE CONFIG
	const featureBlockRegex = /(\/\*\s*={5,}\s*FEATURE CONFIG[\s\S]*?\n)(\s*={5,}\s*\*\/)/i;

	const match = content.match(featureBlockRegex);
	if (!match) {
		console.warn(`⚠️ Không tìm thấy FEATURE CONFIG trong ${configPath}`);
		return;
	}

	const injected = `${match[1]}        ${b64}
${match[2]}`;

	const patched = content.replace(featureBlockRegex, injected);

	fs.writeFileSync(configPath, patched, { encoding: "utf8" });
	console.log(`🧩 Inject base64 → ${configPath}`);
}

/* ===============================
   1) READ META
================================ */
let meta = fs.readFileSync(META_FILE, "utf8");

/* ===============================
   2) AUTO VERSION++
================================ */
const versionRegex = /@version\s+(\d+)\.(\d+)/;
const match = meta.match(versionRegex);

if (!match) {
	console.error("❌ Không tìm thấy @version trong metadata!");
	process.exit(1);
}

const major = Number(match[1]);
const minor = Number(match[2]) + 1;
const newVersion = `${major}.${minor}`;

console.log(`🔼 Tăng version: ${match[1]}.${match[2]} → ${newVersion}`);

meta = meta.replace(versionRegex, `@version      ${newVersion}`);
fs.writeFileSync(META_FILE, meta, { encoding: "utf8" });

/* ===============================
   3) COLLECT + PATCH MODULE CONFIG
================================ */
const moduleConfigs = walk(MODULE_DIR);
const moduleMetaLines = [];

for (const cfg of moduleConfigs) {
	const name = extractModuleName(cfg);
	if (!name) continue;

	const b64 = encodeBase64(name);

	// 🔧 PATCH CONFIG.JS (COMMENT ONLY)
	patchConfigWithBase64(cfg, name);

	// 🏷 METADATA LINE
	moduleMetaLines.push(`// module: ${name} | ${b64}`);
}

/* ===============================
   4) BUILD WITH ESBUILD
================================ */
esbuild
	.build({
		entryPoints: [ENTRY_FILE],
		bundle: true,
		minify: false,
		write: false,
		format: "iife",
		platform: "browser",
		charset: "utf8",
		loader: {
			".css": "text",
		},
	})
	.then((result) => {
		const output = result.outputFiles[0].text;

		/* ===============================
		   5) INJECT MODULE METADATA
		================================ */
		const metaLines = meta.split("\n");
		const endIndex = metaLines.findIndex((l) => l.includes("==/UserScript=="));

		if (endIndex !== -1) {
			const existing = metaLines.join("\n");

			const toInsert = moduleMetaLines.filter((line) => !existing.includes(line.split("|")[1].trim()));

			if (toInsert.length) {
				metaLines.splice(endIndex + 1, 0, "", ...toInsert);
			}
		}

		const finalOutput = `${metaLines.join("\n")}

${output}
`;

		fs.writeFileSync(OUTPUT_FILE, finalOutput, {
			encoding: "utf8",
		});

		console.log("🎉 Build thành công → dist/maxx.user.js");
	})
	.catch((err) => {
		console.error("❌ Build lỗi:", err);
		process.exit(1);
	});
