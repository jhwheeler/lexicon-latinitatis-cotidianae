(() => {
  // Theme toggle (light is the default; the choice is kept where storage allows).
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const label = document.getElementById('theme-label');
  const color = document.querySelector('meta[name="theme-color"]');
  function sync() {
    const dark = root.dataset.theme === 'dark';
    if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    if (toggle) toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    if (color) color.content = dark ? '#1c1b19' : '#ffffff';
  }
  if (toggle) toggle.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    try { localStorage.setItem('lexicon-theme', theme); } catch {}
    sync();
  });
  sync();

  // Example filters: all examples show without JavaScript; with it, a reader can keep
  // only the quotations from authors or only the sentences we composed.
  document.querySelectorAll('[data-example-filter]').forEach(group => {
    const list = document.getElementById(group.dataset.exampleFilter);
    const buttons = [...group.querySelectorAll('button[data-show]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      const show = button.dataset.show;
      buttons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      list.querySelectorAll(':scope > li[data-source]').forEach(item => {
        item.hidden = show !== 'all' && item.dataset.source !== show;
      });
    }));
    group.hidden = false;
  });
})();
