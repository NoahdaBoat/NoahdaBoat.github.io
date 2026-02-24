// screen-list.js — Screens tab: list of entries

import * as Store from '../store.js';
import * as Router from '../router.js';
import { formatDate, formatTime } from '../utils.js';

export function renderScreenList() {
  const container = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">Screens</h1>`;

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-icon';
  addBtn.setAttribute('aria-label', 'Add screen entry');
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => Router.openModal('screen-form', {}));
  header.appendChild(addBtn);
  container.appendChild(header);

  const entries = Store.screen.getAll();
  const section = document.createElement('div');
  section.className = 'list-section';

  if (entries.length === 0) {
    section.appendChild(emptyState());
  } else {
    const card = document.createElement('div');
    card.className = 'card';
    entries.forEach(entry => card.appendChild(createRow(entry)));
    section.appendChild(card);
  }

  container.appendChild(section);

  const spacer = document.createElement('div');
  spacer.className = 'bottom-spacer';
  container.appendChild(spacer);

  return container;
}

function createRow(entry) {
  const row = document.createElement('div');
  row.className = 'card-row';

  const content = document.createElement('div');
  content.className = 'card-row-content';

  const title = document.createElement('div');
  title.className = 'card-row-title';
  title.textContent = formatDate(entry.date);

  const subtitle = document.createElement('div');
  subtitle.className = 'card-row-subtitle';
  subtitle.textContent = `${entry.hoursUsed.toFixed(1)} hrs · Last used ${formatTime(entry.lastUsedTime)}`;

  content.appendChild(title);
  content.appendChild(subtitle);

  const delBtn = document.createElement('button');
  delBtn.className = 'card-row-delete';
  delBtn.textContent = 'Delete';
  delBtn.setAttribute('aria-label', `Delete entry for ${formatDate(entry.date)}`);
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (confirm(`Delete screen entry for ${formatDate(entry.date)}?`)) {
      Store.screen.delete(entry.id);
      Router.refreshView();
    }
  });

  const chevron = document.createElement('span');
  chevron.className = 'card-row-chevron';
  chevron.textContent = '›';

  row.appendChild(content);
  row.appendChild(delBtn);
  row.appendChild(chevron);

  row.addEventListener('click', () => Router.openModal('screen-form', { id: entry.id }));

  return row;
}

function emptyState() {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-state-icon">📱</div>
    <div class="empty-state-title">No Screen Entries</div>
    <div class="empty-state-message">Tap + to log your screen time.</div>
  `;
  return div;
}
