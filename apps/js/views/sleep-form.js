// sleep-form.js — Create/edit sleep entry modal

import * as Store from '../store.js';
import * as Router from '../router.js';
import { today, clamp, generateId } from '../utils.js';
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
    timeFeltTiredList: existing?.timeFeltTired
      ? (Array.isArray(existing.timeFeltTired) ? existing.timeFeltTired : [existing.timeFeltTired])
      : ['14:00'],
    hasCommuteTime: existing?.commuteTimeHome != null,
    commuteTimeHome: existing?.commuteTimeHome ?? 30,
    hasTimeGotHome: existing?.timeGotHome != null,
    timeGotHome: existing?.timeGotHome ?? '17:30',
  };

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
      timeFeltTired: state.feltTired ? state.timeFeltTiredList.filter(t => t) : null,
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
    state.sleepStartTime = val;
  })));
  detailsCard.appendChild(formRow('Sleep End', inputEl('time', state.sleepEndTime, val => {
    state.sleepEndTime = val;
  })));
  detailsCard.appendChild(stepperRow('Hours Slept', state.hoursSlept, 0, 24, 0.5,
    val => { state.hoursSlept = val; },
    v => `${v.toFixed(1)} hrs`
  ));
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
  ratingsCard.appendChild(createRatingPicker('Sleep Quality', state.sleepQuality, v => { state.sleepQuality = v; }, { lowLabel: 'Poor', highLabel: 'Excellent' }));
  ratingsCard.appendChild(createRatingPicker('Productivity Rating', state.productivityRating, v => { state.productivityRating = v; }, { lowLabel: 'Not productive', highLabel: 'Very productive' }));
  ratingsCard.appendChild(createRatingPicker('Day Felt Difficulty', state.dayFeltDifficulty, v => { state.dayFeltDifficulty = v; }, { lowLabel: 'Easy', highLabel: 'Very hard' }));
  ratingsCard.appendChild(createRatingPicker('Day Felt Speed', state.dayFeltSpeed, v => { state.dayFeltSpeed = v; }, { lowLabel: 'Dragged on', highLabel: 'Flew by' }));
  container.appendChild(ratingsCard);

  // ── Additional Info
  container.appendChild(sectionTitle('Additional Info'));
  const addCard = document.createElement('div');
  addCard.className = 'form-card';

  const tiredDetails = document.createElement('div');
  tiredDetails.classList.toggle('hidden', !state.feltTired);

  function renderTiredInputs() {
    tiredDetails.innerHTML = '';
    state.timeFeltTiredList.forEach((time, idx) => {
      const row = document.createElement('div');
      row.className = 'form-row';

      const lbl = document.createElement('span');
      lbl.className = 'form-label';
      lbl.textContent = state.timeFeltTiredList.length > 1 ? `Time #${idx + 1}` : 'Time Felt Tired';

      const rightSide = document.createElement('div');
      rightSide.style.display = 'flex';
      rightSide.style.alignItems = 'center';
      rightSide.style.gap = '8px';

      const input = document.createElement('input');
      input.type = 'time';
      input.value = time;
      input.className = 'form-input';
      input.addEventListener('change', () => { state.timeFeltTiredList[idx] = input.value; });
      rightSide.appendChild(input);

      if (state.timeFeltTiredList.length > 1) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'tired-remove-btn';
        removeBtn.textContent = '\u2212';
        removeBtn.addEventListener('click', () => {
          state.timeFeltTiredList.splice(idx, 1);
          renderTiredInputs();
        });
        rightSide.appendChild(removeBtn);
      }

      row.appendChild(lbl);
      row.appendChild(rightSide);
      tiredDetails.appendChild(row);
    });

    const addRow = document.createElement('div');
    addRow.className = 'form-row';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-text';
    addBtn.textContent = '+ Add Another Time';
    addBtn.addEventListener('click', () => {
      state.timeFeltTiredList.push('14:00');
      renderTiredInputs();
    });
    addRow.appendChild(addBtn);
    tiredDetails.appendChild(addRow);
  }

  renderTiredInputs();

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
    value = clamp(Math.round(newVal * 10) / 10, min, max);
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
