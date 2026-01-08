export default {
	name: "close-ticket module",
	// module-id: Y2xvc2UtdGlja2V0IG1vZHVsZQ==

	enabled: true,

	match: ["*://ticket.vnpt.vn/*"],

	exclude: [],

	runAt: "document-end",

	iframe: false,

	once: true,

	priority: 10,

	options: {
		state: {
			closed: "4",
		},
		organization: {
			TT_ATTT: "18",
		},
	},
};
