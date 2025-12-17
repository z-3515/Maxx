let selectedText = "";
let mounted = false;
let uiRef = null;

/* =========================
   UI CREATION
========================= */
function createUI() {
	injectStyle();

	const container = document.createElement("div");
	container.id = "maxx-selection-search";

	const main = document.createElement("div");
	main.className = "main-icon";
	main.textContent = "🔍";

	const actions = document.createElement("div");
	actions.className = "actions";

	const google = createAction("G", () => openSearch("https://www.google.com/search?q="));

	const vt = createAction("VT", () => openSearch("https://www.virustotal.com/gui/search/"));

	actions.append(google, vt);
	container.append(main, actions);

	return { container };
}

function createAction(label, onClick) {
	const el = document.createElement("div");
	el.className = "action";
	el.textContent = label;

	el.addEventListener("click", (e) => {
		e.stopPropagation();
		if (!selectedText) return;
		onClick();
		cleanupSelection();
	});

	return el;
}

/* =========================
   STYLE
========================= */
function injectStyle() {
	if (document.getElementById("maxx-selection-style")) return;

	const style = document.createElement("style");
	style.id = "maxx-selection-style";
	style.textContent = `
#maxx-selection-search {
	position: fixed;
	z-index: 999999;
	display: none;
	user-select: none;
	font-family: system-ui;
}

#maxx-selection-search .main-icon {
	background: #0ea5e9;
	color: #fff;
	padding: 6px;
	border-radius: 50%;
	cursor: pointer;
	box-shadow: 0 4px 12px rgba(0,0,0,.3);
}

#maxx-selection-search .actions {
	position: absolute;
	top: 0;
	left: 110%;
	display: flex;
	gap: 6px;
	opacity: 0;
	pointer-events: none;
	transition: opacity .15s ease;
}

#maxx-selection-search:hover .actions {
	opacity: 1;
	pointer-events: auto;
}

#maxx-selection-search .action {
	background: #111;
	color: #fff;
	font-size: 12px;
	padding: 6px;
	border-radius: 50%;
	cursor: pointer;
}

#maxx-selection-search .action:hover {
	background: #f97316;
}
`;
	document.head.appendChild(style);
}

/* =========================
   SELECTION LOGIC
========================= */
function isTextInput(el) {
	if (!el) return false;
	return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable === true;
}

function handleSelection(ui) {
	const selection = window.getSelection();
	if (!selection || selection.isCollapsed) {
		hide(ui);
		return;
	}

	const anchorNode = selection.anchorNode;
	const anchorEl = anchorNode?.nodeType === 1 ? anchorNode : anchorNode?.parentElement;

	if (isTextInput(anchorEl)) {
		hide(ui);
		return;
	}

	const text = selection.toString().trim();
	if (!text) {
		hide(ui);
		return;
	}

	selectedText = text;

	try {
		const rect = selection.getRangeAt(0).getBoundingClientRect();
		if (rect.width || rect.height) {
			show(ui, rect);
		}
	} catch {
		hide(ui);
	}
}

function show(ui, rect) {
	ui.container.style.left = rect.right + 6 + "px";
	ui.container.style.top = rect.top - 6 + "px";
	ui.container.style.display = "block";
}

function hide(ui) {
	ui.container.style.display = "none";
	selectedText = "";
}

/* =========================
   ACTIONS
========================= */
function openSearch(baseUrl) {
	if (!selectedText) return;
	window.open(baseUrl + encodeURIComponent(selectedText), "_blank");
}

function cleanupSelection() {
	if (!uiRef) return;
	hide(uiRef);
	window.getSelection().removeAllRanges();
}

/* =========================
   MODULE ENTRY
========================= */
export default function run(ctx) {
	// Chỉ chạy top window
	if (ctx.isIframe) return;

	// Chỉ mount 1 lần
	if (mounted) return;
	mounted = true;

	uiRef = createUI();
	document.body.appendChild(uiRef.container);

	document.addEventListener("mouseup", (e) => {
		if (uiRef.container.contains(e.target)) return;
		handleSelection(uiRef);
	});

	document.addEventListener("mousedown", (e) => {
		if (!uiRef.container.contains(e.target)) {
			hide(uiRef);
		}
	});
}
