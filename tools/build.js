import fs from "fs";
import esbuild from "esbuild";

const META_FILE = "./dist/meta.js";
const OUTPUT_FILE = "./dist/maxx.user.js";
const ENTRY_FILE = "./src/index.js";

// ===============================
// 1) Đọc metadata
// ===============================
let meta = fs.readFileSync(META_FILE, "utf8");

// ===============================
// 2) Tìm version MAJOR.MINOR
// ===============================
const versionRegex = /@version\s+(\d+)\.(\d+)/;
const match = meta.match(versionRegex);

if (!match) {
	console.error("❌ Không tìm thấy @version trong metadata!");
	process.exit(1);
}

let major = Number(match[1]);
let minor = Number(match[2]);

// ===============================
// 3) Tăng version phụ (minor++)
// ===============================
minor += 1;
const newVersion = `${major}.${minor}`;

console.log(`🔼 Tăng version: ${major}.${match[2]} → ${newVersion}`);

meta = meta.replace(versionRegex, `@version      ${newVersion}`);

// ===============================
// 4) GHI LẠI METADATA
// ===============================
fs.writeFileSync(META_FILE, meta);

// ===============================
// 5) Bundle code bằng esbuild
// ===============================
esbuild
	.build({
		entryPoints: [ENTRY_FILE],
		bundle: true,
		minify: false,
		write: false, // vẫn giữ như bạn đang làm
		format: "iife",
		platform: "browser", // ⭐ rất nên có
		loader: {
			".css": "text", // ⭐ FIX CHÍNH Ở ĐÂY
		},
	})
	.then((result) => {
		const finalOutput = `${meta}

${result.outputFiles[0].text}
`;

		fs.writeFileSync(OUTPUT_FILE, finalOutput);
		console.log("🎉 Build thành công → dist/maxx.user.js");
	})
	.catch((err) => {
		console.error("❌ Build lỗi:", err);
		process.exit(1);
	});
