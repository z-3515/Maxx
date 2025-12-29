import { default as config } from "./config.js";
import { zammadFetch } from "../helper/zammad_api.js";
import { observeWhenVisible } from "../helper/domObserver.js";

async function fetchAllTickets(config) {
    return await zammadFetch(config.api.all_ticket);
}

function injectNoteShiftStyle() {
    if (document.getElementById("maxx-note-style")) return;

    const style = document.createElement("style");
    style.id = "maxx-note-style";
    style.textContent = `
/* ===============================
   NOTE GIAO CA – THEME MATCH
================================ */

.maxx-note-shift-container {
    max-width: 960px;
    padding: 16px 20px;
    background: var(--background-secondary);
    color: var(--text-normal);
}

/* ===== Header ===== */
.maxx-note-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--header-primary);
    margin-bottom: 14px;
}

/* ===== Shift Buttons ===== */
.maxx-shift-buttons {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.maxx-shift-buttons button {
    padding: 6px 12px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--button-background);
    color: var(--text-normal);
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
}

.maxx-shift-buttons button small {
    color: var(--text-muted);
    font-size: 11px;
}

.maxx-shift-buttons button:hover {
    background: var(--background-secondary-hover);
}

.maxx-shift-buttons button.active {
    background: var(--button-primary-background);
    color: var(--text-inverted);
    border-color: var(--button-primary-background);
}

/* ===== Time Row ===== */
.maxx-time-row {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 18px;
    flex-wrap: wrap;
}

.maxx-time-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.maxx-time-group label {
    font-size: 11px;
    color: var(--text-muted);
    letter-spacing: 0.3px;
}

/* ===== Input ===== */
.maxx-time-group input {
    height: 32px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-secondary);
    color: var(--text-normal);
}

.maxx-time-group input:focus {
    outline: none;
    border-color: var(--border-highlight);
}

/* ===== Confirm Button ===== */
.maxx-confirm-btn {
    height: 32px;
    padding: 0 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background: var(--button-primary-background);
    color: var(--button-primary-text);
    font-weight: 500;
}

.maxx-confirm-btn:hover {
    background: var(--button-primary-background-active);
}

/* ===== Output ===== */
.maxx-note-output {
    margin-top: 10px;
}

.maxx-note-output .title {
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--header-primary);
}

.maxx-note-text {
    width: 100%;
    min-height: 120px;
    resize: vertical;
    padding: 8px 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
}

.maxx-note-text:focus {
    outline: none;
    border-color: var(--border-highlight);
}
    .maxx-note-preview {
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
    white-space: pre-wrap;
}

.maxx-note-preview a {
    color: var(--text-link);
    text-decoration: underline;
}

.maxx-note-preview a:hover {
    color: var(--highlight);
}
.maxx-note-output .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.maxx-copy-btn {
    height: 26px;
    padding: 0 10px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--button-background);
    color: var(--text-normal);
    cursor: pointer;
}

.maxx-copy-btn:hover {
    background: var(--background-secondary-hover);
}

.maxx-note-editor {
    min-height: 140px;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: monospace;
    white-space: pre-wrap;
    outline: none;
}

.maxx-note-editor a {
    color: var(--text-link);
    text-decoration: underline;
    cursor: pointer;
    user-select: text;
}


    `;
    document.head.appendChild(style);
}

function toggleOverviewHeaderTitle(isNoteShiftOn) {
    const titleEl = document.querySelector(
        ".overview-table .page-header .page-header-title h2"
    );
    if (!titleEl) return;

    // cache title gốc
    if (!titleEl.dataset.maxxOriginTitle) {
        titleEl.dataset.maxxOriginTitle = titleEl.textContent;
    }

    if (isNoteShiftOn) {
        titleEl.textContent = "Note Giao Ca";
    } else {
        titleEl.textContent = titleEl.dataset.maxxOriginTitle;
    }
}

function toggleNoteShiftScreen() {
    const pageContent = document.querySelector(".overview-table .page-content");
    const tableOverview = pageContent?.querySelector(".table-overview");
    if (!pageContent || !tableOverview) return;

    let screen = pageContent.querySelector(".maxx-note-shift-screen");

    // ===== OFF → ON =====
    if (!screen) {
        screen = document.createElement("div");
        screen.className = "maxx-note-shift-screen";

        tableOverview.style.display = "none";
        pageContent.appendChild(screen);

        toggleOverviewHeaderTitle(true);

        injectNoteShiftStyle();
        renderNoteShiftTimePicker(screen, async ({ start, end }) => {
            return `✔ Note giao ca từ ${start} đến ${end}`;
        });

        return;
    }

    // ===== ON → OFF =====
    screen.remove();
    tableOverview.style.display = "";
    toggleOverviewHeaderTitle(false);
}

