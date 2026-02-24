// store.js — localStorage CRUD for sleep/screen entries + settings + CSV export

import { generateId, formatDate, formatTime, downloadCSV } from './utils.js';

const SLEEP_KEY = 'sns_sleep_entries';
const SCREEN_KEY = 'sns_screen_entries';
const SETTINGS_KEY = 'sns_settings';

// ── Event system ──────────────────────────────────────────────────────────────

const listeners = {};

function emit(event) {
  (listeners[event] || []).forEach(cb => cb());
}

export function subscribe(event, cb) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(cb);
  return () => {
    listeners[event] = listeners[event].filter(fn => fn !== cb);
  };
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

function readSleep() {
  try { return JSON.parse(localStorage.getItem(SLEEP_KEY) || '[]'); }
  catch { return []; }
}

function writeSleep(entries) {
  localStorage.setItem(SLEEP_KEY, JSON.stringify(entries));
  emit('sleep-changed');
}

export const sleep = {
  getAll() {
    return readSleep().sort((a, b) => b.date.localeCompare(a.date));
  },
  getById(id) {
    return readSleep().find(e => e.id === id) || null;
  },
  save(entry) {
    const entries = readSleep();
    if (!entry.id) entry.id = generateId();
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entry.createdAt = new Date().toISOString();
      entries.push(entry);
    }
    writeSleep(entries);
    return entry;
  },
  delete(id) {
    writeSleep(readSleep().filter(e => e.id !== id));
  },
  count() {
    return readSleep().length;
  }
};

// ── Screen ────────────────────────────────────────────────────────────────────

function readScreen() {
  try { return JSON.parse(localStorage.getItem(SCREEN_KEY) || '[]'); }
  catch { return []; }
}

function writeScreen(entries) {
  localStorage.setItem(SCREEN_KEY, JSON.stringify(entries));
  emit('screen-changed');
}

export const screen = {
  getAll() {
    return readScreen().sort((a, b) => b.date.localeCompare(a.date));
  },
  getById(id) {
    return readScreen().find(e => e.id === id) || null;
  },
  save(entry) {
    const entries = readScreen();
    if (!entry.id) entry.id = generateId();
    const idx = entries.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entry.createdAt = new Date().toISOString();
      entries.push(entry);
    }
    writeScreen(entries);
    return entry;
  },
  delete(id) {
    writeScreen(readScreen().filter(e => e.id !== id));
  },
  count() {
    return readScreen().length;
  }
};

// ── Settings ──────────────────────────────────────────────────────────────────

const defaultSettings = {
  notificationEnabled: false,
  notificationHour: 21,
  notificationMinute: 0
};

export const settings = {
  get() {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { ...defaultSettings }; }
  },
  save(s) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  }
};

// ── CSV Export ────────────────────────────────────────────────────────────────

function na(val) {
  return val !== null && val !== undefined ? val : 'N/A';
}

export const csvExport = {
  sleep() {
    const entries = sleep.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));
    const header = 'Date,Sleep Start Time,Sleep End Time,Hours Slept,Sleep Quality,Productivity Rating,Day Difficulty,Day Speed,Alarm Time,Snooze Count,Time Felt Tired,Commute Home (min),Time Got Home\n';
    const rows = entries.map(e => [
      formatDate(e.date),
      formatTime(e.sleepStartTime),
      formatTime(e.sleepEndTime),
      e.hoursSlept.toFixed(1),
      e.sleepQuality,
      e.productivityRating,
      na(e.dayFeltDifficulty),
      na(e.dayFeltSpeed),
      e.alarmSetTime ? formatTime(e.alarmSetTime) : 'N/A',
      na(e.alarmSnoozeCount),
      e.timeFeltTired
        ? (Array.isArray(e.timeFeltTired) ? e.timeFeltTired.map(t => formatTime(t)).join('; ') : formatTime(e.timeFeltTired))
        : 'N/A',
      e.commuteTimeHome !== null && e.commuteTimeHome !== undefined ? Math.round(e.commuteTimeHome) : 'N/A',
      e.timeGotHome ? formatTime(e.timeGotHome) : 'N/A'
    ].join(','));
    downloadCSV('sleep_entries.csv', header + rows.join('\n'));
  },

  screen() {
    const entries = screen.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));
    const header = 'Date,Hours Used,Last Used Time\n';
    const rows = entries.map(e => [
      formatDate(e.date),
      e.hoursUsed.toFixed(1),
      formatTime(e.lastUsedTime)
    ].join(','));
    downloadCSV('screen_entries.csv', header + rows.join('\n'));
  },

  all() {
    const sleepEntries = sleep.getAll();
    const screenEntries = screen.getAll();
    const map = {};
    for (const e of sleepEntries) { map[e.date] = map[e.date] || {}; map[e.date].sleep = e; }
    for (const e of screenEntries) { map[e.date] = map[e.date] || {}; map[e.date].screen = e; }
    const header = 'Date,Sleep Hours,Sleep Quality,Productivity,Screen Hours\n';
    const rows = Object.keys(map).sort().map(date => {
      const { sleep: s, screen: sc } = map[date];
      return [
        formatDate(date),
        s ? s.hoursSlept.toFixed(1) : 'N/A',
        s ? s.sleepQuality : 'N/A',
        s ? s.productivityRating : 'N/A',
        sc ? sc.hoursUsed.toFixed(1) : 'N/A'
      ].join(',');
    });
    downloadCSV('all_entries.csv', header + rows.join('\n'));
  }
};
