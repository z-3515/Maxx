/**
 * domapi helper – capture Pagecontrol safely
 * SIEM-safe: capture every time Pagecontrol is called
 */

export function hookDomapi(win, onTabSet) {
	if (!win) return false;

	try {
		const domapi = win.domapi;
		if (!domapi || typeof domapi.Pagecontrol !== "function") return false;

		// hook 1 lần / window
		if (!domapi.__mx_hooked) {
			domapi.__mx_hooked = true;
			domapi.__mx_orig_Pagecontrol = domapi.Pagecontrol;

			domapi.Pagecontrol = function (...args) {
				const pc = domapi.__mx_orig_Pagecontrol.apply(this, args);

				try {
					if (pc && typeof pc.addPage === "function" && typeof pc.assignElement === "function" && typeof pc.setIndex === "function") {
						onTabSet(pc);
					}
				} catch {}

				return pc;
			};
		}

		return true;
	} catch {
		return false;
	}
}
