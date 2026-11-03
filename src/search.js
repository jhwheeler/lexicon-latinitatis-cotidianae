(() => {
  const themeToggle = document.getElementById('theme-toggle');
  function syncTheme() {
    const light = document.documentElement.dataset.theme === 'light';
    document.getElementById('theme-label').textContent = light ? 'Dark mode' : 'Light mode';
    themeToggle.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    document.querySelector('meta[name="theme-color"]').content = light ? '#f4f0e8' : '#171512';
  }
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lexicon-theme', theme); } catch {}
    syncTheme();
  });
  syncTheme();
  const search = document.getElementById('search'), clear = document.getElementById('clear');
  const count = document.getElementById('results'), empty = document.getElementById('empty');
  const emptyMessage = document.getElementById('empty-message'), searchAll = document.getElementById('search-all');
  const results = document.getElementById('search-results'), list = document.getElementById('search-result-list');
  const entries = [...document.querySelectorAll('[data-entry]')];
  const sections = [...document.querySelectorAll('[data-category-section]')];
  const chips = [...document.querySelectorAll('[data-filter]')];
  const categoryMenu = document.getElementById('category-menu');
  const categoryLabel = document.getElementById('active-category');
  const desktop = window.matchMedia('(min-width: 960px)');
  const adaptCategories = () => { categoryMenu.open = desktop.matches; };
  desktop.addEventListener('change', adaptCategories);
  adaptCategories();
  let active = 'all';
  let renderedQuery = null, renderedCategory = null;
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/j/g, 'i');
  const index = entries.map((entry, order) => {
    const section = entry.closest('[data-category-section]');
    if (!entry.id) entry.id = entry.dataset.entryId;
    const lines = [...entry.querySelectorAll('.entry-body > ul > li, .entry-body > p, .entry-sources > p')].map(node => {
      const latin = node.querySelector('strong[lang="la"]')?.textContent.trim();
      const definition = latin && latin.split(/\s+/).length <= 10
        && (/^[a-zāēīōūȳæœ]/.test(latin) || /\b[mfn]\.\s*(pl\.)?$/.test(latin));
      return {node, text: fold(node.textContent), kind: node.closest('.entry-sources') ? 'Source note' : definition ? 'Definition' : 'Example or phrase'};
    });
    return {entry, order, lines, category: entry.dataset.category, label: section.querySelector('h2').textContent,
      heading: fold(entry.querySelector('.entry-head').textContent), text: fold((entry.dataset.search || '') + ' ' + entry.textContent)};
  });

  // Map normalized matches back to original Unicode characters across inline markup.
  function highlight(root, query) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
    let text = '', node, normalized = '', offset = 0;
    while ((node = walker.nextNode())) { nodes.push({node, start: text.length}); text += node.data; }
    const starts = [], ends = [];
    for (const ch of text) {
      const f = fold(ch);
      for (let i = 0; i < f.length; i++) { starts.push(offset); ends.push(offset + ch.length); }
      if (!f && ends.length) ends[ends.length - 1] = offset + ch.length;
      normalized += f; offset += ch.length;
    }
    const ranges = [];
    for (let at = normalized.indexOf(query); at !== -1; at = normalized.indexOf(query, at + query.length)) {
      ranges.push([starts[at], ends[at + query.length - 1]]);
    }
    nodes.forEach(({node: n, start}) => {
      const fragment = document.createDocumentFragment();
      let cursor = 0;
      for (const [from, to] of ranges) {
        const a = Math.max(0, from - start), b = Math.min(n.length, to - start);
        if (a >= b) continue;
        fragment.append(document.createTextNode(n.data.slice(cursor, a)));
        const mark = document.createElement('mark'); mark.textContent = n.data.slice(a, b); fragment.append(mark);
        cursor = b;
      }
      if (cursor) { fragment.append(document.createTextNode(n.data.slice(cursor))); n.replaceWith(fragment); }
    });
  }
  function copy(source, query) {
    const node = document.createElement('div');
    source.childNodes.forEach(child => node.append(child.cloneNode(true)));
    node.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    highlight(node, query);
    return node;
  }
  function result(item, query) {
    const card = document.createElement('article'); card.className = 'entry search-result';
    card.dataset.resultFor = item.entry.dataset.entryId;
    const best = item.matches[0], lemma = best?.node.querySelector('strong[lang="la"]');
    if (best?.kind === 'Example or phrase') card.classList.add('search-example');
    const label = document.createElement('p'); label.className = 'eyebrow';
    label.textContent = item.label + ' · ' + (best?.kind || 'Related entry');
    const title = document.createElement('h3'); title.lang = 'la';
    title.textContent = lemma?.textContent || item.entry.querySelector('h3').textContent;
    highlight(title, query); card.append(label, title);
    const snippets = document.createElement('div'); snippets.className = 'search-snippets';
    item.matches.slice(0, 3).forEach((match, i) => {
      const line = copy(match.node, query); line.className = 'search-match';
      if (i === 0 && lemma) {
        line.querySelector('strong[lang="la"]')?.remove();
        if (line.firstChild?.nodeType === Node.TEXT_NODE) line.firstChild.data = line.firstChild.data.replace(/^\s*[—–-]\s*/, '');
      }
      snippets.append(line);
    });
    if (!best) {
      const note = document.createElement('p'); note.className = 'source-note';
      note.textContent = 'Matches ' + (item.heading.includes(query) ? 'this entry’s heading' : 'an alternative search term') + '. Open the full entry for its terms and examples.';
      snippets.append(note);
    }
    card.append(snippets);
    const context = document.createElement('details'); context.className = 'search-context';
    const summary = document.createElement('summary');
    summary.textContent = 'Full entry' + (item.matches.length > 3 ? ' · ' + item.matches.length + ' matching passages' : '');
    context.append(summary);
    context.addEventListener('toggle', () => {
      if (!context.open || context.childElementCount > 1) return;
      const heading = document.createElement('p'); heading.className = 'eyebrow';
      heading.textContent = item.entry.querySelector('.eyebrow').textContent;
      const body = copy(item.entry.querySelector('.entry-body'), query); body.className = 'entry-body';
      body.querySelectorAll('.entry-sources').forEach(source => { if (source.querySelector('mark')) source.open = true; });
      context.append(heading, body);
    });
    card.append(context);
    return card;
  }
  function apply() {
    const query = fold(search.value.trim());
    categoryLabel.textContent = chips.find(chip => chip.dataset.filter === active).textContent;
    // Blurring the search field fires change even when the query is unchanged.
    // Keep result nodes stable so that click still reaches a disclosure/link.
    if (query === renderedQuery && active === renderedCategory) return;
    renderedQuery = query; renderedCategory = active;
    const matching = index.filter(item => (active === 'all' || item.category === active) && (!query || item.text.includes(query)));
    results.hidden = !query; list.replaceChildren();
    entries.forEach(entry => { entry.hidden = !!query || (active !== 'all' && entry.dataset.category !== active); });
    sections.forEach(section => { section.hidden = !!query || !section.querySelector('[data-entry]:not([hidden])'); });
    if (query) {
      const rank = line => line.kind === 'Definition' ? 0 : line.kind === 'Source note' ? 2 : 1;
      matching.forEach(item => {
        item.matches = item.lines.filter(line => line.text.includes(query)).sort((a, b) => rank(a) - rank(b));
        item.rank = item.matches[0]?.kind === 'Definition' ? 0 : item.heading.includes(query) ? 1 : item.matches.length ? 2 : 3;
      });
      matching.sort((a, b) => a.rank - b.rank || a.order - b.order);
      const fragment = document.createDocumentFragment();
      matching.forEach(item => fragment.append(result(item, query))); list.append(fragment);
    }
    const scope = active === 'all' ? '' : ' in ' + categoryLabel.textContent;
    count.textContent = query ? matching.length + ' matching entries' + scope + ' · definitions first' : 'Showing ' + matching.length + ' of ' + entries.length + scope;
    emptyMessage.textContent = active === 'all' ? 'No entries match that search.' : 'No matches' + scope + '.';
    searchAll.hidden = active === 'all' || matching.length > 0;
    empty.style.display = matching.length ? 'none' : 'block';
  }
  function reset() {
    search.value = ''; active = 'all';
    chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === 'all'))); apply();
  }
  // Reveal original targets when following cross-references from search results.
  function reveal(hash) {
    let target;
    try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return; }
    if (target?.closest('[data-category-section]')) { reset(); target.scrollIntoView(); }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) reveal(link.hash);
  });
  window.addEventListener('hashchange', () => reveal(location.hash));
  ['input', 'change', 'search'].forEach(event => search.addEventListener(event, apply));
  chips.forEach(chip => chip.addEventListener('click', () => {
    active = chip.dataset.filter; chips.forEach(other => other.setAttribute('aria-pressed', String(other === chip))); apply();
    if (!desktop.matches) { categoryMenu.open = false; categoryMenu.querySelector('summary').focus(); }
  }));
  clear.addEventListener('click', () => { reset(); search.focus(); });
  searchAll.addEventListener('click', () => {
    active = 'all';
    chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.filter === 'all')));
    apply(); search.focus();
  });
  search.addEventListener('keydown', event => { if (event.key === 'Escape') clear.click(); });
  apply();
})();
