// router.js — Hash-based tab navigation + modal management

const VALID_TABS = ['sleep', 'screens', 'trends', 'settings'];
const DEFAULT_TAB = 'sleep';

let currentTab = null;
let viewRenderers = {};
let modalRenderers = {};

export function registerView(tab, fn) {
  viewRenderers[tab] = fn;
}

export function registerModal(name, fn) {
  modalRenderers[name] = fn;
}

export function navigate(tab) {
  if (!VALID_TABS.includes(tab)) tab = DEFAULT_TAB;
  window.location.hash = tab;
}

export function openModal(name, data = {}) {
  const renderer = modalRenderers[name];
  if (!renderer) return;
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = '';
  content.appendChild(renderer(data));
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

export function refreshView() {
  const renderer = viewRenderers[currentTab];
  if (renderer) {
    const view = document.getElementById('view');
    view.innerHTML = '';
    view.appendChild(renderer());
  }
}

export function init() {
  // Tab bar clicks
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.tab));
  });

  // Close modal on overlay background click
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  window.addEventListener('hashchange', handleHash);
  handleHash();
}

function handleHash() {
  const hash = window.location.hash.replace('#', '') || DEFAULT_TAB;
  const tab = VALID_TABS.includes(hash) ? hash : DEFAULT_TAB;
  if (tab !== currentTab) {
    currentTab = tab;
    updateTabBar(tab);
    renderTab(tab);
  }
}

function updateTabBar(tab) {
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
    btn.setAttribute('aria-selected', btn.dataset.tab === tab);
  });
}

function renderTab(tab) {
  const renderer = viewRenderers[tab];
  const view = document.getElementById('view');
  view.innerHTML = '';
  if (renderer) view.appendChild(renderer());
}
