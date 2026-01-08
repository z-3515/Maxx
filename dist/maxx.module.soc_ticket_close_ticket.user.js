// ==UserScript==
// @name         MAXX [DEV] close-ticket module
// @namespace    maxx-dev
// @version      0.0.0-dev
// @description  Dev build for module: close-ticket module
// @author       Maxx
// @run-at       document-end
// @match        *://*/*
// @grant        none
// @charset      utf-8
// ==/UserScript==

// module: close-ticket module | Y2xvc2UtdGlja2V0IG1vZHVsZQ==


(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // src/modules/soc/ticket/close_ticket/config.js
  var config_default = {
    name: "close-ticket module",
    enabled: true,
    match: ["*://ticket.vnpt.vn/#ticket/zoom/*"],
    exclude: [],
    runAt: "document-end",
    iframe: false,
    once: true,
    priority: 10,
    options: {
      state: {
        closed: "4"
      },
      organization: {
        TT_ATTT: "18"
      }
    }
  };

  // src/modules/soc/ticket/close_ticket/index.js
  var domObserver = null;
  var currentTicketId = null;
  function getTicketId() {
    const el = document.querySelector(".ticket-number");
    return el ? el.textContent.trim() : null;
  }
  __name(getTicketId, "getTicketId");
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
  __name(injectStyleCSS, "injectStyleCSS");
  function injectCloseButton() {
    const tabsContainer = document.querySelector(".tabsSidebar-tabs");
    if (!tabsContainer) return;
    let closeBtn = tabsContainer.querySelector(".tabsSidebar-action");
    if (!closeBtn) {
      closeBtn = document.createElement("div");
      closeBtn.className = "tabsSidebar-tab tabsSidebar-action";
      closeBtn.title = "Close ticket";
      closeBtn.innerHTML = `<span class="close-icon">×</span>`;
      closeBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (closeBtn.classList.contains("disabled")) return;
        onCloseButtonClick();
      });
      tabsContainer.appendChild(closeBtn);
    }
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
  __name(injectCloseButton, "injectCloseButton");
  function onCloseButtonClick() {
    if (isTicketClosed()) return;
    if (!isAllowedGroup()) return;
    const stateControl = document.querySelector('.form-control[name="state_id"]');
    if (!stateControl) {
      console.warn('[close-ticket] Không tìm thấy <.form-control[name="state_id"]>');
      return;
    }
    stateControl.value = config_default.options.state.closed;
    stateControl.dispatchEvent(new Event("change", { bubbles: true }));
    const updateButton = document.querySelector(".js-submitDropdown > button.js-submit");
    if (!updateButton) {
      console.warn("[close-ticket] Không tìm thấy nút <.js-submitDropdown > button.js-submit>");
      return;
    }
    updateButton.click();
    setTimeout(disconnectObserver, 500);
  }
  __name(onCloseButtonClick, "onCloseButtonClick");
  function isTicketClosed() {
    const stateControl = document.querySelector('.form-control[name="state_id"]');
    if (!stateControl) return false;
    return String(stateControl.value) === String(config_default.options.state.closed);
  }
  __name(isTicketClosed, "isTicketClosed");
  function disconnectObserver() {
    if (domObserver) {
      domObserver.disconnect();
      domObserver = null;
      console.log("[close-ticket] DOM observer disconnected");
    }
  }
  __name(disconnectObserver, "disconnectObserver");
  function isAllowedGroup() {
    const groupInput = document.querySelector('.form-group[data-attribute-name="group_id"] input.searchableSelect-shadow');
    if (!groupInput) {
      console.warn("[close-ticket] Không tìm thấy group_id input");
      return false;
    }
    const currentGroupId = String(groupInput.value);
    const allowedGroupId = String(config_default.options.organization.TT_ATTT);
    return currentGroupId === allowedGroupId;
  }
  __name(isAllowedGroup, "isAllowedGroup");
  function observeDOM() {
    if (domObserver) return;
    let scheduled = false;
    domObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
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
      subtree: true
    });
  }
  __name(observeDOM, "observeDOM");
  function closeTicket(ctx) {
    if (!config_default.enabled) return;
    injectStyleCSS();
    currentTicketId = getTicketId();
    injectCloseButton();
    observeDOM();
  }
  __name(closeTicket, "closeTicket");
  if (true) {
    window.__MAXX_DEV_ENTRY__ = closeTicket;
  }
})();



;(() => {
	const run = window.__MAXX_DEV_ENTRY__;

	if (typeof run !== "function") {
		console.warn("[MAXX DEV] Không tìm thấy entry function");
		return;
	}

	const ctx = {
		mode: "dev",
		source: "build_module",
	};

	if (document.readyState !== "loading") {
		run(ctx);
	} else {
		window.addEventListener("DOMContentLoaded", () => run(ctx), {
			once: true,
		});
	}
})();
