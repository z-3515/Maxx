import { default as config } from "./config.js";

/* =========================
   Internal State
========================= */
let domObserver = null;
let currentTicketId = null;

/* =========================
   Utils: Get Ticket ID
========================= */
function getTicketId() {
	const el = document.querySelector(".ticket-number");

	return el ? el.textContent.trim() : null;
}

/* =========================
   Inject CSS
========================= */
function injectStyleCSS() {
	if (document.getElementById("maxx-close-btn-style")) return;

	const style = document.createElement("style");
	style.id = "maxx-close-btn-style";

	style.innerHTML = `
    .tabsSidebar-action {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .tabsSidebar-action .close-icon {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
        color: #9aa5ad;
        user-select: none;
    }

    .tabsSidebar-action:hover {
        background-color: #eef2f3;
    }

    .tabsSidebar-action:hover .close-icon {
        color: #d9534f;
    }

    /* ===== DISABLED STATE ===== */
    .tabsSidebar-action.disabled {
        pointer-events: none;
        opacity: 0.4;
        cursor: not-allowed;
    }
  `;

	document.head.appendChild(style);
}

/* =========================
   Inject Close Button
========================= */
function injectCloseButton() {
	const tabsContainer = document.querySelector(".tabsSidebar-tabs");
	if (!tabsContainer) return;

	let closeBtn = tabsContainer.querySelector(".tabsSidebar-action");

	if (!closeBtn) {
		closeBtn = document.createElement("div");
		closeBtn.className = "tabsSidebar-tab tabsSidebar-action";
		closeBtn.title = "Close ticket";
		closeBtn.innerHTML = `<span class="close-icon">×</span>`;

		closeBtn.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();

			if (closeBtn.classList.contains("disabled")) return;
			onCloseButtonClick();
		});

		tabsContainer.appendChild(closeBtn);
	}

	// ===== Update trạng thái enable / disable =====
	const shouldDisable = isTicketClosed() || !isAllowedGroup();

	closeBtn.classList.toggle("disabled", shouldDisable);

	if (!isAllowedGroup()) {
		closeBtn.title = "Kiểm tra trước khi đóng <<Organization not TT_ATTT>>";
	} else if (isTicketClosed()) {
		closeBtn.title = "Ticket đã được đóng";
	} else {
		closeBtn.title = "Close ticket";
	}
}

/* =========================
   Business Logic
========================= */
function onCloseButtonClick() {
	if (isTicketClosed()) return;
	if (!isAllowedGroup()) return;

	const stateControl = document.querySelector('.form-control[name="state_id"]');
	if (!stateControl) {
		console.warn('[close-ticket] Không tìm thấy <.form-control[name="state_id"]>');
		return;
	}

	stateControl.value = config.options.state.closed;
	stateControl.dispatchEvent(new Event("change", { bubbles: true }));

	const updateButton = document.querySelector(".js-submitDropdown > button.js-submit");
	if (!updateButton) {
		console.warn("[close-ticket] Không tìm thấy nút <.js-submitDropdown > button.js-submit>");
		return;
	}

	updateButton.click();

	setTimeout(disconnectObserver, 500);
}

/* =========================
   Helpers
========================= */
function isTicketClosed() {
	const stateControl = document.querySelector('.form-control[name="state_id"]');
	if (!stateControl) return false;

	return String(stateControl.value) === String(config.options.state.closed);
}

function disconnectObserver() {
	if (domObserver) {
		domObserver.disconnect();
		domObserver = null;
		console.log("[close-ticket] DOM observer disconnected");
	}
}

function isAllowedGroup() {
	const groupInput = document.querySelector('.form-group[data-attribute-name="group_id"] input.searchableSelect-shadow');

	if (!groupInput) {
		console.warn("[close-ticket] Không tìm thấy group_id input");
		return false;
	}

	const currentGroupId = String(groupInput.value);
	const allowedGroupId = String(config.options.organization.TT_ATTT);

	return currentGroupId === allowedGroupId;
}

/* =========================
   Mutation Observer (SPA)
========================= */
function observeDOM() {
	if (domObserver) return;

	let scheduled = false;

	domObserver = new MutationObserver(() => {
		if (scheduled) return;

		scheduled = true;
		requestAnimationFrame(() => {
			scheduled = false;

			// Detect ticket change
			const newTicketId = getTicketId();
			if (newTicketId && newTicketId !== currentTicketId) {
				console.log(`[close-ticket] Ticket changed: ${currentTicketId} → ${newTicketId}`);
				currentTicketId = newTicketId;
				injectCloseButton();
				return;
			}

			injectCloseButton();
		});
	});

	domObserver.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

/* =========================
   Entry
========================= */
export default function closeTicket(ctx) {
	if (!config.enabled) return;

	injectStyleCSS();

	currentTicketId = getTicketId();
	injectCloseButton();
	observeDOM();
}

/* =========================
   DEV ENTRY
========================= */
if (typeof __MAXX_DEV__ !== "undefined") {
	window.__MAXX_DEV_ENTRY__ = closeTicket;
}