function noteShiftBtn(config, pageHeaderEl) {
    if (!pageHeaderEl) return;

    if (pageHeaderEl.querySelector(".maxx-btn-note-shift")) {
        return;
    }

    const btnNoteShift = document.createElement("button");
    btnNoteShift.innerText = "Note Giao Ca";
    btnNoteShift.className = "maxx-btn-note-shift";

    for (const [key, value] of Object.entries(config.style.btnNoteShift)) {
        btnNoteShift.style[key] = value;
    }

    pageHeaderEl.appendChild(btnNoteShift);

    btnNoteShift.onclick = () => {
        toggleNoteShiftScreen();
        btnNoteShift.classList.toggle("active");
        btnNoteShift.innerText = btnNoteShift.classList.contains("active")
            ? "Quay lại"
            : "Note Giao Ca";
    };
}

function getShiftTime(shift) {
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(today.getTime() - 86400000);

    let start, end;

    switch (shift) {
        case 1: // 06:00 - 14:00 hôm nay
            start = new Date(today.setHours(6, 0, 0, 0));
            end = new Date(today.setHours(14, 0, 0, 0));
            break;

        case 2: // 14:00 - 22:00 hôm nay
            start = new Date(today.setHours(14, 0, 0, 0));
            end = new Date(today.setHours(22, 0, 0, 0));
            break;

        case 3: // 22:00 hôm qua - 06:00 hôm nay
            start = new Date(yesterday.setHours(22, 0, 0, 0));
            end = new Date(today.setHours(6, 0, 0, 0));
            break;
    }

    return {
        start: toLocalDateTimeInput(start),
        end: toLocalDateTimeInput(end),
    };
}

const TZ_OFFSET_MIN = 0 * 60;

function toLocalDateTimeInput(date) {
    const local = new Date(date.getTime() + TZ_OFFSET_MIN * 60000);
    const pad = (n) => String(n).padStart(2, "0");

    return (
        local.getFullYear() +
        "-" +
        pad(local.getMonth() + 1) +
        "-" +
        pad(local.getDate()) +
        "T" +
        pad(local.getHours()) +
        ":" +
        pad(local.getMinutes())
    );
}

function extractPureNote(noteText) {
    if (!noteText) return "";

    return noteText
        .split("\n")
        .filter((line) => {
            const l = line.trim();
            if (!l) return false;
            if (l.startsWith("===")) return false;
            if (l.startsWith("Tổng ticket")) return false;
            if (l.startsWith("Thống kê")) return false;
            if (l.startsWith("- ")) return false;
            if (l.startsWith("Lần chạy")) return false;
            if (l.startsWith("------")) return false;
            if (l.startsWith("Danh sách Re-check")) return false;
            return true;
        })
        .join("\n")
        .trim();
}

