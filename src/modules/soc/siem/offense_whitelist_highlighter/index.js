import config from "./config.js";
import { isActiveIframe } from "../helper/iframe.js";
import { observeElement } from "../helper/observe.js";

export default function offenseWhitelistHighlighter(ctx) {
	if (!config.enabled) return;
	if (config.iframe && !isActiveIframe()) return;

	const url = ctx.url || location.href;
	const isMSS = url.includes("mss.");
	const whitelist = (isMSS ? config.mss.whitelist : config.siem.whitelist) || [];

	if (!Array.isArray(whitelist) || whitelist.length === 0) {
		console.warn("⚠️ Whitelist rỗng, bỏ qua highlight");
		return;
	}

	/* ==========================
	   STYLE (KHÔNG ĐÈ SELECT STATE)
	========================== */
	const style = document.createElement("style");
	style.textContent = `
		/* chỉ dùng viền/outline, hạn chế đụng background để tránh xung đột row selected */
		tr.mx-offense-whitelist-row {
			outline: 1px solid rgba(148, 163, 184, .55);
			outline-offset: -1px;
			box-shadow: inset 3px 0 0 rgba(148, 163, 184, .9);
		}

		/* Nếu grid có class selected kiểu datarowselected (hoặc tương tự), giảm hiệu ứng xuống mức tối thiểu */
		tr.mx-offense-whitelist-row.datarowselected,
		tr.mx-offense-whitelist-row.selected,
		tr.mx-offense-whitelist-row.is-selected,
		tr.mx-offense-whitelist-row[aria-selected="true"] {
			outline-color: rgba(148, 163, 184, .35);
			box-shadow: inset 3px 0 0 rgba(148, 163, 184, .45);
		}

        /* offenseId đỏ khi row whitelist */
		tr.mx-offense-whitelist-row td[propertyname="offenseId"] {
			color: #dc2626 !important; /* red-600 */
			font-weight: 600;
		}

		/* khi row selected (đảo màu), giảm đỏ xuống để không chói */
		tr.mx-offense-whitelist-row.datarowselected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row.is-selected td[propertyname="offenseId"],
		tr.mx-offense-whitelist-row[aria-selected="true"] td[propertyname="offenseId"] {
			color: #fecaca !important; /* red-200 */
		}

		.mx-whitelist-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin-left: 8px;
			padding: 2px 8px;
			border-radius: 999px;
			font-size: 11px;
			line-height: 1.6;
			white-space: nowrap;
			border: 1px solid rgba(148, 163, 184, .55);
			background: rgba(148, 163, 184, .12);
			color: #334155;
			user-select: none;
		}

		.mx-whitelist-badge b {
			font-weight: 700;
			color: #0f172a;
		}

		/* Khi row selected (đảo màu), badge tự “nhạt” để không rối */
		tr.datarowselected .mx-whitelist-badge,
		tr.selected .mx-whitelist-badge,
		tr.is-selected .mx-whitelist-badge,
		tr[aria-selected="true"] .mx-whitelist-badge {
			opacity: .75;
		}
	`;
	document.head.appendChild(style);

	/* ==========================
	   CORE
	========================== */
	function getMatchedKeysFromRow(tr) {
		// dùng innerText để match giống mẫu, không đụng DOM
		const text = (tr.innerText || "").toLowerCase();
		const matched = [];

		for (const key of whitelist) {
			const k = (key || "").trim();
			if (!k) continue;
			if (text.includes(k.toLowerCase())) matched.push(k);
		}
		return matched;
	}

	function setBadge(tr, matchedKeys) {
		// gắn badge vào cell đầu tiên (ổn định nhất)
		const firstTd = tr.querySelector("td");
		if (!firstTd) return;

		let badge = tr.querySelector(".mx-whitelist-badge");
		if (!badge) {
			badge = document.createElement("span");
			badge.className = "mx-whitelist-badge";
			firstTd.appendChild(badge);
		}

		// tránh quá dài
		const showKeys = matchedKeys.slice(0, 3);
		const more = matchedKeys.length > 3 ? ` +${matchedKeys.length - 3}` : "";

		badge.innerHTML = `<b>WL</b>: ${escapeHtml(showKeys.join(", "))}${more}`;
		badge.title = `Whitelist match: ${matchedKeys.join(", ")}`;
	}

	function removeBadge(tr) {
		const badge = tr.querySelector(".mx-whitelist-badge");
		if (badge) badge.remove();
	}

	function highlightRows() {
		const rows = document.querySelectorAll(config.selector.rows);
		if (!rows || rows.length === 0) return;

		rows.forEach((tr) => {
			const matchedKeys = getMatchedKeysFromRow(tr);

			if (matchedKeys.length > 0) {
				tr.classList.add("mx-offense-whitelist-row");
				setBadge(tr, matchedKeys);
			} else {
				tr.classList.remove("mx-offense-whitelist-row");
				removeBadge(tr);
			}
		});
	}

	/* ==========================
	   OBSERVE
	========================== */
	function initObserver() {
		const tbody = document.querySelector(config.selector.tbody);
		if (!tbody) return;

		observeElement(tbody, () => {
			highlightRows();
		});
	}

	/* ==========================
	   INIT (WAIT TABLE)
	========================== */
	let retry = 0;
	const timer = setInterval(() => {
		const table = document.querySelector(config.selector.table);
		if (table) {
			clearInterval(timer);
			highlightRows();
			initObserver();
			console.log("✅ offense whitelist highlighter loaded", ctx);
		}
		if (++retry > 20) clearInterval(timer);
	}, 500);
}

/* ==========================
   UTILS
========================== */
function escapeHtml(str) {
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
