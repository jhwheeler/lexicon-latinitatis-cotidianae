(() => {
  // The editor's review (Jack, 15 November 2026: only he reviews, so his tools are not on the
  // public site). This page is published privately as an artifact and shows the entries as the
  // site draws them, one after another: Rēctē (it reads right), Notā (something is wrong: a few
  // reasons to tap and a line to write), Praeterī (leave it for later), Retrō (the one before).
  //
  // A verdict is saved at once in the artifact's database as the document verdicts/<record id>,
  // {id, rev, verdict: 'ok' | 'flag', reasons, note, t, date}: a verdict of a review report (see
  // docs/review.md), tied to the revision of the text it was given on. An agent reads the
  // documents and applies them with scripts/apply_review.py. Where the database cannot be reached
  // (the page opened as a plain file, say) the verdicts are kept in the browser and offered as a
  // report to copy, so that nothing is lost.
  //
  // The data (window.editorIndex, then one file of entries per category) is written by
  // scripts/editor_review.py. The Latin of the interface is the site's review wording where it
  // has one; the rest is Claude's. Of that, Jack approved these on 16 November 2026 ("bene
  // habent"): "Retrō", "Tolle", "Quaere verbum", "Rērum genera", "In lexicō aperī", and of the
  // lines about saving "Jūdicia servantur", "Nōndum servātum" (with its count, "N nōndum
  // servātum / servāta") and "Iterum temptā". Still Claude's, awaiting his review, because he
  // was not asked about them: "In lexicō probātum est", "restant", and the other lines about
  // saving and reading ("Jūdicia in hōc nāvigātrō tantum servantur", "Jūdicia legī nōn
  // potuērunt", "Jūdicia quaeruntur…", "Pāgina legī nōn potuit").
  //
  // The queue is in order of priority (Jack, 16 November 2026: "would be good to have more high
  // prio items first"): the script gives every record a number and its reasons, and the page reads
  // the highest first, among the entries still to read. Claude's wording of 16 November 2026,
  // awaiting his review: the reasons shown under the strip at the top of an entry, "in libellīs",
  // "verbum frequēns", "vītae cotīdiānae", "verbum nostrum", "verbum recēns", "ā Lewis et Short
  // discēdit", "jūdicium exspectat", "respōnsum dubium", "sine fonte", "exemplum nostrum", "plūra verba prō ūnō";
  // and in the lobby the heading "Ōrdō" with its four lines, "Nostra", "Recentia et
  // disputāta", "Exempla nostra" and "Cētera", and their count, "N ex M restant". (The first order,
  // of the same day, put his own list before everything under "Prīma"; he found it led with
  // attested words like mālum, so risk now decides and his list only orders inside a band.)
  const INDEX = window.editorIndex;
  const UNSAVED = 'lexicon-editor-unsaved', LOCAL = 'lexicon-editor-verdicts';
  // Why an entry stands where it does in the queue: the codes of scripts/editor_review.py.
  const WHY = { mine: 'in libellīs', frequent: 'verbum frequēns', daily: 'vītae cotīdiānae', ours: 'verbum nostrum', recent: 'verbum recēns',
    quantity: 'ā Lewis et Short discēdit', provisional: 'jūdicium exspectat', kind: 'respōnsum dubium', unsourced: 'sine fonte', composed: 'exemplum nostrum', phrase: 'plūra verba prō ūnō' };
  const SHOWN = 3;      // so many reasons at most, the weightiest first
  const REASONS = { word: 'verbum', quantity: 'quantitās', meaning: 'sēnsus', example: 'exemplum', source: 'fōns', other: 'aliud' };
  const MONTHS = ['Jānuāriī', 'Februāriī', 'Mārtiī', 'Aprīlis', 'Majī', 'Jūniī', 'Jūliī', 'Augustī', 'Septembris', 'Octōbris', 'Novembris', 'Decembris'];
  const q = id => document.getElementById(id);
  const number = n => n.toLocaleString('en');
  const day = t => { const when = new Date(t); return `diē ${when.getDate()} ${MONTHS[when.getMonth()]}`; };
  const isoDay = t => { const when = new Date(t), two = n => String(n).padStart(2, '0'); return `${when.getFullYear()}-${two(when.getMonth() + 1)}-${two(when.getDate())}`; };
  // Search ignores case and macrons, and takes i for j and u for v, as the site's does.
  const fold = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/j/g, 'i').replace(/v/g, 'u');
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; };

  const records = INDEX.records.map(([id, rev, english, latin, cat, done, priority, reasons]) =>
    ({ id, rev, english, latin, cat, done: !!done, priority: priority || 0, reasons: reasons || [], key: fold(english + ' ' + latin) }));
  const byId = new Map(records.map(record => [record.id, record]));
  // The queue: the highest priority first, and those of one priority by their English headword.
  const headword = record => record.english.toLowerCase();
  // Risk first: a record's band is the highest its reasons give (the script's table, INDEX.bands),
  // and the bands are read from the highest. Inside a band, the priority; then the headword.
  const BANDS = INDEX.bands || {};
  for (const record of records) record.band = Math.max(0, ...record.reasons.map(code => BANDS[code] || 0));
  // The line of reasons names the risk first (what to look at), then the use.
  for (const record of records) record.reasons = [...record.reasons].sort((a, b) => (BANDS[b] || 0) - (BANDS[a] || 0));
  const ranked = [...records].sort((a, b) => b.band - a.band || b.priority - a.priority || (headword(a) < headword(b) ? -1 : headword(a) > headword(b) ? 1 : a.id < b.id ? -1 : 1));
  const groups = [[3, 'Nostra', 'our own words, entries with no source, rulings that await you'],
    [2, 'Recentia et disputāta', 'modern words, departures from Lewis & Short, answers of the wrong kind'],
    [1, 'Exempla nostra', 'attested words with a sentence of ours'],
    [0, 'Cētera', 'attested words with nothing of ours: least likely to be wrong']]
    .map(([band, latin, english]) => [latin, english, ranked.filter(record => record.band === band)]).filter(([, , list]) => list.length);
  const verdicts = new Map();     // id → verdict
  const dirty = new Map();        // id → verdict or null: given, not yet saved in the database
  const chunks = new Map();       // category id → Promise of {id: html}
  let db = null, mode = 'wait';   // 'wait' until the database answers, then 'db' or 'local'
  let queue = ranked, current = null, history = [];
  let aside = null;               // an entry opened by name, from the search or the list of flags

  const read = key => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} };

  // What an entry's state is: 'done' (reviewed in the lexicon), 'ok' or 'flag' (a verdict on the
  // text as it stands), 'stale' (a verdict on an earlier text) or 'left'.
  function state(record) {
    const verdict = verdicts.get(record.id);
    if (verdict && verdict.rev === record.rev) return record.done && verdict.verdict === 'ok' ? 'done' : verdict.verdict;
    return record.done ? 'done' : verdict ? 'stale' : 'left';
  }
  const open = record => { const s = state(record); return s === 'left' || s === 'stale'; };

  // Saving ---------------------------------------------------------------------------------------
  let flushing = false;
  async function flush() {
    if (mode !== 'db' || flushing) return;
    flushing = true;
    for (const [id, verdict] of [...dirty]) {
      try {
        const ref = db.doc('verdicts/' + id);
        if (verdict) await ref.set(verdict); else await ref.delete();
        if (dirty.get(id) === verdict) dirty.delete(id);
      } catch (e) { break; }
    }
    flushing = false;
    write(UNSAVED, Object.fromEntries(dirty));
    showStore();
  }

  function give(id, verdict) {
    if (verdict) verdicts.set(id, verdict); else verdicts.delete(id);
    if (mode === 'local') write(LOCAL, Object.fromEntries(verdicts));
    else { dirty.set(id, verdict); write(UNSAVED, Object.fromEntries(dirty)); flush(); }
    showStore();
  }

  function showStore() {
    const line = q('e-store');
    line.textContent = '';
    line.classList.toggle('bad', mode === 'local' || (mode === 'db' && dirty.size > 0 && !flushing));
    if (mode === 'wait') line.textContent = 'Jūdicia quaeruntur…';
    else if (mode === 'local') line.textContent = 'Jūdicia in hōc nāvigātrō tantum servantur.';
    else if (dirty.size && !flushing) {
      line.textContent = `${number(dirty.size)} nōndum ${dirty.size === 1 ? 'servātum' : 'servāta'}.`;
      const again = el('button', '', 'Iterum temptā');
      again.type = 'button';
      again.addEventListener('click', flush);
      line.append(again);
    } else line.textContent = 'Jūdicia servantur.';
    q('e-report-sec').hidden = mode !== 'local';
    if (mode === 'local') q('e-report').value = report();
  }

  // The report of the site's review page, for the case where the database cannot be reached.
  function report() {
    const list = [...verdicts.values()].sort((a, b) => a.t - b.t);
    const ok = list.filter(verdict => verdict.verdict === 'ok').length;
    return `Lexicon review: ${ok} marked right, ${list.length - ok} flagged.\n\n` + JSON.stringify({ 'lexicon-review': 1, verdicts: list });
  }

  async function connect() {
    const use = window.claude && window.claude.use ? window.claude.use('db') : Promise.resolve(null);
    try { db = await use; } catch (e) { db = null; }
    if (!db) {
      mode = 'local';
      for (const [id, verdict] of Object.entries(read(LOCAL))) if (byId.has(id)) verdicts.set(id, verdict);
    } else {
      try {
        const snap = await Promise.race([db.collection('verdicts').get(),
          new Promise((_, refuse) => setTimeout(() => refuse(new Error('time')), 10000))]);
        for (const doc of snap.docs) { const data = doc.data(); if (data && data.rev && data.verdict) verdicts.set(doc.id, { ...data, id: doc.id }); }
        mode = 'db';
      } catch (e) {
        // The verdicts already given could not be read: say so, and try again when asked.
        const line = q('e-store');
        line.textContent = 'Jūdicia legī nōn potuērunt.';
        line.classList.add('bad');
        const again = el('button', '', 'Iterum temptā');
        again.type = 'button';
        again.addEventListener('click', () => { line.textContent = 'Jūdicia quaeruntur…'; line.classList.remove('bad'); connect(); });
        line.append(again);
        return;
      }
      // What was given on an earlier visit and never reached the database, and what was given
      // while the database was still answering, has the last word.
      for (const [id, verdict] of Object.entries(read(UNSAVED))) if (!dirty.has(id)) dirty.set(id, verdict);
      for (const [id, verdict] of dirty) { if (verdict) verdicts.set(id, verdict); else verdicts.delete(id); }
    }
    showStore();
    flush();
    drawLobby();
    if (current) drawState();
  }

  // The lobby ------------------------------------------------------------------------------------
  function entryButton(record, mark) {
    const item = el('li'), button = el('button');
    button.type = 'button';
    const main = el('span', 'e-main');
    const english = el('span', '', record.english);
    english.lang = 'en';
    const sub = el('span', 'e-sub', record.latin);
    main.append(english, sub);
    button.append(main);
    if (mark) button.append(el('span', 'e-n', mark));
    button.addEventListener('click', () => start(ranked, record, true));
    item.append(button);
    return item;
  }

  // A line of the lobby that starts a queue: its name, a word of English under it, what is left.
  function queueButton(latin, english, list, mark) {
    const item = el('li'), button = el('button');
    button.type = 'button';
    const main = el('span', 'e-main', latin);
    const sub = el('span', 'e-sub', english);
    sub.lang = 'en';
    main.append(sub);
    button.append(main, el('span', 'e-n', mark));
    button.addEventListener('click', () => start(list, list.find(open) || list[0]));
    item.append(button);
    return item;
  }

  // Begin a queue at an entry. One opened by name stands outside the order: the queue goes on
  // from the top after it, not from its own place.
  function start(list, record, byName) {
    queue = list;
    history = [];
    aside = byName ? record : null;
    show(record);
  }

  function drawLobby() {
    const count = { done: 0, ok: 0, flag: 0, left: 0 };
    const left = INDEX.categories.map(() => 0);
    for (const record of records) {
      const s = state(record);
      count[s === 'stale' ? 'left' : s]++;
      if (open(record)) left[record.cat]++;
    }
    const labels = { done: 'in lexicō probāta', ok: '«Rēctē», nōndum in lexicō', flag: 'notāta', left: 'recēnsenda restant' };
    q('e-counts').replaceChildren(...Object.keys(labels).map(key => {
      const row = el('div');
      row.append(el('dt', '', number(count[key])), el('dd', '', labels[key]));
      return row;
    }));
    q('e-start').disabled = !count.left;
    q('e-first').replaceChildren(...groups.map(([latin, english, list]) => {
      const still = list.filter(open).length;
      return queueButton(latin, english, list, still ? `${number(still)} ex ${number(list.length)} restant` : `${number(list.length)} ✓`);
    }));
    q('e-cats').replaceChildren(...INDEX.categories.map((category, n) =>
      queueButton(category.latin, category.english, ranked.filter(record => record.cat === n), left[n] ? `${number(left[n])} restant` : '✓')));
    const flagged = records.filter(record => state(record) === 'flag');
    q('e-flags-sec').hidden = !flagged.length;
    q('e-flags').replaceChildren(...flagged.map(record => {
      const verdict = verdicts.get(record.id);
      const item = entryButton(record);
      const why = [verdict.reasons.map(reason => REASONS[reason]).join(', '), verdict.note].filter(Boolean).join(' — ');
      if (why) { const line = el('span', 'e-sub', why); line.lang = ''; item.querySelector('.e-main').append(line); }
      return item;
    }));
    find();
  }

  function find() {
    const words = fold(q('e-find').value).split(/\s+/).filter(Boolean);
    if (!words.length) { q('e-found').replaceChildren(); return; }
    const hits = records.filter(record => words.every(word => record.key.includes(word)));
    // Whole headwords first, then those that begin with what was typed.
    const first = fold(q('e-find').value.trim());
    const rank = record => { const english = fold(record.english); return english === first ? 0 : english.startsWith(first) ? 1 : 2; };
    hits.sort((a, b) => rank(a) - rank(b));
    const marks = { done: '✓', ok: 'Rēctē', flag: 'Notā', stale: '', left: '' };
    q('e-found').replaceChildren(...hits.slice(0, 30).map(record => entryButton(record, marks[state(record)])));
  }

  // An entry -------------------------------------------------------------------------------------
  function chunk(category) {
    if (!chunks.has(category)) {
      chunks.set(category, new Promise((resolve, refuse) => {
        window.editorChunk = window.editorChunk || ((id, entries) => { const waiting = pending.get(id); if (waiting) waiting(entries); });
        pending.set(category, resolve);
        const script = el('script');
        script.src = `d/${category}.js`;
        script.onerror = () => { chunks.delete(category); refuse(new Error('load')); };
        document.head.append(script);
      }));
    }
    return chunks.get(category);
  }
  const pending = new Map();

  async function show(record, back) {
    if (!record) return lobby();
    if (current && !back && current !== record) history.push(current);
    current = record;
    q('lobby').hidden = true;
    q('entry').hidden = false;
    closeBox();
    drawState();
    const page = q('e-page');
    page.replaceChildren(el('p', 'e-status', '…'));
    window.scrollTo(0, 0);
    let entries;
    try { entries = await chunk(INDEX.categories[record.cat].id); } catch (e) {
      if (current === record) page.replaceChildren(el('p', 'e-status bad', 'Pāgina legī nōn potuit.'));
      return;
    }
    if (current !== record) return;
    page.innerHTML = entries[record.id] || '';
    const link = el('a', '', 'In lexicō aperī');
    link.href = `${INDEX.site}c/${record.id}.html`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const line = el('p', 'e-open');
    line.append(link);
    page.append(line);
  }

  function drawState() {
    const record = current, verdict = verdicts.get(record.id), s = state(record);
    const left = queue.filter(open).length;
    q('e-where').textContent = `${INDEX.categories[record.cat].latin} · ${left ? number(left) + ' restant' : 'nihil restat'}`;
    const why = record.reasons.map(code => WHY[code]).filter(Boolean).slice(0, SHOWN).join(' · ');
    q('e-why').textContent = why;
    q('e-why').hidden = !why;
    q('e-back').disabled = !history.length;
    q('e-ok').setAttribute('aria-pressed', String(s === 'ok'));
    q('e-flag').setAttribute('aria-pressed', String(s === 'flag'));
    const line = q('e-state');
    line.textContent = '';
    line.classList.remove('bad');
    if (s === 'ok') line.textContent = `«Rēctē» dīxistī ${day(verdict.t)}.`;
    else if (s === 'flag') {
      const why = [verdict.reasons.map(reason => REASONS[reason]).join(', '), verdict.note].filter(Boolean).join(' — ');
      line.textContent = `Notāvistī ${day(verdict.t)}${why ? ': ' + why : ''}.`;
    } else if (s === 'stale') line.textContent = `Haec pāgina mūtāta est postquam jūdicāvistī (${day(verdict.t)}).`;
    else if (s === 'done') line.textContent = 'In lexicō probātum est.';
    if (s === 'ok' || s === 'flag') {
      const undo = el('button', '', 'Tolle');
      undo.type = 'button';
      undo.addEventListener('click', () => { give(record.id, null); drawState(); });
      line.append(undo);
    }
    if (mode === 'db' && dirty.has(record.id) && !flushing) { line.classList.add('bad'); line.append(' Nōndum servātum.'); }
    line.hidden = !line.textContent;
  }

  // The next entry still to read after this one in the queue; from the top when the end is reached,
  // or when this one was opened by name.
  function next() {
    const at = current === aside ? -1 : queue.indexOf(current);
    const still = record => record !== current && open(record);
    const found = queue.slice(at + 1).find(still) || queue.slice(0, Math.max(at, 0)).find(still);
    if (found) return show(found);
    closeBox();
    drawState();
    const page = q('e-page');
    page.replaceChildren(el('p', 'e-done', 'Nihil restat.'));
    window.scrollTo(0, 0);
  }

  function lobby() {
    current = null;
    q('entry').hidden = true;
    q('lobby').hidden = false;
    drawLobby();
    window.scrollTo(0, 0);
  }

  function verdictNow(kind, reasons, note) {
    const t = Date.now();
    return { id: current.id, rev: current.rev, verdict: kind, reasons: reasons || [], note: note || '', t, date: isoDay(t) };
  }

  function openBox() {
    const verdict = verdicts.get(current.id), mine = verdict && verdict.rev === current.rev && verdict.verdict === 'flag' ? verdict : null;
    q('e-chips').replaceChildren(...Object.entries(REASONS).map(([reason, label]) => {
      const chip = el('button', '', label);
      chip.type = 'button';
      chip.dataset.reason = reason;
      chip.setAttribute('aria-pressed', String(!!mine && mine.reasons.includes(reason)));
      chip.addEventListener('click', () => chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true')));
      return chip;
    }));
    q('e-note').value = mine ? mine.note : '';
    q('e-box').hidden = false;
    q('e-buttons').hidden = true;
    q('e-state').hidden = true;
  }
  function closeBox() {
    q('e-box').hidden = true;
    q('e-buttons').hidden = false;
  }

  q('e-start').addEventListener('click', () => start(ranked, ranked.find(open)));
  q('e-find').addEventListener('input', find);
  q('e-close').addEventListener('click', lobby);
  q('e-back').addEventListener('click', () => { if (history.length) show(history.pop(), true); });
  q('e-skip').addEventListener('click', next);
  q('e-ok').addEventListener('click', () => {
    if (state(current) !== 'ok' && state(current) !== 'done') give(current.id, verdictNow('ok'));
    next();
  });
  q('e-flag').addEventListener('click', openBox);
  q('e-cancel').addEventListener('click', () => { closeBox(); drawState(); });
  q('e-box').addEventListener('submit', event => {
    event.preventDefault();
    const reasons = [...q('e-chips').children].filter(chip => chip.getAttribute('aria-pressed') === 'true').map(chip => chip.dataset.reason);
    give(current.id, verdictNow('flag', reasons, q('e-note').value.replace(/\s+/g, ' ').trim()));
    next();
  });
  q('e-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(q('e-report').value); q('e-copied').textContent = ' Exscrīptum'; }
    catch (e) { q('e-report').select(); }
  });

  const built = new Date(INDEX.built + 'T12:00:00');
  q('e-built').textContent = ` · ut erat diē ${built.getDate()} ${MONTHS[built.getMonth()]}`;
  drawLobby();
  connect();
})();