function renderNoteShiftTimePicker(screenEl) {
    screenEl.innerHTML = "";

    const container = document.createElement("div");
    container.className = "maxx-note-shift-container";

    container.innerHTML = `
        <div class="maxx-shift-buttons">
            <button data-shift="1">Ca 1<br><small>06:00 - 14:00</small></button>
            <button data-shift="2">Ca 2<br><small>14:00 - 22:00</small></button>
            <button data-shift="3">Ca 3<br><small>22:00 - 06:00</small></button>
        </div>

        <div class="maxx-time-row">
            <div class="maxx-time-group">
                <label>START TIME</label>
                <input type="datetime-local" class="maxx-start-time">
            </div>

            <div class="maxx-time-group">
                <label>END TIME</label>
                <input type="datetime-local" class="maxx-end-time">
            </div>

            <button class="maxx-confirm-btn">Xác nhận</button>
        </div>

        <div class="maxx-note-output">
            <div class="title">
                📄 Nội dung note giao ca
                <button class="maxx-copy-btn">Copy Note</button>
            </div>

            <div class="maxx-note-editor" tabindex="0"></div>

        </div>
    `;

    screenEl.appendChild(container);

    const startInput = container.querySelector(".maxx-start-time");
    const endInput = container.querySelector(".maxx-end-time");
    const noteText = container.querySelector(".maxx-note-text");

    // ===== Quick shift buttons =====
    container.querySelectorAll("[data-shift]").forEach((btn) => {
        btn.onclick = () => {
            container
                .querySelectorAll("[data-shift]")
                .forEach((b) => b.classList.remove("active"));

            btn.classList.add("active");

            const { start, end } = getShiftTime(Number(btn.dataset.shift));
            startInput.value = start;
            endInput.value = end;
        };
    });

    // ===== Confirm =====
    container.querySelector(".maxx-confirm-btn").onclick = async () => {
        const start = startInput.value;
        const end = endInput.value;

        if (!start || !end) {
            alert("Vui lòng chọn đầy đủ thời gian");
            return;
        }

        const target = detectTargetByURL();
        if (!target) {
            editorEl.textContent =
                "❌ Không xác định được hệ thống (MSS / SIEM)";
            return;
        }

        const shiftLabel =
            container
                .querySelector("[data-shift].active")
                ?.innerText?.split("\n")[0] || "Ca";

        const editorEl = container.querySelector(".maxx-note-editor");
        const copyBtn = container.querySelector(".maxx-copy-btn");
        let currentPureNote = "";

        // loading
        editorEl.textContent = "⏳ Đang xử lý dữ liệu...";

        try {
            const { noteText } = await processData({
                target,
                startTime: start,
                endTime: end,
                shiftLabel,
            });

            // ✅ HIỂN THỊ HTML CÓ LINK
            editorEl.innerHTML = noteText;
            currentPureNote = extractPureNote(editorEl.innerText);
        } catch (err) {
            editorEl.textContent = "❌ Lỗi xử lý dữ liệu: " + err.message;
        }

        // ✅ COPY → TEXT SẠCH (strip <a>)
        copyBtn.onclick = async () => {
            const text = (currentPureNote || "").trim();
            if (!text) {
                alert("Chưa có nội dung note để copy");
                return;
            }

            try {
                await navigator.clipboard.writeText(text);
                copyBtn.innerText = "Đã copy";
                setTimeout(() => (copyBtn.innerText = "Copy Note"), 1500);
            } catch {
                alert("Không copy được, hãy copy thủ công");
            }
        };

        editorEl.addEventListener("copy", (e) => {
            e.preventDefault();
            const sel = window.getSelection();
            const text = sel ? sel.toString() : "";
            e.clipboardData.setData("text/plain", text);
        });

        editorEl.addEventListener("click", (e) => {
            const a = e.target?.closest?.("a");
            if (!a) return;

            // đảm bảo click là mở tab, không bị SPA / editor chặn
            e.preventDefault();
            e.stopPropagation();

            const href = a.getAttribute("href");
            if (href) window.open(href, "_blank", "noopener,noreferrer");
        });
    };
}

function parseLocalDateTime(value) {
    // value: "2025-12-29T06:00"
    return new Date(value).getTime();
}

function filterCategory(target, ticket) {
    const title = ticket.title?.toLowerCase() || "";

    const base = () => {
        if (title.includes("scan web") || title.includes("lỗ hổng"))
            return "Scan Web";
        if (title.includes("bruteforce")) return "Bruteforce";
        if (title.includes("command") || title.includes("thực thi lệnh"))
            return "Command";
        if (title.includes("kata")) return "Kata alert";
        if (title.includes("đổi mật khẩu")) return "Change password";
        if (title.includes("mã độc") || title.includes("malware"))
            return "Malware";
        if (title.includes("ngừng đẩy log")) return "ngừng đẩy log";
        if (title.includes("tạo file") || title.includes("create file"))
            return "create file";
        return "re-check";
    };

    if (target === "mss") {
        if (title.includes("khóa tài khoản")) return "lock acc";
        if (
            title.includes("tạo mới tài khoản") ||
            title.includes("create user")
        )
            return "create acc";
    }

    return base();
}

function groupTicketsString(target, tickets) {
    if (!tickets.length) return "";

    tickets.sort((a, b) =>
        filterCategory(target, a).localeCompare(filterCategory(target, b))
    );

    let result = "";
    let current = "";
    let temp = [];

    for (const t of tickets) {
        const cat = filterCategory(target, t);
        if (!current) current = cat;

        if (cat === current) {
            temp.push(buildTicketLink(target, t));
        } else {
            result += `${temp.join(", ")} ${current}; `;
            current = cat;
            temp = [buildTicketLink(target, t)];
        }
    }

    if (temp.length) {
        result += `${temp.join(", ")} ${current}`;
    }

    return result.trim();
}

