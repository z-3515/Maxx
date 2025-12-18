export default {
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
		animation: true,
	},

	engines: {
		google: {
			label: "G",
			url: (q) => `https://www.google.com/search?q=${q}`,
			class: "mx-google",
		},
		vt: {
			label: "VT",
			url: (q) => `https://www.virustotal.com/gui/search/${q}`,
			class: "mx-vt",
		},
	},
};
