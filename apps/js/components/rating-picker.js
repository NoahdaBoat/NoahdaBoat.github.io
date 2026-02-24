// rating-picker.js — Reusable 1-5 circular button rating picker

export function createRatingPicker(label, value, onChange) {
  const row = document.createElement('div');
  row.className = 'rating-row';

  const lbl = document.createElement('div');
  lbl.className = 'rating-label';
  lbl.textContent = label;
  row.appendChild(lbl);

  const picker = document.createElement('div');
  picker.className = 'rating-picker';

  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rating-btn' + (i === value ? ' selected' : '');
    btn.textContent = String(i);
    btn.setAttribute('aria-label', `${i} out of 5`);
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.rating-btn').forEach((b, idx) => {
        b.classList.toggle('selected', idx + 1 === i);
      });
      onChange(i);
    });
    picker.appendChild(btn);
  }

  row.appendChild(picker);
  return row;
}
