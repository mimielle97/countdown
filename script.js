// Objetivo por defecto: 22/04/2026 10:00 (hora LOCAL del dispositivo)
const INITIAL_TARGET = new Date(2026, 3, 22, 10, 0, 0); // (mes 3 = abril)
const DEFAULT_TITLE = "Días para el examen Aux. Admin.";
const DEFAULT_BG_A = "#d95a85";
const DEFAULT_BG_B = "#ef8fb0";
const DEFAULT_BG_C = "#ef8fb0";
const DEFAULT_TEXT_COLOR = "#ffffff";
const SUPABASE_URL = "https://blwhqrxabojzrrllmlnc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HNx3eIJxdQhO0xXSa-xkXA_Nvx162-9";
const TICK_INTERVAL_MS = 1000;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

const params = new URLSearchParams(window.location.search);
const widgetId = (params.get("widgetId") || "").trim();
const hasWidgetId = widgetId !== "";
const canEdit = hasWidgetId;
const isEmbedded = window.self !== window.top || params.get("embed") === "1";

let intervalId = null;
let targetDate = new Date(INITIAL_TARGET.getTime());
let hasPendingChanges = false;

const state = {
  title: DEFAULT_TITLE,
  bgColorA: DEFAULT_BG_A,
  bgColorB: DEFAULT_BG_B,
  bgColorC: DEFAULT_BG_C,
  textColor: DEFAULT_TEXT_COLOR,
};

const cardEl = document.querySelector(".card");
const titleEl = document.getElementById("name");
const displayEl = document.getElementById("display");
const openConfigEl = document.getElementById("openConfig");
const configPanelEl = document.getElementById("configPanel");
const closeConfigEl = document.getElementById("closeConfig");
const titleInputEl = document.getElementById("titleInput");
const targetInputEl = document.getElementById("targetInput");
const colorAInputEl = document.getElementById("colorAInput");
const colorBInputEl = document.getElementById("colorBInput");
const colorCInputEl = document.getElementById("colorCInput");
const textColorInputEl = document.getElementById("textColorInput");
const saveConfigEl = document.getElementById("saveConfig");
const saveStatusEl = document.getElementById("saveStatus");

const pad2 = n => String(n).padStart(2, "0");
const pad4 = n => String(n).padStart(4, "0");

const toTimeParts = totalSeconds => {
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return { days, hours, minutes, seconds };
};

