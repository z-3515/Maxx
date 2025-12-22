export default {
	name: "log-prettier module",
	// module-id: bG9nLXByZXR0aWVyIG1vZHVsZQ==

	enabled: false,
	match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],
	exclude: [],
	runAt: "document-end",

	iframe: true,

	once: false,

	priority: 10,

	selector: {
		frameTarget: ["PAGE_EVENTVIEWER", "mainPage"],
		rawlogContainer: "div.binaryWidget",
		rawlogPre: "pre.utf",
	},
};
