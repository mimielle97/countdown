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
const WIDGET_ID_PATTERN = /^[a-z0-9-]{2,60}$/;

const params = new URLSearchParams(window.location.search);
const widgetId = (params.get("widgetId") || "").trim();
const adminToken = (params.get("admin") || "").trim();
const isEmbedded = window.self !== window.top || params.get("embed") === "1";

const widgetViewEl = document.getElementById("widgetView");
const adminViewEl = document.getElementById("adminView");
const emptyViewEl = document.getElementById("emptyView");

const titleEl = document.getElementById("name");
const displayEl = document.getElementById("display");
const widgetStatusEl = document.getElementById("widgetStatus");

const createFormEl = document.getElementById("createForm");
const newWidgetIdEl = document.getElementById("newWidgetId");
const newTitleEl = document.getElementById("newTitle");
const newTargetDateEl = document.getElementById("newTargetDate");
const newColorAEl = document.getElementById("newColorA");
const newColorBEl = document.getElementById("newColorB");
const newColorCEl = document.getElementById("newColorC");
const newTextColorEl = document.getElementById("newTextColor");
const adminStatusEl = document.getElementById("adminStatus");
const widgetListEl = document.getElementById("widgetList");

const authHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

let intervalId = null;
let targetDate = new Date(INITIAL_TARGET.getTime());

const widgetState = {
  title: DEFAULT_TITLE,
  bgColorA: DEFAULT_BG_A,
  bgColorB: DEFAULT_BG_B,
  bgColorC: DEFAULT_BG_C,
  textColor: DEFAULT_TEXT_COLOR,
};

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

const normalizeWidgetId = value => (value || "").trim().toLowerCase();

