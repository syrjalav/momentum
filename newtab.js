const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const KEYS = {
  tasks: "momentumTasks",
  notes: "momentumNotes",
  focus: "momentumDailyFocus",
  background: "momentumBackground",
  rotationPaused: "momentumRotationPaused",
  fallbackTimer: "momentumTimerFallback"
};

const hasChromeStorage = typeof chrome !== "undefined" && Boolean(chrome.storage?.local);
const hasRuntime = typeof chrome !== "undefined" && Boolean(chrome.runtime?.sendMessage);

const storage = {
  async get(keys) {
    if (hasChromeStorage) return chrome.storage.local.get(keys);
    const list = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(list.map((key) => {
      try { return [key, JSON.parse(localStorage.getItem(key))]; }
      catch { return [key, localStorage.getItem(key)]; }
    }));
  },
  async set(values) {
    if (hasChromeStorage) return chrome.storage.local.set(values);
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
  }
};

const timerFallbackDefault = () => ({ durationSeconds: 1500, remainingSeconds: 1500, running: false, endTime: null });

async function timerMessage(type, payload = {}) {
  if (hasRuntime) return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError || !response?.ok) resolve({ ok: false });
      else resolve(response);
    });
  });

  const stored = await storage.get(KEYS.fallbackTimer);
  let timer = { ...timerFallbackDefault(), ...(stored[KEYS.fallbackTimer] || {}) };
  if (timer.running) {
    timer.remainingSeconds = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
    if (!timer.remainingSeconds) timer = { ...timer, running: false, endTime: null };
  }
  if (type === "timer:start") timer = { ...timer, remainingSeconds: payload.remainingSeconds || timer.remainingSeconds, running: true, endTime: Date.now() + (payload.remainingSeconds || timer.remainingSeconds) * 1000 };
  if (type === "timer:pause") timer = { ...timer, running: false, endTime: null };
  if (type === "timer:reset") timer = { ...timerFallbackDefault(), durationSeconds: payload.durationSeconds, remainingSeconds: payload.durationSeconds };
  await storage.set({ [KEYS.fallbackTimer]: timer });
  return { ok: true, timer };
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  $("#clock").textContent = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  $("#topDate").textContent = new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(now);
  $("#fullDate").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(now);
  $("#greeting").textContent = hours < 5 ? "A quiet night" : hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

let timerState = timerFallbackDefault();

function renderTimer(timer) {
  timerState = timer;
  $("#timerDisplay").textContent = formatTimer(timer.remainingSeconds);
  $("#timerStatus").textContent = timer.running ? "Focusing" : timer.remainingSeconds === 0 ? "Complete" : "Ready";
  $("#timerToggleText").textContent = timer.running ? "Pause" : timer.remainingSeconds === 0 ? "Start again" : "Start focus";
  $("#timerToggleIcon").setAttribute("d", timer.running ? "M9 5v14M15 5v14" : "m8 5 11 7-11 7Z");
  const circumference = 2 * Math.PI * 68;
  const fraction = timer.durationSeconds ? timer.remainingSeconds / timer.durationSeconds : 0;
  $("#progressRing").style.strokeDashoffset = String(circumference * (1 - fraction));
  $$(".preset").forEach((button) => button.classList.toggle("is-active", Number(button.dataset.minutes) * 60 === timer.durationSeconds));
}

async function refreshTimer() {
  const response = await timerMessage("timer:get");
  if (response.ok) renderTimer(response.timer);
}

function initTimer() {
  $$(".preset").forEach((button) => button.addEventListener("click", async () => {
    const durationSeconds = Number(button.dataset.minutes) * 60;
    const response = await timerMessage("timer:reset", { durationSeconds });
    if (response.ok) renderTimer(response.timer);
  }));

  $("#timerToggle").addEventListener("click", async () => {
    const type = timerState.running ? "timer:pause" : "timer:start";
    const remainingSeconds = timerState.remainingSeconds || timerState.durationSeconds;
    const response = await timerMessage(type, { remainingSeconds });
    if (response.ok) renderTimer(response.timer);
  });

  $("#timerReset").addEventListener("click", async () => {
    const response = await timerMessage("timer:reset", { durationSeconds: timerState.durationSeconds });
    if (response.ok) renderTimer(response.timer);
  });

  refreshTimer();
  setInterval(refreshTimer, 500);
}

let tasks = [];

function renderTasks() {
  const list = $("#taskList");
  list.replaceChildren();
  const template = $("#taskTemplate");
  tasks.forEach((task) => {
    const item = template.content.firstElementChild.cloneNode(true);
    item.dataset.id = task.id;
    item.classList.toggle("is-complete", task.complete);
    const checkbox = item.querySelector("input");
    checkbox.checked = task.complete;
    checkbox.setAttribute("aria-label", `Mark ${task.text} ${task.complete ? "incomplete" : "complete"}`);
    item.querySelector(".task-text").textContent = task.text;
    checkbox.addEventListener("change", async () => {
      task.complete = checkbox.checked;
      await saveTasks();
    });
    item.querySelector(".delete-task").addEventListener("click", async () => {
      tasks = tasks.filter((entry) => entry.id !== task.id);
      await saveTasks();
    });
    list.append(item);
  });
  $("#emptyTasks").classList.toggle("is-hidden", tasks.length > 0);
  $("#clearCompleted").classList.toggle("is-hidden", !tasks.some((task) => task.complete));
  $("#taskCount").textContent = String(tasks.filter((task) => !task.complete).length);
}

