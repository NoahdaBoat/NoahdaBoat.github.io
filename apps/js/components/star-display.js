// star-display.js — Read-only star rating display (1-5 stars)

export function createStarDisplay(value) {
  const container = document.createElement('div');
  container.className = 'stars';

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star ' + (i <= value ? 'filled' : 'empty');
    star.textContent = '★';
    container.appendChild(star);
  }

  return container;
}
