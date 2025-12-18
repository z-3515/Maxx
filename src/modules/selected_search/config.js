export default {
	name: "selected-search module",
	// module-id: c2VsZWN0ZWQtc2VhcmNoIG1vZHVsZQ==

	enabled: true,

	match: ["*://*/*"],
	iframe: true,

	ui: {
		offsetX: 8,
		offsetY: -10,
		zIndex: 999999,
	},

	engines: {
		vt: {
			label: "VT",
			class: "mx-vt",
			priority: 100,

			url: (q) => `https://www.virustotal.com/gui/search/${q}`,

			match: ["*://mss.vnpt.vn/*", "*://siem.vnpt.vn/*"],

			condition: (text) => {
				return isHash(text) || isIP(text) || isDomain(text);
			},
		},

		google: {
			label: "G",
			class: "mx-google",
			priority: 10,

			url: (q) => `https://www.google.com/search?q=${q}`,

			match: ["*://*/*"],

			condition: () => true,
		},
	},
};
