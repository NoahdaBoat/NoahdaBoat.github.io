// settings.js — Settings tab

import * as Store from '../store.js';
import { csvExport } from '../store.js';

let reminderTimeout = null;

export function renderSettings() {
  const container = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">Settings</h1>`;
  container.appendChild(header);

  const s = Store.settings.get();

  // ── Daily Reminder ─────────────────────────────────────────────────────────
  container.appendChild(sectionTitle('Daily Reminder'));
  const notifCard = document.createElement('div');
  notifCard.className = 'settings-card';

  // Time row (shown only when notifications enabled)
  const timeRow = document.createElement('div');
  timeRow.className = 'settings-row';
  timeRow.classList.toggle('hidden', !s.notificationEnabled);

  const timeLabel = document.createElement('span');
  timeLabel.className = 'settings-row-label';
  timeLabel.textContent = 'Reminder Time';

  const timeInput = document.createElement('input');
  timeInput.type = 'time';
  timeInput.className = 'form-input';
  timeInput.value = `${String(s.notificationHour).padStart(2, '0')}:${String(s.notificationMinute).padStart(2, '0')}`;
  timeInput.addEventListener('change', () => {
    const [h, m] = timeInput.value.split(':').map(Number);
    s.notificationHour = h;
    s.notificationMinute = m;
    Store.settings.save(s);
    updateReminder(s);
  });

  timeRow.appendChild(timeLabel);
  timeRow.appendChild(timeInput);

  // Enable toggle row
  const enableRow = document.createElement('div');
  enableRow.className = 'settings-row';

  const enableLabel = document.createElement('span');
  enableLabel.className = 'settings-row-label';
  enableLabel.textContent = 'Enable Reminder';

  const toggle = buildToggle(s.notificationEnabled, async (enabled) => {
    if (enabled) {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toggle.querySelector('input').checked = false;
        s.notificationEnabled = false;
        Store.settings.save(s);
        alert('Notification permission denied. Please allow notifications in your browser settings.');
        return;
      }
    }
    s.notificationEnabled = enabled;
    Store.settings.save(s);
    timeRow.classList.toggle('hidden', !enabled);
    updateReminder(s);
  });

  enableRow.appendChild(enableLabel);
  enableRow.appendChild(toggle);

  notifCard.appendChild(enableRow);
  notifCard.appendChild(timeRow);
  container.appendChild(notifCard);

  const notifNote = document.createElement('div');
  notifNote.className = 'notification-note';
  notifNote.style.padding = '6px 20px 0';
  notifNote.textContent = 'Reminders only work while the app is open in your browser.';
  container.appendChild(notifNote);

  // ── Export Data ────────────────────────────────────────────────────────────
  container.appendChild(sectionTitle('Export Data'));
  const exportCard = document.createElement('div');
  exportCard.className = 'settings-card';

  const hasSleep  = Store.sleep.count() > 0;
  const hasScreen = Store.screen.count() > 0;

  exportCard.appendChild(exportBtn('Export Sleep Data as CSV',      !hasSleep,             () => csvExport.sleep()));
  exportCard.appendChild(exportBtn('Export Screen Time Data as CSV', !hasScreen,            () => csvExport.screen()));
  exportCard.appendChild(exportBtn('Export All Data as CSV',         !hasSleep && !hasScreen, () => csvExport.all()));

  container.appendChild(exportCard);

  // ── About ──────────────────────────────────────────────────────────────────
  container.appendChild(sectionTitle('About'));
  const aboutCard = document.createElement('div');
  aboutCard.className = 'settings-card';
  aboutCard.appendChild(settingsRow('Sleep Entries',  String(Store.sleep.count())));
  aboutCard.appendChild(settingsRow('Screen Entries', String(Store.screen.count())));
  aboutCard.appendChild(settingsRow('Version', '1.0'));
  container.appendChild(aboutCard);

  const spacer = document.createElement('div');
  spacer.className = 'bottom-spacer';
  container.appendChild(spacer);

  if (s.notificationEnabled) updateReminder(s);

  return container;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionTitle(text) {
  const s = document.createElement('div');
  s.className = 'settings-section';
  const t = document.createElement('div');
  t.className = 'settings-section-title';
  t.textContent = text;
  s.appendChild(t);
  return s;
}

function settingsRow(label, value) {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const lbl = document.createElement('span');
  lbl.className = 'settings-row-label';
  lbl.textContent = label;
  const val = document.createElement('span');
  val.className = 'settings-row-value';
  val.textContent = value;
  row.appendChild(lbl);
  row.appendChild(val);
  return row;
}

function exportBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'btn-export';
  btn.textContent = label;
  btn.disabled = disabled;
  btn.addEventListener('click', onClick);
  return btn;
}

function buildToggle(checked, onChange) {
  const label = document.createElement('label');
  label.className = 'toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const track = document.createElement('div');
  track.className = 'toggle-track';
  const thumb = document.createElement('div');
  thumb.className = 'toggle-thumb';
  label.appendChild(input);
  label.appendChild(track);
  label.appendChild(thumb);
  return label;
}

function updateReminder(s) {
  if (reminderTimeout) clearTimeout(reminderTimeout);
  if (!s.notificationEnabled) return;

  function scheduleNext() {
    const now = new Date();
    const target = new Date();
    target.setHours(s.notificationHour, s.notificationMinute, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    reminderTimeout = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Sleep & Screens', {
          body: "Don't forget to log your sleep and screen time today!",
          icon: 'icons/icon.svg'
        });
      }
      scheduleNext();
    }, target - now);
  }

  scheduleNext();
}
