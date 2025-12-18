import config from "./config.js";
import { isActiveIframe } from "../helper/iframe.js";
import { observeElement } from "../helper/observe.js";

function getRowSearchText(tr) {
	const tds = tr.querySelectorAll("td");
	if (!tds || tds.length === 0) return "";

	// Lấy text từng cột → join có dấu cách để tránh dính chữ
	const parts = Array.from(tds).map((td) => (td.textContent || "").trim());

	let s = parts.join(" ");

	// normalize whitespace
	s = s.replace(/\s+/g, " ").trim();

	// strip noise thường gặp trong SIEM grid (nếu DOM có text kiểu function call)
	s = s
		.replace(/dynamicpopupmenu\s*\([^)]*\)\s*;?/gi, " ")
		.replace(/domapi\.getelm\s*\([^)]*\)/gi, " ")
		.replace(/\s+/g, " ")
		.trim();

	return s.toLowerCase();
}

export default function offenseWhitelistHighlighter(ctx) {
	if (!config.enabled) return;
	if (config.iframe && !isActiveIframe()) return;

	const url = ctx.url || location.href;
	const isMSS = url.includes("mss.");
	const whitelist = (isMSS ? config.mss.whitelist : config.siem.whitelist) || [];

	if (!Array.isArray(whitelist) || whitelist.length === 0) return;

	/* ==========================
	   STYLE (NHẸ – KHÔNG ĐÈ SELECT)
	========================== */
	const style = document.createElement("style");
	style.textContent = `
		tr.mx-offense-whitelist-row {
			outline: 1px solid rgba(148,163,184,.45);
			outline-offset: -1px;
			box-shadow: inset 3px 0 0 rgba(148,163,184,.7);
		}

		tr.mx-offense-whitelist-row td[propertyname="offenseId"] {
			color: #dc2626 !important;
			font-weight: 600;
		}

		tr.mx-offense-whitelist-row.datarowselected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.is-selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row[aria-selected="true"] td[propertyname="offenseId"] {
			color: #fecaca !important;
		}

		.mx-whitelist-badge {
			margin-left: 6px;
			padding: 1px 6px;
			border-radius: 999px;
			font-size: 11px;
			border: 1px solid rgba(148,163,184,.5);
			background: rgba(148,163,184,.12);
			color: #334155;
			user-select: none;
			white-space: nowrap;
		}
	`;
	document.head.appendChild(style);

	/* ==========================
	   CACHE (RẤT QUAN TRỌNG)
	========================== */
	const processedRows = new WeakMap();

	/* ==========================
	   CORE
	========================== */
	function processRow(tr) {
		// Nếu row đã xử lý rồi → bỏ qua
		if (processedRows.has(tr)) return;

		const text = getRowSearchText(tr);
		const matched = [];

		for (const key of whitelist) {
			const k = key?.toLowerCase();
			if (k && text.includes(k)) matched.push(key);
		}

		processedRows.set(tr, matched);

		if (matched.length === 0) return;

		tr.classList.add("mx-offense-whitelist-row");

		const firstTd = tr.querySelector("td");
		if (!firstTd) return;

		const badge = document.createElement("span");
		badge.className = "mx-whitelist-badge";

		const show = matched.slice(0, 2);
		const more = matched.length > 2 ? ` +${matched.length - 2}` : "";

		badge.textContent = `WL: ${show.join(", ")}${more}`;
		badge.title = `Whitelist: ${matched.join(", ")}`;

		firstTd.appendChild(badge);
	}

	function scanRows() {
		const rows = document.querySelectorAll(config.selector.rows);
		if (!rows || rows.length === 0) return;

		rows.forEach(processRow);
	}

	/* ==========================
	   OBSERVER (DEBOUNCE)
	========================== */
	function initObserver() {
		const tbody = document.querySelector(config.selector.tbody);
		if (!tbody) return;

		let scheduled = false;

		observeElement(tbody, () => {
			if (scheduled) return;

			scheduled = true;
			requestAnimationFrame(() => {
				scheduled = false;
				scanRows();
			});
		});
	}

	/* ==========================
	   INIT
	========================== */
	let retry = 0;
	const timer = setInterval(() => {
		const table = document.querySelector(config.selector.table);
		if (table) {
			clearInterval(timer);
			scanRows();
			initObserver();
			console.log("✅ offense whitelist highlighter loaded (optimized)", ctx);
		}
		if (++retry > 20) clearInterval(timer);
	}, 500);
}
