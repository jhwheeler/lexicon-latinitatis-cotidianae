(() => {
  // Picture cards, Chartae pictae (Jack, 20 November 2026): a picture, the Latin name to say aloud,
  // then the back of the card and a mark, "Got it" or "Again". The cards are data/chartae.json,
  // made for Jack and his son from freely licensed pictures on Wikimedia Commons; the builder writes
  // them into assets/chartae-data.js and copies the pictures to chartae/. Each card that has an
  // entry in the lexicon links to it. The cards were animals at first; the same day Jack decided
  // that the other subjects (plants and their parts first, later tools and actions) go into this
  // one exercise, in which the reader chooses the subjects and the kinds, with one spacing and one
  // progress for every card, not into games of their own.
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
  // animālium" was the name the cards had from the start until they took in the plants, and "Quō
  // vēscitur?" and "Anglicē" are printed on them. The rest is Claude's wording, composed for this
  // page on 20 November 2026, for Jack to review: sub, groups, all, gallery, ask, prev, forth,
  // credit, cropped, offline, more, vocabulary, and the English names of the animal kinds (in
  // data/chartae.json); and, when the plants came in the same day, title (Chartae pictae / Picture
  // cards), subjects (Rēs), picture (Imāgō, for Imāgō animālis), the question on the back of a
  // plant's card ("Quid fert?", in drawBack), and the Latin and English names of the subjects and
  // of the plant kinds (in data/chartae.json).
  const one = (n, singular, many) => `${number(n)} ${n === 1 ? singular : many}`;
  const T = {
    la: {
      title: 'Chartae pictae', sub: 'Imāginem īnspice, nōmen Latīnum clārā vōce dīc, deinde respōnsum ostende.', langLabel: 'Lingua',
      subjects: 'Rēs', groups: 'Genera', all: 'Omnia', gallery: 'Omnēs chartae', ask: 'Quid est?', prev: 'Prior', forth: 'Proxima',
      start: 'Incipe', resume: 'Perge', early: 'Repete tamen nunc', next: 'Novus cursus',
      show: 'Respōnsum ostende', again: 'Iterum', got: 'Teneō', undo: 'Redī', close: 'Exī', card: 'Charta',
      status: { new: 'nova', due: 'repetenda', lapsed: 'ēlāpsa' },
      keys: 'Plēctra: spatium respōnsum ostendit; 1 = Iterum, 2 = Teneō; z = Redī.',
      saved: 'Prōgressus in hōc nāvigātrō servātur.',
      notSaved: 'Prōgressus in hōc nāvigātrō servārī nōn potest: pāginā clausā perībit.',
      offline: 'Imāginēs in hōc apparātū servātae sunt: sine rēte quoque lūdere licet.',
      entry: 'In lexicō īnspice', composed: 'exemplum nostrum', english: 'Anglicē', picture: 'Imāgō',
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
      title: 'Picture cards', sub: 'Look at the picture, say the Latin name aloud, then show the answer.', langLabel: 'Language',
      subjects: 'Subjects', groups: 'Kinds', all: 'All', gallery: 'All the cards', ask: 'What is it?', prev: 'Previous', forth: 'Next',
      start: 'Start', resume: 'Continue', early: 'Practise early', next: 'Another round',
      show: 'Show the Latin', again: 'Again', got: 'Got it', undo: 'Undo', close: 'Close', card: 'Card',
      status: { new: 'new', due: 'due', lapsed: 'lapsed' },
      keys: 'Keys: Space shows the Latin; 1 = Again, 2 = Got it; z = Undo.',
      saved: 'Progress is kept in this browser.',
      notSaved: 'Progress cannot be saved in this browser: it will last only until the page is closed.',
      offline: 'The pictures are saved on this device: the game also works offline.',
      entry: 'Open the entry', composed: 'composed', english: 'English', picture: 'Picture',
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
  // always Latin (the names, the sentences, what an animal eats or a plant bears) says "la", what is always English
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
  // A kind with no cards yet (the builder allows it) is not shown, nor a subject with none.
  const cards = data.cards, byId = new Map();
  cards.forEach(card => { card.head = headOf(card.latin); byId.set(card.id, card); });
  const groups = data.groups.filter(group => cards.some(card => card.group === group.id));
  const subjects = data.subjects.filter(subject => groups.some(group => group.subject === subject.id));
  const subjectOf = new Map(groups.map(group => [group.id, group.subject]));
  // The cards in the order of the list of every card: by subject, then by kind.
  const listed = subjects.flatMap(subject => groups.filter(group => group.subject === subject.id).flatMap(group => cards.filter(card => card.group === group.id)));
  // The deck is the subjects and the kinds chosen, two groups of choices as in the vocabulary's
  // deck: choices within a group add up, the groups narrow one another, and a group with nothing
  // chosen does not narrow. The kinds offered are those of the subjects chosen, and a kind whose
  // subject is not chosen is dropped. Choosing every one is the same as choosing none. The first
  // version kept a plain list of kinds under the same key: it is read as the kinds.
  const chosen = { subjects: [], groups: [] };
  const shownGroups = () => groups.filter(group => !chosen.subjects.length || chosen.subjects.includes(group.subject));
  function tidy() {
    if (chosen.subjects.length === subjects.length) chosen.subjects = [];
    chosen.groups = chosen.groups.filter(id => shownGroups().some(group => group.id === id));
    if (chosen.groups.length && chosen.groups.length === shownGroups().length) chosen.groups = [];
  }
  {
    const kept = read(KEY.deck, null), list = value => (Array.isArray(value) ? value.filter(id => typeof id === 'string') : []);
    const old = Array.isArray(kept);
    chosen.subjects = old ? [] : list(kept && kept.subjects).filter(id => subjects.some(subject => subject.id === id));
    chosen.groups = (old ? list(kept) : list(kept && kept.groups)).filter(id => groups.some(group => group.id === id));
    tidy();
  }
  const inDeck = card => (!chosen.subjects.length || chosen.subjects.includes(subjectOf.get(card.group))) && (!chosen.groups.length || chosen.groups.includes(card.group));
  let pool = [];
  const nameOf = group => (lang === 'la' ? group.latin : group.english);
  function drawDeck() {
    pool = cards.filter(inDeck);
    const button = (dataset, id, picked, label, language, count) => {
      const node = el('button', '', [el('span', '', label, language), ' ', el('span', 'count', number(count))]);
      node.type = 'button'; node.dataset[dataset] = id;
      node.setAttribute('aria-pressed', String(id ? picked.includes(id) : !picked.length));
      return node;
    };
    const language = lang === 'la' ? 'la' : 'en';
    q('c-subjects').replaceChildren(button('subject', '', chosen.subjects, t('all'), undefined, cards.length),
      ...subjects.map(subject => button('subject', subject.id, chosen.subjects, nameOf(subject), language, cards.filter(card => subjectOf.get(card.group) === subject.id).length)));
    const offered = shownGroups();
    q('c-groups').replaceChildren(button('group', '', chosen.groups, t('all'), undefined, cards.filter(card => offered.some(group => group.id === card.group)).length),
      ...offered.map(group => button('group', group.id, chosen.groups, nameOf(group), language, cards.filter(card => card.group === group.id).length)));
    // The deck's name in the round: the kinds chosen, else the subjects chosen, else the game's name.
    const names = chosen.groups.length ? groups.filter(group => chosen.groups.includes(group.id)) : subjects.filter(subject => chosen.subjects.includes(subject.id));
    q('g-deck').replaceChildren(...(names.length ? names.flatMap((item, n) => [...(n ? [', '] : []), el('span', '', nameOf(item), language)]) : [t('title')]));
  }
  function choose(kind, id) {
    const list = chosen[kind];
    chosen[kind] = !id ? [] : list.includes(id) ? list.filter(other => other !== id) : list.concat(id);
    // A subject un-chosen takes its chosen kinds with it.
    if (kind === 'subjects') chosen.groups = chosen.groups.filter(group => !list.includes(subjectOf.get(group)) || chosen.subjects.includes(subjectOf.get(group)));
    tidy();
    write(KEY.deck, { subjects: chosen.subjects, groups: chosen.groups });
    round = idle(); keep();   // a round begun with the old deck is dropped
    drawDeck(); drawLobby();
  }
  q('c-subjects').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) choose('subjects', button.dataset.subject);
  });
  q('c-groups').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) choose('groups', button.dataset.group);
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

  // Every card, to look through with a child: the picture and the name. A tile opens its card, with
  // the sentence and the rest of its back (Jack, 20 November 2026: "bene esset chartam aperīre
  // posse ut videātur sententiola etc. (de indice)"); the way to the entry is on the card. The
  // pictures are fetched as they come into view, and not at all while the list is closed.
  // The list is set out by subject (a heading of the second level) and under it by kind (the third).
  function drawGallery() {
    const language = lang === 'la' ? 'la' : 'en';
    q('c-gallery').replaceChildren(...subjects.flatMap(subject => [el('h2', 'c-subject', nameOf(subject), language),
      ...groups.filter(group => group.subject === subject.id).flatMap(group => {
        const tiles = cards.filter(card => card.group === group.id).map(card => {
          const picture = el('img'); picture.src = card.picture; picture.alt = ''; picture.loading = 'lazy'; picture.width = 720; picture.height = 511;
          const tile = el('button', 'c-tile', [picture, el('span', 'c-name', [el('b', '', card.head, 'la'), ' ', el('span', 'c-en', card.english, 'en')])]);
          tile.type = 'button'; tile.dataset.card = card.id;
          return tile;
        });
        return [el('h3', 'c-group', nameOf(group), language), el('div', 'c-tiles', tiles)];
      })]));
  }
  // A card opened from the list is looked at, not played: its back is shown, there are no marks,
  // and nothing is recorded. The cards before and after it follow in the list's order. The page's
  // address names the card (#taurus), so that the way back from its entry leads to it again.
  let look = null;   // the card being looked at, or null
  function openLook(id) {
    if (!byId.has(id)) return;
    look = byId.get(id);
    try { history.replaceState(null, '', '#' + id); } catch {}
    openGame();
  }
  const lookStep = by => { if (look) openLook(listed[(listed.indexOf(look) + by + listed.length) % listed.length].id); };
  q('c-gallery').addEventListener('click', event => {
    const tile = event.target.closest('button[data-card]');
    if (tile) openLook(tile.dataset.card);
  });

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
    if (look || !round.current || round.shown) return;
    round.shown = true;
    drawCard(); keep();
    q('g-got').focus({ preventScroll: true });
  }
  function mark(got) {
    if (look || !round.current || !round.shown) return;
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
    if (look || !step) return;
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
    q('g-look').hidden = !look;
    q('g-deck').hidden = !!look; q('g-list').hidden = !look;
    if (look) {
      // A card from the list: its picture and its back, and the ways to the cards beside it.
      const at = listed.indexOf(look);
      q('g-pos').textContent = `${at + 1} / ${listed.length}`;
      q('g-bar').style.width = '0';
      q('g-undo').disabled = true;
      q('g-card').classList.remove('front', 'finished');
      q('g-ask').hidden = true; q('g-picture').hidden = false; q('g-end').hidden = true;
      q('g-back').hidden = false; q('g-back').setAttribute('aria-hidden', 'false');
      q('g-front').hidden = true; q('g-marks').hidden = true; q('g-done').hidden = true; q('g-keys').hidden = true;
      if (q('g-picture').getAttribute('src') !== look.picture) q('g-picture').src = look.picture;
      q('g-picture').alt = look.english; q('g-picture').lang = 'en';
      drawBack(look);
      [-1, 1].forEach(by => { new Image().src = listed[(at + by + listed.length) % listed.length].picture; });
      polish(game);
      return;
    }
    q('g-picture').removeAttribute('lang');
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
    // The scientific name follows the English one (Jack, 20 November 2026: "inclūdāmus nōmina
    // scientifica … jūxtā nōmina Anglica … Hōc modō discēmus discrīmina"), in italic, as zoology and
    // botany write it. Its language is la-x-taxon: Latin to a screen reader, which reads the
    // primary tag, but not "la", the only language the display options rewrite, so that no option
    // turns Juniperus into Iuniperus or Vulpes into Uulpes. No new words: only a middle dot.
    const taxon = card.scientific ? el('i', 'c-sci', card.scientific, 'la-x-taxon') : null;
    if (taxon) taxon.translate = false;
    q('g-en').replaceChildren(...(lang === 'la' ? [t('english') + ' '] : []), el('span', '', card.english, 'en'), ...(taxon ? [' · ', taxon] : []));
    // The sentence: a line of an author with its place, or one of ours, which is marked as the
    // lexicon marks its own examples.
    q('g-ex-la').textContent = card.line;
    q('g-ex-src').replaceChildren(card.source ? el('span', 'src', card.source, 'en') : el('span', 'src composed', t('composed')));
    // What an animal eats, or what a plant bears: the question and its answer are the card's own
    // Latin in either language. A card with neither has no such line.
    q('g-food').hidden = !card.food;
    q('g-food').replaceChildren(...(card.food ? [el('span', 'c-ask', 'Quō vēscitur?'), ' ', card.food] : []));
    q('g-bears').hidden = !card.bears;
    q('g-bears').replaceChildren(...(card.bears ? [el('span', 'c-ask', 'Quid fert?'), ' ', card.bears] : []));
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
    const opened = !game.open;
    if (opened) { try { game.showModal(); } catch { game.setAttribute('open', ''); } }
    document.documentElement.classList.add('pgame-open');
    drawCard();
    q('g-stage').scrollTop = 0;
    if (look) { if (opened) q('g-forth').focus({ preventScroll: true }); return; }   // a round left in the middle stays as it was kept
    keep();
    const button = [q('g-show'), q('g-got'), q('g-next'), q('g-early'), q('g-exit')].find(b => !b.hidden && !b.parentElement.hidden);
    if (button) button.focus({ preventScroll: true });
  }
  function closeGame() {
    if (game.open) { try { game.close(); } catch { game.removeAttribute('open'); } }
    document.documentElement.classList.remove('pgame-open');
    if (look) {
      // Back to the list, at the card that was looked at last.
      const tile = q('c-gallery').querySelector(`button[data-card="${look.id}"]`);
      look = null;
      try { history.replaceState(null, '', location.pathname + location.search); } catch {}
      drawLobby();
      if (tile) { tile.focus({ preventScroll: true }); tile.scrollIntoView({ block: 'nearest' }); }
      return;
    }
    if (round.done) round = idle();   // a finished round is over; one left in the middle can be taken up again
    keep();
    drawLobby();
  }
  function start(early) {
    if (!round.current && !newRound(early)) { drawLobby(); return; }
    openGame();
  }

  q('p-start').addEventListener('click', () => start(!round.current && !standing().more));
  q('g-prev').addEventListener('click', () => lookStep(-1));
  q('g-forth').addEventListener('click', () => lookStep(1));
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
    else if (look) { if (event.key === 'ArrowLeft') lookStep(-1); else if (event.key === 'ArrowRight') lookStep(1); }
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
  // A round kept from another deck (the subjects or kinds were changed in another tab) is not taken up.
  if (round.current && ![round.current, ...round.queue].every(inDeck)) { round = idle(); forget(); }
  root.hidden = false;
  applyLanguage();
  // The address may name a card to look at: the way back from its entry, or a link to it.
  if (byId.has(location.hash.slice(1))) { q('c-all').open = true; openLook(location.hash.slice(1)); }
  else if (reopen && (round.current || round.done)) openGame();
  if (navigator.serviceWorker) {
    // On a first visit the worker takes the page over a moment after it is ready.
    navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(savePictures, 1500));
    navigator.serviceWorker.ready.then(() => setTimeout(savePictures, 1500)).catch(() => {});
  }
})();
