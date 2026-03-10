// utils.js — Date/time helpers, calculations, CSV download

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// HH:MM -> minutes since midnight
export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// minutes since midnight -> HH:MM
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Handle midnight crossing: if end <= start, add 24 hours to end
export function calcHoursSlept(startHHMM, endHHMM) {
  let startMins = timeToMinutes(startHHMM);
  let endMins = timeToMinutes(endHHMM);
  if (endMins <= startMins) endMins += 24 * 60;
  const hours = (endMins - startMins) / 60;
  return Math.round(hours * 10) / 10;
}

// 'YYYY-MM-DD' -> 'Feb 7, 2026'
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// 'YYYY-MM-DD' -> 'Feb 7'
export function formatChartDate(dateStr) {
  if (!dateStr) return '';
  const [y, mo, d] = dateStr.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// 'HH:MM' -> '11:00 PM'
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function normalizeStringList(values) {
  if (!values) return [];
  const items = Array.isArray(values) ? values : String(values).split(',');
  return items.map(value => String(value).trim()).filter(Boolean);
}

export function joinStringList(values, separator = ', ') {
  return normalizeStringList(values).join(separator);
}

export function summarizeStringList(values) {
  const items = normalizeStringList(values);
  if (items.length === 0) return '';
  if (items.length <= 2) return items.join(', ');
  return `${items[0]} +${items.length - 1}`;
}

// Trigger a browser file download with CSV content
export function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Clamp a number to [min, max]
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
