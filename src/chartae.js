(() => {
  // Animal picture cards (Jack, 20 November 2026): a picture, the Latin name to say aloud, then the
  // back of the card and a mark, "Got it" or "Again". The cards are data/chartae.json, made for
  // Jack and his son from freely licensed pictures on Wikimedia Commons; the builder writes them
  // into assets/chartae-data.js and copies the pictures to chartae/. Each card that has an entry in
  // the lexicon links to it.
  //
  // The page is built as the vocabulary practice is (src/practice.js): a lobby with the deck, the
  // meter and a Start button, and a round played in a layer over the whole page, with the same
  // marks. The interface is in Latin unless the reader chooses English, and the choice is the one
  // made in the vocabulary practice (the same key). Everything stays on the device.
  const root = document.getElementById('chartae'), game = document.getElementById('p-game'), data = window.lexiconChartae;
  if (!root || !game || !data) return;
  const q = id => document.getElementById(id);

  // The spacing is the vocabulary practice's own, rule for rule (Jack, 20 November 2026: in the
  // first version of this game, outside the lexicon, a card marked "Again" came back a few cards
  // later, "paene statim"; "do we not have a way of repeating in our other game already?"). The
  // constants and the three functions below are copied from src/practice.js, where the grounds for
  // each number are given, and a test (tests/test_build.py) fails if the two differ: change them
  // there, here and on how-practice-works.html together. In short: "Again" sends a card to box 0,
  // due in ten minutes, and it is not put back into the round; "Got it" sends a missed card to
  // box 2 (the next day), a new card to box 3 (3 or 4 days), any other card up one box; waits of a
  // day or more are counted in calendar days that start at 04:00; a round has 12 cards, of which
  // at most 6 are repetitions while the deck has new cards. The record kept for a card is the same
  // ({b, due, t}), under a key of this game's own: a picture and an English cue are two questions.
  const ROUND = 12, ROUND_DUE = 6, KNOWN = 3, TOP = 9, HOUR = 3600e3, DAY = 24 * HOUR;
  const ROUND_DUE_MORE = [[72, 10], [36, 8]];   // with more than so many cards waiting, so many of a round
  const AGAIN_WAIT = HOUR / 6, RELEARNT = 2, NEW_KNOWN = 3, DAY_STARTS = 4;
  const WAIT_DAYS = [null, null, [1, 1], [3, 4], [6, 8], [14, 18], [30, 40], [70, 90], [150, 210], [300, 420]];   // by box: [fewest, most] days; boxes 0 and 1 wait less than a day
  const KEY = { progress: 'lexicon-chartae', deck: 'lexicon-chartae-deck', round: 'lexicon-chartae-round', lang: 'lexicon-practice-lang' };
  const PAGES = 'lexicon-pages';   // the service worker's cache of what is saved as it is read (src/sw.js)
  const number = n => n.toLocaleString('en');

  function dayStart(moment, n) {
    const date = new Date(moment);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getHours() < DAY_STARTS ? 1 : 0) + n, DAY_STARTS).getTime();
  }
  function dueFrom(now, b) {
    if (!WAIT_DAYS[b]) return now + AGAIN_WAIT;
    const [fewest, most] = WAIT_DAYS[b];
    return dayStart(now, fewest + Math.min(most - fewest, Math.floor(Math.random() * (most - fewest + 1))));
  }
  function boxAfter(record, got) {
    if (!got) return 0;
    if (!record) return NEW_KNOWN;
    return record.b < RELEARNT ? RELEARNT : Math.min(TOP, record.b + 1);
  }

  // The words of the interface --------------------------------------------------------------------
  // The round's Latin is the vocabulary practice's, which is the hub drill's and Jack's own
  // (Incipe, Perge, Respōnsum ostende, Iterum, Teneō, Redī, Exī, Novus cursus, Repete tamen nunc,
  // nova / repetenda / ēlāpsa, Cursus cōnfectus, the meter, Nihil hīc repetendum, Prōgressus in
  // hōc nāvigātrō servātur, In lexicō īnspice, exemplum nostrum, Quā ratiōne repetātur). "Chartae
  // animālium" is the name the cards have had from the start, and "Quō vēscitur?" and "Anglicē"
  // are printed on them. The rest is Claude's wording, composed for this page on 20 November 2026,
  // for Jack to review: sub, groups, all, gallery, ask, picture, credit, cropped, offline, more,
  // vocabulary, and the English names of the groups (in data/chartae.json).
  const one = (n, singular, many) => `${number(n)} ${n === 1 ? singular : many}`;
  const T = {
    la: {
      title: 'Chartae animālium', sub: 'Imāginem īnspice, nōmen Latīnum clārā vōce dīc, deinde respōnsum ostende.', langLabel: 'Lingua',
      groups: 'Genera', all: 'Omnia', gallery: 'Omnēs chartae', ask: 'Quid est?',
      start: 'Incipe', resume: 'Perge', early: 'Repete tamen nunc', next: 'Novus cursus',
      show: 'Respōnsum ostende', again: 'Iterum', got: 'Teneō', undo: 'Redī', close: 'Exī', card: 'Charta',
      status: { new: 'nova', due: 'repetenda', lapsed: 'ēlāpsa' },
      keys: 'Plēctra: spatium respōnsum ostendit; 1 = Iterum, 2 = Teneō; z = Redī.',
      saved: 'Prōgressus in hōc nāvigātrō servātur.',
      notSaved: 'Prōgressus in hōc nāvigātrō servārī nōn potest: pāginā clausā perībit.',
      offline: 'Imāginēs in hōc apparātū servātae sunt: sine rēte quoque lūdere licet.',
      entry: 'In lexicō īnspice', composed: 'exemplum nostrum', english: 'Anglicē', picture: 'Imāgō animālis',
      credit: 'Imāgō:', from: 'ex', cropped: 'recīsa',
      cards: n => one(n, 'charta', 'chartae'), due: n => `${number(n)} nunc ${n === 1 ? 'repetenda' : 'repetendae'}`, fresh: n => one(n, 'nova', 'novae'),
      known: n => one(n, 'nōta', 'nōtae'), learning: n => one(n, 'discitur', 'discuntur'),
      done: (got, again) => `Cursus cōnfectus: «Teneō» ${got}, «Iterum» ${again}.`,
      nothing: when => `Nihil hīc repetendum. Proxima charta redībit ${when}.`,
      none: 'Nūllae hīc chartae.',
      wait: (hours, days) => (hours < 1 ? 'intrā hōram' : hours < 24 ? (hours === 1 ? 'post hōram' : `post ${hours} hōrās`) : days === 1 ? 'post diem' : `post ${days} diēs`),
      how: 'Quā ratiōne repetātur', more: 'Aliī lūdī:', vocabulary: 'Exercitātiō', clock: ''
    },
    en: {
      title: 'Animal cards', sub: 'Look at the picture, say the Latin name aloud, then show the answer.', langLabel: 'Language',
      groups: 'Kinds', all: 'All', gallery: 'All the cards', ask: 'What is it?',
      start: 'Start', resume: 'Continue', early: 'Practise early', next: 'Another round',
      show: 'Show the Latin', again: 'Again', got: 'Got it', undo: 'Undo', close: 'Close', card: 'Card',
      status: { new: 'new', due: 'due', lapsed: 'lapsed' },
      keys: 'Keys: Space shows the Latin; 1 = Again, 2 = Got it; z = Undo.',
      saved: 'Progress is kept in this browser.',
      notSaved: 'Progress cannot be saved in this browser: it will last only until the page is closed.',
      offline: 'The pictures are saved on this device: the game also works offline.',
      entry: 'Open the entry', composed: 'composed', english: 'English', picture: 'Picture of an animal',
      credit: 'Picture:', from: 'from', cropped: 'cropped',
      cards: n => one(n, 'card', 'cards'), due: n => `${number(n)} due now`, fresh: n => `${number(n)} new`,
      known: n => `${number(n)} known`, learning: n => `${number(n)} learning`,
      done: (got, again) => `Round done: Got it ${got}, Again ${again}.`,
      nothing: when => `Nothing is due. The next card comes back ${when}.`,
      none: 'No cards here.',
      wait: (hours, days) => (hours < 1 ? 'within the hour' : hours < 24 ? (hours === 1 ? 'in an hour' : `in ${hours} hours`) : days === 1 ? 'in a day' : `in ${days} days`),
      how: 'How the practice works', more: 'Other games:', vocabulary: 'Vocabulary', clock: 'the clock, '
    }
  };
  let lang = 'la';
  try { if (localStorage.getItem(KEY.lang) === 'en') lang = 'en'; } catch {}
  const t = key => T[lang][key];

  // A piece of text with its language: the interface's own words take the page's language; what is
  // always Latin (the names, the sentences, what an animal eats) says "la", what is always English
  // (the English name, citations, the photographer and the licence) says "en".
  function el(tag, className, content, language) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (language !== undefined) node.lang = language;
    node.append(...[].concat(content === undefined ? [] : content));
    return node;
  }
  const polish = scope => window.lexiconDisplay?.render(scope);
  const headOf = latin => /^(.+?)(?=\s*(?:,|$))/.exec(latin)[1];

  // Storage may be blocked: the page then works for the visit and says that nothing is kept.
  let saving = true;
  function read(key, fallback) {
    try { const value = JSON.parse(localStorage.getItem(key)); return value === null || typeof value !== 'object' ? fallback : value; } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { saving = false; }
    q('p-saved').textContent = saving ? t('saved') : t('notSaved');
  }

  // The cards and the deck ------------------------------------------------------------------------
  const cards = data.cards, byId = new Map(), groups = data.groups;
  cards.forEach(card => { card.head = headOf(card.latin); byId.set(card.id, card); });
  // The deck is the kinds chosen; none chosen is all of them.
  let chosen = (() => { const kept = read(KEY.deck, []); return Array.isArray(kept) ? kept.filter(id => groups.some(group => group.id === id)) : []; })();
  let pool = [];
  const nameOf = group => (lang === 'la' ? group.latin : group.english);
  function drawDeck() {
    pool = cards.filter(card => !chosen.length || chosen.includes(card.group));
    const button = (id, label, language, count) => {
      const node = el('button', '', [el('span', '', label, language), ' ', el('span', 'count', number(count))]);
      node.type = 'button'; node.dataset.group = id;
      node.setAttribute('aria-pressed', String(id ? chosen.includes(id) : !chosen.length));
      return node;
    };
    q('c-groups').replaceChildren(button('', t('all'), undefined, cards.length),
      ...groups.map(group => button(group.id, nameOf(group), lang === 'la' ? 'la' : 'en', cards.filter(card => card.group === group.id).length)));
    q('g-deck').replaceChildren(...(chosen.length ? groups.filter(group => chosen.includes(group.id)).flatMap((group, n) => [...(n ? [', '] : []), el('span', '', nameOf(group), lang === 'la' ? 'la' : 'en')]) : [t('title')]));
  }
  q('c-groups').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = button.dataset.group;
    chosen = !id ? [] : chosen.includes(id) ? chosen.filter(other => other !== id) : chosen.concat(id);
    if (chosen.length === groups.length) chosen = [];
    write(KEY.deck, chosen);
    round = idle(); keep();   // a round begun with the old deck is dropped
    drawDeck(); drawLobby();
  });

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

  // The lobby: the deck's count, the meter, and the way in ---------------------------------------------
  const dueIn = (list, now) => list.filter(card => rec(card.id) && rec(card.id).due <= now).length;
  function when(due, now) {
    const ms = due - now, hours = ms < HOUR ? 0 : Math.round(ms / HOUR);
    return t('wait')(hours, Math.max(1, Math.round((dayStart(due, 0) - dayStart(now, 0)) / DAY)));
  }
  // What the deck holds now: cards due, cards new, and if neither, when the next one comes back.
  function standing() {
    const now = Date.now(), due = dueIn(pool, now), fresh = pool.filter(card => !rec(card.id)).length;
    const met = pool.filter(card => rec(card.id));
    const waiting = [due ? t('due')(due) : '', fresh ? t('fresh')(fresh) : ''].filter(Boolean).join(', ') + '.';
    if (due || fresh) return { more: true, early: false, due, fresh, text: waiting };
    if (!met.length) return { more: false, early: false, due, fresh, text: t('none') };
    return { more: false, early: true, due, fresh, text: t('nothing')(when(Math.min(...met.map(card => rec(card.id).due)), now)) };
  }
  function drawLobby() {
    const state = standing();
    q('p-count').textContent = `${t('cards')(pool.length)} · ${t('due')(state.due)} · ${t('fresh')(state.fresh)}`;
    const known = pool.filter(card => box(card.id) >= KNOWN).length, learning = pool.filter(card => box(card.id) >= 0 && box(card.id) < KNOWN).length;
    const total = pool.length || 1;
    q('p-bar-known').style.width = (100 * known / total) + '%';
    q('p-bar-learning').style.width = (100 * learning / total) + '%';
    q('p-meter-text').textContent = `${t('known')(known)} · ${t('learning')(learning)} · ${t('fresh')(pool.length - known - learning)}`;
    // The way in: a round left open is taken up again; else a new one, or an early one, or nothing.
    const going = !!round.current, start = q('p-start');
    q('p-state').textContent = going || state.more ? '' : state.text;
    q('p-state').hidden = going || state.more;
    start.textContent = going ? t('resume') : state.more ? t('start') : t('early');
    start.classList.toggle('pbtn-fill', going || state.more);
    start.hidden = !(going || state.more || state.early);
    q('p-saved').textContent = saving ? t('saved') : t('notSaved');
    polish(root);
  }

  // Every card, to look through with a child: the picture, the name, and the way to the entry. The
  // pictures are fetched as they come into view, and not at all while the list is closed.
  function drawGallery() {
    q('c-gallery').replaceChildren(...groups.flatMap(group => {
      const tiles = cards.filter(card => card.group === group.id).map(card => {
        const picture = el('img'); picture.src = card.picture; picture.alt = ''; picture.loading = 'lazy'; picture.width = 720; picture.height = 511;
        const caption = el('figcaption', '', [el('b', '', card.head, 'la'), ' ', el('span', 'c-en', card.english, 'en')]);
        const figure = el('figure', 'c-tile', [picture, caption]);
        if (!card.record) return figure;
        const link = el('a', 'c-tile-link', figure); link.href = `c/${card.record}.html`;
        return link;
      });
      return [el('h2', 'c-group', nameOf(group), lang === 'la' ? 'la' : 'en'), el('div', 'c-tiles', tiles)];
    }));
  }

  // Rounds, as in the vocabulary practice: twelve cards; while the deck has new cards at most half
  // of a round is repetition, first the cards that were missed, then the longest overdue; the rest
  // are new, and the two are mixed. An early round, when nothing is due and nothing is new, takes
  // the cards that are due soonest. The round is kept on the device, so that a reader who opens a
  // card's entry and comes back finds the same card, with its back still shown.
  const idle = () => ({ queue: [], current: null, shown: false, done: false, got: 0, again: 0, missed: [], size: 0, last: '', undo: null });
  let round = idle();
  const ROUND_KEPT = 12 * HOUR, ROUND_REOPENS = HOUR;
  const forget = () => { try { localStorage.removeItem(KEY.round); } catch {} };
  function keep() {
    if (!round.current && !round.done) { forget(); return; }
    write(KEY.round, { ...round, queue: round.queue.map(card => card.id), current: round.current ? round.current.id : null, open: game.open, at: Date.now() });
  }
  function restore() {
    const kept = read(KEY.round, null);
    if (!kept || typeof kept !== 'object' || !Array.isArray(kept.queue)) return false;
    const age = Date.now() - kept.at;
    if (!(age >= 0 && age <= ROUND_KEPT)) { forget(); return false; }
    const queue = kept.queue.map(id => byId.get(id)), current = kept.current ? byId.get(kept.current) : null;
    const count = value => (Number.isFinite(value) && value >= 0 ? value : 0);
    if (queue.includes(undefined) || (kept.current && !current) || (!current && !kept.done)) return false;
    const ids = list => (Array.isArray(list) ? list.filter(id => byId.has(id)) : []);
    const undo = kept.undo && byId.has(kept.undo.id) ? { id: kept.undo.id, before: sane(kept.undo.before), got: count(kept.undo.got), again: count(kept.undo.again), missed: ids(kept.undo.missed) } : null;
    round = { queue, current, shown: !!kept.shown && !!current, done: !current, got: count(kept.got), again: count(kept.again), missed: ids(kept.missed),
      size: Math.max(count(kept.size), queue.length + (current ? 1 : 0)), last: String(kept.last || ''), undo };
    const reopen = !!kept.open && age <= ROUND_REOPENS;
    if (round.done && !reopen) { round = idle(); forget(); }   // a finished round is not offered again
    return reopen;
  }
  function shuffled(list) {
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return list;
  }
  function newRound(early) {
    const now = Date.now(), last = round.last;
    let queue;
    if (early) queue = pool.filter(card => rec(card.id)).sort((a, b) => rec(a.id).due - rec(b.id).due).slice(0, ROUND);
    else {
      const fresh = shuffled(pool.filter(card => !rec(card.id)));
      // Shuffled first: the sort keeps that order among cards of the same rank and the same day.
      const order = new Map();   // for each due card: 0 if it is in box 0, then the day it was due
      pool.forEach(card => { const record = rec(card.id); if (record && record.due <= now) order.set(card, [record.b === 0 ? 0 : 1, dayStart(record.due, 0)]); });
      const due = shuffled([...order.keys()]).sort((a, b) => order.get(a)[0] - order.get(b)[0] || order.get(a)[1] - order.get(b)[1]);
      const share = (ROUND_DUE_MORE.find(([waiting]) => due.length > waiting) || [0, ROUND_DUE])[1];
      const again = due.slice(0, fresh.length ? share : ROUND), novel = fresh.slice(0, ROUND - again.length);
      // Too few new cards to fill the round: more of the due ones, if there are any.
      queue = shuffled(again.concat(novel, due.slice(again.length, again.length + ROUND - again.length - novel.length)));
    }
    round = idle();
    round.queue = queue;
    if (round.queue.length > 1 && round.queue[0].id === last) round.queue.push(round.queue.shift());
    round.size = round.queue.length;
    if (round.queue.length) next();
    return round.size > 0;
  }
  function next() {
    round.current = round.queue.shift() || null; round.shown = false;
    round.done = !round.current;
    if (round.current) round.last = round.current.id;
  }
  function reveal() {
    if (!round.current || round.shown) return;
    round.shown = true;
    drawCard(); keep();
    q('g-got').focus({ preventScroll: true });
  }
  function mark(got) {
    if (!round.current || !round.shown) return;
    const now = Date.now(), id = round.current.id, record = rec(id);
    // One step back: what the card's record was before this mark, a new card having none, and the round's tally.
    round.undo = { id, before: progress.cards[id] || null, got: round.got, again: round.again, missed: round.missed.slice() };
    const b = boxAfter(record, got);
    progress.cards[id] = { b, due: dueFrom(now, b), t: now };
    if (got) round.got++; else { round.again++; round.missed.push(id); }   // a missed card is not put back into this round
    save(); next();
    drawCard(); keep();
    q('g-stage').scrollTop = 0;
    const button = round.done ? [q('g-next'), q('g-early'), q('g-exit')].find(b => !b.hidden) : q('g-show');
    if (document.activeElement && document.activeElement.closest('.pgame-actions')) button.focus({ preventScroll: true });
  }
  function undo() {
    const step = round.undo;
    if (!step) return;
    if (step.before) progress.cards[step.id] = step.before; else delete progress.cards[step.id];
    save();
    if (round.current) round.queue.unshift(round.current);
    round.current = byId.get(step.id); round.shown = true; round.done = false;
    round.got = step.got; round.again = step.again; round.missed = step.missed; round.last = step.id; round.undo = null;
    drawCard(); keep();
    q('g-got').focus({ preventScroll: true });
  }

  // The round's layer: the card, and what can be done with it ------------------------------------------
  function drawCard() {
    const card = round.current, record = card ? rec(card.id) : null;
    const position = round.size - round.queue.length;
    q('g-pos').textContent = round.done ? '' : `${position} / ${round.size}`;
    q('g-bar').style.width = (100 * (round.done ? round.size : position - 1) / (round.size || 1)) + '%';
    q('g-undo').disabled = !round.undo;
    q('g-card').classList.toggle('front', !!card && !round.shown);
    q('g-card').classList.toggle('finished', round.done);
    q('g-status').textContent = card ? t('status')[!record ? 'new' : record.b === 0 ? 'lapsed' : 'due'] : '';
    // The back is drawn with the front and kept unseen until the card is turned, so that the card
    // is as tall before as after (Jack, 20 November 2026: "Melius esset sī altitūdō chartae nōn mūtāret cum eam premam").
    q('g-ask').hidden = !card; q('g-ask').setAttribute('aria-hidden', String(round.shown));
    q('g-picture').hidden = !card;
    q('g-back').hidden = !card; q('g-back').setAttribute('aria-hidden', String(!round.shown));
    q('g-end').hidden = !round.done;
    q('g-front').hidden = !card || round.shown;
    q('g-marks').hidden = !card || !round.shown;
    q('g-done').hidden = !round.done;
    q('g-keys').hidden = round.done;
    if (card) {
      // The picture's description does not give the answer away.
      if (q('g-picture').getAttribute('src') !== card.picture) q('g-picture').src = card.picture;
      q('g-picture').alt = t('picture');
      drawBack(card);
      // The next card's picture is fetched while this one is looked at.
      if (round.queue[0]) new Image().src = round.queue[0].picture;
    } else {
      // Between rounds: what the round came to, what is waiting, and the names marked Again.
      const state = standing();
      const missed = round.missed.length ? [' ', el('span', 'pgame-missed', [`«${t('again')}»: `, el('span', '', round.missed.map(id => byId.get(id).head).join(', '), 'la')])] : [];
      q('g-end').replaceChildren(el('span', 'pgame-tally', t('done')(round.got, round.again)), ' ', state.text, ...missed);
      q('g-next').hidden = !state.more; q('g-early').hidden = !state.early;
    }
    polish(game);
  }
  function drawBack(card) {
    q('g-la').replaceChildren(el('b', '', card.head), card.latin.slice(card.head.length));
    q('g-la').classList.toggle('long', card.head.includes(' '));
    q('g-en').replaceChildren(...(lang === 'la' ? [t('english') + ' '] : []), el('span', '', card.english, 'en'));
    // The sentence: a line of an author with its place, or one of ours, which is marked as the
    // lexicon marks its own examples.
    q('g-ex-la').textContent = card.line;
    q('g-ex-src').replaceChildren(card.source ? el('span', 'src', card.source, 'en') : el('span', 'src composed', t('composed')));
    // What it eats: the question and its answer are the card's own Latin in either language.
    q('g-food').replaceChildren(el('span', 'c-ask', 'Quō vēscitur?'), ' ', card.food);
    q('g-entry').hidden = !card.record;
    if (card.record) q('g-entry').href = `c/${card.record}.html`;
    // The picture's author and licence, as the licences ask: both are links, and the picture is said to be cropped.
    const image = card.image, file = el('a', '', image.author, 'en'), licence = image.licence_url ? el('a', '', image.licence, 'en') : el('span', '', image.licence, 'en');
    file.href = image.page; file.rel = 'noopener';
    if (image.licence_url) { licence.href = image.licence_url; licence.rel = 'license noopener'; }
    q('g-credit').replaceChildren(t('credit') + ' ', file, ', ', licence, `, ${t('from')} `, el('span', '', 'Wikimedia Commons', 'en'), `; ${t('cropped')}.`);
  }
  // The layer covers the whole page, which does not scroll under it.
  function openGame() {
    if (!game.open) { try { game.showModal(); } catch { game.setAttribute('open', ''); } }
    document.documentElement.classList.add('pgame-open');
    drawCard(); keep();
    q('g-stage').scrollTop = 0;
    const button = [q('g-show'), q('g-got'), q('g-next'), q('g-early'), q('g-exit')].find(b => !b.hidden && !b.parentElement.hidden);
    if (button) button.focus({ preventScroll: true });
  }
  function closeGame() {
    if (game.open) { try { game.close(); } catch { game.removeAttribute('open'); } }
    document.documentElement.classList.remove('pgame-open');
    if (round.done) round = idle();   // a finished round is over; one left in the middle can be taken up again
    keep();
    drawLobby();
  }
  function start(early) {
    if (!round.current && !newRound(early)) { drawLobby(); return; }
    openGame();
  }

  q('p-start').addEventListener('click', () => start(!round.current && !standing().more));
  q('g-close').addEventListener('click', closeGame);
  q('g-exit').addEventListener('click', closeGame);
  game.addEventListener('close', closeGame);   // Escape closes a dialog by itself
  q('g-undo').addEventListener('click', undo);
  q('g-show').addEventListener('click', reveal);
  q('g-again').addEventListener('click', () => mark(false));
  q('g-got').addEventListener('click', () => mark(true));
  q('g-next').addEventListener('click', () => { newRound(false); if (round.current) openGame(); else closeGame(); });
  q('g-early').addEventListener('click', () => { newRound(true); if (round.current) openGame(); else closeGame(); });
  // A tap on the card itself shows its back.
  q('g-card').addEventListener('click', event => { if (!event.target.closest('a')) reveal(); });
  document.addEventListener('keydown', event => {
    if (!game.open || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); closeGame(); }
    else if ((event.key === ' ' || event.key === 'Enter') && round.current && !round.shown && !event.target.closest('button, a')) { event.preventDefault(); reveal(); }
    else if (event.key === '1' && round.shown) mark(false);
    else if (event.key === '2' && round.shown) mark(true);
    else if ((event.key === 'z' || event.key === 'Backspace') && round.undo) { event.preventDefault(); undo(); }
  });
  addEventListener('pageshow', event => { if (event.persisted) { drawLobby(); if (game.open) drawCard(); } });

  // The pictures for a journey (Jack was about to fly when the game was made): once the service
  // worker has the page, the pictures it has not saved yet are fetched one after another, which
  // saves them (src/sw.js keeps whatever is read), and the page says when all are there. Nothing
  // is fetched twice, and nothing at all for a reader who has asked the browser to save data.
  let offline = false;
  async function savePictures() {
    if (offline || !('caches' in window) || !navigator.serviceWorker.controller || (navigator.connection && navigator.connection.saveData)) return;
    try {
      const cache = await caches.open(PAGES);
      const missing = async () => {
        const absent = [];
        for (const card of cards) if (!await cache.match(new URL(card.picture, location.href).pathname)) absent.push(card);
        return absent;
      };
      for (const card of await missing()) {
        const response = await fetch(card.picture);
        if (!response.ok) return;
      }
      // The worker saves a picture a moment after it hands it over: look again before saying so.
      for (let tries = 0; (await missing()).length; tries++) {
        if (tries === 10) return;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      offline = true;
      q('c-offline').textContent = t('offline'); q('c-offline').hidden = false;
    } catch {}
  }

  // The page's own language follows the choice; the site's header and footer stay in English.
  document.querySelectorAll('header.site-top, footer.site-foot').forEach(part => { part.lang = 'en'; });
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = `${t('title')} · Lexicon Latīnitātis Cotīdiānae`;
    document.querySelectorAll('[data-t]').forEach(node => { node.textContent = t(node.dataset.t); });
    document.querySelectorAll('[data-t-label]').forEach(node => node.setAttribute('aria-label', t(node.dataset.tLabel)));
    q('p-lang').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    q('c-offline').textContent = offline ? t('offline') : ''; q('c-offline').hidden = !offline;
    drawDeck(); drawGallery(); drawLobby();
    if (game.open) drawCard();
    polish(document.body);
  }
  q('p-lang').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.lang === lang) return;
    lang = button.dataset.lang;
    try { localStorage.setItem(KEY.lang, lang); } catch {}
    applyLanguage();
  }));
  q('p-lang').hidden = false;

  const reopen = restore();
  // A round kept from another deck (the kinds were changed in another tab) is not taken up.
  if (round.current && chosen.length && ![round.current, ...round.queue].every(card => chosen.includes(card.group))) { round = idle(); forget(); }
  root.hidden = false;
  applyLanguage();
  if (reopen && (round.current || round.done)) openGame();
  if (navigator.serviceWorker) {
    // On a first visit the worker takes the page over a moment after it is ready.
    navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(savePictures, 1500));
    navigator.serviceWorker.ready.then(() => setTimeout(savePictures, 1500)).catch(() => {});
  }
})();
