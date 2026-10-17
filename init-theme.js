'use strict';
// Shared display preference only. No application records, data requests or authentication.
function initializeOneChartThemeMemory(storageKey, fallback) {
  const valid = value => value === 'light' || value === 'dark';
  const root = document.documentElement;
  const shared = location.protocol === 'https:' && (location.hostname === 'onechartlab.com' || location.hostname.endsWith('.onechartlab.com'));
  function cookie() {
    if (!shared) return null;
    try {
      const item = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('onechart-theme='));
      const value = item ? decodeURIComponent(item.slice('onechart-theme='.length)) : null;
      return valid(value) ? value : null;
    } catch { return null; }
  }
  function local() {
    try { const value = localStorage.getItem(storageKey); return valid(value) ? value : null; } catch { return null; }
  }
  function store(theme) { try { localStorage.setItem(storageKey, theme); } catch {} }
  let current = fallback;
  function read() { return cookie() || local() || current; }
  current = read();
  function paint(theme) { root.dataset.theme = theme; root.style.colorScheme = theme; }
  function remember(theme) {
    if (!valid(theme)) return;
    current = theme; store(theme);
    if (shared) {
      try { document.cookie = `onechart-theme=${theme}; Domain=.onechartlab.com; Path=/; Max-Age=31536000; SameSite=Lax; Secure`; } catch {}
    }
  }
  function sync() {
    const theme = read();
    if (theme === current) return;
    current = theme; store(theme); paint(theme);
    dispatchEvent(new CustomEvent('onechart-shared-theme-change', { detail:{theme} }));
  }
  window.OneChartThemeMemory = { read, remember, sync };
  // The first visited page seeds the common preference from its incumbent choice/default.
  remember(current); paint(current);
  addEventListener('focus', sync);
  addEventListener('pageshow', sync);
  addEventListener('storage', event => { if (event.key === storageKey || event.key === null) sync(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
}

initializeOneChartThemeMemory('onechart-theme', 'light');