const hexToRgba = (hex, alpha) => {
  const safeHex = normalizeHex(hex, DEFAULT_TEXT_COLOR);
  const r = Number.parseInt(safeHex.slice(1, 3), 16);
  const g = Number.parseInt(safeHex.slice(3, 5), 16);
  const b = Number.parseInt(safeHex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

function setMode(mode) {
  if (widgetViewEl) widgetViewEl.hidden = mode !== "widget";
  if (adminViewEl) adminViewEl.hidden = mode !== "admin";
  if (emptyViewEl) emptyViewEl.hidden = mode !== "empty";

  document.body.classList.remove("mode-widget", "mode-admin", "mode-empty", "embed-mode");
  document.documentElement.classList.remove("mode-widget", "mode-admin", "mode-empty", "embed-mode");
  document.body.classList.add(`mode-${mode}`);
  document.documentElement.classList.add(`mode-${mode}`);

  if (mode === "widget" && isEmbedded) {
    document.body.classList.add("embed-mode");
    document.documentElement.classList.add("embed-mode");
  }
}

function setWidgetStatus(message, type = "") {
  if (!widgetStatusEl) return;
  widgetStatusEl.textContent = message;
  widgetStatusEl.classList.remove("ok", "error");
  if (type === "ok" || type === "error") {
    widgetStatusEl.classList.add(type);
  }
}

function setAdminStatus(message, type = "") {
  if (!adminStatusEl) return;
  adminStatusEl.textContent = message;
  adminStatusEl.classList.remove("ok", "error");
  if (type === "ok" || type === "error") {
    adminStatusEl.classList.add(type);
  }
}

function setItemStatus(itemEl, message, type = "") {
  if (!itemEl) return;
  const statusEl = itemEl.querySelector(".item-status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "error");
  if (type === "ok" || type === "error") {
    statusEl.classList.add(type);
  }
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--bg-sunrise-a", widgetState.bgColorA);
  root.style.setProperty("--bg-sunrise-b", widgetState.bgColorB);
  root.style.setProperty("--bg-sunrise-c", widgetState.bgColorC);
  root.style.setProperty("--text-main", hexToRgba(widgetState.textColor, ".98"));
  root.style.setProperty("--text-secondary", hexToRgba(widgetState.textColor, ".84"));
  root.style.setProperty("--text-tertiary", hexToRgba(widgetState.textColor, ".76"));
}

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

function applyWidgetStateToView() {
  if (titleEl) titleEl.textContent = widgetState.title;
  applyTheme();
  tick();
}

function parseRpcError(payload) {
  if (payload && typeof payload === "object" && "message" in payload) {
    return String(payload.message || "Error en Supabase.");
  }
  return "Error en Supabase.";
}

async function callRpc(functionName, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let parsed = null;

  if (rawText !== "") {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new Error(parseRpcError(parsed));
  }

  return parsed;
}

function getCreateDraft() {
  if (!newWidgetIdEl || !newTitleEl || !newTargetDateEl || !newColorAEl || !newColorBEl || !newColorCEl || !newTextColorEl) {
    return null;
  }

  const normalizedWidgetId = normalizeWidgetId(newWidgetIdEl.value);
  if (!WIDGET_ID_PATTERN.test(normalizedWidgetId)) return null;
  if (newTargetDateEl.value === "") return null;

  const parsedTarget = new Date(newTargetDateEl.value);
  if (Number.isNaN(parsedTarget.getTime())) return null;

  return {
    widgetId: normalizedWidgetId,
    title: (newTitleEl.value || "").trim() || DEFAULT_TITLE,
    targetDate: parsedTarget,
    bgColorA: normalizeHex(newColorAEl.value, DEFAULT_BG_A),
    bgColorB: normalizeHex(newColorBEl.value, DEFAULT_BG_B),
    bgColorC: normalizeHex(newColorCEl.value, DEFAULT_BG_C),
    textColor: normalizeHex(newTextColorEl.value, DEFAULT_TEXT_COLOR),
  };
}

function getItemDraft(itemEl) {
  if (!itemEl) return null;

  const id = normalizeWidgetId(itemEl.dataset.widgetId || "");
  if (!WIDGET_ID_PATTERN.test(id)) return null;

  const titleInput = itemEl.querySelector("[data-field='title']");
  const targetInput = itemEl.querySelector("[data-field='targetDate']");
  const colorAInput = itemEl.querySelector("[data-field='bgColorA']");
  const colorBInput = itemEl.querySelector("[data-field='bgColorB']");
  const colorCInput = itemEl.querySelector("[data-field='bgColorC']");
  const textColorInput = itemEl.querySelector("[data-field='textColor']");

  if (!titleInput || !targetInput || !colorAInput || !colorBInput || !colorCInput || !textColorInput) {
    return null;
  }

  if (targetInput.value === "") return null;
  const parsedTarget = new Date(targetInput.value);
  if (Number.isNaN(parsedTarget.getTime())) return null;

  return {
    widgetId: id,
    title: (titleInput.value || "").trim() || DEFAULT_TITLE,
    targetDate: parsedTarget,
    bgColorA: normalizeHex(colorAInput.value, DEFAULT_BG_A),
    bgColorB: normalizeHex(colorBInput.value, DEFAULT_BG_B),
    bgColorC: normalizeHex(colorCInput.value, DEFAULT_BG_C),
    textColor: normalizeHex(textColorInput.value, DEFAULT_TEXT_COLOR),
  };
}

function createColorField(label, dataField, value, fallback) {
  const wrapper = document.createElement("label");
  wrapper.className = "color-field";

  const text = document.createElement("span");
  text.textContent = label;

  const input = document.createElement("input");
  input.type = "color";
  input.value = normalizeHex(value, fallback);
  input.setAttribute("data-field", dataField);

  wrapper.append(text, input);
  return wrapper;
}

function createInputField(label, value, dataField, type = "text") {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-label";
  wrapper.textContent = label;

  const input = document.createElement("input");
  input.className = "admin-input";
  input.type = type;
  input.value = value;
  input.setAttribute("data-field", dataField);

  wrapper.append(input);
  return wrapper;
}

function renderWidgetList(rows) {
  if (!widgetListEl) return;
  widgetListEl.textContent = "";

  if (!rows || rows.length === 0) {
    const emptyLine = document.createElement("p");
    emptyLine.className = "list-empty";
    emptyLine.textContent = "Aún no tienes widgets.";
    widgetListEl.append(emptyLine);
    return;
  }

  for (const row of rows) {
    const item = document.createElement("article");
    item.className = "widget-item";
    item.dataset.widgetId = row.widget_id;

    const top = document.createElement("div");
    top.className = "widget-item-top";

    const itemTitle = document.createElement("p");
    itemTitle.className = "widget-item-id";
    itemTitle.textContent = row.widget_id;

    const openLink = document.createElement("a");
    openLink.className = "link-button";
    openLink.href = `?widgetId=${encodeURIComponent(row.widget_id)}`;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Abrir widget";

    top.append(itemTitle, openLink);

    const fields = document.createElement("div");
    fields.className = "widget-fields";

    const parsedTarget = new Date(row.target_date);
    const safeTarget = Number.isNaN(parsedTarget.getTime()) ? new Date(INITIAL_TARGET.getTime()) : parsedTarget;

    fields.append(
      createInputField("Texto", (row.title || "").trim() || DEFAULT_TITLE, "title"),
      createInputField("Fecha y hora", formatInputDateTime(safeTarget), "targetDate", "datetime-local")
    );

    const colors = document.createElement("div");
    colors.className = "color-grid";
    colors.append(
      createColorField("Fondo A", "bgColorA", row.bg_color_a, DEFAULT_BG_A),
      createColorField("Fondo B", "bgColorB", row.bg_color_b, DEFAULT_BG_B),
      createColorField("Fondo C", "bgColorC", row.bg_color_c, DEFAULT_BG_C),
      createColorField("Texto", "textColor", row.text_color, DEFAULT_TEXT_COLOR)
    );

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "save-button";
    saveButton.textContent = "Guardar";
    saveButton.dataset.action = "save";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Eliminar";
    deleteButton.dataset.action = "delete";

    actions.append(saveButton, deleteButton);

    const status = document.createElement("p");
    status.className = "item-status";
    status.setAttribute("aria-live", "polite");

    item.append(top, fields, colors, actions, status);
    widgetListEl.append(item);
  }
}

async function loadWidgetConfig() {
  if (widgetId === "") return;

  setWidgetStatus("Cargando widget...");

  const query = new URLSearchParams({
    select: "widget_id,title,target_date,bg_color_a,bg_color_b,bg_color_c,text_color",
    widget_id: `eq.${widgetId}`,
    limit: "1",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/widgets?${query.toString()}`, {
    method: "GET",
    headers: authHeaders,
  });

  if (!response.ok) {
    setWidgetStatus("No se pudo cargar el widget.", "error");
    return;
  }

  const rows = await response.json();
  const row = rows[0];

  if (!row) {
    setWidgetStatus("No existe un widget con ese widget_id.", "error");
    return;
  }

  widgetState.title = (row.title || "").trim() || DEFAULT_TITLE;
  widgetState.bgColorA = normalizeHex(row.bg_color_a, DEFAULT_BG_A);
  widgetState.bgColorB = normalizeHex(row.bg_color_b, DEFAULT_BG_B);
  widgetState.bgColorC = normalizeHex(row.bg_color_c, DEFAULT_BG_C);
  widgetState.textColor = normalizeHex(row.text_color, DEFAULT_TEXT_COLOR);

  const parsedTarget = new Date(row.target_date);
  if (!Number.isNaN(parsedTarget.getTime())) {
    targetDate = parsedTarget;
  }

  ensureTicking();
  applyWidgetStateToView();
  setWidgetStatus("");
}

async function loadAdminWidgets() {
  setAdminStatus("Cargando widgets...");

  const rows = await callRpc("get_all_widgets", {
    p_admin_token: adminToken,
  });

  renderWidgetList(Array.isArray(rows) ? rows : []);
  setAdminStatus("");
}

async function createWidget(event) {
  event.preventDefault();

  const draft = getCreateDraft();
  if (!draft) {
    setAdminStatus("Revisa widget_id, fecha y colores antes de crear.", "error");
    return;
  }

  setAdminStatus("Creando widget...");

  const created = await callRpc("create_widget", {
    p_admin_token: adminToken,
    p_widget_id: draft.widgetId,
    p_title: draft.title,
    p_target_date: draft.targetDate.toISOString(),
    p_bg_color_a: draft.bgColorA,
    p_bg_color_b: draft.bgColorB,
    p_bg_color_c: draft.bgColorC,
    p_text_color: draft.textColor,
  });

  if (created !== true) {
    setAdminStatus("Ese widget_id ya existe.", "error");
    return;
  }

  if (newWidgetIdEl) newWidgetIdEl.value = "";
  if (newTitleEl) newTitleEl.value = "";
  if (newTargetDateEl) newTargetDateEl.value = formatInputDateTime(new Date(INITIAL_TARGET.getTime()));
  if (newColorAEl) newColorAEl.value = DEFAULT_BG_A;
  if (newColorBEl) newColorBEl.value = DEFAULT_BG_B;
  if (newColorCEl) newColorCEl.value = DEFAULT_BG_C;
  if (newTextColorEl) newTextColorEl.value = DEFAULT_TEXT_COLOR;

  await loadAdminWidgets();
  setAdminStatus("Widget creado.", "ok");
}

async function saveWidget(itemEl) {
  const draft = getItemDraft(itemEl);
  if (!draft) {
    setItemStatus(itemEl, "Revisa los campos antes de guardar.", "error");
    return;
  }

  setItemStatus(itemEl, "Guardando...");

  const saved = await callRpc("update_widget_config", {
    p_admin_token: adminToken,
    p_widget_id: draft.widgetId,
    p_title: draft.title,
    p_target_date: draft.targetDate.toISOString(),
    p_bg_color_a: draft.bgColorA,
    p_bg_color_b: draft.bgColorB,
    p_bg_color_c: draft.bgColorC,
    p_text_color: draft.textColor,
  });

  if (saved !== true) {
    setItemStatus(itemEl, "No se encontró el widget.", "error");
    return;
  }

  setItemStatus(itemEl, "Cambios guardados.", "ok");
}

async function deleteWidget(itemEl) {
  if (!itemEl) return;

  const currentId = normalizeWidgetId(itemEl.dataset.widgetId || "");
  if (!WIDGET_ID_PATTERN.test(currentId)) {
    setItemStatus(itemEl, "widget_id inválido.", "error");
    return;
  }

  const confirmed = window.confirm(`¿Eliminar el widget "${currentId}"?`);
  if (!confirmed) return;

  setItemStatus(itemEl, "Eliminando...");

  const deleted = await callRpc("delete_widget", {
    p_admin_token: adminToken,
    p_widget_id: currentId,
  });

  if (deleted !== true) {
    setItemStatus(itemEl, "No se pudo eliminar.", "error");
    return;
  }

  itemEl.remove();
  setAdminStatus("Widget eliminado.", "ok");

  if (widgetListEl && widgetListEl.children.length === 0) {
    renderWidgetList([]);
  }
}

function bindAdminEvents() {
  if (createFormEl) {
    createFormEl.addEventListener("submit", event => {
      createWidget(event).catch(error => {
        setAdminStatus(error.message || "Error de red al crear.", "error");
      });
    });
  }

  if (newTargetDateEl) {
    newTargetDateEl.value = formatInputDateTime(new Date(INITIAL_TARGET.getTime()));
  }

  if (widgetListEl) {
    widgetListEl.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const action = target.dataset.action;
      if (!action) return;

      const itemEl = target.closest(".widget-item");
      if (!(itemEl instanceof HTMLElement)) return;

      if (action === "save") {
        saveWidget(itemEl).catch(error => {
          setItemStatus(itemEl, error.message || "Error de red al guardar.", "error");
        });
      }

      if (action === "delete") {
        deleteWidget(itemEl).catch(error => {
          setItemStatus(itemEl, error.message || "Error de red al eliminar.", "error");
        });
      }
    });
  }
}

function initWidgetMode() {
  setMode("widget");
  applyWidgetStateToView();
  tick();
  ensureTicking();
  loadWidgetConfig().catch(() => {
    setWidgetStatus("Error de red al cargar el widget.", "error");
  });
}

function initAdminMode() {
  setMode("admin");
  bindAdminEvents();
  loadAdminWidgets().catch(error => {
    setAdminStatus(error.message || "No se pudo cargar el panel.", "error");
  });
}

function init() {
  if (adminToken !== "") {
    initAdminMode();
    return;
  }

  if (widgetId !== "") {
    initWidgetMode();
    return;
  }

  setMode("empty");
}

init();