async function saveTasks() {
  await storage.set({ [KEYS.tasks]: tasks });
  renderTasks();
}

async function initTasks() {
  const stored = await storage.get(KEYS.tasks);
  tasks = Array.isArray(stored[KEYS.tasks]) ? stored[KEYS.tasks] : [];
  renderTasks();
  $("#taskForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#taskInput");
    const text = input.value.trim();
    if (!text) return;
    tasks.unshift({ id: crypto.randomUUID(), text, complete: false, createdAt: Date.now() });
    input.value = "";
    await saveTasks();
  });
  $("#clearCompleted").addEventListener("click", async () => {
    tasks = tasks.filter((task) => !task.complete);
    await saveTasks();
  });
}

function switchPanel(name) {
  const tasksActive = name === "tasks";
  $("#tasksTab").classList.toggle("is-active", tasksActive);
  $("#notesTab").classList.toggle("is-active", !tasksActive);
  $("#tasksTab").setAttribute("aria-selected", String(tasksActive));
  $("#notesTab").setAttribute("aria-selected", String(!tasksActive));
  $("#tasksPanel").classList.toggle("is-hidden", !tasksActive);
  $("#notesPanel").classList.toggle("is-hidden", tasksActive);
  if (!tasksActive) $("#notesInput").focus();
}

async function initNotesAndFocus() {
  const values = await storage.get([KEYS.notes, KEYS.focus]);
  $("#notesInput").value = values[KEYS.notes] || "";
  $("#focusInput").value = values[KEYS.focus] || "";
  $("#notesCount").textContent = `${$("#notesInput").value.length} / 2000`;
  let noteSaveTimer;
  $("#notesInput").addEventListener("input", () => {
    $("#notesCount").textContent = `${$("#notesInput").value.length} / 2000`;
    $("#notesSaved").textContent = "Saving…";
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(async () => {
      await storage.set({ [KEYS.notes]: $("#notesInput").value });
      $("#notesSaved").textContent = "Saved automatically";
    }, 350);
  });
  const saveFocus = async () => {
    await storage.set({ [KEYS.focus]: $("#focusInput").value.trim() });
    $("#focusSaved").classList.add("is-visible");
    setTimeout(() => $("#focusSaved").classList.remove("is-visible"), 1200);
  };
  $("#focusInput").addEventListener("change", saveFocus);
  $("#focusInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); saveFocus(); $("#focusInput").blur(); }
  });
}

let backgroundIndex = 0;
let rotationPaused = false;
let rotationInterval;

async function showBackground(index, persist = true) {
  const backgrounds = window.MOMENTUM_BACKGROUNDS;
  backgroundIndex = (index + backgrounds.length) % backgrounds.length;
  const scene = backgrounds[backgroundIndex];
  const next = new Image();
  next.onload = () => {
    $("#background").style.backgroundImage = `linear-gradient(105deg, rgba(7, 16, 23, .30), rgba(7, 16, 23, .08)), url("${scene.url}")`;
    $("#sceneName").textContent = scene.name;
  };
  next.src = scene.url;
  if (persist) await storage.set({ [KEYS.background]: backgroundIndex });
}

function updateRotationButton() {
  $("#toggleRotation").title = rotationPaused ? "Resume background rotation" : "Pause background rotation";
  $("#toggleRotation").setAttribute("aria-label", $("#toggleRotation").title);
  $("#toggleRotation .pause-icon").classList.toggle("is-hidden", rotationPaused);
  $("#toggleRotation .play-icon").classList.toggle("is-hidden", !rotationPaused);
  clearInterval(rotationInterval);
  if (!rotationPaused) rotationInterval = setInterval(() => showBackground(backgroundIndex + 1), 30_000);
}

async function initBackgrounds() {
  const values = await storage.get([KEYS.background, KEYS.rotationPaused]);
  backgroundIndex = Number.isInteger(values[KEYS.background]) ? values[KEYS.background] : Math.floor(Math.random() * window.MOMENTUM_BACKGROUNDS.length);
  rotationPaused = Boolean(values[KEYS.rotationPaused]);
  showBackground(backgroundIndex, false);
  updateRotationButton();
  $("#changeBackground").addEventListener("click", () => showBackground(backgroundIndex + 1));
  $("#toggleRotation").addEventListener("click", async () => {
    rotationPaused = !rotationPaused;
    await storage.set({ [KEYS.rotationPaused]: rotationPaused });
    updateRotationButton();
  });
}

function initSearchAndTabs() {
  $("#searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("#searchInput").value.trim();
    if (query) window.location.assign(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  });
  $("#tasksTab").addEventListener("click", () => switchPanel("tasks"));
  $("#notesTab").addEventListener("click", () => switchPanel("notes"));
}

async function init() {
  updateClock();
  setInterval(updateClock, 1000);
  $("#quote").textContent = `“${window.MOMENTUM_QUOTES[new Date().getDate() % window.MOMENTUM_QUOTES.length]}”`;
  initSearchAndTabs();
  initTimer();
  await Promise.all([initTasks(), initNotesAndFocus(), initBackgrounds()]);
}

init();
