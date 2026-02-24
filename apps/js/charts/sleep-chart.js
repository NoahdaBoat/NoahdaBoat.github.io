// sleep-chart.js — Sleep hours chart + quality/productivity chart

import * as Store from '../store.js';
import { formatDate, formatChartDate } from '../utils.js';

const CHART_DEFAULTS = {
  color: {
    grid: 'rgba(255, 255, 255, 0.06)',
    tick: '#8E8E93',
  }
};

export function renderSleepCharts(container) {
  const entries = Store.sleep.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) {
    container.appendChild(emptyState('🌙', 'No Sleep Data', 'Log sleep entries to see your trends.'));
    return;
  }

  const chartLabels = entries.map(e => formatChartDate(e.date));

  // ── Hours Slept chart
  const hoursBox = chartBox('Hours Slept');
  const hoursDetail = detailPanel();
  hoursBox.wrap.parentElement?.appendChild(hoursDetail); // appended below in order

  container.appendChild(buildChartContainer('Hours Slept', canvas => {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Hours Slept',
          data: entries.map(e => e.hoursSlept),
          borderColor: '#0A84FF',
          backgroundColor: 'rgba(10, 132, 255, 0.12)',
          pointBackgroundColor: '#0A84FF',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        }]
      },
      options: makeOptions(0, 12, 'h', entries, (entry) => {
        return `
          <div class="chart-detail-date">${formatDate(entry.date)}</div>
          <div class="chart-detail-values">
            <div class="chart-detail-item">
              <div class="chart-detail-label">Hours Slept</div>
              <div class="chart-detail-value" style="color:#0A84FF">${entry.hoursSlept.toFixed(1)} hrs</div>
            </div>
          </div>`;
      })
    });
  }));

  // ── Quality & Productivity chart
  container.appendChild(buildChartContainer('Sleep Quality & Productivity', canvas => {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Sleep Quality',
            data: entries.map(e => e.sleepQuality),
            borderColor: '#30D158',
            backgroundColor: 'rgba(48, 209, 88, 0.08)',
            pointBackgroundColor: '#30D158',
            pointStyle: 'circle',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3,
          },
          {
            label: 'Productivity',
            data: entries.map(e => e.productivityRating),
            borderColor: '#FF9F0A',
            backgroundColor: 'rgba(255, 159, 10, 0.08)',
            pointBackgroundColor: '#FF9F0A',
            pointStyle: 'rect',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3,
          }
        ]
      },
      options: {
        ...makeOptions(1, 5, '', entries, (entry) => {
          return `
            <div class="chart-detail-date">${formatDate(entry.date)}</div>
            <div class="chart-detail-values">
              <div class="chart-detail-item">
                <div class="chart-detail-label">Sleep Quality</div>
                <div class="chart-detail-value" style="color:#30D158">${entry.sleepQuality}/5</div>
              </div>
              <div class="chart-detail-item">
                <div class="chart-detail-label">Productivity</div>
                <div class="chart-detail-value" style="color:#FF9F0A">${entry.productivityRating}/5</div>
              </div>
              ${entry.dayFeltDifficulty != null ? `
              <div class="chart-detail-item">
                <div class="chart-detail-label">Day Difficulty</div>
                <div class="chart-detail-value">${entry.dayFeltDifficulty}/5</div>
              </div>` : ''}
            </div>`;
        }),
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#8E8E93', boxWidth: 12, font: { size: 12 } } }
        }
      }
    });
  }));
}

// ── Screen chart ──────────────────────────────────────────────────────────────

export function renderScreenChart(container) {
  const entries = Store.screen.getAll().slice().sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) {
    container.appendChild(emptyState('📱', 'No Screen Data', 'Log screen entries to see your trends.'));
    return;
  }

  const chartLabels = entries.map(e => formatChartDate(e.date));

  container.appendChild(buildChartContainer('Screen Time', canvas => {
    return new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Screen Hours',
          data: entries.map(e => e.hoursUsed),
          borderColor: '#BF5AF2',
          backgroundColor: 'rgba(191, 90, 242, 0.12)',
          pointBackgroundColor: '#BF5AF2',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.3,
          fill: true,
        }]
      },
      options: makeOptions(0, 12, 'h', entries, (entry) => {
        return `
          <div class="chart-detail-date">${formatDate(entry.date)}</div>
          <div class="chart-detail-values">
            <div class="chart-detail-item">
              <div class="chart-detail-label">Screen Time</div>
              <div class="chart-detail-value" style="color:#BF5AF2">${entry.hoursUsed.toFixed(1)} hrs</div>
            </div>
            <div class="chart-detail-item">
              <div class="chart-detail-label">Last Used</div>
              <div class="chart-detail-value">${formatTime12(entry.lastUsedTime)}</div>
            </div>
          </div>`;
      })
    });
  }));
}

