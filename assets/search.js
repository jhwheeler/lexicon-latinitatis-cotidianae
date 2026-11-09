(() => {
  // Live search over the lexicon (assets/search-data.js, loaded on first use). It runs on the front
  // page, over every category or the one named by ?cat=, and on each category's page, over that
  // category. The address keeps the query (?q=pyjama), so a search can be linked to. Without
  // scripts the search bar is hidden and the pages' own lists remain. A Latin word is found from
  // any of its forms (piscinam finds piscīna), and when nothing matches, the entries one letter
  // off are offered (pyjams finds pyjamas).
  const search = document.getElementById('search');
  if (!search) return;
  const form = search.form, clear = document.getElementById('clear');
  const count = document.getElementById('results'), empty = document.getElementById('empty');
  const emptyMessage = document.getElementById('empty-message'), searchAll = document.getElementById('search-all');
  const results = document.getElementById('search-results'), list = document.getElementById('search-result-list');
  const page = document.querySelector('[data-category]');
  const view = document.getElementById('contents') || document.getElementById('category-view');
  const up = page ? '../' : '';
  const params = new URLSearchParams(location.search);
  let scope = page ? page.dataset.category : (params.get('cat') || '');
  const resting = count.textContent;
  let data = null, loading = null, rendered = null;
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/j/g, 'i');
  const KINDS = { d: 'Definition', e: 'Example or phrase', n: 'Source note' };
  const stems = new Map();

  function load() {
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = up + 'assets/search-data.js';
      script.onload = () => {
        data = window.lexiconData;
        data.items.forEach((item, order) => {
          item.order = order;
          item.heading = fold(item.en);
          item.lines = item.l.map(line => ({ line, text: fold(line.slice(1).join(' ')) }));
          item.text = fold([item.en, item.la, item.al].join(' ')) + ' ' + item.lines.map(l => l.text).join(' ');
          // The names a misspelling is measured against: the headword, its other English words, its Latin terms.
          item.names = [item.heading.replace(/\s*\(.*\)$/, ''), ...String(item.al || '').split(';').map(fold),
            ...item.lines.filter(l => l.line[0] === 'd').map(l => fold(l.line[1]).split(/[,(]/)[0])].map(n => n.trim()).filter(Boolean);
          // Each term's stems, by the class of endings they take: [head, class, stem, class, stem…]
          (item.f || []).forEach(([head, ...pairs]) => {
            for (let i = 0; i < pairs.length; i += 2) {
              const key = pairs[i] + '|' + pairs[i + 1];
              if (!stems.has(key)) stems.set(key, []);
              stems.get(key).push({ item, head });
            }
          });
        });
        resolve(data);
      };
      script.onerror = reject;
      document.head.append(script);
    });
    return loading;
  }

  // The terms a typed Latin word is a form of (piscinam → piscīna, dixit → dīcō): take each ending
  // its class allows off the word, and look up what is left among the terms' stems.
  function formsOf(query) {
    const found = new Map();
    if (!/^[a-z]{3,}$/.test(query)) return found;
    for (const [cls, endings] of Object.entries(data.endings)) {
      for (const ending of endings) {
        if (!query.endsWith(ending)) continue;
        for (const hit of stems.get(cls + '|' + query.slice(0, query.length - ending.length)) || []) {
          if (!found.has(hit.item)) found.set(hit.item, hit.head);
        }
      }
    }
    return found;
  }

  // Letters apart, counting a swap of two neighbours as one (optimal string alignment); stops past max.
  function distance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let before = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      let least = i;
      for (let j = 1; j <= b.length; j++) {
        let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (before && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, before[j - 2] + 1);
        row.push(d); least = Math.min(least, d);
      }
      if (least > max) return max + 1;
      before = prev; prev = row;
    }
    return prev[b.length];
  }

  // When nothing matches: the entries whose names are one letter off (two in a long word).
  function closeTo(query, inScope) {
    if (query.length < 4) return [];
    const max = query.length >= 8 ? 2 : 1;
    return data.items.filter(inScope)
      .map(item => [Math.min(...item.names.map(name => distance(name, query, max))), item])
      .filter(([d]) => d <= max)
      .sort((a, b) => a[0] - b[0] || a[1].order - b[1].order)
      .map(([, item]) => item);
  }

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

  function lineNode(line, query) {
    const [kind, latin, english, meta] = line;
    const p = document.createElement('p');
    p.className = 'search-match' + (kind === 'n' ? ' source-note' : '');
    if (kind === 'n') {
      p.textContent = latin;
    } else {
      if (latin) {
        const strong = document.createElement('strong');
        strong.lang = 'la'; strong.textContent = latin;
        if (kind === 'e') strong.className = 'ex-la';
        p.append(strong);
      }
      if (english) p.append((latin ? ' — ' : '') + english);
      if (meta) {
        const span = document.createElement('span');
        span.className = kind === 'e' ? 'src' : 'rec-meta'; span.textContent = meta;
        p.append(' ', span);
      }
    }
    highlight(p, query);
    return p;
  }

  function result(item, query, typed) {
    const card = document.createElement('article');
    card.className = 'search-result'; card.dataset.resultFor = item.id;
    const best = item.matches[0];
    const label = document.createElement('p'); label.className = 'eyebrow';
    label.textContent = data.categories[item.k] + ' · ' + (item.close ? 'Close spelling' : best ? KINDS[best.line[0]] : 'Related entry');
    const lead = best && best.line[0] !== 'n' ? best.line[1]
      : item.la || (item.l.find(line => line[0] === 'd') || [])[1] || item.en;
    if (best && best.line[0] === 'e') card.classList.add('search-example');
    const title = document.createElement('h3'), link = document.createElement('a');
    link.href = up + item.u; link.lang = 'la'; link.textContent = lead;
    title.append(link); highlight(title, query);
    const english = document.createElement('p'); english.className = 'r-en'; english.textContent = item.en;
    if (item.pos) {
      const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = item.pos;
      english.append(' ', pos);
    }
    highlight(english, query);
    const snippets = document.createElement('div'); snippets.className = 'search-snippets';
    if (item.form && fold(item.form) !== query) {
      // piscinam: “piscinam” is a form of piscīna.
      const note = document.createElement('p'); note.className = 'source-note form-of';
      const head = document.createElement('span'); head.lang = 'la'; head.textContent = item.form;
      note.append(`“${typed}” is a form of `, head, '.');
      snippets.append(note);
    }
    item.matches.slice(0, 3).forEach((match, i) => {
      const line = match.line.slice();
      if (i === 0 && line[0] !== 'n' && line[1] === lead) line[1] = '';
      if (line.slice(1).some(Boolean)) snippets.append(lineNode(line, query));
    });
    if (!best && !item.close) {
      const note = document.createElement('p'); note.className = 'source-note';
      note.textContent = 'Matches ' + (item.heading.includes(query) ? 'this entry’s heading' : 'an alternative search term') + '.';
      snippets.append(note);
    }
    card.append(label, title, english, snippets);
    return card;
  }

  function show(searching) {
    results.hidden = !searching;
    if (view) view.hidden = searching;
  }

  function apply() {
    const typed = search.value.trim(), query = fold(typed);
    remember(typed);
    if (!query) {
      rendered = null; show(false); list.replaceChildren();
      count.textContent = resting; empty.style.display = 'none';
      return;
    }
    if (!data) {
      count.textContent = 'Searching…';
      load().then(apply, () => { count.textContent = 'The search could not load.'; });
      return;
    }
    if (query + '|' + scope === rendered) return;
    rendered = query + '|' + scope;
    const rank = line => ({ d: 0, e: 1, n: 2 })[line.line[0]];
    const inScope = item => !scope || item.k === scope || (item.x || []).includes(scope);
    const forms = formsOf(query);
    let matching = data.items.filter(item => inScope(item) && (item.text.includes(query) || forms.has(item)));
    matching.forEach(item => {
      item.close = false;
      item.form = forms.get(item) || null;
      item.matches = item.lines.filter(line => line.text.includes(query)).sort((a, b) => rank(a) - rank(b));
      // A form of one of the record's terms leads with that term.
      if (item.form) {
        const answer = item.lines.find(line => line.line[0] === 'd' && line.text.startsWith(fold(item.form)));
        if (answer) item.matches = [answer, ...item.matches.filter(line => line !== answer)];
      }
      const heading = item.heading.includes(query);
      // A record's answer doesn't repeat its headword; a match on the headword finds the answer.
      if (heading && item.id.startsWith('c-') && item.matches[0]?.line[0] !== 'd') {
        const answer = item.lines.find(line => line.line[0] === 'd');
        if (answer) item.matches = [answer, ...item.matches.filter(line => line !== answer)];
      }
      const definition = item.matches[0]?.line[0] === 'd';
      // The headword itself (soap, or soap with a sense) before longer ones that contain it (soap bubble).
      const exact = item.heading === query || item.heading.startsWith(query + ' (');
      item.rank = definition && heading ? (exact ? 0 : 1) : definition ? 2 : heading ? 3 : item.matches.length ? 4 : 5;
      // A Latin form (piscinam) comes after the English headwords and before matches inside entries.
      if (item.form && item.rank > 1) item.rank = 1.5;
    });
    matching.sort((a, b) => a.rank - b.rank || a.order - b.order);
    // Nothing matches: offer the entries one letter off (piscnia, pyjams).
    const close = !matching.length;
    if (close) {
      matching = closeTo(query, inScope);
      matching.forEach(item => {
        item.close = true; item.form = null;
        const answer = item.lines.find(line => line.line[0] === 'd');
        item.matches = answer ? [answer] : [];
      });
    }
    const fragment = document.createDocumentFragment();
    matching.forEach(item => fragment.append(result(item, query, typed)));
    list.replaceChildren(fragment);
    show(true);
    const where = scope ? ' in ' + data.categories[scope] : '';
    count.textContent = close && matching.length
      ? `No exact matches${where} · ${matching.length} with a close spelling`
      : `${matching.length} matching ${matching.length === 1 ? 'entry' : 'entries'}${where} · definitions first`;
    emptyMessage.textContent = scope ? 'No matches' + where + '.' : 'No entries match that search.';
    searchAll.hidden = !scope || matching.length > 0;
    empty.style.display = matching.length ? 'none' : 'block';
    window.lexiconDisplay?.render(list);
  }

  // The address follows the query, so that a search can be bookmarked or sent.
  let timer;
  function remember(typed) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const next = new URLSearchParams();
      if (typed) next.set('q', typed);
      if (typed && scope && !page) next.set('cat', scope);
      const url = location.pathname + (next.toString() ? '?' + next : '');
      if (url !== location.pathname + location.search) history.replaceState(null, '', url);
    }, 250);
  }

  form.addEventListener('submit', event => { event.preventDefault(); apply(); });
  ['input', 'search'].forEach(event => search.addEventListener(event, apply));
  search.addEventListener('focus', () => { load().catch(() => {}); }, { once: true });
  search.addEventListener('keydown', event => { if (event.key === 'Escape') clear.click(); });
  clear.addEventListener('click', () => { search.value = ''; apply(); search.focus(); });
  searchAll.addEventListener('click', () => {
    if (page) { location.href = up + 'index.html?q=' + encodeURIComponent(search.value.trim()); return; }
    scope = ''; rendered = null; apply(); search.focus();
  });
  // A change of display (macrons, j or i) redraws the results.
  document.addEventListener('lexicon-display', () => { rendered = null; apply(); });
  if (params.get('q')) { search.value = params.get('q'); apply(); }
})();
