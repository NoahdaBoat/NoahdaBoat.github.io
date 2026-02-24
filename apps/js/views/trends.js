// trends.js — Trends tab: segmented control + chart lifecycle management

import { renderSleepCharts, renderScreenChart, renderCombinedChart } from '../charts/sleep-chart.js';

const TABS = [
  { id: 'sleep',    label: 'Sleep'    },
  { id: 'screens',  label: 'Screens'  },
  { id: 'combined', label: 'Combined' },
];

export function renderTrends() {
  let activeTab = 'sleep';

  const container = document.createElement('div');

  const header = document.createElement('div');
  header.className = 'page-header';
  header.innerHTML = `<h1 class="page-title">Trends</h1>`;
  container.appendChild(header);

  // Segmented control
  const segmented = document.createElement('div');
  segmented.className = 'segmented-control';

  // Chart area — cleared and re-populated on each tab switch
  const chartArea = document.createElement('div');

  function switchTab(tabId) {
    activeTab = tabId;
    segmented.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    // Destroy existing Chart.js instances before removing canvases
    chartArea.querySelectorAll('canvas').forEach(c => {
      if (c._chartInstance) {
        c._chartInstance.destroy();
        c._chartInstance = null;
      }
    });
    chartArea.innerHTML = '';
    if (tabId === 'sleep')    renderSleepCharts(chartArea);
    if (tabId === 'screens')  renderScreenChart(chartArea);
    if (tabId === 'combined') renderCombinedChart(chartArea);
  }

  TABS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'segmented-btn' + (id === activeTab ? ' active' : '');
    btn.dataset.tab = id;
    btn.textContent = label;
    btn.addEventListener('click', () => switchTab(id));
    segmented.appendChild(btn);
  });

  container.appendChild(segmented);
  container.appendChild(chartArea);

  switchTab(activeTab);

  const spacer = document.createElement('div');
  spacer.className = 'bottom-spacer';
  container.appendChild(spacer);

  return container;
}
