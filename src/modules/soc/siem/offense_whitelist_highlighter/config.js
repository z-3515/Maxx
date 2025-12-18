export default {
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
		rows: "#tableSection table#defaultTable tbody tr",
	},
	mss: {
		whitelist: ["REC: Alert from IDPS of BO_KHCN containing", "Cang_HPG"],
	},
	siem: {
		whitelist: ["VNPT Media EXE: Detect wscript or cscript execute vbs file"],
	},
};
