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
    entry.targetBedtime = entry.targetBedtime || null;
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
    entry.screenSatisfaction = entry.screenSatisfaction || null;
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

function csvCell(value) {
  const stringValue = value !== null && value !== undefined ? String(value) : '';
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(csvCell).join(',');
}

export const csvExport = {
  sleep() {
    const entries = sleep.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));
    const header = csvRow([
      'Date',
      'Target Bedtime',
      'Sleep Start Time',
      'Sleep End Time',
      'Hours Slept',
      'Sleep Quality',
      'Productivity Rating',
      'Day Difficulty',
      'Day Speed',
      'Alarm Time',
      'Snooze Count',
      'Commute Home (min)',
      'Time Got Home'
    ]) + '\n';
    const rows = entries.map(e => csvRow([
      formatDate(e.date),
      e.targetBedtime ? formatTime(e.targetBedtime) : 'N/A',
      formatTime(e.sleepStartTime),
      formatTime(e.sleepEndTime),
      e.hoursSlept.toFixed(1),
      e.sleepQuality,
      e.productivityRating,
      na(e.dayFeltDifficulty),
      na(e.dayFeltSpeed),
      e.alarmSetTime ? formatTime(e.alarmSetTime) : 'N/A',
      na(e.alarmSnoozeCount),
      e.commuteTimeHome !== null && e.commuteTimeHome !== undefined ? Math.round(e.commuteTimeHome) : 'N/A',
      e.timeGotHome ? formatTime(e.timeGotHome) : 'N/A'
    ]));
    downloadCSV('sleep_entries.csv', header + rows.join('\n'));
  },

  screen() {
    const entries = screen.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));
    const header = csvRow(['Date', 'Hours Used', 'Last Used Time', 'Satisfaction']) + '\n';
    const rows = entries.map(e => csvRow([
      formatDate(e.date),
      e.hoursUsed.toFixed(1),
      formatTime(e.lastUsedTime),
      e.screenSatisfaction ? capitalize(e.screenSatisfaction) : 'N/A'
    ]));
    downloadCSV('screen_entries.csv', header + rows.join('\n'));
  },

  all() {
    const sleepEntries = sleep.getAll();
    const screenEntries = screen.getAll();
    const map = {};
    for (const e of sleepEntries) { map[e.date] = map[e.date] || {}; map[e.date].sleep = e; }
    for (const e of screenEntries) { map[e.date] = map[e.date] || {}; map[e.date].screen = e; }
    const header = csvRow([
      'Date',
      'Target Bedtime',
      'Sleep Start Time',
      'Sleep End Time',
      'Hours Slept',
      'Sleep Quality',
      'Productivity Rating',
      'Day Difficulty',
      'Day Speed',
      'Alarm Time',
      'Snooze Count',
      'Commute Home (min)',
      'Time Got Home',
      'Hours Used',
      'Last Used Time',
      'Screen Satisfaction'
    ]) + '\n';
    const rows = Object.keys(map).sort().map(date => {
      const { sleep: s, screen: sc } = map[date];
      return csvRow([
        formatDate(date),
        s?.targetBedtime ? formatTime(s.targetBedtime) : 'N/A',
        s?.sleepStartTime ? formatTime(s.sleepStartTime) : 'N/A',
        s?.sleepEndTime ? formatTime(s.sleepEndTime) : 'N/A',
        s ? s.hoursSlept.toFixed(1) : 'N/A',
        s ? s.sleepQuality : 'N/A',
        s ? s.productivityRating : 'N/A',
        s ? na(s.dayFeltDifficulty) : 'N/A',
        s ? na(s.dayFeltSpeed) : 'N/A',
        s?.alarmSetTime ? formatTime(s.alarmSetTime) : 'N/A',
        s ? na(s.alarmSnoozeCount) : 'N/A',
        s && s.commuteTimeHome !== null && s.commuteTimeHome !== undefined ? Math.round(s.commuteTimeHome) : 'N/A',
        s?.timeGotHome ? formatTime(s.timeGotHome) : 'N/A',
        sc ? sc.hoursUsed.toFixed(1) : 'N/A',
        sc?.lastUsedTime ? formatTime(sc.lastUsedTime) : 'N/A',
        sc?.screenSatisfaction ? capitalize(sc.screenSatisfaction) : 'N/A'
      ]);
    });
    downloadCSV('all_entries.csv', header + rows.join('\n'));
  }
};

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
