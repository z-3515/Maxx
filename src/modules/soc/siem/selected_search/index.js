import config from "./config.js";

export default function selectedSearch(ctx) {
	if (!config.enabled) return;

	const { engines, ui } = config;

	/* ==========================
	   STYLE
	========================== */
	const style = document.createElement("style");
	style.textContent = `
		.mx-search-box {
			position: fixed;
			display: flex;
			gap: 6px;
			padding: 6px;
			background: rgba(15,23,42,.85);
			backdrop-filter: blur(6px);
			border-radius: 999px;
			box-shadow: 0 10px 30px rgba(0,0,0,.4);
			transform: scale(.6);
			opacity: 0;
			pointer-events: none;
			transition: all .2s cubic-bezier(.25,.8,.25,1);
			z-index: ${ui?.zIndex ?? 999999};
		}

		.mx-search-box.show {
			transform: scale(1);
			opacity: 1;
			pointer-events: auto;
		}

		.mx-btn {
			width: 34px;
			height: 34px;
			border-radius: 50%;
			display: grid;
			place-items: center;
			cursor: pointer;
			font-weight: 700;
			font-size: 13px;
			color: #fff;
			user-select: none;
			transition: all .2s ease;
		}

		.mx-btn:hover {
			transform: scale(1.15) rotate(6deg);
			box-shadow: 0 0 12px currentColor;
		}

		.mx-google {
			background: radial-gradient(circle,#60a5fa,#2563eb);
		}

		.mx-vt {
			background: radial-gradient(circle,#34d399,#059669);
		}
	`;
	document.head.appendChild(style);

	/* ==========================
	   UI
	========================== */
	const box = document.createElement("div");
	box.className = "mx-search-box";

	let selectedText = "";

	Object.values(engines).forEach((engine) => {
		const btn = document.createElement("div");
		btn.className = `mx-btn ${engine.class}`;
		btn.textContent = engine.label;

		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (!selectedText) return;

			window.open(engine.url(encodeURIComponent(selectedText)), "_blank");
			hide();
		});

		box.appendChild(btn);
	});

	document.body.appendChild(box);

	/* ==========================
	   POSITION & STATE
	========================== */
	function show(rect) {
		box.style.left = rect.right + (ui?.offsetX ?? 8) + "px";
		box.style.top = rect.top + (ui?.offsetY ?? -10) + "px";

		box.classList.add("show");
	}

	function hide() {
		box.classList.remove("show");
		selectedText = "";
	}

	/* ==========================
	   SELECTION HANDLER
	========================== */
	document.addEventListener("mouseup", () => {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed) return hide();

		const text = sel.toString().trim();
		if (!text) return hide();

		selectedText = text;

		try {
			const rect = sel.getRangeAt(0).getBoundingClientRect();
			if (rect.width || rect.height) show(rect);
		} catch {
			hide();
		}
	});

	document.addEventListener("mousedown", (e) => {
		if (!box.contains(e.target)) hide();
	});
}
