(() => {
  // Vocabulary practice (Jack, 13 November 2026): an English cue, the Latin to say aloud, then the
  // answer and a mark, "Got it" or "Again". The cards are the lexicon's own records
  // (assets/practice-data.js, one card per record). Vocabulary is the primary thing and phrases
  // are secondary, so the deck starts as the words. The reader narrows it by kind, part of speech,
  // category, source, the entries looked up and the reader's own lists: within a group the choices
  // add up, between groups they narrow, and a group with nothing chosen does not narrow.
  //
  // Since 14 November 2026 (Jack: "it doesn't feel like a standalone game") the page is a lobby,
  // with the deck, the meter and a Start button, and a round is played in a layer of its own over
  // the whole page: a card, and real buttons under it. The interface is in Latin unless the reader
  // chooses English. Everything the reader does stays on the device: progress, the choices, the
  // language, the entries looked up (recorded by page.js) and the lists.
  const root = document.getElementById('practice'), game = document.getElementById('p-game'), data = window.lexiconPractice;
  if (!root || !game || !data) return;
  const q = id => document.getElementById(id);
  const KINDS = ['w', 'p', 's'];
  // Part of speech, as in the drill in Jack's hub (13 November 2026): a choice among the words. A
  // record that is two things (noun and verb) counts under each; a phrase has no part of speech
  // to choose by, so this group leaves the phrases as they are.
  const PARTS = ['n', 'v', 'a', 'd', 'o'];
  const PART_OF = { noun: 'n', verb: 'v', adjective: 'a', adverb: 'd' };
  // The boxes begin as the Leitner boxes of the drill in Jack's hub, 0 to 6, and the record kept for a
  // card is the same ({b, due, t}), so that progress still moves between the two. How a card moves
  // through them, when it is due and what a round holds differ from the hub's since 15 November
  // 2026. Jack, having played every day (15 November 2026): the day after a long session every round
  // was yesterday's words and nothing else, "really boring"; a word missed once came back four
  // times in two days, three of them right; it "needs some mental variety". The cause: a missed
  // card climbed through 10 minutes, 1 hour, 1 day and 3 days; a new card known at sight came back
  // the next day; a round took every due card before any new one; and cards learned together came
  // due together ever after.
  //
  // The rules now. The numbers are the coordinating session's choice, not Jack's, and are here to
  // be tuned:
  // - "Again", any card: box 0, due in AGAIN_WAIT (10 minutes). It is not put back into the round.
  // - "Got it" on a card in box 0 or 1 (one that was missed, or one imported from the hub in its
  //   hour box): box RELEARNT (2), due the next day. The hour step is no longer climbed.
  // - "Got it" on a new card: box NEW_KNOWN (3), 3 or 4 days. It was known without being shown.
  // - "Got it" on a card in box 2 or higher: up one box, to TOP.
  // - Waits of a day or more are counted in days of the calendar, a day starting at DAY_STARTS
  //   o'clock on the device (04:00, so that a session late at night belongs to the evening): a
  //   card due "in 1 day" is due from the start of the next day, whatever the hour it was marked.
  // - WAIT_DAYS gives for each box the fewest and the most days: the nominal waits of 1, 3, 7, 16
  //   and 35 days, then 80, 180 and 365, spread from box 3 up by about 15% either way (a day at least from 7 days up),
  //   a whole number of days chosen at random, so that cards learned together do not come back
  //   together. Box 2 is always the next day.
  // - A round has ROUND cards, of which at most ROUND_DUE are repetitions while the deck still has
  //   new cards; the two are mixed. Half and half cannot last for a reader who takes new cards
  //   every day (a card needs three to five repetitions in its first month, so more would come
  //   due than the rounds hold: found while the page "How the practice works" was written, 15
  //   November 2026), so the share grows as cards wait: ROUND_DUE_MORE gives, for a number of
  //   cards waiting, how many of the round they may take.
  // The grounds for the numbers. Anki's defaults: a card answered "Good" through its learning
  // steps graduates to an interval of 1 day, one answered "Easy" at once to 4 days (the settings
  // are "Graduating interval" and "Easy interval" in the Anki manual, Deck Options; 1 and 4 are
  // the values the program starts with). The finding that what matters is a first retrieval after
  // a real delay (Karpicke & Roediger 2007, "Expanding retrieval practice promotes short-term
  // retention, but equally spaced retrieval enhances long-term retention"), and that growing gaps
  // did not in the end do better than equal ones (Kang, Lindsey, Mozer & Pashler 2014, "Retrieval
  // practice over the long term: should spacing be expanding or equal-interval?", Psychonomic
  // Bulletin & Review 21, 1544–1550). And for the long waits, that vocabulary kept over years was
  // kept better with sessions 56 days apart than 14 (Bahrick et al. 1993): the boxes above 6
  // (about 80 days, half a year, a year) were added on 15 November 2026; until then the waits
  // stopped at 35 days. The hub's boxes are 0 to 6, a part of these. The page
  // how-practice-works.html sets all this out with its sources; keep the two in step.
  // "Known", in the meter, is box 3 or higher: three days or more.
  const ROUND = 12, ROUND_DUE = 6, KNOWN = 3, TOP = 9, HOUR = 3600e3, DAY = 24 * HOUR;
  const ROUND_DUE_MORE = [[72, 10], [36, 8]];   // with more than so many cards waiting, so many of a round
  const AGAIN_WAIT = HOUR / 6, RELEARNT = 2, NEW_KNOWN = 3, DAY_STARTS = 4;
  const WAIT_DAYS = [null, null, [1, 1], [3, 4], [6, 8], [14, 18], [30, 40], [70, 90], [150, 210], [300, 420]];   // by box: [fewest, most] days; boxes 0 and 1 wait less than a day
  const KEY = { progress: 'lexicon-practice', deck: 'lexicon-practice-deck', seen: 'lexicon-seen', lists: 'lexicon-lists',
    lang: 'lexicon-practice-lang', round: 'lexicon-practice-round' };
  const number = n => n.toLocaleString('en');

  // The start of the day n days after this moment, on the device's clock: a day starts at
  // DAY_STARTS o'clock, so 01:00 on Tuesday is still Monday. With n = 0, the start of its own day.
  // It is read from the clock's own date and hour, so a day of 23 or 25 hours is still one day.
  function dayStart(moment, n) {
    const date = new Date(moment);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getHours() < DAY_STARTS ? 1 : 0) + n, DAY_STARTS).getTime();
  }
  // When a card marked at this moment into this box is due: box 0 in ten minutes, a higher box at
  // the start of a day, as many days on as WAIT_DAYS allows, chosen at random between its two ends.
  function dueFrom(now, b) {
    if (!WAIT_DAYS[b]) return now + AGAIN_WAIT;
    const [fewest, most] = WAIT_DAYS[b];
    return dayStart(now, fewest + Math.min(most - fewest, Math.floor(Math.random() * (most - fewest + 1))));
  }
  // The box a mark sends a card to; record is null for a new card.
  function boxAfter(record, got) {
    if (!got) return 0;
    if (!record) return NEW_KNOWN;
    return record.b < RELEARNT ? RELEARNT : Math.min(TOP, record.b + 1);
  }

  // The words of the interface --------------------------------------------------------------------
  // Latin is the default (Jack, 14 November 2026: "I wish it were in Latin"), English the other
  // choice, as in the clock game. The Latin of the round is the hub drill's own wording, which Jack
  // has used for weeks: Respōnsum ostende, Iterum, Teneō, Novus cursus, Repete tamen nunc, nova /
  // repetenda / ēlāpsa, Cursus cōnfectus, the meter, Nihil hīc repetendum, Fasciculus, chartae, the
  // parts of speech, Rērum genera, Plēctra, Prōgressus in hōc nāvigātrō servātur. "Perge" and
  // "Lingua" are from his clock game. The rest is Claude's wording, composed for this page, for
  // Jack to review: first what the coordinating session wrote (title, sub, undo, close, start, the
  // kinds, src, works, mine, seen, lists, addList, name, entry, also, the periods, export, import,
  // copy), then, marked "review" below, what was still wanted. "how" (Quā ratiōne repetātur, 15
  // November 2026) is Claude's wording, approved by Jack on 16 November 2026 ("bene habet"): the
  // lobby's link to the page that says how the practice chooses and spaces its cards
  // (how-practice-works.html, which is in English).
  // "also" (Item: / Also:) labels the back's line of other Latin words. The front's line of other
  // English names does not use it: see drawing the front, below.
  const one = (n, singular, many) => `${number(n)} ${n === 1 ? singular : many}`;
  const T = {
    la: {
      title: 'Exercitātiō', sub: 'Ex Anglicō in Latīnum: dīc clārā vōce, deinde īnspice.', langLabel: 'Lingua',
      deck: 'Fasciculus', kind: 'Genus', part: 'Partēs ōrātiōnis', cat: 'Rērum genera', src: 'Auctōrēs', works: 'Opera singula', mine: 'Mea',
      kinds: { w: 'Verba singula', p: 'Locūtiōnēs cotīdiānae', s: 'Sententiae et dicta' },
      parts: { n: 'Nōmina', v: 'Verba', a: 'Adjectīva', d: 'Adverbia', o: 'Cētera' },
      seen: 'Verba quae quaesīvī', lists: 'Indicēs meī', addList: 'Indicem adde', name: 'Nōmen',
      start: 'Incipe', resume: 'Perge', early: 'Repete tamen nunc', next: 'Novus cursus',
      show: 'Respōnsum ostende', again: 'Iterum', got: 'Teneō', undo: 'Redī', close: 'Exī',
      status: { new: 'nova', due: 'repetenda', lapsed: 'ēlāpsa' },
      keys: 'Plēctra: spatium respōnsum ostendit; 1 = Iterum, 2 = Teneō; z = Redī.',
      saved: 'Prōgressus in hōc nāvigātrō servātur.',
      entry: 'In lexicō īnspice', also: 'Item:',
      periods: ['aetātis classicae', 'post aetātem classicam', 'Latīnitātis sērae', 'mediī aevī', 'renātārum litterārum', 'vōx recentior', 'locūtiō nostra'],
      export: 'Prōgressum exportā', import: 'Prōgressum importā', copy: 'Exscrībe',
      cards: n => one(n, 'charta', 'chartae'), due: n => `${number(n)} nunc ${n === 1 ? 'repetenda' : 'repetendae'}`, fresh: n => one(n, 'nova', 'novae'),
      known: n => one(n, 'nōta', 'nōtae'), learning: n => one(n, 'discitur', 'discuntur'),
      done: (got, again) => `Cursus cōnfectus: «Teneō» ${got}, «Iterum» ${again}.`,
      nothing: when => `Nihil hīc repetendum. Proxima charta redībit ${when}.`,
      none: 'Nūllae hīc chartae.',
      wait: (hours, days) => (hours < 1 ? 'intrā hōram' : hours < 24 ? (hours === 1 ? 'post hōram' : `post ${hours} hōrās`) : days === 1 ? 'post diem' : `post ${days} diēs`),
      // review (Claude's, 14 November 2026): everything from here to the end of the Latin.
      items: 'Verba', anyCat: 'omnia', anySrc: 'omnēs', noMine: 'nihil ēlēctum', composed: 'exemplum nostrum', card: 'Charta',
      deckHelp: 'Quae in eōdem ōrdine ēligis, adduntur (Cicerō vel Vergilius); ōrdō ōrdinem coartat (Cicerō, sed in culīnā tantum). Ōrdō in quō nihil ēlēgistī nihil coartat.',
      clear: 'Ēlēcta tolle',
      seenNote: 'Quae in lexicō īnspexeris, hīc servābuntur, in hōc tantum nāvigātrō.',
      notFound: 'In lexicō nōn inventa:', remove: 'Dēlē', removeAgain: 'Iterum tange: dēlēbitur', removeLabel: name => `Indicem «${name}» dēlē`,
      listHelp: ['Singula in singulīs versibus scrībe, vel commatibus distīncta: verbum Anglicum, verbum Latīnum (vōcālēs longās notāre necesse nōn est), vel nōmen pāginae (', '). Index in hōc nāvigātrō servātur.'],
      listNeed: 'Indicī nōmen dā et ūnum saltem verbum.',
      listNone: 'Nihil hōrum in lexicō inventum est; index factus nōn est.',
      listDone: (found, all, missed, name) => [`Inventa ${number(found)} ex ${number(all)}.`, ...(missed ? [' Nōn inventa: ', missed, '.'] : []), ' Fasciculus nunc est «', name, '».'],
      notSaved: 'Prōgressus in hōc nāvigātrō servārī nōn potest: pāginā clausā perībit.',
      backup: 'Prōgressus', backupHint: 'exportā vel importā',
      backupHelp: 'Prōgressus et indicēs tuī in hōc tantum nāvigātrō servantur. Exportā, ut alibī servēs vel in alium apparātum trānsferās; cum importāveris, in singulīs chartīs respōnsum recentius valēbit.',
      exportLabel: 'Prōgressus tuus', importLabel: 'Quod exportāvistī hūc glūtinā', copied: 'Exscrīptum',
      importBad: 'Hoc nōn est prōgressus exportātus. Tōtum glūtinā.',
      how: 'Quā ratiōne repetātur',
      importDone: (taken, older, unknown, added) => (taken === 1 ? 'Importāta 1 charta' : `Importātae ${number(taken)} chartae`)
        + (older ? `; ${number(older)} ${older === 1 ? 'relicta, hīc recentius notāta' : 'relictae, hīc recentius notātae'}` : '')
        + (unknown ? `; ${number(unknown)} in lexicō nōn ${unknown === 1 ? 'est' : 'sunt'}` : '')
        + (added ? `; ${number(added)} ${added === 1 ? 'index additus' : 'indicēs additī'}` : '') + '.',
      // "more" was Alius lūdus: until the picture cards (then the animal cards) made the games three (Claude's wording, 20 November 2026); Ubi est Theodōrus? made them four the same day.
      more: 'Aliī lūdī:', clock: '', pictures: '', places: ''
    },
    en: {
      title: 'Practice', sub: 'English to Latin: say it aloud, then check.', langLabel: 'Language',
      deck: 'Deck', kind: 'Kind', part: 'Part of speech', cat: 'Category', src: 'Source', works: 'Single works', mine: 'Mine',
      kinds: { w: 'Words', p: 'Everyday phrases', s: 'Sayings and quotations' },
      parts: { n: 'Nouns', v: 'Verbs', a: 'Adjectives', d: 'Adverbs', o: 'Other' },
      seen: 'Words I looked up', lists: 'My lists', addList: 'Add a list', name: 'Name',
      start: 'Start', resume: 'Continue', early: 'Practise early', next: 'Another round',
      show: 'Show the Latin', again: 'Again', got: 'Got it', undo: 'Undo', close: 'Close',
      status: { new: 'new', due: 'due', lapsed: 'lapsed' },
      keys: 'Keys: Space shows the Latin; 1 = Again, 2 = Got it; z = Undo.',
      saved: 'Progress is kept in this browser.',
      entry: 'Open the entry', also: 'Also:',
      periods: ['classical', 'post-classical', 'late Latin', 'medieval', 'Renaissance', 'modern', 'our formation'],
      export: 'Export progress', import: 'Import progress', copy: 'Copy',
      cards: n => one(n, 'card', 'cards'), due: n => `${number(n)} due now`, fresh: n => `${number(n)} new`,
      known: n => `${number(n)} known`, learning: n => `${number(n)} learning`,
      done: (got, again) => `Round done: Got it ${got}, Again ${again}.`,
      nothing: when => `Nothing is due. The next card comes back ${when}.`,
      none: 'No cards here: the choices leave none.',
      wait: (hours, days) => (hours < 1 ? 'within the hour' : hours < 24 ? (hours === 1 ? 'in an hour' : `in ${hours} hours`) : days === 1 ? 'in a day' : `in ${days} days`),
      items: 'Words', anyCat: 'any', anySrc: 'any', noMine: 'not chosen', composed: 'composed', card: 'Card',
      deckHelp: 'Within a group the choices add up (Cicero or Vergil); between groups they narrow (Cicero, within the kitchen). A group with nothing chosen does not narrow.',
      clear: 'Clear the choices',
      seenNote: 'Open an entry of the lexicon and it is remembered here, on this device.',
      notFound: 'Not found in the lexicon:', remove: 'Delete', removeAgain: 'Tap again to delete', removeLabel: name => `Delete the list ${name}`,
      listHelp: ['One item per line, or separated by commas: an English headword, a Latin word (macrons optional) or the last part of an entry’s address (', '). The list stays on this device.'],
      listNeed: 'Give the list a name and at least one item.',
      listNone: 'None of these items was found in the lexicon, so no list was made.',
      listDone: (found, all, missed, name) => [`Matched ${number(found)} of ${one(all, 'item', 'items')}.`, ...(missed ? [' Not found: ', missed, '.'] : []), ' The deck is now “', name, '”.'],
      notSaved: 'Progress cannot be saved in this browser: it will last only until the page is closed.',
      backup: 'Backup', backupHint: 'export or import your progress',
      backupHelp: 'Your progress and your lists are kept on this device only. Export them as text to keep, or to move to another device; import puts them back, and for each card the later answer wins.',
      exportLabel: 'Your progress', importLabel: 'Paste the exported text here', copied: 'Copied',
      importBad: 'That is not an export of progress: paste the whole text, from the first brace to the last.',
      how: 'How the practice works',
      importDone: (taken, older, unknown, added) => `Imported ${one(taken, 'card', 'cards')}`
        + (older ? `; ${number(older)} left as they were, marked here more recently` : '')
        + (unknown ? `; ${number(unknown)} not in the lexicon` : '')
        + (added ? `; ${one(added, 'list', 'lists')} added` : '') + '.',
      more: 'Other games:', clock: 'the clock, ', pictures: 'picture cards, ', places: 'the adverbs of place, '
    }
  };
  let lang = 'la';
  try { if (localStorage.getItem(KEY.lang) === 'en') lang = 'en'; } catch {}
  const t = key => T[lang][key];

  // A piece of text with its language. The interface's own words take the page's language; what is
  // always Latin (the answers, the categories) says "la", what is always English (the cue, the
  // glosses, the authors' names and citations) says "en", and what the reader typed says "": the
  // display options (macrons, j, v) change Latin only, and a screen reader must know which is which.
  function el(tag, className, content, language) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (language !== undefined) node.lang = language;
    node.append(...[].concat(content === undefined ? [] : content));
    return node;
  }
  const polish = scope => window.lexiconDisplay?.render(scope);
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
    q('p-saved').textContent = saving ? t('saved') : t('notSaved');
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
  const seen = new Set();
  function readSeen() {
    seen.clear();
    Object.keys(read(KEY.seen, {})).forEach(id => { if (byId.has(id)) seen.add(id); });
  }
  readSeen();

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
    const known = { kind: KINDS, part: PARTS, cat: data.categories.map(c => c[0]), src: sources.map(s => s.id), mine: mineIds() };
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
  let toggles = [];   // {group, id, button, count}
  function toggle(group, id, label, extra) {
    const count = el('span', 'pt-n');
    const button = el('button', '', [el('span', 'pt-name', label), ...(extra ? [extra] : []), count]);
    button.type = 'button';
    button.dataset.group = group; button.dataset.id = id;
    button.addEventListener('click', () => choose(group, id));
    toggles.push({ group, id, button, count });
    return button;
  }
  function choose(group, id) {
    const chosen = deck[group], at = chosen.indexOf(id);
    if (at < 0) chosen.push(id); else if (group !== 'kind' || chosen.length > 1) chosen.splice(at, 1);
    write(KEY.deck, deck);
    refresh();
  }
  // The author's name as it is shown: English, but the plays of Plautus and Terence by their Latin titles.
  const sourceName = source => el('span', '', source.name, source.la ? 'la' : 'en');
  function drawToggles() {
    toggles = [];
    q('p-kind').replaceChildren(...KINDS.map(id => toggle('kind', id, t('kinds')[id])));
    q('p-part').replaceChildren(...PARTS.map(id => toggle('part', id, t('parts')[id])));
    // In Latin the categories go by their Latin names alone; in English the English stands beside.
    q('p-cat').replaceChildren(...data.categories.map(([id, latin, name]) =>
      toggle('cat', id, el('span', 'pt-la', latin, 'la'), lang === 'en' ? el('span', 'pt-en', name, 'en') : null)));
    q('p-src').replaceChildren(...sources.filter(source => source.of === undefined).map(source => toggle('src', source.id, sourceName(source))));
    // The works stand under their author's name, apart from the authors: choosing "Vergil" already
    // takes all of his, so a work is chosen in his place, not beside him.
    const works = [];
    sources.forEach((source, n) => {
      const mine = sources.filter(work => work.of === n);
      if (!mine.length) return;
      const group = el('div', 'pworks-author', [el('span', 'pworks-name', source.name, 'en'), ...mine.map(work => toggle('src', work.id, sourceName(work)))]);
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', source.name);
      works.push(group);
    });
    q('p-works').replaceChildren(...works);
    q('p-works').parentElement.hidden = !works.length;
    drawMine();
  }
  let armed = '';
  function drawMine() {
    toggles = toggles.filter(entry => entry.group !== 'mine');
    const rows = [toggle('mine', 'seen', t('seen'))];
    if (!seen.size) rows.push(el('span', 'p-help pmine-note', t('seenNote')));
    if (lists.length) rows.push(el('h3', '', t('lists')));
    lists.forEach(list => {
      const remove = el('button', 'p-delete', t('remove'));
      remove.type = 'button';
      remove.setAttribute('aria-label', t('removeLabel')(list.name));
      // Two taps, not a dialog: the first asks, the second deletes.
      remove.addEventListener('click', () => {
        if (armed !== list.id) {
          armed = list.id; remove.textContent = t('removeAgain'); polish(remove);
          setTimeout(() => { if (armed === list.id) { armed = ''; remove.textContent = t('remove'); polish(remove); } }, 4000);
          return;
        }
        armed = '';
        lists = lists.filter(other => other !== list);
        saveLists(); tidyDeck(); write(KEY.deck, deck); drawMine(); refresh();
      });
      rows.push(el('div', 'pmine-list', [toggle('mine', 'list:' + list.id, el('span', '', list.name, '')), remove]));
      if (list.missed.length) rows.push(el('span', 'p-help pmine-note', [t('notFound') + ' ', el('span', '', list.missed.join(', '), '')]));
    });
    q('p-mine').replaceChildren(...rows);
  }
  // A choice as it is named in the deck's line: a piece of text, with its language where it has one.
  const named = {
    kind: id => t('kinds')[id], part: id => t('parts')[id],
    cat: id => el('span', '', data.categories.find(c => c[0] === id)[1], 'la'),
    src: id => { const source = sources[sourceNumber.get(id)]; return source.of === undefined ? sourceName(source) : el('span', '', [sourceName(sources[source.of]), ', ', sourceName(source)]); },
    mine: id => (id === 'seen' ? t('seen') : el('span', '', (lists.find(list => 'list:' + list.id === id) || {}).name || '', ''))
  };
  const between = (pieces, separator) => pieces.flatMap((piece, n) => (n ? [separator, piece] : [piece]));
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
    const listed = group => (group === 'part' && !words ? [] : between(deck[group].map(named[group]), ', '));
    const or = (pieces, otherwise) => (pieces.length ? pieces : [otherwise]);
    q('p-cat-now').replaceChildren(...or(listed('cat'), t('anyCat')));
    q('p-src-now').replaceChildren(...or(listed('src'), t('anySrc')));
    q('p-mine-now').replaceChildren(...or(listed('mine'), t('noMine')));
    q('p-now').replaceChildren(...between(GROUPS.map(listed).filter(pieces => pieces.length).map(pieces => el('span', '', pieces)), ' · '));
    q('p-clear').hidden = !(deck.part.length || deck.cat.length || deck.src.length || deck.mine.length);
  }

  // The lobby: the deck's count, the meter, and the way in ---------------------------------------------
  const dueIn = (list, now) => list.filter(card => rec(card.i) && rec(card.i).due <= now).length;
  // How long until a card comes back: under a day, in hours, as it always was; from a day up, in
  // days of the calendar (dayStart), since that is how the waits are counted: a card marked on
  // Monday evening for Thursday comes back "in 3 days", though that is 56 hours.
  function when(due, now) {
    const ms = due - now, hours = ms < HOUR ? 0 : Math.round(ms / HOUR);
    return t('wait')(hours, Math.max(1, Math.round((dayStart(due, 0) - dayStart(now, 0)) / DAY)));
  }
  // What the deck holds now: cards due, cards new, and if neither, when the next one comes back.
  function standing() {
    const now = Date.now(), due = dueIn(pool, now), fresh = pool.filter(card => !rec(card.i)).length;
    const met = pool.filter(card => rec(card.i));
    const waiting = [due ? t('due')(due) : '', fresh ? t('fresh')(fresh) : ''].filter(Boolean).join(', ') + '.';
    if (due || fresh) return { more: true, early: false, due, fresh, text: waiting };
    if (!met.length) return { more: false, early: false, due, fresh, text: t('none') };
    return { more: false, early: true, due, fresh, text: t('nothing')(when(Math.min(...met.map(card => rec(card.i).due)), now)) };
  }
  function drawLobby() {
    const state = standing();
    q('p-count').textContent = `${t('cards')(pool.length)} · ${t('due')(state.due)} · ${t('fresh')(state.fresh)}`;
    const known = pool.filter(card => box(card.i) >= KNOWN).length, learning = pool.filter(card => box(card.i) >= 0 && box(card.i) < KNOWN).length;
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

  // Rounds: twelve cards, one for each Latin headword (guard and security officer are both
  // custōs). While the deck has new cards, at most half of a round is repetition (ROUND_DUE), so
  // that the day after a long session is not that session over again (Jack, 15 November 2026);
  // new cards, in no order, are the rest. With fewer due, new cards fill the round; with no new
  // cards left, due ones do. The due cards taken are first those in box 0 (missed, and waiting
  // to be seen again), then the rest, the longest overdue first, and among cards due on the same
  // day in no order. The round is then mixed, repetitions among new cards. An early round, when
  // nothing is due and nothing is new, takes the cards that are due soonest, in that order.
  // The round is kept on the device, so that a reader who opens a card's entry and comes back
  // finds the same card, with its answer still shown (Jack, 14 November 2026). It was kept for the
  // visit only (sessionStorage) until 15 November 2026, when Jack found it lost on his iPhone: a
  // link from the entry to another site opens a sheet over the app, and after it the app had a new
  // visit, with no way back and no round. So it is in localStorage, with the time it was kept: a
  // round can be taken up again for ROUND_KEPT (12 hours), and opens by itself, over the lobby,
  // for ROUND_REOPENS (1 hour); after that the lobby offers it (Perge). An entry opened from the
  // current card shows a link back to the round (src/page.js reads this key).
  const idle = () => ({ queue: [], current: null, shown: false, done: false, got: 0, again: 0, missed: [], size: 0, last: '', undo: null });
  let round = idle();
  const ROUND_KEPT = 12 * HOUR, ROUND_REOPENS = HOUR;
  const forget = () => { try { localStorage.removeItem(KEY.round); } catch {} };
  function keep() {
    if (!round.current && !round.done) { forget(); return; }
    write(KEY.round, { ...round, queue: round.queue.map(card => card.i), current: round.current ? round.current.i : null, open: game.open, at: Date.now() });
  }
  function restore() {
    let kept = read(KEY.round, null), age = 0;
    if (kept && typeof kept === 'object') {
      age = Date.now() - kept.at;
      if (!(age >= 0 && age <= ROUND_KEPT)) { forget(); return false; }
    } else {
      // A round in progress when the round moved out of sessionStorage: taken up once from there.
      try { kept = JSON.parse(sessionStorage.getItem(KEY.round)); sessionStorage.removeItem(KEY.round); } catch {}
    }
    if (!kept || typeof kept !== 'object' || !Array.isArray(kept.queue)) return false;
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
    const now = Date.now(), last = round.last, heads = new Set();
    // Up to so many cards of a list, in its order, none with a headword the round already has.
    const take = (list, most) => {
      const taken = [];
      for (const card of list) {
        if (taken.length >= most) break;
        if (!heads.has(card.head)) { heads.add(card.head); taken.push(card); }
      }
      return taken;
    };
    let queue;
    if (early) queue = take(pool.filter(card => rec(card.i)).sort((a, b) => rec(a.i).due - rec(b.i).due), ROUND);
    else {
      const fresh = shuffled(pool.filter(card => !rec(card.i)));
      // Shuffled first: the sort keeps that order among cards of the same rank and the same day.
      const order = new Map();   // for each due card: 0 if it is in box 0, then the day it was due
      pool.forEach(card => { const record = rec(card.i); if (record && record.due <= now) order.set(card, [record.b === 0 ? 0 : 1, dayStart(record.due, 0)]); });
      const due = shuffled([...order.keys()]).sort((a, b) => order.get(a)[0] - order.get(b)[0] || order.get(a)[1] - order.get(b)[1]);
      const share = (ROUND_DUE_MORE.find(([waiting]) => due.length > waiting) || [0, ROUND_DUE])[1];
      const again = take(due, fresh.length ? share : ROUND), novel = take(fresh, ROUND - again.length);
      // Too few new cards to fill the round: more of the due ones, if there are any.
      queue = shuffled(again.concat(novel, take(due, ROUND - again.length - novel.length)));
    }
    round = idle();
    round.queue = queue;
    if (round.queue.length > 1 && round.queue[0].i === last) round.queue.push(round.queue.shift());
    round.size = round.queue.length;
    if (round.queue.length) next();
    return round.size > 0;
  }
  function next() {
    round.current = round.queue.shift() || null; round.shown = false;
    round.done = !round.current;
    if (round.current) round.last = round.current.i;
  }
  function reveal() {
    if (!round.current || round.shown) return;
    round.shown = true;
    drawCard(); keep();
    q('g-got').focus({ preventScroll: true });
  }
  function mark(got) {
    if (!round.current || !round.shown) return;
    const now = Date.now(), id = round.current.i, record = rec(id);
    // One step back (Jack, 14 November 2026: "sometimes I press the wrong button"): what the card's
    // record was before this mark, a new card having none, and the round's tally.
    round.undo = { id, before: progress.cards[id] || null, got: round.got, again: round.again, missed: round.missed.slice() };
    const b = boxAfter(record, got);
    progress.cards[id] = { b, due: dueFrom(now, b), t: now };
    if (got) round.got++; else { round.again++; round.missed.push(id); }   // a missed card is not put back into this round
    save(); next();
    drawCard(); keep();
    const button = round.done ? [q('g-next'), q('g-early'), q('g-exit')].find(b => !b.hidden) : q('g-show');
    if (document.activeElement && document.activeElement.closest('.pgame-actions')) button.focus({ preventScroll: true });
  }
  // Back to the card just marked, as it was before the mark and with its answer shown, to be marked
  // again. It is offered until the next mark.
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
    const card = round.current, record = card ? rec(card.i) : null;
    const position = round.size - round.queue.length;
    q('g-deck').replaceChildren(...[...q('p-now').childNodes].map(node => node.cloneNode(true)));
    q('g-pos').textContent = round.done ? '' : `${position} / ${round.size}`;
    q('g-bar').style.width = (100 * (round.done ? round.size : position - 1) / (round.size || 1)) + '%';
    q('g-undo').disabled = !round.undo;
    q('g-card').classList.toggle('front', !!card && !round.shown);
    q('g-card').classList.toggle('finished', round.done);
    q('g-status').textContent = card ? t('status')[!record ? 'new' : record.b === 0 ? 'lapsed' : 'due'] : '';
    q('g-status').hidden = !card;
    q('g-cue').hidden = !card;
    q('g-back').hidden = !card || !round.shown;
    q('g-end').hidden = !round.done;
    q('g-front').hidden = !card || round.shown;
    q('g-marks').hidden = !card || !round.shown;
    q('g-done').hidden = !round.done;
    q('g-keys').hidden = round.done;
    if (card) {
      q('g-cue').replaceChildren(card.e, ...(card.p ? [' ', el('span', 'pos', card.p)] : []));
      // What the cue alone leaves open (Jack, 15 November 2026: "in turn" is not enough to know
      // which word is wanted): the headword's other English names, the Latin word's own gloss
      // where it says more, and the English of the example, which shows the word at work. All of
      // it is English, so none of it gives the answer away. Once the card is turned the example
      // stands on the back with its Latin, and is not said twice.
      // The other names are English, so their label is English whatever the interface's language,
      // and is written as an entry's own page writes it: "also take turns, in turns, alternately",
      // lower case, no colon (Jack, 16 November 2026: in the Latin interface the line began
      // "Item:", and "it looks like the english word 'item', which is confusing since the rest of
      // the ux here is in english"). The back's line of other Latin words keeps the interface's
      // label (Item: / Also:).
      const plain = text => fold(text).replace(/[^a-z0-9]+/g, '');   // a saying is not given as its own example
      const example = exampleOf(card), context = example && plain(example[1]) !== plain(card.e) ? example[1] : '';
      q('g-more').textContent = card.o ? `also ${card.o.join(', ')}` : ''; q('g-more').hidden = !card.o;
      q('g-gloss').textContent = card.g || ''; q('g-gloss').hidden = !card.g;
      q('g-context').textContent = context ? `“${context}”` : ''; q('g-context').hidden = !context || round.shown;
      if (round.shown) drawBack(card);
    } else {
      // Between rounds: what the round came to, what is waiting, and when the next card comes back.
      // With them, the words marked Again, to be looked at once more (Claude's addition, 14 November 2026).
      const state = standing();
      const missed = round.missed.length ? [' ', el('span', 'pgame-missed', [`«${t('again')}»: `, el('span', '', round.missed.map(id => byId.get(id).head).join(', '), 'la')])] : [];
      q('g-end').replaceChildren(el('span', 'pgame-tally', t('done')(round.got, round.again)), ' ', state.text, ...missed);
      q('g-next').hidden = !state.more; q('g-early').hidden = !state.early;
    }
    polish(game);
  }
  // One example, and only one that contains the answer (the builder keeps no other): from a
  // chosen source if the card has one, else its first.
  function exampleOf(card) {
    const chosen = deck.src.map(id => sourceNumber.get(id));
    return (card.q || []).find(row => (row[3] || []).some(n => chosen.includes(n))) || (card.q || [])[0];
  }
  function drawBack(card) {
    const period = card.r || 0, ours = period === data.periods.indexOf('ours');
    // A form of our own carries the asterisk of an unattested form, and the line under it says so
    // in words (Jack, 14 November 2026: the asterisk alone is not clear here).
    const star = el('span', 'ours', '*');
    star.title = t('periods')[period];
    q('g-la').replaceChildren(...(ours ? [star] : []), el('b', '', card.head), card.l.slice(card.head.length));
    // A phrase is not set as large as a single word.
    q('g-la').classList.toggle('long', card.head.includes(' '));
    // Where the answer comes from: its period, and the first places it is cited from.
    q('g-origin').replaceChildren(el('span', 'pgame-period', t('periods')[period]), ...(card.v ? [' · ', el('span', '', card.v.join('; '), 'en')] : []));
    // The record's other words, for the reader who said one of them (the coordinating session's idea).
    q('g-also').replaceChildren(t('also') + ' ', el('span', '', (card.a || []).join(', '), 'la'));
    q('g-also').hidden = !card.a;
    const example = exampleOf(card);
    q('g-ex').hidden = !example;
    if (example) {
      q('g-ex-la').textContent = example[0];
      q('g-ex-en').replaceChildren(el('span', '', example[1], 'en'), ' ', example[2] ? el('span', 'src', example[2], 'en') : el('span', 'src composed', t('composed')));
    }
    q('g-entry').href = `c/${card.i}.html`;
    // Beside the way to the entry, the flag (review.js; Jack, 15 November 2026: most problems
    // are noticed while practising). It touches neither the round nor the step back. The editor's
    // "looks right" is not here: he reviews in a private page of his own.
    const verdict = window.lexiconReview ? window.lexiconReview.controls({ id: card.i, rev: card.h, english: card.e, where: 'game' }).box : null;
    q('g-verdict').replaceChildren(...(verdict ? [verdict] : []));
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
  // The deck changed (a choice, a list, an import): count it again; a round begun with the old deck is dropped.
  function refresh() {
    round = idle(); keep();
    drawDeck();
    drawLobby();
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
  // A tap on the card itself shows its answer.
  q('g-card').addEventListener('click', event => { if (!event.target.closest('a')) reveal(); });
  q('p-clear').addEventListener('click', () => { deck.part = []; deck.cat = []; deck.src = []; deck.mine = []; write(KEY.deck, deck); refresh(); });
  document.addEventListener('keydown', event => {
    // Not while the flag's box is open over the round: its keys are its own.
    if (!game.open || event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.flagsheet[open]') || event.target.closest('input, textarea')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeGame(); }
    else if ((event.key === ' ' || event.key === 'Enter') && round.current && !round.shown && !event.target.closest('button, a')) { event.preventDefault(); reveal(); }
    else if (event.key === '1' && round.shown) mark(false);
    else if (event.key === '2' && round.shown) mark(true);
    else if ((event.key === 'z' || event.key === 'Backspace') && round.undo) { event.preventDefault(); undo(); }
  });
  // Back from an entry without the page being loaded again: it may have been added to the words looked up.
  addEventListener('pageshow', event => { if (event.persisted) { readSeen(); drawDeck(); drawLobby(); if (game.open) drawCard(); } });

  // A list of the reader's own ---------------------------------------------------------------------
  q('p-list-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = q('p-list-name').value.replace(/\s+/g, ' ').trim(), items = splitItems(q('p-list-text').value);
    const status = q('p-list-status');
    const say = (...pieces) => { status.replaceChildren(...pieces); polish(status); };
    if (!name || !items.length) { say(t('listNeed')); return; }
    const list = makeList('l' + Date.now().toString(36), name, items);
    if (!list.ids.size) { say(t('listNone')); return; }
    lists.push(list);
    saveLists();
    // A new list becomes the deck, whole: its phrases with its words, and no part of speech,
    // category or source left over from before to hide half of it.
    deck.mine = ['list:' + list.id]; deck.part = []; deck.cat = []; deck.src = [];
    deck.kind = KINDS.filter(kind => [...list.ids].some(id => byId.get(id).kind === kind));
    q('p-list-name').value = ''; q('p-list-text').value = '';
    write(KEY.deck, deck);
    drawMine(); refresh();
    // What the reader typed is in no language the page knows.
    const typed = text => el('span', '', text, '');
    say(...t('listDone')(items.length - list.missed.length, items.length, list.missed.length ? typed(list.missed.join(', ')) : null, typed(name)));
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
    q('p-copy').textContent = t('copied'); polish(q('p-copy'));
    setTimeout(() => { q('p-copy').textContent = t('copy'); polish(q('p-copy')); }, 2000);
  });
  // Import takes this page's own export and the record of the drill in Jack's hub, whose word cards
  // are "v:<record id>" (its sentence cards, and words the lexicon no longer has, are left out).
  // Where both copies have a card, the later answer wins.
  q('p-import').addEventListener('click', () => {
    const status = q('p-import-status');
    const say = text => { status.textContent = text; polish(status); };
    let incoming;
    try { incoming = JSON.parse(q('p-import-text').value); } catch { incoming = null; }
    if (!incoming || typeof incoming !== 'object' || !incoming.cards || typeof incoming.cards !== 'object') { say(t('importBad')); return; }
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
    if (taken || added) { q('p-import-text').value = ''; refresh(); }
    say(t('importDone')(taken, older, unknown, added));
  });

  // The language ----------------------------------------------------------------------------------------
  // The page's own language follows the choice, so the site's header and footer, which stay in
  // English, say that they are English.
  document.querySelectorAll('header.site-top, footer.site-foot').forEach(part => { part.lang = 'en'; });
  function applyLanguage() {
    document.documentElement.lang = lang;
    document.title = `${t('title')} · Lexicon Latīnitātis Cotīdiānae`;
    document.querySelectorAll('[data-t]').forEach(node => { node.textContent = t(node.dataset.t); });
    document.querySelectorAll('[data-t-label]').forEach(node => node.setAttribute('aria-label', t(node.dataset.tLabel)));
    q('p-lang').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    const [before, after] = t('listHelp');
    q('p-list-help').replaceChildren(before, el('code', '', 'brush-teeth', 'en'), after);
    q('p-list-status').textContent = ''; q('p-import-status').textContent = '';
    drawToggles(); drawDeck(); drawLobby();
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
  root.hidden = false;
  applyLanguage();
  if (reopen) openGame();
})();
