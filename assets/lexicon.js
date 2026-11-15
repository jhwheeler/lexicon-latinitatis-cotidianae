(() => {
  // The service worker (sw.js, at the root of the site) keeps the lexicon on the device: it opens
  // at once, searches without the network and works offline. Pages opened from disk go without it.
  const script = document.currentScript;
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && script) {
    addEventListener('load', () => { navigator.serviceWorker.register(new URL("../sw.js", script.src)).catch(() => {}); });
  }

  // Words looked up (Jack, 13 November 2026): opening an entry's page records it on the device, with
  // the time, so that the practice page can offer "Words I looked up". Only the 500 most recent are
  // kept. The record's id is the last part of the page's address (c/<id>.html).
  if (document.querySelector('article.concept[data-record]')) {
    const entry = /\/c\/([a-z0-9-]+?)(?:\.html)?$/.exec(location.pathname);
    if (entry) {
      try {
        const kept = JSON.parse(localStorage.getItem('lexicon-seen') || '{}');
        const seen = kept && typeof kept === 'object' && !Array.isArray(kept) ? kept : {};
        seen[entry[1]] = Date.now();
        const recent = Object.entries(seen).filter(([, when]) => Number.isFinite(when)).sort((a, b) => b[1] - a[1]).slice(0, 500);
        localStorage.setItem('lexicon-seen', JSON.stringify(Object.fromEntries(recent)));
      } catch {}
    }
  }

  // Back to the round (Jack, 15 November 2026). An entry opened from a card of the practice game
  // was left by going back; but on an iPhone a link from the entry to another site opens a sheet
  // over the app, and after it there is nothing to go back to. So while a round is in progress
  // whose current card is this entry (practice.js keeps the round in localStorage, with its time,
  // for 12 hours), the entry has one quiet link above it, back to the round. The words follow the
  // practice page's language; "Redī ad cursum" is Claude's wording, awaiting Jack's review (the
  // round is "cursus" in the game: Novus cursus, Cursus cōnfectus).
  const article = document.querySelector('article.concept[data-record]');
  const here = /\/c\/([a-z0-9-]+?)(?:\.html)?$/.exec(location.pathname);
  if (article && here) {
    try {
      const kept = JSON.parse(localStorage.getItem('lexicon-practice-round'));
      const age = kept && typeof kept === 'object' ? Date.now() - kept.at : -1;
      if (kept.current === here[1] && age >= 0 && age <= 12 * 3600e3) {
        const latin = localStorage.getItem('lexicon-practice-lang') !== 'en';
        const line = document.createElement('p'), link = document.createElement('a');
        line.className = 'round-back';
        link.href = '../practice.html';
        link.lang = latin ? 'la' : 'en';
        link.textContent = latin ? '← Redī ad cursum' : '← Back to the round';
        line.append(link);
        article.before(line);
      }
    } catch {}
  }

  // Theme (light is the default; the choice is kept where storage allows), chosen in the settings.
  const root = document.documentElement;
  const color = document.querySelector('meta[name="theme-color"]');
  const choices = [...document.querySelectorAll('[data-theme-choice]')];
  function sync() {
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === root.dataset.theme)));
    if (color) color.content = root.dataset.theme === 'dark' ? '#1c1b19' : '#ffffff';
  }
  function choose(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem('lexicon-theme', theme); } catch {}
    sync();
  }
  choices.forEach(button => button.addEventListener('click', () => choose(button.dataset.themeChoice)));
  sync();

  // The settings close with Escape, or with a tap outside them.
  const settingsMenu = document.querySelector('details.settings');
  if (settingsMenu) {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && settingsMenu.open) { settingsMenu.open = false; settingsMenu.querySelector('summary').focus(); }
    });
    document.addEventListener('click', event => { if (settingsMenu.open && !settingsMenu.contains(event.target)) settingsMenu.open = false; });
  }

  // "/" goes to the search: the page's own where it searches in place, else the header's.
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
    const target = event.target;
    if (target.closest && target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const field = [document.getElementById('search'), document.getElementById('site-search')]
      .find(el => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
    if (!field) return;
    event.preventDefault();
    field.focus();
    field.select();
  });

  // Display options: macrons shown or hidden, consonantal i written j or i, consonantal u written
  // v or u (Jack, 11 November 2026: lower case only, so Venus and Vt keep their capital V). They
  // change only what is shown (search ignores all three anyway); each text node under lang="la"
  // keeps its original, so switching back restores it exactly. A node's language is that of the
  // nearest element that names one, so English inside Latin (a gloss after a term, the cue of a
  // practice card on a page whose interface is Latin) is left alone.
  const original = new WeakMap();
  const settings = { macrons: 'on', j: 'j', v: 'v' };
  const keys = { macrons: 'lexicon-macrons', j: 'lexicon-j', v: 'lexicon-v' };
  try {
    if (localStorage.getItem('lexicon-macrons') === 'off') settings.macrons = 'off';
    if (localStorage.getItem('lexicon-j') === 'i') settings.j = 'i';
    if (localStorage.getItem('lexicon-v') === 'u') settings.v = 'u';
  } catch {}
  function shown(text) {
    if (settings.macrons === 'off') text = text.normalize('NFD').replace(/\u0304/g, '').normalize('NFC');
    if (settings.j === 'i') text = text.replace(/j/g, 'i').replace(/J/g, 'I');
    if (settings.v === 'u') text = text.replace(/v/g, 'u');
    return text;
  }
  function render(scope = document) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.parentElement?.closest('[lang]')?.getAttribute('lang') === 'la' && !node.parentElement.closest('script, style')
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
    root.dataset.macrons = settings.macrons; root.dataset.consonantalI = settings.j; root.dataset.consonantalU = settings.v;
  }
  options.forEach(button => button.addEventListener('click', () => {
    settings[button.dataset.display] = button.dataset.value;
    try {
      localStorage.setItem(keys[button.dataset.display], button.dataset.value);
    } catch {}
    syncDisplay(); render();
    document.dispatchEvent(new CustomEvent('lexicon-display'));
  }));
  syncDisplay();
  if (settings.macrons === 'off' || settings.j === 'i' || settings.v === 'u') render();
  window.lexiconDisplay = { render };

  // Words or phrases: in a category's list and in the English A–Z, keep only the words or only the
  // phrases. The choice is kept, so it holds from one list to the next; a letter left with nothing
  // to show is hidden with its link.
  document.querySelectorAll('[data-kind-filter]').forEach(group => {
    const buttons = [...group.querySelectorAll('button[data-kind]')], count = group.querySelector('.kind-count');
    const items = [...document.querySelectorAll('.wlist > li[data-kind]')];
    const letters = [...document.querySelectorAll('.az-letter')];
    function apply(kind) {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === kind)));
      let shown = 0;
      items.forEach(item => { item.hidden = kind !== 'all' && item.dataset.kind !== kind; if (!item.hidden) shown++; });
      letters.forEach(letter => {
        letter.hidden = !letter.querySelector('li[data-kind]:not([hidden])');
        const link = document.querySelector(`.az-nav a[href="#${letter.id}"]`);
        if (link) link.hidden = letter.hidden;
      });
      count.textContent = kind === 'all' ? '' : `${shown.toLocaleString('en')} ${kind === 'word' ? 'words' : 'phrases'}`;
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      try { localStorage.setItem('lexicon-kind', button.dataset.kind); } catch {}
      apply(button.dataset.kind);
    }));
    let kept = 'all';
    try { if (['word', 'phrase'].includes(localStorage.getItem('lexicon-kind'))) kept = localStorage.getItem('lexicon-kind'); } catch {}
    // A list with no phrases (or no words) offers no choice.
    const kinds = new Set(items.map(item => item.dataset.kind));
    if (kinds.size < 2) return;
    group.hidden = false;
    if (kept !== 'all') apply(kept);
  });

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
