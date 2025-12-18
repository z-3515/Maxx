export default {
	/* ==========================
	        MODULE META
	========================== */
	name: "offense-whitelist-highlighter module",

	enabled: true,

	match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],

	exclude: [],

	runAt: "document-end",

	iframe: true,

	once: true,

	priority: 10,

	/* ==========================
	        FEATURE CONFIG
	========================== */
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
