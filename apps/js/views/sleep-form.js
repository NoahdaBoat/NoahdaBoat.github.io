// sleep-form.js — Create/edit sleep entry modal

import * as Store from '../store.js';
import * as Router from '../router.js';
import { today, calcHoursSlept, clamp, generateId } from '../utils.js';
import { createRatingPicker } from '../components/rating-picker.js';

export function renderSleepForm({ id } = {}) {
  const existing = id ? Store.sleep.getById(id) : null;

  // State — mirrors SleepLogView.swift init defaults
  const state = {
    date: existing?.date ?? today(),
    sleepStartTime: existing?.sleepStartTime ?? '23:00',
    sleepEndTime: existing?.sleepEndTime ?? '07:00',
    hoursSlept: existing?.hoursSlept ?? 8.0,
    sleepQuality: existing?.sleepQuality ?? 3,
    productivityRating: existing?.productivityRating ?? 3,
    dayFeltDifficulty: existing?.dayFeltDifficulty ?? 3,
    dayFeltSpeed: existing?.dayFeltSpeed ?? 3,
    hasAlarm: existing?.alarmSetTime != null,
    alarmSetTime: existing?.alarmSetTime ?? '07:00',
    alarmSnoozeCount: existing?.alarmSnoozeCount ?? 0,
    feltTired: existing?.timeFeltTired != null,
    timeFeltTired: existing?.timeFeltTired ?? '14:00',
    hasCommuteTime: existing?.commuteTimeHome != null,
    commuteTimeHome: existing?.commuteTimeHome ?? 30,
    hasTimeGotHome: existing?.timeGotHome != null,
    timeGotHome: existing?.timeGotHome ?? '17:30',
  };

  function recomputeHours() {
    state.hoursSlept = calcHoursSlept(state.sleepStartTime, state.sleepEndTime);
    const el = container.querySelector('#hours-slept-display');
    if (el) el.textContent = `${state.hoursSlept.toFixed(1)} hrs`;
  }

  function save() {
    const entry = {
      id: existing?.id ?? generateId(),
      date: state.date,
      sleepStartTime: state.sleepStartTime,
      sleepEndTime: state.sleepEndTime,
      hoursSlept: state.hoursSlept,
      sleepQuality: state.sleepQuality,
      productivityRating: state.productivityRating,
      dayFeltDifficulty: state.dayFeltDifficulty,
      dayFeltSpeed: state.dayFeltSpeed,
      timeFeltTired: state.feltTired ? state.timeFeltTired : null,
      commuteTimeHome: state.hasCommuteTime ? state.commuteTimeHome : null,
      alarmSetTime: state.hasAlarm ? state.alarmSetTime : null,
      alarmSnoozeCount: state.hasAlarm ? state.alarmSnoozeCount : null,
      timeGotHome: state.hasTimeGotHome ? state.timeGotHome : null,
    };
    if (existing) entry.createdAt = existing.createdAt;
    Store.sleep.save(entry);
    Router.closeModal();
    Router.refreshView();
  }

  const container = document.createElement('div');

  // ── Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<span class="modal-title">${existing ? 'Edit Sleep' : 'Log Sleep'}</span>`;

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-text';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => Router.closeModal());

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-text';
  saveBtn.style.fontWeight = '600';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', save);

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  header.appendChild(actions);
  container.appendChild(header);

  // Duplicate date warning (create mode only)
  if (!existing) {
    const warn = document.createElement('div');
    warn.id = 'date-warning';
    warn.className = 'warning-banner hidden';
    warn.textContent = 'An entry already exists for this date. Saving will create a duplicate.';
    container.appendChild(warn);
  }

  // ── Sleep Details
  container.appendChild(sectionTitle('Sleep Details'));
  const detailsCard = document.createElement('div');
  detailsCard.className = 'form-card';

  detailsCard.appendChild(formRow('Date', inputEl('date', state.date, val => {
    state.date = val;
    if (!existing) checkDuplicate(container, val);
  })));
  detailsCard.appendChild(formRow('Sleep Start', inputEl('time', state.sleepStartTime, val => {
    state.sleepStartTime = val; recomputeHours();
  })));
  detailsCard.appendChild(formRow('Sleep End', inputEl('time', state.sleepEndTime, val => {
    state.sleepEndTime = val; recomputeHours();
  })));

  const hoursRow = document.createElement('div');
  hoursRow.className = 'form-row';
  hoursRow.innerHTML = `<span class="form-label">Hours Slept</span><span class="form-value" id="hours-slept-display">${state.hoursSlept.toFixed(1)} hrs</span>`;
  detailsCard.appendChild(hoursRow);
  container.appendChild(detailsCard);

  // ── Alarm
  container.appendChild(sectionTitle('Alarm'));
  const alarmCard = document.createElement('div');
  alarmCard.className = 'form-card';

  const alarmDetails = document.createElement('div');
  alarmDetails.classList.toggle('hidden', !state.hasAlarm);
  alarmDetails.appendChild(formRow('Alarm Time', inputEl('time', state.alarmSetTime, val => { state.alarmSetTime = val; })));
  alarmDetails.appendChild(stepperRow('Snooze Count', state.alarmSnoozeCount, 0, 20, 1,
    val => { state.alarmSnoozeCount = val; }, v => String(v)));

  alarmCard.appendChild(toggleRow('Set an alarm?', state.hasAlarm, val => {
    state.hasAlarm = val;
    alarmDetails.classList.toggle('hidden', !val);
  }));
  alarmCard.appendChild(alarmDetails);
  container.appendChild(alarmCard);

  // ── Ratings
  container.appendChild(sectionTitle('Ratings'));
  const ratingsCard = document.createElement('div');
  ratingsCard.className = 'form-card';
  ratingsCard.appendChild(createRatingPicker('Sleep Quality', state.sleepQuality, v => { state.sleepQuality = v; }));
  ratingsCard.appendChild(createRatingPicker('Productivity Rating', state.productivityRating, v => { state.productivityRating = v; }));
  ratingsCard.appendChild(createRatingPicker('Day Felt Difficulty', state.dayFeltDifficulty, v => { state.dayFeltDifficulty = v; }));
  ratingsCard.appendChild(createRatingPicker('Day Felt Speed', state.dayFeltSpeed, v => { state.dayFeltSpeed = v; }));
  container.appendChild(ratingsCard);

  // ── Additional Info
  container.appendChild(sectionTitle('Additional Info'));
  const addCard = document.createElement('div');
  addCard.className = 'form-card';

  const tiredDetails = document.createElement('div');
  tiredDetails.classList.toggle('hidden', !state.feltTired);
  tiredDetails.appendChild(formRow('Time Felt Tired', inputEl('time', state.timeFeltTired, val => { state.timeFeltTired = val; })));

  const commuteDetails = document.createElement('div');
  commuteDetails.classList.toggle('hidden', !state.hasCommuteTime);
  commuteDetails.appendChild(stepperRow('Commute Home', state.commuteTimeHome, 0, 180, 5,
    val => { state.commuteTimeHome = val; }, v => `${v} min`));

  const gotHomeDetails = document.createElement('div');
  gotHomeDetails.classList.toggle('hidden', !state.hasTimeGotHome);
  gotHomeDetails.appendChild(formRow('Time Got Home', inputEl('time', state.timeGotHome, val => { state.timeGotHome = val; })));

  addCard.appendChild(toggleRow('Did you feel tired today?', state.feltTired, val => {
    state.feltTired = val; tiredDetails.classList.toggle('hidden', !val);
  }));
  addCard.appendChild(tiredDetails);
  addCard.appendChild(toggleRow('Log commute time?', state.hasCommuteTime, val => {
    state.hasCommuteTime = val; commuteDetails.classList.toggle('hidden', !val);
  }));
  addCard.appendChild(commuteDetails);
  addCard.appendChild(toggleRow('Log time got home?', state.hasTimeGotHome, val => {
    state.hasTimeGotHome = val; gotHomeDetails.classList.toggle('hidden', !val);
  }));
  addCard.appendChild(gotHomeDetails);
  container.appendChild(addCard);

  const spacer = document.createElement('div');
  spacer.style.height = '32px';
  container.appendChild(spacer);

  if (!existing) checkDuplicate(container, state.date);

  return container;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function sectionTitle(text) {
  const s = document.createElement('div');
  s.className = 'form-section';
  const t = document.createElement('div');
  t.className = 'form-section-title';
  t.textContent = text;
  s.appendChild(t);
  return s;
}

function formRow(label, inputElement) {
  const row = document.createElement('div');
  row.className = 'form-row';
  const lbl = document.createElement('span');
  lbl.className = 'form-label';
  lbl.textContent = label;
  row.appendChild(lbl);
  row.appendChild(inputElement);
  return row;
}

function inputEl(type, value, onChange) {
  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.className = 'form-input';
  input.addEventListener('change', () => onChange(input.value));
  return input;
}

function toggleRow(label, checked, onChange) {
  const row = document.createElement('div');
  row.className = 'toggle-row';

  const lbl = document.createElement('span');
  lbl.className = 'form-label';
  lbl.textContent = label;

  const toggle = document.createElement('label');
  toggle.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  const track = document.createElement('div');
  track.className = 'toggle-track';

  const thumb = document.createElement('div');
  thumb.className = 'toggle-thumb';

  toggle.appendChild(input);
  toggle.appendChild(track);
  toggle.appendChild(thumb);
  row.appendChild(lbl);
  row.appendChild(toggle);
  return row;
}

function stepperRow(label, initialValue, min, max, step, onChange, formatVal) {
  let value = initialValue;
  const row = document.createElement('div');
  row.className = 'form-row';

  const lbl = document.createElement('span');
  lbl.className = 'form-label';
  lbl.textContent = label;

  const stepper = document.createElement('div');
  stepper.className = 'stepper';

  const minusBtn = document.createElement('button');
  minusBtn.type = 'button';
  minusBtn.className = 'stepper-btn';
  minusBtn.textContent = '−';

  const display = document.createElement('span');
  display.className = 'stepper-value';
  display.textContent = formatVal(value);

  const plusBtn = document.createElement('button');
  plusBtn.type = 'button';
  plusBtn.className = 'stepper-btn';
  plusBtn.textContent = '+';

  function update(newVal) {
    value = clamp(newVal, min, max);
    display.textContent = formatVal(value);
    minusBtn.disabled = value <= min;
    plusBtn.disabled = value >= max;
    onChange(value);
  }

  minusBtn.addEventListener('click', () => update(value - step));
  plusBtn.addEventListener('click', () => update(value + step));
  update(value);

  stepper.appendChild(minusBtn);
  stepper.appendChild(display);
  stepper.appendChild(plusBtn);
  row.appendChild(lbl);
  row.appendChild(stepper);
  return row;
}

function checkDuplicate(container, dateStr) {
  const warn = container.querySelector('#date-warning');
  if (!warn) return;
  const exists = Store.sleep.getAll().some(e => e.date === dateStr);
  warn.classList.toggle('hidden', !exists);
}
