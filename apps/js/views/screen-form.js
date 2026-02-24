// screen-form.js — Create/edit screen time entry modal

import * as Store from '../store.js';
import * as Router from '../router.js';
import { today, clamp, generateId } from '../utils.js';

export function renderScreenForm({ id } = {}) {
  const existing = id ? Store.screen.getById(id) : null;

  const state = {
    date: existing?.date ?? today(),
    hoursUsed: existing?.hoursUsed ?? 3.0,
    lastUsedTime: existing?.lastUsedTime ?? '22:00',
  };

  function save() {
    const entry = {
      id: existing?.id ?? generateId(),
      date: state.date,
      hoursUsed: state.hoursUsed,
      lastUsedTime: state.lastUsedTime,
    };
    if (existing) entry.createdAt = existing.createdAt;
    Store.screen.save(entry);
    Router.closeModal();
    Router.refreshView();
  }

  const container = document.createElement('div');

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<span class="modal-title">${existing ? 'Edit Screen Time' : 'Log Screen Time'}</span>`;

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

  // Duplicate warning (create mode only)
  if (!existing) {
    const warn = document.createElement('div');
    warn.id = 'date-warning';
    warn.className = 'warning-banner hidden';
    warn.textContent = 'An entry already exists for this date. Saving will create a duplicate.';
    container.appendChild(warn);
  }

  // Details section
  container.appendChild(sectionTitle('Screen Time Details'));
  const card = document.createElement('div');
  card.className = 'form-card';

  // Date
  card.appendChild(formRow('Date', (() => {
    const input = document.createElement('input');
    input.type = 'date';
    input.value = state.date;
    input.className = 'form-input';
    input.addEventListener('change', () => {
      state.date = input.value;
      if (!existing) checkDuplicate(container, state.date);
    });
    return input;
  })()));

  // Hours used stepper (0–24, step 0.5)
  card.appendChild(stepperRow('Hours Used', state.hoursUsed, 0, 24, 0.5,
    val => { state.hoursUsed = val; },
    v => `${v.toFixed(1)} hrs`
  ));

  // Last used time
  card.appendChild(formRow('Last Used Time', (() => {
    const input = document.createElement('input');
    input.type = 'time';
    input.value = state.lastUsedTime;
    input.className = 'form-input';
    input.addEventListener('change', () => { state.lastUsedTime = input.value; });
    return input;
  })()));

  container.appendChild(card);

  const spacer = document.createElement('div');
  spacer.style.height = '32px';
  container.appendChild(spacer);

  if (!existing) checkDuplicate(container, state.date);

  return container;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const exists = Store.screen.getAll().some(e => e.date === dateStr);
  warn.classList.toggle('hidden', !exists);
}