const formatInputDateTime = date => {
  const year = pad4(date.getFullYear());
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const normalizeHex = (value, fallback) => {
  const normalized = (value || "").trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : fallback;
};

const hexToRgba = (hex, alpha) => {
  const safeHex = normalizeHex(hex, DEFAULT_TEXT_COLOR);
  const r = Number.parseInt(safeHex.slice(1, 3), 16);
  const g = Number.parseInt(safeHex.slice(3, 5), 16);
  const b = Number.parseInt(safeHex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

function tick() {
  const now = new Date();
  let diff = targetDate.getTime() - now.getTime();
  if (diff < 0) diff = 0;

  const totalSeconds = Math.floor(diff / 1000);
  const { days, hours, minutes, seconds } = toTimeParts(totalSeconds);

  if (displayEl) {
    displayEl.textContent = `${days}:${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  if (diff === 0 && intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function ensureTicking() {
  if (intervalId === null) {
    intervalId = setInterval(tick, TICK_INTERVAL_MS);
  }
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--bg-sunrise-a", state.bgColorA);
  root.style.setProperty("--bg-sunrise-b", state.bgColorB);
  root.style.setProperty("--bg-sunrise-c", state.bgColorC);
  root.style.setProperty("--text-main", hexToRgba(state.textColor, ".98"));
  root.style.setProperty("--text-secondary", hexToRgba(state.textColor, ".84"));
  root.style.setProperty("--text-tertiary", hexToRgba(state.textColor, ".76"));
}

function applyStateToView() {
  if (titleEl) titleEl.textContent = state.title;
  tick();
  applyTheme();
}

function syncInputsFromState() {
  if (titleInputEl) titleInputEl.value = state.title;
  if (targetInputEl) targetInputEl.value = formatInputDateTime(targetDate);
  if (colorAInputEl) colorAInputEl.value = state.bgColorA;
  if (colorBInputEl) colorBInputEl.value = state.bgColorB;
  if (colorCInputEl) colorCInputEl.value = state.bgColorC;
  if (textColorInputEl) textColorInputEl.value = state.textColor;
}

function setSaveStatus(message, type = "") {
  if (!saveStatusEl) return;
  saveStatusEl.textContent = message;
  saveStatusEl.classList.remove("ok", "error");
  if (type === "ok" || type === "error") {
    saveStatusEl.classList.add(type);
  }
}

function setPendingChanges(value) {
  hasPendingChanges = value;
  if (saveConfigEl) saveConfigEl.disabled = !hasPendingChanges;
}

function openConfigPanel() {
  if (!configPanelEl || !canEdit) return;
  syncInputsFromState();
  setSaveStatus("");
  setPendingChanges(false);
  configPanelEl.classList.add("is-open");
  configPanelEl.setAttribute("aria-hidden", "false");
}

function closeConfigPanel() {
  if (!configPanelEl) return;
  configPanelEl.classList.remove("is-open");
  configPanelEl.setAttribute("aria-hidden", "true");
}

function buildDraft() {
  if (!titleInputEl || !targetInputEl || !colorAInputEl || !colorBInputEl || !colorCInputEl || !textColorInputEl) {
    return null;
  }

  if (targetInputEl.value === "") return null;
  const parsedTarget = new Date(targetInputEl.value);
  if (Number.isNaN(parsedTarget.getTime())) return null;

  const normalizedTitle = (titleInputEl.value || "").trim() || DEFAULT_TITLE;

  return {
    title: normalizedTitle,
    targetDate: parsedTarget,
    bgColorA: normalizeHex(colorAInputEl.value, DEFAULT_BG_A),
    bgColorB: normalizeHex(colorBInputEl.value, DEFAULT_BG_B),
    bgColorC: normalizeHex(colorCInputEl.value, DEFAULT_BG_C),
    textColor: normalizeHex(textColorInputEl.value, DEFAULT_TEXT_COLOR),
  };
}

async function loadRemoteConfig() {
  if (!hasWidgetId) return;

  setSaveStatus("Cargando configuración...");

  const query = new URLSearchParams({
    select: "widget_id,title,target_date,bg_color_a,bg_color_b,bg_color_c,text_color",
    widget_id: `eq.${widgetId}`,
    limit: "1",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/widgets?${query.toString()}`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    setSaveStatus("No se pudo cargar la configuración.", "error");
    return;
  }

  const rows = await response.json();
  const row = rows[0];

  if (!row) {
    setSaveStatus("No existe configuración para este widget.", "error");
    return;
  }

  state.title = (row.title || "").trim() || DEFAULT_TITLE;
  state.bgColorA = normalizeHex(row.bg_color_a, DEFAULT_BG_A);
  state.bgColorB = normalizeHex(row.bg_color_b, DEFAULT_BG_B);
  state.bgColorC = normalizeHex(row.bg_color_c, DEFAULT_BG_C);
  state.textColor = normalizeHex(row.text_color, DEFAULT_TEXT_COLOR);

  const parsedTarget = new Date(row.target_date);
  if (!Number.isNaN(parsedTarget.getTime())) {
    targetDate = parsedTarget;
  }

  ensureTicking();
  applyStateToView();
  syncInputsFromState();
  setSaveStatus("");
}

async function saveRemoteConfig() {
  if (!canEdit) return;

  const draft = buildDraft();
  if (!draft) {
    setSaveStatus("Revisa la fecha y los campos antes de guardar.", "error");
    return;
  }

  const confirmed = window.confirm("¿Quieres actualizar este widget en la base de datos?");
  if (!confirmed) return;

  setSaveStatus("Guardando...");
  if (saveConfigEl) saveConfigEl.disabled = true;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_widget_config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_widget_id: widgetId,
      p_title: draft.title,
      p_target_date: draft.targetDate.toISOString(),
      p_bg_color_a: draft.bgColorA,
      p_bg_color_b: draft.bgColorB,
      p_bg_color_c: draft.bgColorC,
      p_text_color: draft.textColor,
    }),
  });

  if (!response.ok) {
    setSaveStatus("No se pudo guardar.", "error");
    if (saveConfigEl) saveConfigEl.disabled = false;
    return;
  }

  state.title = draft.title;
  state.bgColorA = draft.bgColorA;
  state.bgColorB = draft.bgColorB;
  state.bgColorC = draft.bgColorC;
  state.textColor = draft.textColor;
  targetDate = draft.targetDate;

  ensureTicking();
  applyStateToView();
  setPendingChanges(false);
  setSaveStatus("Cambios guardados.", "ok");
  closeConfigPanel();
}

function onConfigInputChange() {
  setPendingChanges(true);
  setSaveStatus("");
}

function bindEvents() {
  if (openConfigEl) openConfigEl.addEventListener("click", openConfigPanel);
  if (closeConfigEl) closeConfigEl.addEventListener("click", closeConfigPanel);
  if (saveConfigEl) {
    saveConfigEl.addEventListener("click", () => {
      saveRemoteConfig().catch(() => {
        setSaveStatus("Error de red al guardar.", "error");
        if (saveConfigEl) saveConfigEl.disabled = false;
      });
    });
  }

  if (titleInputEl) titleInputEl.addEventListener("input", onConfigInputChange);
  if (targetInputEl) targetInputEl.addEventListener("change", onConfigInputChange);
  if (colorAInputEl) colorAInputEl.addEventListener("input", onConfigInputChange);
  if (colorBInputEl) colorBInputEl.addEventListener("input", onConfigInputChange);
  if (colorCInputEl) colorCInputEl.addEventListener("input", onConfigInputChange);
  if (textColorInputEl) textColorInputEl.addEventListener("input", onConfigInputChange);

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") closeConfigPanel();
  });
}

function setupModes() {
  if (isEmbedded) {
    document.body.classList.add("embed-mode");
  }

  if (cardEl && canEdit) {
    cardEl.classList.add("can-edit");
  }
}

tick();
ensureTicking();
bindEvents();
setupModes();
syncInputsFromState();
applyStateToView();

loadRemoteConfig().catch(() => {
  setSaveStatus("Error de red al cargar la configuración.", "error");
});
