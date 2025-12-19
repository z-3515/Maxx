export default {
	name: "log-prettier module",

	enabled: true,

	match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],

	exclude: [],

	runAt: "document-end",

	iframe: false,

	once: true,

	priority: 10,
};
