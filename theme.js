// Shared theme. A saved preference wins; otherwise follow local daytime.
(() => {
  const key = 'north-theme';
  let selected;
  try { selected = localStorage.getItem(key); } catch (_) { /* Storage can be unavailable. */ }
  const button = document.getElementById('btn-theme');
  function apply() {
    const hour = new Date().getHours();
    const theme = selected === 'light' || selected === 'dark' ? selected : (hour >= 19 || hour < 7 ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    button?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
  button?.addEventListener('click', () => {
    selected = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(key, selected); } catch (_) { /* Keep preference for this visit. */ }
    apply();
  });
  apply();
  setInterval(apply, 60000);
})();