// ── Combined chart ────────────────────────────────────────────────────────────

export function renderCombinedChart(container) {
  const sleepEntries = Store.sleep.getAll();
  const screenEntries = Store.screen.getAll();

  if (sleepEntries.length === 0 && screenEntries.length === 0) {
    container.appendChild(emptyState('📈', 'No Data Yet', 'Log sleep and screen entries to see combined trends.'));
    return;
  }

  const dateSet = new Set([...sleepEntries.map(e => e.date), ...screenEntries.map(e => e.date)]);
  const dates = Array.from(dateSet).sort();
  const sleepMap = Object.fromEntries(sleepEntries.map(e => [e.date, e]));
  const screenMap = Object.fromEntries(screenEntries.map(e => [e.date, e]));
  const chartLabels = dates.map(d => formatChartDate(d));

  container.appendChild(buildChartContainer('Sleep vs Screen Time', canvas => {
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Sleep Hours',
            data: dates.map(d => sleepMap[d]?.hoursSlept ?? null),
            borderColor: '#0A84FF',
            backgroundColor: 'rgba(10, 132, 255, 0.06)',
            pointBackgroundColor: '#0A84FF',
            pointStyle: 'circle',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3,
            spanGaps: false,
          },
          {
            label: 'Screen Hours',
            data: dates.map(d => screenMap[d]?.hoursUsed ?? null),
            borderColor: '#BF5AF2',
            backgroundColor: 'rgba(191, 90, 242, 0.06)',
            pointBackgroundColor: '#BF5AF2',
            pointStyle: 'rect',
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.3,
            spanGaps: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick(event, elements) {
          if (elements.length > 0) {
            const idx = elements[0].index;
            const date = dates[idx];
            const s = sleepMap[date];
            const sc = screenMap[date];
            const panel = canvas.closest('.chart-container').querySelector('.chart-detail-panel');
            panel.classList.remove('hidden');
            panel.innerHTML = `
              <div class="chart-detail-date">${formatDate(date)}</div>
              <div class="chart-detail-values">
                <div class="chart-detail-item">
                  <div class="chart-detail-label">Sleep Hours</div>
                  <div class="chart-detail-value" style="color:#0A84FF">${s ? s.hoursSlept.toFixed(1) + ' hrs' : 'No data'}</div>
                </div>
                <div class="chart-detail-item">
                  <div class="chart-detail-label">Screen Hours</div>
                  <div class="chart-detail-value" style="color:#BF5AF2">${sc ? sc.hoursUsed.toFixed(1) + ' hrs' : 'No data'}</div>
                </div>
              </div>`;
          }
        },
        scales: makeScales(0, 12, 'h'),
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#8E8E93', boxWidth: 12, font: { size: 12 } } },
          tooltip: { enabled: true }
        },
        animation: { duration: 300 }
      }
    });
    return chart;
  }));
}

// ── Private helpers ───────────────────────────────────────────────────────────

function buildChartContainer(title, createChart) {
  const box = document.createElement('div');
  box.className = 'chart-container';

  const titleEl = document.createElement('div');
  titleEl.className = 'chart-title';
  titleEl.textContent = title;
  box.appendChild(titleEl);

  const wrap = document.createElement('div');
  wrap.className = 'chart-canvas-wrap';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  box.appendChild(wrap);

  const detail = document.createElement('div');
  detail.className = 'chart-detail-panel hidden';
  box.appendChild(detail);

  const hint = document.createElement('div');
  hint.className = 'chart-hint';
  hint.textContent = 'Tap a point to see details';
  box.appendChild(hint);

  // Create the chart after the canvas is in the DOM tree
  requestAnimationFrame(() => createChart(canvas));

  return box;
}

function makeOptions(yMin, yMax, unit, entries, detailHTML) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    onClick(event, elements) {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const panel = event.chart.canvas.closest('.chart-container').querySelector('.chart-detail-panel');
        panel.classList.remove('hidden');
        panel.innerHTML = detailHTML(entries[idx]);
      }
    },
    scales: makeScales(yMin, yMax, unit),
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    animation: { duration: 300 }
  };
}

function makeScales(yMin, yMax, unit) {
  return {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, maxRotation: 45, color: CHART_DEFAULTS.color.tick }
    },
    y: {
      min: yMin,
      max: yMax,
      grid: { color: CHART_DEFAULTS.color.grid },
      ticks: {
        font: { size: 11 },
        color: CHART_DEFAULTS.color.tick,
        callback: val => unit ? `${val}${unit}` : val
      }
    }
  };
}

function emptyState(icon, title, message) {
  const div = document.createElement('div');
  div.className = 'empty-state';
  div.innerHTML = `
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-message">${message}</div>
  `;
  return div;
}

function formatTime12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}
