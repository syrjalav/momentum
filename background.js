const ALARM_NAME = "momentum-focus-complete";
const TIMER_KEY = "momentumTimer";
const DEFAULT_SECONDS = 25 * 60;

const defaultTimer = () => ({
  durationSeconds: DEFAULT_SECONDS,
  remainingSeconds: DEFAULT_SECONDS,
  endTime: null,
  running: false,
  completedAt: null
});

async function readTimer() {
  const result = await chrome.storage.local.get(TIMER_KEY);
  const timer = { ...defaultTimer(), ...(result[TIMER_KEY] || {}) };
  return normalizeTimer(timer);
}

async function saveTimer(timer) {
  await chrome.storage.local.set({ [TIMER_KEY]: timer });
  return timer;
}

function normalizeTimer(timer) {
  if (!timer.running || !timer.endTime) return timer;
  const remainingSeconds = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
  if (remainingSeconds > 0) return { ...timer, remainingSeconds };
  return { ...timer, remainingSeconds: 0, running: false, endTime: null, completedAt: Date.now() };
}

async function startTimer(requestedSeconds) {
  const current = await readTimer();
  const seconds = Math.max(1, Number(requestedSeconds || current.remainingSeconds || current.durationSeconds));
  const timer = {
    ...current,
    remainingSeconds: seconds,
    endTime: Date.now() + seconds * 1000,
    running: true,
    completedAt: null
  };
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, { when: timer.endTime });
  return saveTimer(timer);
}

async function pauseTimer() {
  const timer = await readTimer();
  await chrome.alarms.clear(ALARM_NAME);
  return saveTimer({ ...timer, running: false, endTime: null });
}

async function resetTimer(durationSeconds) {
  const seconds = Math.max(1, Number(durationSeconds || DEFAULT_SECONDS));
  await chrome.alarms.clear(ALARM_NAME);
  return saveTimer({ ...defaultTimer(), durationSeconds: seconds, remainingSeconds: seconds });
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(TIMER_KEY);
  if (!existing[TIMER_KEY]) await saveTimer(defaultTimer());
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type?.startsWith("timer:")) return false;

  const handlers = {
    "timer:get": () => readTimer(),
    "timer:start": () => startTimer(message.remainingSeconds),
    "timer:pause": () => pauseTimer(),
    "timer:reset": () => resetTimer(message.durationSeconds)
  };

  const handler = handlers[message.type];
  if (!handler) return false;
  handler()
    .then((timer) => sendResponse({ ok: true, timer }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const timer = await readTimer();
  await saveTimer({ ...timer, remainingSeconds: 0, running: false, endTime: null, completedAt: Date.now() });
  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Focus session complete",
    message: "Nice work. Take a breath before choosing what comes next.",
    priority: 2
  });
});
