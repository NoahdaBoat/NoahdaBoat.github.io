// sleep-detail.js — Read-only sleep entry detail modal

import * as Store from '../store.js';
import * as Router from '../router.js';
import { formatDate, formatTime } from '../utils.js';
import { createStarDisplay } from '../components/star-display.js';

export function renderSleepDetail({ id }) {
  const entry = Store.sleep.getById(id);
  if (!entry) {
    const err = document.createElement('div');
    err.className = 'empty-state';
    err.textContent = 'Entry not found.';
    return err;
  }

  const container = document.createElement('div');

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<span class="modal-title">${formatDate(entry.date)}</span>`;

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-text';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => {
    Router.closeModal();
    Router.openModal('sleep-form', { id: entry.id });
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'btn-text';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => Router.closeModal());

  actions.appendChild(editBtn);
  actions.appendChild(doneBtn);
  header.appendChild(actions);
  container.appendChild(header);

  // Sleep Details
  container.appendChild(sectionTitle('Sleep Details'));
  const detailCard = document.createElement('div');
  detailCard.className = 'detail-card';
  addRow(detailCard, 'Date', formatDate(entry.date));
  addRow(detailCard, 'Target Bedtime', entry.targetBedtime ? formatTime(entry.targetBedtime) : '—');
  addRow(detailCard, 'Sleep Start', formatTime(entry.sleepStartTime));
  addRow(detailCard, 'Sleep End', formatTime(entry.sleepEndTime));
  addRow(detailCard, 'Hours Slept', `${entry.hoursSlept.toFixed(1)} hrs`);
  container.appendChild(detailCard);

  // Ratings
  container.appendChild(sectionTitle('Ratings'));
  const ratingsCard = document.createElement('div');
  ratingsCard.className = 'detail-card';
  addStarRow(ratingsCard, 'Sleep Quality', entry.sleepQuality);
  addStarRow(ratingsCard, 'Productivity', entry.productivityRating);
  addStarRow(ratingsCard, 'Day Difficulty', entry.dayFeltDifficulty);
  addStarRow(ratingsCard, 'Day Speed', entry.dayFeltSpeed);
  container.appendChild(ratingsCard);

  // Alarm (if set)
  if (entry.alarmSetTime) {
    container.appendChild(sectionTitle('Alarm'));
    const alarmCard = document.createElement('div');
    alarmCard.className = 'detail-card';
    addRow(alarmCard, 'Alarm Time', formatTime(entry.alarmSetTime));
    if (entry.alarmSnoozeCount !== null && entry.alarmSnoozeCount !== undefined) {
      addRow(alarmCard, 'Snooze Count', String(entry.alarmSnoozeCount));
    }
    container.appendChild(alarmCard);
  }

  // Additional Info
  const hasAdditional = entry.commuteTimeHome != null || entry.timeGotHome;
  if (hasAdditional) {
    container.appendChild(sectionTitle('Additional Info'));
    const addCard = document.createElement('div');
    addCard.className = 'detail-card';
    if (entry.commuteTimeHome != null) addRow(addCard, 'Commute Home', `${Math.round(entry.commuteTimeHome)} min`);
    if (entry.timeGotHome) addRow(addCard, 'Time Got Home', formatTime(entry.timeGotHome));
    container.appendChild(addCard);
  }

  // Info
  container.appendChild(sectionTitle('Info'));
  const infoCard = document.createElement('div');
  infoCard.className = 'detail-card';
  const created = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
  addRow(infoCard, 'Logged', created);
  container.appendChild(infoCard);

  const spacer = document.createElement('div');
  spacer.style.height = '32px';
  container.appendChild(spacer);

  return container;
}

function sectionTitle(text) {
  const s = document.createElement('div');
  s.className = 'detail-section';
  const t = document.createElement('div');
  t.className = 'detail-section-title';
  t.textContent = text;
  s.appendChild(t);
  return s;
}

function addRow(card, label, value) {
  const row = document.createElement('div');
  row.className = 'detail-row';
  const field = document.createElement('span');
  field.className = 'detail-field';
  field.textContent = label;
  const val = document.createElement('span');
  val.className = 'detail-value';
  val.textContent = value;
  row.appendChild(field);
  row.appendChild(val);
  card.appendChild(row);
}

function addStarRow(card, label, value) {
  if (value == null) return;
  const row = document.createElement('div');
  row.className = 'detail-row';
  const field = document.createElement('span');
  field.className = 'detail-field';
  field.textContent = label;
  row.appendChild(field);
  row.appendChild(createStarDisplay(value));
  card.appendChild(row);
}
