(function() {
  // ── Theme toggle ───────────────────────────────────────────────────────────
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.setAttribute('aria-label', 'Toggle dark mode');

  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // Place inside the nav (beside hamburger on mobile, fixed on desktop via CSS)
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.insertBefore(themeToggle, nav.firstChild);
  } else {
    document.body.appendChild(themeToggle);
  }

  // ── Apps dropdown: click-to-toggle on mobile ──────────────────────────────
  var dropdown = document.querySelector('.nav-dropdown__toggle');
  if (dropdown) {
    dropdown.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var parent = dropdown.closest('.nav-dropdown');
      if (parent) parent.classList.toggle('open');
    });

    // Close when tapping elsewhere
    document.addEventListener('click', function() {
      var openDropdown = document.querySelector('.nav-dropdown.open');
      if (openDropdown) openDropdown.classList.remove('open');
    });
  }
})();