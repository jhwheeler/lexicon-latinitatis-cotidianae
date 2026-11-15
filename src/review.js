(() => {
  // Review (Jack, 15 November 2026): every entry is a draft until the editor has read it, and he
  // reads on his phone. An entry's page ends with two quiet controls: Flag, for anyone, which
  // opens a small box (a few reasons to tap, a line to write); and Looks right, for the editor
  // alone, in one tap. The back of a practice card has the same two. A verdict is kept on the
  // device with the revision of the record it was given on (data-rev, from record_revision in
  // the builder), so it is never applied to a text the reader did not see. review.html gathers
  // what has not been sent into one report, to share, copy or open as an issue; in the
  // repository scripts/apply_review.py reads it. There is no server. See docs/review.md.
  //
  // This script runs on every entry's page, on review.html and on practice.html (where
  // practice.js asks it for the controls of a card).
  const KEY = 'lexicon-review', LANG = 'lexicon-practice-lang', QUEUE = 'lexicon-review-queue', SKIPPED = 'lexicon-review-skipped';
  const REPO = 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae';
  const SITE = 'https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/';
  const REASONS = ['word', 'quantity', 'meaning', 'example', 'source', 'other'];
  // A link can carry only so much: past this, a report is copied, not opened as an issue.
  const LINK_LIMIT = 6000;
  const number = n => n.toLocaleString('en');
  const q = id => document.getElementById(id);

  // The words of the interface. It follows the practice page's choice: Latin unless the reader
  // chose English there. The Latin is Claude's wording throughout, awaiting Jack's review; the
  // coordinating session gave Rēctē, Notā, Recēnsiō, Proxima, Praeterī, Mitte, Missa, Recēnsor
  // sum and the six reasons, and "Incipe", "Exscrībe" and "Lingua" are already in use on the
  // practice page.
  const MONTHS = {
    la: ['Jānuāriī', 'Februāriī', 'Mārtiī', 'Aprīlis', 'Majī', 'Jūniī', 'Jūliī', 'Augustī', 'Septembris', 'Octōbris', 'Novembris', 'Decembris'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  const T = {
    la: {
      flag: 'Notā', ok: 'Rēctē', title: 'Recēnsiō', next: 'Proxima', skip: 'Praeterī', send: 'Mitte', sent: 'Missa', editor: 'Recēnsor sum',
      reasons: { word: 'verbum', quantity: 'quantitās', meaning: 'sēnsus', example: 'exemplum', source: 'fōns', other: 'aliud' },
      langLabel: 'Lingua', start: 'Incipe', copy: 'Exscrībe', copied: 'Exscrīptum',
      ask: 'Quid vitiī est?', note: 'Paucīs verbīs, sī vīs', save: 'Servā', cancel: 'Omitte', withdraw: 'Notam tolle', alt: 'Vel per GitHub mitte',
      okState: date => `«Rēctē» dīxistī ${date}.`,
      flagState: (reasons, date) => `Notāvistī ${date}${reasons ? ': ' + reasons : ''}.`,
      stale: date => `Haec pāgina mūtāta est postquam jūdicāvistī (${date}).`,
      unsent: 'In hōc nāvigātrō servātur, dōnec mittās:', isSent: 'Missum.',
      date: when => `diē ${when.getDate()} ${MONTHS.la[when.getMonth()]}`,
      sub: 'Nihil hīc prō certō habētur, nisi quod recēnsor lēgit et probāvit.',
      intro: 'Sī quid in lexicō vitiōsum vidētur, in ipsā pāginā notā. Notae in hōc nāvigātrō servantur, dōnec eās hinc mittās.',
      countH: 'Summa',
      counts: { done: 'in lexicō probāta', ok: '«Rēctē», nōndum missa', flag: 'notāta, nōndum missa', left: 'recēnsenda restant', waiting: 'missa, nōndum in lexicō' },
      editorHelp: 'Recēnsōrī sōlī licet «Rēctē» dīcere; cēterī notant.',
      queueH: 'Proxima recēnsenda',
      queueHelp: 'Prīmum quae quaesīvistī, deinde quae exercuistī, tum cētera per rērum genera.',
      why: { seen: 'quaesītum', practised: 'exercitātum' }, more: 'Plūra', queueEmpty: 'Nihil restat.',
      sendH: 'Mitte',
      sendHelp: 'Quae jūdicāvistī nec adhūc mīsistī in ūnam relātiōnem colliguntur. Eam commūnicā, exscrībe, vel per GitHub mitte; deinde «Missa» tange.',
      sendNothing: 'Nihil mittendum est.',
      reportLabel: 'Relātiō', share: 'Commūnicā', issue: 'Per GitHub mitte',
      tooLong: 'Longior est relātiō quam ut per GitHub aperīrī possit: exscrībe et ibi glūtinā.',
      staleOk: n => `«Rēctē» dīxistī dē ${number(n)}, ${n === 1 ? 'quod posteā mūtātum est: dēnuō legendum est' : 'quae posteā mūtāta sunt: dēnuō legenda sunt'}.`,
      waiting: n => `${number(n)} ${n === 1 ? 'missum' : 'missa'}, nōndum in lexicō.`, resend: 'Iterum mitte',
      pendingOk: n => `«Rēctē»: ${number(n)}`
    },
    en: {
      flag: 'Flag', ok: 'Looks right', title: 'Review', next: 'Next', skip: 'Skip', send: 'Send', sent: 'Sent', editor: 'I am the reviewer',
      reasons: { word: 'wrong word', quantity: 'vowel length', meaning: 'meaning', example: 'example', source: 'source', other: 'other' },
      langLabel: 'Language', start: 'Start', copy: 'Copy', copied: 'Copied',
      ask: 'What looks wrong?', note: 'A few words, if you like', save: 'Save', cancel: 'Cancel', withdraw: 'Withdraw the flag', alt: 'Or send it as a GitHub issue',
      okState: date => `You marked this right, ${date}.`,
      flagState: (reasons, date) => `You flagged this, ${date}${reasons ? ': ' + reasons : ''}.`,
      stale: date => `This entry has changed since you gave your verdict (${date}).`,
      unsent: 'Kept on this device until you send it:', isSent: 'Sent.',
      date: when => `${when.getDate()} ${MONTHS.en[when.getMonth()]}`,
      sub: 'Every entry is a draft until the editor has read it.',
      intro: 'If something in the lexicon looks wrong, flag it on its own page. Flags are kept on this device until you send them from here.',
      countH: 'Where it stands',
      counts: { done: 'reviewed on the site', ok: 'marked right, not yet sent', flag: 'flagged, not yet sent', left: 'drafts to review', waiting: 'sent, not yet on the site' },
      editorHelp: 'Only the reviewer marks an entry right; everyone else flags.',
      queueH: 'What to review next',
      queueHelp: 'First what you looked up, then what you practised, then the rest by category.',
      why: { seen: 'looked up', practised: 'practised' }, more: 'More', queueEmpty: 'Nothing is left.',
      sendH: 'Send',
      sendHelp: 'Your verdicts not yet sent are gathered into one report. Share it, copy it, or open it as a GitHub issue; then tap “Sent”.',
      sendNothing: 'Nothing to send.',
      reportLabel: 'The report', share: 'Share', issue: 'Open a GitHub issue',
      tooLong: 'The report is too long to open as an issue from a link: copy it and paste it there.',
      staleOk: n => `${number(n)} marked right ${n === 1 ? 'has' : 'have'} changed since: ${n === 1 ? 'it wants' : 'they want'} reading again.`,
      waiting: n => `${number(n)} sent, not yet on the site.`, resend: 'Send again',
      pendingOk: n => `Marked right: ${number(n)}`
    }
  };
  function language() {
    try { return localStorage.getItem(LANG) === 'en' ? 'en' : 'la'; } catch { return 'la'; }
  }
  const t = key => T[language()][key];
  const polish = scope => window.lexiconDisplay?.render(scope);
  // A piece of text with its language (see practice.js): the interface's words take the language
  // of the controls, and what the reader typed is in none the page knows.
  function el(tag, className, content, lang) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (lang !== undefined) node.lang = lang;
    node.append(...[].concat(content === undefined || content === null ? [] : content));
    return node;
  }
  function icon(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shape.setAttribute('d', path); shape.setAttribute('fill', 'none'); shape.setAttribute('stroke', 'currentColor');
    shape.setAttribute('stroke-width', '1.8'); shape.setAttribute('stroke-linecap', 'round'); shape.setAttribute('stroke-linejoin', 'round');
    svg.append(shape);
    return svg;
  }
  const FLAG = 'M6 21V4M6 5h11l-2.5 4L17 13H6', TICK = 'M5 12.5l4.5 4.5L19 7.5';

  // The verdicts ------------------------------------------------------------------------------------
  // One record for the device: {editor: is the reader the reviewer, verdicts: {id: {v: 'ok' or
  // 'flag', r: reasons, n: note, t: when, rev: the record's revision, sent: when it was sent}}}.
  // Where storage is blocked the verdicts last for the visit.
  let memory = null;
  function load() {
    if (memory) return memory;
    let kept = null;
    try { kept = JSON.parse(localStorage.getItem(KEY)); } catch {}
    const state = { editor: !!(kept && kept.editor), verdicts: {} };
    Object.entries(kept && kept.verdicts && typeof kept.verdicts === 'object' ? kept.verdicts : {}).forEach(([id, verdict]) => {
      if (!verdict || (verdict.v !== 'ok' && verdict.v !== 'flag') || typeof verdict.rev !== 'string' || !Number.isFinite(verdict.t)) return;
      state.verdicts[id] = { v: verdict.v, r: Array.isArray(verdict.r) ? verdict.r.filter(reason => REASONS.includes(reason)) : [],
        n: typeof verdict.n === 'string' ? verdict.n : '', t: verdict.t, rev: verdict.rev, ...(Number.isFinite(verdict.sent) ? { sent: verdict.sent } : {}) };
    });
    return state;
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); memory = null; } catch { memory = state; }
  }
  const verdictOf = id => load().verdicts[id] || null;
  function give(id, verdict) {
    const state = load();
    if (verdict) state.verdicts[id] = verdict; else delete state.verdicts[id];
    save(state);
  }
  const isEditor = () => load().editor;

  // The flag box: reasons to tap, a line to write, Save -------------------------------------------------
  function flagForm({ id, rev, english, done }) {
    const current = verdictOf(id), mine = current && current.v === 'flag' && current.rev === rev ? current : null;
    const chosen = new Set(mine ? mine.r : []);
    const chips = REASONS.map(reason => {
      const chip = el('button', 'flagbox-chip', t('reasons')[reason]);
      chip.type = 'button';
      chip.dataset.reason = reason;
      chip.setAttribute('aria-pressed', String(chosen.has(reason)));
      chip.addEventListener('click', () => {
        if (chosen.has(reason)) chosen.delete(reason); else chosen.add(reason);
        chip.setAttribute('aria-pressed', String(chosen.has(reason)));
      });
      return chip;
    });
    const group = el('div', 'flagbox-chips', chips);
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', t('ask'));
    const field = el('input', 'flagbox-note');
    field.type = 'text'; field.maxLength = 300; field.id = `flag-note-${id}`; field.lang = ''; field.autocomplete = 'off';
    field.value = mine ? mine.n : '';
    const label = el('label', '', t('note'));
    label.htmlFor = field.id;
    const button = (className, text, type = 'button') => { const b = el('button', className, text); b.type = type; return b; };
    const saveButton = button('flagbox-save', t('save'), 'submit'), cancel = button('flagbox-cancel', t('cancel'));
    const withdraw = mine ? button('flagbox-withdraw', t('withdraw')) : null;
    // For a stranger with a GitHub account: the same flag as an issue, filled in.
    const issue = el('a', '', t('alt'));
    issue.target = '_blank'; issue.rel = 'noopener noreferrer';
    const address = () => {
      const reasons = REASONS.filter(reason => chosen.has(reason)).map(reason => T.en.reasons[reason]).join(', ');
      const body = `Page: ${SITE}c/${id}.html\nRevision: ${rev}\n\nWhat looks wrong: ${reasons}\n\n${field.value.trim()}\n`;
      return `${REPO}/issues/new?title=${encodeURIComponent('Correction: ' + (english || id))}&body=${encodeURIComponent(body)}`;
    };
    issue.href = `${REPO}/issues`;
    issue.addEventListener('click', () => { issue.href = address(); });
    const form = el('form', 'flagbox', [el('p', 'flagbox-ask', t('ask')), group, label, field,
      el('div', 'flagbox-row', [saveButton, cancel, ...(withdraw ? [withdraw] : [])]), el('p', 'flagbox-alt', issue)]);
    form.addEventListener('submit', event => {
      event.preventDefault();
      give(id, { v: 'flag', r: REASONS.filter(reason => chosen.has(reason)), n: field.value.replace(/\s+/g, ' ').trim(), t: Date.now(), rev });
      done(true);
    });
    cancel.addEventListener('click', () => done(false));
    if (withdraw) withdraw.addEventListener('click', () => { give(id, null); done(true); });
    return form;
  }

  // What a verdict says of itself, on the entry's page.
  function stateLine(id, rev, up, brief) {
    const verdict = verdictOf(id);
    if (!verdict) return null;
    const date = t('date')(new Date(verdict.t));
    if (verdict.rev !== rev) return el('p', 'verdict-state', t('stale')(date));
    const reasons = verdict.r.map(reason => t('reasons')[reason]).join(', ');
    const pieces = [verdict.v === 'ok' ? t('okState')(date) : t('flagState')(reasons, date)];
    if (verdict.v === 'flag' && verdict.n) pieces.push(' ', el('q', '', verdict.n, ''));
    if (verdict.sent) pieces.push(' ', t('isSent'));
    else if (!brief) {
      const link = el('a', '', t('title'));
      link.href = `${up}review.html`;
      pieces.push(' ', t('unsent'), ' ', link, '.');
    }
    return el('p', 'verdict-state', pieces);
  }

  // The two controls of a record: on its page (with the box under them and a line saying what was
  // decided) and on the back of a practice card (as two small buttons; the box opens over the round).
  function controls({ id, rev, reviewed, english, where, up = '', brief = false, extra, changed }) {
    const box = el('div', `verdict verdict-${where}`, [], language());
    let form = null, sheet = null;
    const current = () => { const verdict = verdictOf(id); return verdict && verdict.rev === rev ? verdict : null; };
    function close() {
      if (sheet) { try { sheet.close(); } catch {} sheet.remove(); sheet = null; }
      form = null;
    }
    function finished(saved) {
      close();
      draw();
      if (saved && changed) changed();
    }
    function draw() {
      box.lang = language();
      const mine = current();
      const flag = el('button', 'verdict-flag', [icon(FLAG), el('span', '', t('flag'))]);
      flag.type = 'button';
      flag.setAttribute('aria-pressed', String(!!mine && mine.v === 'flag'));
      flag.addEventListener('click', event => {
        event.stopPropagation();
        if (form) { finished(false); return; }
        form = flagForm({ id, rev, english, done: finished });
        if (where === 'game') {
          // Over the round, as a sheet of its own, so that the round is left as it is.
          sheet = el('dialog', 'flagsheet', form, language());
          sheet.addEventListener('cancel', event => { event.preventDefault(); finished(false); });   // Escape
          sheet.addEventListener('close', () => { if (sheet) finished(false); });
          sheet.addEventListener('click', event => { if (event.target === sheet) finished(false); });
          (document.querySelector('dialog.pgame[open]') || document.body).append(sheet);
          try { sheet.showModal(); } catch { sheet.setAttribute('open', ''); }
          polish(sheet);
        } else {
          flag.setAttribute('aria-expanded', 'true');
          box.append(form);
          polish(form);
          form.querySelector('.flagbox-chip').focus({ preventScroll: true });
        }
      });
      const row = [flag];
      // Looks right is the editor's word, and is wanted only for a record that is still a draft.
      if (isEditor() && !reviewed) {
        const ok = el('button', 'verdict-ok', [icon(TICK), el('span', '', t('ok'))]);
        ok.type = 'button';
        ok.setAttribute('aria-pressed', String(!!mine && mine.v === 'ok'));
        ok.addEventListener('click', event => {
          event.stopPropagation();
          give(id, mine && mine.v === 'ok' ? null : { v: 'ok', r: [], n: '', t: Date.now(), rev });
          finished(true);
        });
        row.push(ok);
      }
      if (where === 'game') {
        flag.setAttribute('aria-label', t('flag')); flag.title = t('flag');
        if (row[1]) { row[1].setAttribute('aria-label', t('ok')); row[1].title = t('ok'); }
      }
      const state = where === 'entry' ? stateLine(id, rev, up, brief) : null;
      if (state) state.setAttribute('role', 'status');
      const more = extra ? extra(!!mine) : null;
      box.replaceChildren(...(state ? [state] : []), el('div', 'verdict-row', more ? row.concat(more) : row));
      form = null;
      if (box.isConnected) polish(box);
    }
    draw();
    return { box, draw };
  }

  // An entry's page ---------------------------------------------------------------------------------
  // The controls stand where "Suggest a correction" stood (which is still there without scripts,
  // and is the way to GitHub inside the box). Opened from the review page (?review=1), the entry
  // is one of a queue: the controls stay at the foot of the screen, with Skip beside them, and
  // after a verdict Next leads to the following entry.
  const article = document.querySelector('article.concept[data-rev]');
  const entry = article && /\/c\/([a-z0-9-]+?)(?:\.html)?$/.exec(location.pathname);
  if (article && entry) {
    const id = entry[1], suggest = article.querySelector('.suggest'), foot = article.querySelector('.c-sources');
    const reviewing = new URLSearchParams(location.search).get('review') === '1';
    const stored = key => { try { const list = JSON.parse(sessionStorage.getItem(key)); return Array.isArray(list) ? list : []; } catch { return []; } };
    const queue = reviewing ? stored(QUEUE) : [], at = queue.indexOf(id);
    const following = queue.slice(at + 1).find(other => other !== id && !verdictOf(other));
    const onward = following ? `${following}.html?review=1` : '../review.html';
    // Skip before a verdict, Next after one: one tap either way.
    function onwardLink(judged) {
      const link = el('a', 'verdict-next', judged ? t('next') : t('skip'));
      link.href = onward;
      if (!judged) link.addEventListener('click', () => { try { sessionStorage.setItem(SKIPPED, JSON.stringify([...new Set(stored(SKIPPED).concat(id))])); } catch {} });
      return link;
    }
    const made = controls({
      id, rev: article.dataset.rev, reviewed: article.dataset.status === 'reviewed', where: 'entry', up: '../', brief: reviewing,
      english: (article.querySelector('h1.hw')?.firstChild?.textContent || id).trim(),
      extra: reviewing ? onwardLink : null
    });
    if (suggest) suggest.hidden = true;
    (foot || article).append(made.box);
    if (reviewing) { made.box.classList.add('verdict-bar'); document.body.classList.add('reviewing'); }
    polish(made.box);
  }

  // The review page ---------------------------------------------------------------------------------
  const page = q('review'), data = window.lexiconPractice;
  if (page && data) {
    const cards = data.cards, byId = new Map(cards.map(card => [card.i, card]));
    const headOf = latin => /^(.+?)(?=\s*(?:,|\(|$))/.exec(latin)[1];
    const local = key => { try { const value = JSON.parse(localStorage.getItem(key)); return value && typeof value === 'object' ? value : {}; } catch { return {}; } };
    const session = key => { try { const list = JSON.parse(sessionStorage.getItem(key)); return Array.isArray(list) ? list : []; } catch { return []; } };
    const PAGE = 20;
    let shown = PAGE, report = null;

    // What stands where: the site's own count, the verdicts given here, and the queue.
    function standing() {
      const state = load(), verdicts = Object.entries(state.verdicts).filter(([id]) => byId.has(id));
      const fresh = ([id, verdict]) => verdict.rev === byId.get(id).h;
      const unsent = verdicts.filter(([, verdict]) => !verdict.sent);
      // A record judged on its present text is out of the queue; one that has changed since comes back.
      const judged = new Set(verdicts.filter(fresh).map(([id]) => id));
      const drafts = cards.filter(card => !card.d && !judged.has(card.i));
      const seen = local('lexicon-seen'), practised = (local('lexicon-practice').cards) || {};
      const skipped = new Set(session(SKIPPED));
      const rank = card => (skipped.has(card.i) ? 3 : seen[card.i] ? 0 : practised[card.i] ? 1 : 2);
      const order = new Map(data.categories.map(([key], n) => [key, n]));
      const recent = card => -(rank(card) === 0 ? seen[card.i] : rank(card) === 1 ? (practised[card.i].t || 0) : 0);
      const queue = drafts.map((card, n) => [rank(card), recent(card), order.get(card.k), n, card])
        .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]).map(row => row[4]);
      return {
        done: cards.filter(card => card.d).length, queue, seen, practised,
        ok: unsent.filter(pair => pair[1].v === 'ok' && fresh(pair)),
        staleOk: unsent.filter(pair => pair[1].v === 'ok' && !fresh(pair)),
        flags: unsent.filter(pair => pair[1].v === 'flag'),
        // Sent, and the site does not show it yet: an entry marked right is still a draft, a flagged one still reads as it did.
        waiting: verdicts.filter(pair => pair[1].sent && fresh(pair) && !(pair[1].v === 'ok' && byId.get(pair[0]).d))
      };
    }

    // The report: a few lines to read, then the verdicts as JSON for scripts/apply_review.py. It is
    // written in English whatever the page's language: it is read in the repository.
    function build(state) {
      const day = when => { const d = new Date(when), two = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
      const pairs = state.flags.concat(state.ok).sort((a, b) => a[1].t - b[1].t);
      const verdicts = pairs.map(([id, verdict]) => ({ id, rev: verdict.rev, verdict: verdict.v, reasons: verdict.r, note: verdict.n, t: verdict.t, date: day(verdict.t) }));
      const today = new Date();
      const lines = [`Lexicon review report, ${today.getDate()} ${MONTHS.en[today.getMonth()]} ${today.getFullYear()}: ${state.ok.length} marked right, ${state.flags.length} flagged.`,
        'To apply it: python3 scripts/apply_review.py (see docs/review.md).', ''];
      if (state.flags.length) {
        lines.push('Flagged:');
        state.flags.forEach(([id, verdict]) => {
          const reasons = verdict.r.map(reason => T.en.reasons[reason]).join(', ');
          lines.push(`- ${byId.get(id).e} (c/${id}.html)${reasons ? ': ' + reasons : ''}${verdict.n ? `. “${verdict.n}”` : ''}`);
        });
        lines.push('');
      }
      if (state.ok.length) lines.push(`Marked right: ${state.ok.map(([id]) => id).join(', ')}`, '');
      lines.push('```json', '{"lexicon-review":1,"verdicts":[', verdicts.map(verdict => JSON.stringify(verdict)).join(',\n'), ']}', '```');
      return { ids: pairs.map(([id]) => id), text: lines.join('\n'), title: `Review report, ${day(Date.now())}` };
    }

    function draw() {
      const lang = language(), state = standing();
      document.documentElement.lang = lang;
      document.title = `${t('title')} · Lexicon Latīnitātis Cotīdiānae`;
      document.querySelectorAll('[data-t]').forEach(node => { node.textContent = t(node.dataset.t); });
      document.querySelectorAll('[data-t-label]').forEach(node => node.setAttribute('aria-label', t(node.dataset.tLabel)));
      q('r-lang').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
      q('r-editor').setAttribute('aria-checked', String(isEditor()));
      // The counts.
      const rows = [['done', state.done], ['left', state.queue.length], ['flag', state.flags.length]];
      if (isEditor() || state.ok.length) rows.push(['ok', state.ok.length]);
      if (state.waiting.length) rows.push(['waiting', state.waiting.length]);
      q('r-counts').replaceChildren(...rows.map(([key, n]) => {
        const row = el('div', '', [el('dt', '', number(n)), el('dd', '', t('counts')[key])]);
        row.dataset.count = key;
        return row;
      }));
      // The queue: kept for the visit, so that an entry knows which comes after it.
      try { sessionStorage.setItem(QUEUE, JSON.stringify(state.queue.map(card => card.i))); } catch {}
      const names = new Map(data.categories.map(([key, latin]) => [key, latin]));
      q('r-queue').replaceChildren(...state.queue.slice(0, shown).map(card => {
        const why = state.seen[card.i] ? el('span', 'w-cat r-why', t('why').seen) : state.practised[card.i] ? el('span', 'w-cat r-why', t('why').practised)
          : el('span', 'w-cat r-why', names.get(card.k), 'la');
        const link = el('a', '', [el('span', 'w-en', card.e, 'en'), el('span', 'w-la', headOf(card.l), 'la'), why]);
        link.href = `c/${card.i}.html?review=1`;
        return el('li', '', link);
      }));
      q('r-more').hidden = state.queue.length <= shown;
      const start = q('r-start');
      start.hidden = !state.queue.length;
      if (state.queue.length) start.href = `c/${state.queue[0].i}.html?review=1`;
      q('r-queue-help').textContent = state.queue.length ? t('queueHelp') : t('queueEmpty');
      // What is to be sent.
      const pending = state.flags.length + state.ok.length;
      q('r-send-help').textContent = pending ? t('sendHelp') : t('sendNothing');
      q('r-pending').replaceChildren(
        ...state.flags.map(([id, verdict]) => {
          const link = el('a', '', byId.get(id).e, 'en');
          link.href = `c/${id}.html`;
          const reasons = verdict.r.map(reason => t('reasons')[reason]).join(', ');
          return el('li', '', [link, reasons ? ': ' + reasons : '', ...(verdict.n ? [' ', el('q', '', verdict.n, '')] : [])]);
        }),
        ...(state.ok.length ? [el('li', '', t('pendingOk')(state.ok.length))] : []),
        ...(state.staleOk.length ? [el('li', 'p-help', t('staleOk')(state.staleOk.length))] : []));
      q('r-build').hidden = !pending;
      if (!pending || !report) { q('r-report-box').hidden = true; report = null; }
      const waiting = q('r-waiting');
      waiting.replaceChildren();
      if (state.waiting.length) {
        const again = el('button', 'p-button', t('resend'));
        again.type = 'button';
        again.addEventListener('click', () => {
          const all = load();
          state.waiting.forEach(([id]) => { delete all.verdicts[id].sent; });
          save(all); draw();
        });
        waiting.append(t('waiting')(state.waiting.length), ' ', again);
      }
      polish(document.body);
    }

    document.querySelectorAll('header.site-top, footer.site-foot').forEach(part => { part.lang = 'en'; });
    q('r-lang').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      try { localStorage.setItem(LANG, button.dataset.lang); } catch {}
      draw();
    }));
    q('r-editor').addEventListener('click', () => { const state = load(); state.editor = !state.editor; save(state); draw(); });
    q('r-more').addEventListener('click', () => { shown += PAGE; draw(); });
    q('r-build').addEventListener('click', () => {
      report = build(standing());
      q('r-report').value = report.text;
      q('r-report-box').hidden = false;
      q('r-share').hidden = typeof navigator.share !== 'function';
      const address = `${REPO}/issues/new?title=${encodeURIComponent(report.title)}&body=${encodeURIComponent(report.text)}`;
      const fits = address.length <= LINK_LIMIT;
      q('r-issue').href = fits ? address : `${REPO}/issues/new?title=${encodeURIComponent(report.title)}`;
      q('r-status').textContent = fits ? '' : t('tooLong');
      polish(q('r-report-box'));
    });
    q('r-share').addEventListener('click', async () => {
      try { await navigator.share({ title: report.title, text: report.text }); } catch {}
    });
    q('r-copy').addEventListener('click', async () => {
      const field = q('r-report');
      try { await navigator.clipboard.writeText(field.value); } catch { field.select(); try { document.execCommand('copy'); } catch {} }
      q('r-copy').textContent = t('copied'); polish(q('r-copy'));
      setTimeout(() => { q('r-copy').textContent = t('copy'); polish(q('r-copy')); }, 2000);
    });
    // The reader says that the report has gone: its verdicts are kept, as sent.
    q('r-sent').addEventListener('click', () => {
      if (!report) return;
      const state = load(), now = Date.now();
      report.ids.forEach(id => { if (state.verdicts[id]) state.verdicts[id].sent = now; });
      save(state);
      report = null;
      draw();
    });
    // Back from an entry without the page being loaded again: its verdict counts at once.
    addEventListener('pageshow', event => { if (event.persisted) draw(); });
    q('r-lang').hidden = false;
    document.querySelector('.r-static')?.remove();
    page.hidden = false;
    draw();
  }

  window.lexiconReview = { controls, verdictOf, isEditor };
})();
