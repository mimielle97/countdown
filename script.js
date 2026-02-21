// Objetivo: 22/04/2026 10:00 (hora LOCAL del dispositivo)
const INITIAL_TARGET = new Date(2026, 3, 22, 10, 0, 0); // (mes 3 = abril)
const TICK_INTERVAL_MS = 1000;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

let targetDate = new Date(INITIAL_TARGET.getTime());
const titleEl = document.getElementById("name");
const displayEl = document.getElementById("display");
const dateEditorEl = document.getElementById("dateEditor");
const targetInputEl = document.getElementById("targetInput");
const closeDateEditorEl = document.getElementById("closeDateEditor");
let intervalId = null;

const pad2 = n => String(n).padStart(2, "0");
const pad4 = n => String(n).padStart(4, "0");

const toTimeParts = totalSeconds => {
  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return { days, hours, minutes, seconds };
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

const formatInputDateTime = date => {
  const year = pad4(date.getFullYear());
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function ensureTicking() {
  if (intervalId === null) {
    intervalId = setInterval(tick, TICK_INTERVAL_MS);
  }
}

function openDateEditor() {
  if (!dateEditorEl || !targetInputEl) return;
  dateEditorEl.classList.add("is-open");
  targetInputEl.value = formatInputDateTime(targetDate);
  targetInputEl.focus();
}

function closeDateEditor() {
  if (!dateEditorEl) return;
  dateEditorEl.classList.remove("is-open");
}

function updateTargetFromInput() {
  if (!targetInputEl || targetInputEl.value === "") return;
  const parsed = new Date(targetInputEl.value);
  if (Number.isNaN(parsed.getTime())) return;
  targetDate = parsed;
  ensureTicking();
  tick();
  closeDateEditor();
}

function startTitleEditing() {
  if (!titleEl) return;
  titleEl.dataset.previousText = titleEl.textContent || "";
  titleEl.contentEditable = "true";
  titleEl.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(titleEl);
  selection.removeAllRanges();
  selection.addRange(range);
}

function finishTitleEditing() {
  if (!titleEl) return;
  const text = (titleEl.textContent || "").trim();
  if (text === "") {
    titleEl.textContent = titleEl.dataset.previousText || "Cuenta atrás";
  } else {
    titleEl.textContent = text;
  }
  titleEl.contentEditable = "false";
}

function onTitleKeyDown(event) {
  if (!titleEl || titleEl.contentEditable !== "true") return;
  if (event.key === "Enter") {
    event.preventDefault();
    finishTitleEditing();
    titleEl.blur();
  }
  if (event.key === "Escape") {
    event.preventDefault();
    titleEl.textContent = titleEl.dataset.previousText || titleEl.textContent;
    titleEl.contentEditable = "false";
    titleEl.blur();
  }
}

function onDisplayKeyDown(event) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openDateEditor();
  }
}

function bindEvents() {
  if (titleEl) {
    titleEl.addEventListener("click", startTitleEditing);
    titleEl.addEventListener("keydown", onTitleKeyDown);
    titleEl.addEventListener("blur", finishTitleEditing);
  }
  if (displayEl) {
    displayEl.addEventListener("click", openDateEditor);
    displayEl.addEventListener("keydown", onDisplayKeyDown);
  }
  if (targetInputEl) {
    targetInputEl.addEventListener("change", updateTargetFromInput);
    targetInputEl.addEventListener("blur", closeDateEditor);
  }
  if (closeDateEditorEl) {
    closeDateEditorEl.addEventListener("click", closeDateEditor);
  }
}

tick();
ensureTicking();
bindEvents();
