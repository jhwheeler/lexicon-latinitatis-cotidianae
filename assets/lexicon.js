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

  // Display options: macrons shown or hidden, consonantal i written j or i. They change only what
  // is shown (search ignores both anyway); each text node under lang="la" keeps its original.
  const original = new WeakMap();
  const settings = { macrons: 'on', j: 'j' };
  try {
    if (localStorage.getItem('lexicon-macrons') === 'off') settings.macrons = 'off';
    if (localStorage.getItem('lexicon-j') === 'i') settings.j = 'i';
  } catch {}
  function shown(text) {
    if (settings.macrons === 'off') text = text.normalize('NFD').replace(/\u0304/g, '').normalize('NFC');
    if (settings.j === 'i') text = text.replace(/j/g, 'i').replace(/J/g, 'I');
    return text;
  }
  function render(scope = document) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement?.closest('[lang="la"]') && !node.parentElement.closest('script, style')
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    for (let node; (node = walker.nextNode());) {
      if (!original.has(node)) original.set(node, node.data);
      const text = shown(original.get(node));
      if (node.data !== text) node.data = text;
    }
  }
  const options = [...document.querySelectorAll('[data-display]')];
  function syncDisplay() {
    options.forEach(button => button.setAttribute('aria-pressed', String(settings[button.dataset.display] === button.dataset.value)));
    root.dataset.macrons = settings.macrons; root.dataset.consonantalI = settings.j;
  }
  options.forEach(button => button.addEventListener('click', () => {
    settings[button.dataset.display] = button.dataset.value;
    try {
      localStorage.setItem(button.dataset.display === 'j' ? 'lexicon-j' : 'lexicon-macrons', button.dataset.value);
    } catch {}
    syncDisplay(); render();
    document.dispatchEvent(new CustomEvent('lexicon-display'));
  }));
  syncDisplay();
  if (settings.macrons === 'off' || settings.j === 'i') render();
  window.lexiconDisplay = { render };

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