function detectTargetByURL() {
    const host = location.hostname;

    if (host.includes("ticket.vnpt.vn")) return "siem";
    if (host.includes("dashboard-soc.vnpt.vn")) return "mss";

    return null;
}

function cleanTitle(title = "") {
    return String(title)
        .replace(/\[[^\]]*\]/g, "")
        .trim();
}

function buildTicketLink(target, ticket) {
    const id = ticket.id;
    const number = ticket.number;

    if (!id || !number) return number || "";

    if (target === "mss") {
        return `<a href="https://dashboard-soc.vnpt.vn/ticket/#ticket/zoom/${id}" target="_blank">${number}</a>`;
    }

    if (target === "siem") {
        return `<a href="https://ticket.vnpt.vn/#ticket/zoom/${id}" target="_blank">${number}</a>`;
    }

    return number;
}

async function processData({ target, startTime, endTime, shiftLabel }) {
    const { STATE_LABEL, SPECIAL_ORG } = config.mapping;

    const data = await fetchAllTickets(config);

    const ticketsAll = Object.values(data?.assets?.Ticket || {});
    const stateMap = data?.assets?.TicketState || {};

    const start = new Date(startTime);
    const end = new Date(endTime);

    // ===== Lọc theo thời gian =====
    const tickets = ticketsAll.filter((t) => {
        const time = new Date(t.created_at || t.updated_at);
        return time >= start && time <= end;
    });

    // ===== Thống kê trạng thái =====
    const stateCount = {};
    tickets.forEach((t) => {
        const stateName = stateMap[t.state_id]?.name || `#${t.state_id}`;
        const label = STATE_LABEL[target]?.[stateName] || stateName;
        stateCount[label] = (stateCount[label] || 0) + 1;
    });

    let output = "";
    let recheck = [];

    if (target === "mss") {
        const MSS_list = [];
        const org_lists = {};

        tickets.forEach((t) => {
            if (![1, 2].includes(t.state_id)) return;

            const cat = filterCategory(target, t);
            if (cat === "re-check") recheck.push(t);

            if (SPECIAL_ORG[t.organization_id]) {
                const org = SPECIAL_ORG[t.organization_id];
                if (!org_lists[org]) org_lists[org] = [];
                org_lists[org].push(t);
            } else {
                MSS_list.push(t);
            }
        });

        const mssStr = groupTicketsString(target, MSS_list);
        if (mssStr) output += `MSS: ${mssStr} chưa xử lý.\n`;

        Object.entries(org_lists).forEach(([org, list]) => {
            const str = groupTicketsString(target, list);
            if (str) output += `${org}: ${str} chưa xử lý.\n`;
        });
    } else {
        const list = [];
        tickets.forEach((t) => {
            if (![1, 2].includes(t.state_id)) return;
            const cat = filterCategory(target, t);
            if (cat === "re-check") recheck.push(t);
            list.push(t);
        });

        const siemStr = groupTicketsString(target, list);
        if (siemStr) output += `SIEM: ${siemStr} chưa xử lý.\n`;
    }

    if (recheck.length) {
        output += `\n------\nDanh sách Re-check:\n`;
        recheck.forEach((t) => {
            output += `- ${buildTicketLink(target, t)}: ${cleanTitle(
                t.title
            )}\n`;
        });
    }

    // ===== Build note =====
    const block = [];
    block.push(`=== NOTE ${target.toUpperCase()} (${shiftLabel}) ===`);
    block.push(output.trim());
    block.push(`\nTổng ticket lọc: ${tickets.length}`);
    block.push(`Thống kê trạng thái:`);

    Object.entries(stateCount).forEach(([s, c]) => block.push(`- ${s}: ${c}`));

    block.push(`Lần chạy: ${new Date().toLocaleString("vi-VN")}`);

    return {
        noteText: block.join("\n"),
        tickets,
        stateCount,
    };
}

export default function noteShift(ctx) {
    if (!config.enabled) return;

    observeWhenVisible(
        ".overview-table .page-header",
        (pageHeaderEl) => {
            noteShiftBtn(config, pageHeaderEl);
        },
        {
            debounce: 150,
        }
    );

    console.log("✅ Maxx Module Loaded: SOC Ticket Note Shift");
}

/* ==============================
   DEV ENTRY
============================== */
if (typeof __MAXX_DEV__ !== "undefined") {
    window.__MAXX_DEV_ENTRY__ = noteShift;
}
