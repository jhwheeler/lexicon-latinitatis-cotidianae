(() => {
  // Vocabulary practice (Jack, 13 November 2026): an English cue, the Latin to say aloud, then the
  // answer and a mark, "Got it" or "Again". The cards are the lexicon's own records
  // (assets/practice-data.js, one card per record). Vocabulary is the primary thing and phrases
  // are secondary, so the deck starts as the words. The reader narrows it by kind, part of speech,
  // category, source, the entries looked up and the reader's own lists: within a group the choices add up,
  // between groups they narrow, and a group with nothing chosen does not narrow. Everything the
  // reader does stays on the device: progress, the choices, the entries looked up (recorded by
  // page.js) and the lists.
  const root = document.getElementById('practice'), data = window.lexiconPractice;
  if (!root || !data) return;
  const q = id => document.getElementById(id);
  const KINDS = [['w', 'Words'], ['p', 'Everyday phrases'], ['s', 'Sayings and quotations']];
  // Part of speech, as in the drill in Jack's hub (13 November 2026): a choice among the words. A
  // record that is two things (noun and verb) counts under each; a phrase has no part of speech
  // to choose by, so this group leaves the phrases as they are.
  const PARTS = [['n', 'Nouns'], ['v', 'Verbs'], ['a', 'Adjectives'], ['d', 'Adverbs'], ['o', 'Other']];
  const PART_OF = { noun: 'n', verb: 'v', adjective: 'a', adverb: 'd' };
  // The Leitner boxes of the drill in Jack's hub, so that progress moves between the two: a card
  // waits 10 minutes, 1 hour, 1, 3, 7, 16, 35 days as it climbs; "Again" sends it back to the first
  // box; a new card that is right first time starts in the third. "Known" is three days or more.
  const ROUND = 12, KNOWN = 3, TOP = 6, HOUR = 3600e3, DAY = 24 * HOUR;
  const WAIT = [HOUR / 6, HOUR, DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
  const KEY = { progress: 'lexicon-practice', deck: 'lexicon-practice-deck', seen: 'lexicon-seen', lists: 'lexicon-lists' };
  const number = n => n.toLocaleString('en');
  const plural = (n, one, many) => `${number(n)} ${n === 1 ? one : many}`;
  // As the search folds what is typed: no macrons, i for j, u for v.
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/j/g, 'i').replace(/v/g, 'u');
  const english = s => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  // The dictionary headword of a term: "caccabus" in "caccabus (cacabus), caccabī m.".
  const headOf = latin => /^(.+?)(?=\s*(?:,|\(|$))/.exec(latin)[1];

  // Storage may be blocked (private windows, some embedded browsers): the page then works for the
  // visit and says that nothing is kept.
  let saving = true;
  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value === null || typeof value !== 'object' ? fallback : value; } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { saving = false; }
    q('p-saved').hidden = saving;
  }

  // The cards ------------------------------------------------------------------------------------
  const cards = data.cards, byId = new Map(), byEnglish = new Map(), byLatin = new Map();
  const index = (map, key, card) => { if (key) map.set(key, (map.get(key) || []).concat(card)); };
  cards.forEach(card => {
    card.kind = card.t || 'w';
    card.parts = [...new Set((card.p || '').split(' and ').map(part => PART_OF[part] || 'o'))];
    card.cats = [card.k].concat(card.x || []);
    card.head = headOf(card.l);
    byId.set(card.i, card);
    // A list item finds a record by its English headword, with or without the sense in brackets.
    const full = english(card.e), bare = full.replace(/\s*\([^()]*\)$/, '');
    index(byEnglish, full, card);
    if (bare !== full) index(byEnglish, bare, card);
    index(byLatin, fold(card.head), card);
  });
  const sources = data.sources;

  // Progress: one record per card, {b: box, due: when it comes back, t: when it was marked}.
  function sane(record) {
    if (!record || typeof record !== 'object' || !Number.isFinite(record.b) || !Number.isFinite(record.due)) return null;
    return { b: Math.max(-1, Math.min(TOP, Math.round(record.b))), due: Math.max(0, record.due), t: Number.isFinite(record.t) ? record.t : 0 };
  }
  const progress = { cards: {}, at: 0 };
  {
    const kept = read(KEY.progress, {});
    Object.entries(kept.cards && typeof kept.cards === 'object' ? kept.cards : {}).forEach(([id, record]) => {
      if (sane(record)) progress.cards[id] = sane(record);
    });
    progress.at = Number.isFinite(kept.at) ? kept.at : 0;
  }
  const rec = id => { const record = progress.cards[id]; return record && record.b >= 0 ? record : null; };
  const box = id => (rec(id) ? rec(id).b : -1);
  const save = () => { progress.at = Date.now(); write(KEY.progress, progress); };

  // Words I looked up: page.js records each entry opened, {id: when}.
  const seen = new Set(Object.keys(read(KEY.seen, {})).filter(id => byId.has(id)));

  // My lists: a name and the items as they were pasted. They are matched to the records each time
  // the page opens, so an item finds its entry once the lexicon has one.
  let lists = [];
  function matchItem(item) {
    const id = item.toLowerCase();
    if (byId.has(id)) return [byId.get(id)];
    const full = english(item);
    return byEnglish.get(full) || byEnglish.get(full.replace(/\s*\([^()]*\)$/, '')) || byLatin.get(fold(item.trim())) || [];
  }
  function makeList(id, name, items) {
    const ids = new Set(), missed = [];
    items.forEach(item => { const found = matchItem(item); if (found.length) found.forEach(card => ids.add(card.i)); else missed.push(item); });
    return { id, name, items, ids, missed };
  }
  const splitItems = text => [...new Set(String(text).split(/[\n,]/).map(item => item.replace(/\s+/g, ' ').trim()).filter(Boolean))];
  {
    const kept = read(KEY.lists, []);
    (Array.isArray(kept) ? kept : []).forEach(list => {
      if (list && typeof list.id === 'string' && typeof list.name === 'string' && Array.isArray(list.items)) {
        lists.push(makeList(list.id, list.name, list.items.filter(item => typeof item === 'string')));
      }
    });
  }
  const saveLists = () => write(KEY.lists, lists.map(({ id, name, items }) => ({ id, name, items })));

  // The deck: what is chosen in each group ------------------------------------------------------------
  const deck = { kind: ['w'], part: [], cat: [], src: [], mine: [] };
  const mineIds = () => ['seen'].concat(lists.map(list => 'list:' + list.id));
  function tidyDeck() {
    const known = { kind: KINDS.map(k => k[0]), part: PARTS.map(p => p[0]), cat: data.categories.map(c => c[0]), src: sources.map(s => s.id), mine: mineIds() };
    Object.keys(deck).forEach(group => { deck[group] = deck[group].filter(id => known[group].includes(id)); });
    if (!deck.kind.length) deck.kind = ['w'];   // the kind is always chosen: words unless the reader says otherwise
  }
  {
    const kept = read(KEY.deck, {});
    Object.keys(deck).forEach(group => { if (Array.isArray(kept[group])) deck[group] = kept[group].filter(id => typeof id === 'string'); });
    tidyDeck();
  }
  const sourceNumber = new Map(sources.map((source, n) => [source.id, n]));
  const mineSet = id => (id === 'seen' ? seen : (lists.find(list => 'list:' + list.id === id) || { ids: new Set() }).ids);
  const tests = {
    kind: card => deck.kind.includes(card.kind),
    part: card => !deck.part.length || card.kind !== 'w' || card.parts.some(part => deck.part.includes(part)),
    cat: card => !deck.cat.length || card.cats.some(cat => deck.cat.includes(cat)),
    src: card => !deck.src.length || (card.s || []).some(n => deck.src.includes(sources[n].id)),
    mine: card => !deck.mine.length || deck.mine.some(id => mineSet(id).has(card.i))
  };
  const GROUPS = Object.keys(tests);
  let pool = [];

  // The toggles -------------------------------------------------------------------------------------
  const toggles = [];   // {group, id, button, count}
  function toggle(group, id, label, extra) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.group = group; button.dataset.id = id;
    const name = document.createElement('span');
    name.className = 'pt-name';
    name.append(label);
    const count = document.createElement('span');
    count.className = 'pt-n';
    button.append(name, ...(extra ? [extra] : []), count);
    button.addEventListener('click', () => choose(group, id));
    toggles.push({ group, id, button, count });
    return button;
  }
  const span = (className, text, lang) => { const el = document.createElement('span'); el.className = className; el.textContent = text; if (lang) el.lang = lang; return el; };
  function choose(group, id) {
    const chosen = deck[group], at = chosen.indexOf(id);
    if (at < 0) chosen.push(id); else if (group !== 'kind' || chosen.length > 1) chosen.splice(at, 1);
    write(KEY.deck, deck);
    refresh();
  }
  function drawToggles() {
    q('p-kind').replaceChildren(...KINDS.map(([id, label]) => toggle('kind', id, label)));
    q('p-part').replaceChildren(...PARTS.map(([id, label]) => toggle('part', id, label)));
    q('p-cat').replaceChildren(...data.categories.map(([id, latin, name]) => toggle('cat', id, span('pt-la', latin, 'la'), span('pt-en', name))));
    q('p-src').replaceChildren(...sources.filter(source => source.of === undefined).map(source => toggle('src', source.id, source.name)));
    // The works stand under their author's name, apart from the authors: choosing "Vergil" already
    // takes all of his, so a work is chosen in his place, not beside him.
    const works = [];
    sources.forEach((source, n) => {
      const mine = sources.filter(work => work.of === n);
      if (!mine.length) return;
      const group = document.createElement('div');
      group.className = 'pworks-author';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', source.name);
      group.append(span('pworks-name', source.name), ...mine.map(work => toggle('src', work.id, work.la ? span('', work.name, 'la') : work.name)));
      works.push(group);
    });
    q('p-works').replaceChildren(...works);
    q('p-works').parentElement.hidden = !works.length;
    drawMine();
  }
  let armed = '';
  function drawMine() {
    for (let i = toggles.length - 1; i >= 0; i--) if (toggles[i].group === 'mine') toggles.splice(i, 1);
    const rows = [toggle('mine', 'seen', 'Words I looked up')];
    if (!seen.size) rows.push(span('p-help pmine-note', 'Open an entry of the lexicon and it is remembered here, on this device.'));
    lists.forEach(list => {
      const row = document.createElement('div');
      row.className = 'pmine-list';
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'p-delete'; remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete the list ${list.name}`);
      // Two taps, not a dialog: the first asks, the second deletes.
      remove.addEventListener('click', () => {
        if (armed !== list.id) {
          armed = list.id; remove.textContent = 'Tap again to delete';
          setTimeout(() => { if (armed === list.id) { armed = ''; remove.textContent = 'Delete'; } }, 4000);
          return;
        }
        armed = '';
        lists = lists.filter(other => other !== list);
        saveLists(); tidyDeck(); write(KEY.deck, deck); drawMine(); refresh();
      });
      row.append(toggle('mine', 'list:' + list.id, list.name), remove);
      rows.push(row);
      if (list.missed.length) rows.push(span('p-help pmine-note', `Not found in the lexicon: ${list.missed.join(', ')}`));
    });
    q('p-mine').replaceChildren(...rows);
  }
  const names = { kind: id => KINDS.find(k => k[0] === id)[1], part: id => PARTS.find(p => p[0] === id)[1], cat: id => data.categories.find(c => c[0] === id)[1],
    src: id => { const source = sources[sourceNumber.get(id)]; return source.of === undefined ? source.name : `${sources[source.of].name}, ${source.name}`; },
    mine: id => (id === 'seen' ? 'Words I looked up' : (lists.find(list => 'list:' + list.id === id) || {}).name) };
  // Each toggle shows how many cards it would give with the other groups as they are, so a count
  // beside "Cicero" is Cicero within the kind and the categories already chosen.
  function drawDeck() {
    const tally = {}, mine = mineIds();
    GROUPS.forEach(group => { tally[group] = new Map(); });
    const keys = {
      kind: card => [card.kind], part: card => (card.kind === 'w' ? card.parts : []), cat: card => card.cats, src: card => (card.s || []).map(n => sources[n].id),
      mine: card => mine.filter(id => mineSet(id).has(card.i))
    };
    pool = [];
    cards.forEach(card => {
      const failed = GROUPS.filter(group => !tests[group](card));
      if (!failed.length) pool.push(card);
      if (failed.length > 1) return;
      (failed.length ? failed : GROUPS).forEach(group => keys[group](card).forEach(key => tally[group].set(key, (tally[group].get(key) || 0) + 1)));
    });
    toggles.forEach(({ group, id, button, count }) => {
      const n = tally[group].get(id) || 0, pressed = deck[group].includes(id);
      button.setAttribute('aria-pressed', String(pressed));
      count.textContent = number(n);
      button.classList.toggle('none', !n && !pressed);
    });
    // The parts of speech are a choice among the words: without the words they have nothing to narrow.
    const words = deck.kind.includes('w');
    q('p-part-line').hidden = !words;
    const listed = group => (group === 'part' && !words ? '' : deck[group].map(names[group]).join(', '));
    q('p-cat-now').textContent = listed('cat') || 'any';
    q('p-src-now').textContent = listed('src') || 'any';
    q('p-mine-now').textContent = listed('mine') || 'not chosen';
    q('p-now').textContent = GROUPS.map(listed).filter(Boolean).join(' · ');
    q('p-clear').hidden = !(deck.part.length || deck.cat.length || deck.src.length || deck.mine.length);
    window.lexiconDisplay?.render(q('p-deck'));
  }
  function drawCount() {
    const now = Date.now(), due = dueIn(pool, now), fresh = pool.filter(card => !rec(card.i)).length;
    q('p-count').textContent = `${plural(pool.length, 'card', 'cards')} · ${number(due)} due now · ${number(fresh)} new`;
  }
  // The deck changed (a choice, a list, an import): count it again and start a round from it.
  function refresh() {
    drawDeck();
    newRound(false);
  }

  // Rounds: the cards that are due, the longest overdue first, then new ones in no order; twelve to
  // a round, and one card for each Latin headword (guard and security officer are both custōs).
  const round = { queue: [], current: null, shown: false, got: 0, again: 0, size: 0, last: '' };
  const dueIn = (list, now) => list.filter(card => rec(card.i) && rec(card.i).due <= now).length;
  function shuffled(list) {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  }
  function newRound(early) {
    const now = Date.now(), byDue = (a, b) => rec(a.i).due - rec(b.i).due;
    const pick = early ? pool.filter(card => rec(card.i)).sort(byDue)
      : pool.filter(card => rec(card.i) && rec(card.i).due <= now).sort(byDue).concat(shuffled(pool.filter(card => !rec(card.i))));
    const heads = new Set();
    round.queue = pick.filter(card => !heads.has(card.head) && heads.add(card.head)).slice(0, ROUND);
    if (round.queue.length > 1 && round.queue[0].i === round.last) round.queue.push(round.queue.shift());
    round.size = round.queue.length; round.got = 0; round.again = 0;
    if (round.queue.length) next(); else rest(false);
  }
  function show(...visible) {
    ['p-back', 'p-front', 'p-marks', 'p-end', 'p-keys'].forEach(id => { q(id).hidden = !visible.includes(id); });
  }
  function next() {
    round.current = round.queue.shift() || null; round.shown = false;
    if (!round.current) { rest(true); return; }
    const card = round.current, record = rec(card.i);
    round.last = card.i;
    const moved = document.activeElement && document.activeElement.closest('.p-actions');
    show('p-front', 'p-keys');
    if (moved) q('p-show').focus({ preventScroll: true });
    q('p-pos').textContent = `${!record ? 'new' : record.b === 0 ? 'missed last time' : 'review'} · ${round.size - round.queue.length} of ${round.size}`;
    const cue = q('p-cue');
    cue.classList.remove('p-note');
    cue.replaceChildren(card.e);
    if (card.p) cue.append(' ', span('pos', card.p));
    drawCount(); drawMeter();
  }
  function reveal() {
    if (!round.current || round.shown) return;
    round.shown = true;
    const card = round.current, tail = card.l.slice(card.head.length);
    const head = document.createElement('b');
    head.textContent = card.head;
    q('p-la').replaceChildren(...(card.o ? [span('ours', '*')] : []), head, tail);
    if (card.o) q('p-la').firstChild.title = 'Our own formation: no source has this word or phrase';
    // A phrase is not set as large as a single word.
    q('p-la').classList.toggle('p-long', card.head.includes(' '));
    q('p-cite').textContent = card.c || ''; q('p-cite').hidden = !card.c;
    q('p-gloss').textContent = card.g || ''; q('p-gloss').hidden = !card.g;
    // One example: from a chosen source if the card has one, else its first.
    const chosen = deck.src.map(id => sourceNumber.get(id));
    const example = (card.q || []).find(row => (row[3] || []).some(n => chosen.includes(n))) || (card.q || [])[0];
    q('p-ex').hidden = !example;
    if (example) {
      q('p-ex-la').textContent = example[0];
      q('p-ex-en').replaceChildren(example[1], span('src' + (example[2] ? '' : ' composed'), example[2] || 'composed'));
    }
    q('p-entry').href = `c/${card.i}.html`;
    show('p-back', 'p-marks', 'p-keys');
    window.lexiconDisplay?.render(q('p-back'));
    q('p-got').focus({ preventScroll: true });
  }
  function mark(got) {
    if (!round.current || !round.shown) return;
    const now = Date.now(), record = rec(round.current.i);
    if (got) { const b = !record ? 2 : Math.min(TOP, record.b + 1); progress.cards[round.current.i] = { b, due: now + WAIT[b], t: now }; round.got++; }
    else { progress.cards[round.current.i] = { b: 0, due: now + WAIT[0], t: now }; round.again++; }   // not put back into this round
    save(); next();
  }
  function wait(ms) {
    const minutes = Math.round(ms / 60e3), hours = Math.round(ms / HOUR), days = Math.round(ms / DAY);
    return ms < 90e3 ? 'in a minute' : minutes < 60 ? `in ${minutes} minutes` : hours < 24 ? (hours <= 1 ? 'in an hour' : `in ${hours} hours`) : (days <= 1 ? 'in a day' : `in ${days} days`);
  }
  // Between rounds: what the round came to, what is waiting, and when the next card comes back.
  function rest(finished) {
    round.current = null;
    const now = Date.now(), due = dueIn(pool, now), fresh = pool.filter(card => !rec(card.i)).length;
    const met = pool.filter(card => rec(card.i));
    const done = finished ? `Round done: Got it ${round.got}, Again ${round.again}. ` : '';
    let text, more = false, early = false;
    if (due || fresh) { text = [due ? `${number(due)} due now` : '', fresh ? `${number(fresh)} new` : ''].filter(Boolean).join(', ') + '.'; more = true; }
    else if (!met.length) text = 'No cards in this deck: the choices under Deck leave none. Take one of them away.';
    else { text = `Nothing is due. The next card comes back ${wait(Math.min(...met.map(card => rec(card.i).due)) - now)}.`; early = true; }
    q('p-pos').textContent = '';
    q('p-cue').classList.add('p-note');
    q('p-cue').textContent = done + text;
    show('p-end');
    q('p-next').hidden = !more; q('p-early').hidden = !early;
    q('p-end').hidden = !more && !early;
    drawCount(); drawMeter();
    if (finished) { const button = more ? q('p-next') : q('p-early'); if (!button.hidden) button.focus({ preventScroll: true }); }
  }
  function drawMeter() {
    const known = pool.filter(card => box(card.i) >= KNOWN).length, learning = pool.filter(card => box(card.i) >= 0 && box(card.i) < KNOWN).length;
    const total = pool.length || 1;
    q('p-bar-known').style.width = (100 * known / total) + '%';
    q('p-bar-learning').style.width = (100 * learning / total) + '%';
    q('p-meter-text').textContent = `In this deck: ${number(known)} known · ${number(learning)} learning · ${number(pool.length - known - learning)} new`;
  }

  q('p-show').addEventListener('click', reveal);
  q('p-again').addEventListener('click', () => mark(false));
  q('p-got').addEventListener('click', () => mark(true));
  q('p-next').addEventListener('click', () => newRound(false));
  q('p-early').addEventListener('click', () => newRound(true));
  q('p-clear').addEventListener('click', () => { deck.part = []; deck.cat = []; deck.src = []; deck.mine = []; write(KEY.deck, deck); refresh(); });
  document.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.target.closest('input, textarea, select')) return;
    if ((event.key === ' ' || event.key === 'Enter') && round.current && !round.shown && !event.target.closest('button, summary, a')) { event.preventDefault(); reveal(); }
    else if (event.key === '1' && round.shown) mark(false);
    else if (event.key === '2' && round.shown) mark(true);
  });

  // A list of the reader's own ---------------------------------------------------------------------
  q('p-list-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = q('p-list-name').value.replace(/\s+/g, ' ').trim(), items = splitItems(q('p-list-text').value);
    const status = q('p-list-status');
    if (!name || !items.length) { status.textContent = 'Give the list a name and at least one item.'; return; }
    const list = makeList('l' + Date.now().toString(36), name, items);
    if (!list.ids.size) { status.textContent = 'None of these items was found in the lexicon, so no list was made.'; return; }
    lists.push(list);
    saveLists();
    // A new list becomes the deck, whole: its phrases with its words, and no part of speech,
    // category or source left over from before to hide half of it.
    deck.mine = ['list:' + list.id]; deck.part = []; deck.cat = []; deck.src = [];
    deck.kind = KINDS.map(kind => kind[0]).filter(kind => [...list.ids].some(id => byId.get(id).kind === kind));
    q('p-list-name').value = ''; q('p-list-text').value = '';
    status.textContent = `Matched ${number(items.length - list.missed.length)} of ${plural(items.length, 'item', 'items')}`
      + (list.missed.length ? `. Not found: ${list.missed.join(', ')}.` : '.') + ` The deck is now “${name}”.`;
    write(KEY.deck, deck);
    drawMine(); refresh();
  });

  // Backup ---------------------------------------------------------------------------------------------
  q('p-export').addEventListener('click', () => {
    q('p-export-text').value = JSON.stringify({ cards: progress.cards, at: progress.at, lists: lists.map(({ name, items }) => ({ name, items })) });
    q('p-export-box').hidden = false;
    q('p-export-text').select();
  });
  q('p-copy').addEventListener('click', async () => {
    const field = q('p-export-text');
    try { await navigator.clipboard.writeText(field.value); } catch { field.select(); try { document.execCommand('copy'); } catch {} }
    q('p-copy').textContent = 'Copied';
    setTimeout(() => { q('p-copy').textContent = 'Copy'; }, 2000);
  });
  // Import takes this page's own export and the record of the drill in Jack's hub, whose word cards
  // are "v:<record id>" (its sentence cards, and words the lexicon no longer has, are left out).
  // Where both copies have a card, the later answer wins.
  q('p-import').addEventListener('click', () => {
    const status = q('p-import-status');
    let incoming;
    try { incoming = JSON.parse(q('p-import-text').value); } catch { incoming = null; }
    if (!incoming || typeof incoming !== 'object' || !incoming.cards || typeof incoming.cards !== 'object') {
      status.textContent = 'That is not an export of progress: paste the whole text, from the first brace to the last.';
      return;
    }
    const newer = (Number.isFinite(incoming.at) ? incoming.at : 0) > progress.at;
    let taken = 0, older = 0, unknown = 0;
    Object.entries(incoming.cards).forEach(([key, value]) => {
      const id = key.startsWith('v:') ? key.slice(2) : key, record = sane(value), mine = progress.cards[id];
      if (!record || !byId.has(id)) { unknown++; return; }
      if (!mine || record.t > mine.t || (!record.t && !mine.t && newer)) { progress.cards[id] = record; taken++; } else older++;
    });
    let added = 0;
    (Array.isArray(incoming.lists) ? incoming.lists : []).forEach(list => {
      if (!list || typeof list.name !== 'string' || !Array.isArray(list.items)) return;
      const items = list.items.filter(item => typeof item === 'string');
      if (lists.some(other => other.name === list.name && other.items.join('\n') === items.join('\n'))) return;
      lists.push(makeList('l' + Date.now().toString(36) + added, list.name, items)); added++;
    });
    if (taken) save();
    if (added) { saveLists(); drawMine(); }
    status.textContent = `Imported ${plural(taken, 'card', 'cards')}`
      + (older ? `; ${number(older)} left as they were, marked here more recently` : '')
      + (unknown ? `; ${number(unknown)} not in the lexicon` : '')
      + (added ? `; ${plural(added, 'list', 'lists')} added` : '') + '.';
    if (taken || added) { q('p-import-text').value = ''; refresh(); }
  });

  drawToggles();
  root.hidden = false;
  refresh();
})();
