(() => {
  // Live search over the lexicon (assets/search-data.js). The data is fetched once the page has
  // loaded and is idle, so that it is ready before the first letter is typed; the service worker
  // (sw.js) keeps it on the device. Only the first results are drawn, and more on request: drawing
  // thousands of cards for a single letter is what used to make typing slow. It runs on the front
  // page, over every category or the one named by ?cat=, and on each category's page, over that
  // category. The address keeps the query (?q=pyjama), so a search can be linked to. Without
  // scripts the search bar is hidden and the pages' own lists remain. A Latin word is found from
  // any of its forms (piscinam finds piscīna), and when nothing matches, the entries one letter
  // off are offered (pyjams finds pyjamas). i and j are read alike, and u and v (uideo finds videō).
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
  // How many results are drawn at a time; the count line always gives the full number.
  const PAGE = 30;
  let current = null, drawn = 0;
  const more = document.createElement('button');
  more.type = 'button'; more.id = 'more-results'; more.className = 'more-results'; more.hidden = true;
  results.append(more);
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/j/g, 'i').replace(/v/g, 'u');
  // The same without reading j as i or v as u: tv is not tū, though the search finds both.
  const strict = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe');
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
          // Its other English words, each as a whole (TV, telly), so that a query that is one of them
          // ranks with the headword (Jack, 16 November 2026: "tv" found television far down the list).
          item.alts = new Set(String(item.al || '').split(';').map(alt => fold(alt).replace(/\s*\(.*\)$/, '').trim()).filter(Boolean));
          // Each line keeps, beside its whole text, a term's own words (its Latin and its gloss, without
          // its grammar and evidence) and its headword alone (mons, of mōns, montis m.): the ranking
          // tells a word that is the term from a word quoted in its evidence.
          item.lines = item.l.map(line => ({ line, text: fold(line.slice(1).join(' ')),
            own: line[0] === 'd' ? fold(line[1] + ' ' + line[2]) : '',
            head: line[0] === 'd' ? strict(line[1]).split(/[,(]/)[0].replace(/[.!?…]+$/, '').trim() : '' }));
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

  function lineNode(line, query, href, wordHref) {
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
        // Another word of the same entry (magis under “more”) leads to that entry too.
        // A Latin word with a page of its own leads to that page.
        if (kind === 'd' && (wordHref || href)) {
          const a = document.createElement('a'); a.href = wordHref || href; a.className = 'match-link'; a.append(strong);
          p.append(a);
        } else p.append(strong);
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
    label.textContent = data.categories[item.k] + ' · ' + (item.close ? 'Close spelling' : item.cited ? 'Evidence or grammar' : best ? KINDS[best.line[0]] : 'Related entry');
    const lead = best && best.line[0] !== 'n' ? best.line[1]
      : item.la || (item.l.find(line => line[0] === 'd') || [])[1] || item.en;
    if (best && best.line[0] === 'e') card.classList.add('search-example');
    const title = document.createElement('h3'), link = document.createElement('a');
    // The Latin heading leads to its word's page when it has one (Jack, 16 November 2026: a tap
    // on the Latin word opened the English entry); the rest of the card opens the entry.
    const wordOf = line => { const at = item.l.indexOf(line); return item.w && at > -1 && item.w[at] ? up + 'l/' + item.w[at] + '.html' : ''; };
    const leadLine = best && best.line[0] === 'd' ? best.line : (!best || best.line[0] === 'n') && !item.la ? item.l.find(line => line[0] === 'd') : null;
    const entryHref = up + item.u;
    link.href = (leadLine && wordOf(leadLine)) || entryHref; link.lang = 'la'; link.textContent = lead;
    title.append(link); highlight(title, query);
    // The whole card opens the entry, not only its Latin heading: on a phone a tap anywhere on it
    // must work. Selecting text, or a link inside the card, is left alone.
    card.addEventListener('click', event => {
      if (event.target.closest('a') || String(getSelection()) ) return;
      location.href = entryHref;
    });
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
      if (line.slice(1).some(Boolean)) snippets.append(lineNode(line, query, entryHref, match.line[0] === 'd' ? wordOf(match.line) : ''));
    });
    if (!best && !item.close) {
      const note = document.createElement('p'); note.className = 'source-note';
      note.textContent = 'Matches ' + (item.heading.includes(query) ? 'this entry’s heading' : 'an alternative search term') + '.';
      snippets.append(note);
    }
    card.append(label, title, english, snippets);
    return card;
  }

  // The Latin word an entry's card leads with, when the search found the entry by that word:
  // the address of the word's page, or the word itself where it has none. Empty for the rest.
  function wordKey(item) {
    const best = item.matches[0];
    if (!best || best.line[0] !== 'd' || !(item.form || item.byWord)) return '';
    const at = item.l.indexOf(best.line);
    return (item.w && at > -1 && item.w[at]) || fold(best.head || best.line[1]);
  }

  // The card of a Latin word that answers several entries: the word once, then each entry with
  // its English headword, its part of speech, its category, and what the word means there.
  function wordResult(items, query, typed) {
    const first = items[0], best = first.matches[0], at = first.l.indexOf(best.line);
    const wordHref = first.w && at > -1 && first.w[at] ? up + 'l/' + first.w[at] + '.html' : '';
    const card = document.createElement('article');
    card.className = 'search-result search-word'; card.dataset.resultFor = first.id;
    const label = document.createElement('p'); label.className = 'eyebrow';
    label.textContent = `Latin word · ${items.length} entries`;
    const title = document.createElement('h3'), link = document.createElement('a');
    // The fullest dictionary form any of the entries gives (trānsferō, trānsferre, trānstulī, trānslātum).
    const fullest = items.map(item => item.matches[0].line[1]).reduce((a, b) => b.length > a.length ? b : a);
    link.href = wordHref || up + first.u; link.lang = 'la'; link.textContent = fullest;
    title.append(link); highlight(title, query);
    card.append(label, title);
    if (first.form && fold(first.form) !== query) {
      const note = document.createElement('p'); note.className = 'source-note form-of';
      const head = document.createElement('span'); head.lang = 'la'; head.textContent = first.form;
      note.append(`“${typed}” is a form of `, head, '.');
      card.append(note);
    }
    const senses = document.createElement('ul'); senses.className = 'search-senses';
    items.forEach(item => {
      const li = document.createElement('li'); li.dataset.senseFor = item.id;
      const a = document.createElement('a'); a.className = 'sense-link'; a.href = up + item.u;
      const english = document.createElement('span'); english.className = 'sense-en'; english.textContent = item.en;
      a.append(english);
      if (item.pos) {
        const pos = document.createElement('span'); pos.className = 'pos'; pos.textContent = item.pos;
        a.append(' ', pos);
      }
      const where = document.createElement('span'); where.className = 'sense-cat'; where.textContent = data.categories[item.k];
      a.append(' ', where);
      // What the word means in this entry, where the entry says more than its headword.
      const gloss = item.matches[0].line[2];
      if (gloss && fold(gloss) !== fold(item.en)) {
        const says = document.createElement('span'); says.className = 'sense-gloss'; says.textContent = gloss;
        a.append(says);
      }
      highlight(a, query);
      li.append(a); senses.append(li);
    });
    card.append(senses);
    card.addEventListener('click', event => {
      if (event.target.closest('a') || String(getSelection())) return;
      location.href = wordHref || up + first.u;
    });
    return card;
  }

  function show(searching) {
    results.hidden = !searching;
    if (view) view.hidden = searching;
  }

  // While the data is on its way, the rule under the field moves and the status line says so.
  function busy(on) { form.classList.toggle('loading', on); }

  // Draw the next results of the current search.
  function draw() {
    const { cards, firstInside, inside, query, typed } = current;
    const fragment = document.createDocumentFragment();
    const end = Math.min(cards.length, drawn + PAGE);
    for (let index = drawn; index < end; index++) {
      if (index === firstInside) {
        const divide = document.createElement('h2'); divide.className = 'results-divide';
        divide.textContent = `Inside longer words: ${inside}`;
        fragment.append(divide);
      }
      const items = cards[index].items;
      fragment.append(items.length > 1 ? wordResult(items, query, typed) : result(items[0], query, typed));
    }
    drawn = end;
    list.append(fragment);
    const left = cards.length - drawn;
    more.hidden = !left;
    more.textContent = left ? `Show ${Math.min(PAGE, left)} more · ${left.toLocaleString("en")} not shown` : '';
    window.lexiconDisplay?.render(list);
  }

  function apply() {
    const typed = search.value.trim(), query = fold(typed);
    remember(typed);
    if (!query) {
      rendered = null; current = null; drawn = 0; more.hidden = true; busy(false); show(false); list.replaceChildren();
      count.textContent = resting; empty.style.display = 'none';
      return;
    }
    if (!data) {
      count.textContent = 'Loading the lexicon…'; busy(true);
      load().then(apply, () => { busy(false); count.textContent = 'The search could not load. Check the connection and try again.'; loading = null; });
      return;
    }
    busy(false);
    // What was typed, not only what it folds to: tu and tv are one search and two orders.
    if (strict(typed) + '|' + scope === rendered) return;
    rendered = strict(typed) + '|' + scope;
    // A term that has the query in its own words comes before an example, and an example before a
    // term that has it only in its grammar or evidence (Jack, 19 November 2026: mons found summus,
    // tendō, immānis, and Appennīnus, each for a quotation with mōns in it, before mōns itself).
    const rank = line => line.line[0] === 'd' ? (line.own.includes(query) ? 0 : 1.5) : ({ e: 1, n: 2 })[line.line[0]];
    const inScope = item => !scope || item.k === scope || (item.x || []).includes(scope);
    const forms = formsOf(query);
    const whole = new RegExp('(^|[^a-z0-9])' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
    const written = strict(typed);
    let matching = data.items.filter(item => inScope(item) && (item.text.includes(query) || forms.has(item)));
    matching.forEach(item => {
      item.close = false; item.cited = false;
      item.form = forms.get(item) || null;
      let led = false;
      item.matches = item.lines.filter(line => line.text.includes(query)).sort((a, b) => rank(a) - rank(b));
      // A form of one of the record's terms leads with that term.
      if (item.form) {
        const answer = item.lines.find(line => line.line[0] === 'd' && line.text.startsWith(fold(item.form)));
        if (answer) { item.matches = [answer, ...item.matches.filter(line => line !== answer)]; led = true; }
      }
      const heading = item.heading.includes(query);
      // A record's answer doesn't repeat its headword; a match on the headword finds the answer.
      // The record's own answer leads, even when another of its terms also matches (soap: sāpō
      // before sāpōnis quadrula, "a bar of soap").
      if (heading && item.id.startsWith('c-') && !item.form) {
        const answer = item.lines.find(line => line.line[0] === 'd');
        if (answer) { if (item.matches[0] !== answer) item.matches = [answer, ...item.matches.filter(line => line !== answer)]; led = true; }
      }
      // The query is the headword of one of the record's terms, whole: that term leads. It is the
      // word as typed (tu is tū), or as typed by a reader who writes i for j and u for v (iam is
      // jam, uideo is videō); failing those, whatever folds to the same letters (tv and tū).
      const typedAs = line => line.head === written || (line.head && fold(line.head) === written);
      const word = item.lines.find(typedAs) || item.lines.find(line => line.head && fold(line.head) === query);
      if (word) { item.matches = [word, ...item.matches.filter(line => line !== word)]; item.form = null; }
      item.byWord = Boolean(word);
      const first = item.matches[0];
      const definition = first?.line[0] === 'd' && (led || first.own.includes(query));
      item.cited = first?.line[0] === 'd' && !definition;
      // The headword itself (soap, or soap with a sense) before longer ones that contain it (soap bubble).
      const exact = item.heading === query || item.heading.startsWith(query + ' (');
      item.rank = definition && heading ? (exact ? 0 : 1) : definition ? 2 : heading ? 3 : item.matches.length ? 4 : 5;
      // A term that has the query as a word of its own (mōns ignivomus) before one that has it only
      // inside a longer word (monstrous, in the gloss of immānis).
      if (item.rank === 2 && !led && !whole.test(first.own)) item.rank = 2.5;
      // The query is one of the entry's other words, whole: it ranks just after the headword itself.
      // Its card still leads with the answer and says it matched an alternative search term.
      if (item.alts.has(query) && item.rank > 0) item.rank = 0.5;
      // A Latin form (piscinam) comes after the English headwords and before matches inside entries.
      if (item.form && item.rank > 1) item.rank = 1.5;
      // The Latin word itself ranks with the English headword itself: first where it is the record's
      // answer, then where it is one of the record's other words.
      // A word found only by reading a typed v as u (tv, tū) comes after the English word typed whole (TV).
      if (word) item.rank = Math.min(item.rank, (word === item.lines.find(line => line.line[0] === 'd') ? 0 : 0.5) + (typedAs(word) ? 0 : 0.6));
    });
    // The word itself (ship) before the entries that only have it inside a longer word (relationship, worship).
    matching.forEach(item => { item.whole = Boolean(item.form) || whole.test(item.text); });
    matching.sort((a, b) => b.whole - a.whole || a.rank - b.rank || a.order - b.order);
    const inside = matching.some(item => item.whole) ? matching.filter(item => !item.whole).length : 0;
    // Nothing matches: offer the entries one letter off (piscnia, pyjams).
    const close = !matching.length;
    if (close) {
      matching = closeTo(query, inScope);
      matching.forEach(item => {
        item.close = true; item.form = null; item.cited = false; item.byWord = false;
        const answer = item.lines.find(line => line.line[0] === 'd');
        item.matches = answer ? [answer] : [];
      });
    }
    // One card for a Latin word that answers several entries (Jack, 23 November 2026: "transfer"
    // found trānsferō four times, once for each entry it stands in, each with the same heading and
    // another category). The entries that lead with the same Latin word, found by that word or a
    // form of it, share a card at the place of the first of them; it lists them. Everything else
    // keeps a card of its own. The wording and the look of the shared card are Claude's, for Jack
    // to judge.
    const cards = [], shared = new Map();
    matching.forEach(item => {
      const key = close ? '' : wordKey(item), card = key && shared.get(key);
      if (card) { card.items.push(item); return; }
      const made = { items: [item] };
      if (key) shared.set(key, made);
      cards.push(made);
    });
    const firstInside = inside ? cards.findIndex(card => !card.items[0].whole) : -1;
    current = { cards, firstInside, inside, close, query, typed }; drawn = 0;
    list.replaceChildren();
    draw();
    show(true);
    const where = scope ? ' in ' + data.categories[scope] : '';
    count.textContent = close && matching.length
      ? `No exact matches${where} · ${matching.length} with a close spelling`
      : `${matching.length - inside} matching ${matching.length - inside === 1 ? 'entry' : 'entries'}${where}`
        + (inside ? ` · ${inside} more inside longer words` : '') + ' · definitions first';
    emptyMessage.textContent = scope ? 'No matches' + where + '.' : 'No entries match that search.';
    searchAll.hidden = !scope || matching.length > 0;
    empty.style.display = matching.length ? 'none' : 'block';
  }

  // The address follows the query, so that a search can be bookmarked or sent. While a word is
  // being typed the address is rewritten in place. A search the reader has looked at becomes a
  // step of its own in the browser's history when the next one begins, so that Back leads from
  // the second search to the first and not off the site (Jack, 19 November 2026: Back took him
  // to another website, where he expected the word he had searched for before). A search counts
  // as looked at when the page opened with it, when Enter is pressed, when its results are
  // clicked, or when it has stood for LOOKED milliseconds with something found. Typing on from it
  // (tow, towel) is the same search, not a new step. The rule and the number are Claude's, for
  // Jack to judge.
  const LOOKED = 1200;
  let timer, looking, held = (params.get('q') || '').trim(), looked = Boolean(held);
  function write(typed) {
    clearTimeout(timer);
    const next = new URLSearchParams();
    if (typed) next.set('q', typed);
    if (typed && scope && !page) next.set('cat', scope);
    const url = location.pathname + (next.toString() ? '?' + next : '');
    if (url !== location.pathname + location.search) {
      const step = looked && !fold(typed).startsWith(fold(held));
      history[step ? 'pushState' : 'replaceState'](null, '', url);
      looked = false;
    }
    held = typed;
    clearTimeout(looking);
    if (!looked && typed) looking = setTimeout(look, LOOKED);
  }
  function look() {
    if (!data) looking = setTimeout(look, LOOKED);
    else if (current && !current.close && current.query === fold(held)) looked = true;
  }
  function remember(typed) {
    clearTimeout(timer);
    timer = setTimeout(() => write(typed), 250);
  }
  // The reader has acted on the search as it stands: its address is written at once.
  function settle() {
    write(search.value.trim());
    clearTimeout(looking);
    looked = Boolean(held);
  }
  // Back or Forward between two searches made on this page: show the one the address names.
  addEventListener('popstate', () => {
    const now = new URLSearchParams(location.search);
    clearTimeout(timer); clearTimeout(looking);
    search.value = now.get('q') || '';
    if (!page) scope = now.get('cat') || '';
    held = search.value.trim(); looked = Boolean(held);
    rendered = null;
    apply();
  });
  results.addEventListener('click', settle, true);

  form.addEventListener('submit', event => { event.preventDefault(); apply(); settle(); });
  ['input', 'search'].forEach(event => search.addEventListener(event, apply));
  more.addEventListener('click', () => { if (current) draw(); });
  // The data is fetched as soon as the page is idle (or at the first focus, if that comes sooner),
  // unless the reader has asked the browser to save data; then it waits for the first search.
  const warm = () => { load().catch(() => { loading = null; }); };
  search.addEventListener('focus', warm, { once: true });
  if (!navigator.connection?.saveData) {
    const idle = () => (window.requestIdleCallback ? requestIdleCallback(warm, { timeout: 2000 }) : setTimeout(warm, 300));
    if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
  }
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
