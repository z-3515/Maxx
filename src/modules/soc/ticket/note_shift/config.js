export default {
    name: "test-module",
	// module-id: dGVzdC1tb2R1bGU=

    enabled: true,

    match: ["*://ticket.vnpt.vn/*", "*://dashboard-soc.vnpt.vn/ticket/*"],

    exclude: [],

    runAt: "document-end",

    iframe: false,

    once: true,

    priority: 10,

    style: {
        btnNoteShift: {
            width: "180px",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
        },
        screenNoteShift: {
            position: "fixed",
            top: "0px",
            right: "0px",
            width: "1000px",
            height: "800px",
        },
    },

    api: {
        all_ticket: "/api/v1/ticket_overviews?view=all_ticket",
    },

    mapping: {
        STATE_LABEL: {
            mss: {
                new: "Mới",
                open: "Chưa xử lý",
                resolve: "Đã xử lý",
                inprocess: "Đang xử lý",
            },
            siem: {
                new: "Mới",
                open: "Chưa xử lý",
                inprocess: "Đang xử lý",
                "pending reminder": "Chờ xử lý",
                "pending close": "Chờ đóng",
                resolve: "Đã xử lý",
                closed: "Đã đóng",
                merged: "Gộp ticket",
            },
        },
        SPECIAL_ORG: {
            125: "VNPOST",
            132: "CIC",
            3: "ABBank",
        },
    },
};
