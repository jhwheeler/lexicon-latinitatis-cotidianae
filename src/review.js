(() => {
  // Review (Jack, 15 November 2026): every entry is a draft until the editor has read it. The
  // site offers a reader one thing, the flag. An entry's page ends with one quiet control, Flag,
  // which opens a small box (a few reasons to tap, a line to write); the back of a practice card
  // has the same. A flag is kept on the device with the revision of the record it was given on
  // (data-rev, from record_revision in the builder), so it is never applied to a text the reader
  // did not see. review.html gathers what has not been sent into one report, to share, copy or
  // open as an issue; in the repository scripts/apply_review.py reads it. There is no server.
  //
  // The editor does not review here (Jack, 15 November 2026): he reads the drafts and marks them
  // right in a private page of his own, built by scripts/editor_review.py, which writes its
  // report in the same format. This site has no "looks right", no reviewer's switch and no queue,
  // and never prints the reviewer's name. See docs/review.md.
  //
  // This script runs on every entry's page, on review.html and on practice.html (where
  // practice.js asks it for the flag of a card).
  const KEY = 'lexicon-review', LANG = 'lexicon-practice-lang';
  const REPO = 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae';
  const SITE = 'https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/';
  const REASONS = ['word', 'quantity', 'meaning', 'example', 'source', 'other'];
  // A link can carry only so much: past this, a report is copied, not opened as an issue.
  const LINK_LIMIT = 6000;
  const number = n => n.toLocaleString('en');
  const q = id => document.getElementById(id);

  // The words of the interface. It follows the practice page's choice: Latin unless the reader
  // chose English there. The Latin is Claude's wording throughout, awaiting Jack's review; the
  // coordinating session gave Notā, Recēnsiō, Mitte, Missa and the six reasons, and "Exscrībe"
  // and "Lingua" are already in use on the practice page.
  const MONTHS = {
    la: ['Jānuāriī', 'Februāriī', 'Mārtiī', 'Aprīlis', 'Majī', 'Jūniī', 'Jūliī', 'Augustī', 'Septembris', 'Octōbris', 'Novembris', 'Decembris'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  const T = {
    la: {
      flag: 'Notā', title: 'Recēnsiō', send: 'Mitte', sent: 'Missa',
      reasons: { word: 'verbum', quantity: 'quantitās', meaning: 'sēnsus', example: 'exemplum', source: 'fōns', other: 'aliud' },
      langLabel: 'Lingua', copy: 'Exscrībe', copied: 'Exscrīptum',
      ask: 'Quid vitiī est?', note: 'Paucīs verbīs, sī vīs', save: 'Servā', cancel: 'Omitte', withdraw: 'Notam tolle', alt: 'Vel per GitHub mitte',
      flagState: (reasons, date) => `Notāvistī ${date}${reasons ? ': ' + reasons : ''}.`,
      stale: date => `Haec pāgina mūtāta est postquam notāvistī (${date}).`,
      unsent: 'In hōc nāvigātrō servātur, dōnec mittās:', isSent: 'Missum.',
      date: when => `diē ${when.getDate()} ${MONTHS.la[when.getMonth()]}`,
      sub: 'Nihil hīc prō certō habētur, nisi quod recēnsor lēgit et probāvit.',
      intro: 'Sī quid in lexicō vitiōsum vidētur, in ipsā pāginā notā. Notae in hōc nāvigātrō servantur, dōnec eās hinc mittās.',
      countH: 'Summa',
      counts: { done: 'in lexicō probāta', drafts: 'recēnsenda restant', flag: 'notāta, nōndum missa', waiting: 'missa, nōndum in lexicō' },
      sendH: 'Mitte',
      sendHelp: 'Quae notāvistī nec adhūc mīsistī in ūnam relātiōnem colliguntur. Eam commūnicā, exscrībe, vel per GitHub mitte; deinde «Missa» tange.',
      sendNothing: 'Nihil mittendum est.',
      reportLabel: 'Relātiō', share: 'Commūnicā', issue: 'Per GitHub mitte',
      tooLong: 'Longior est relātiō quam ut per GitHub aperīrī possit: exscrībe et ibi glūtinā.',
      waiting: n => `${number(n)} ${n === 1 ? 'missum' : 'missa'}, nōndum in lexicō.`, resend: 'Iterum mitte',
      pendingOk: n => `«Rēctē»: ${number(n)}`
    },
    en: {
      flag: 'Flag', title: 'Review', send: 'Send', sent: 'Sent',
      reasons: { word: 'wrong word', quantity: 'vowel length', meaning: 'meaning', example: 'example', source: 'source', other: 'other' },
      langLabel: 'Language', copy: 'Copy', copied: 'Copied',
      ask: 'What looks wrong?', note: 'A few words, if you like', save: 'Save', cancel: 'Cancel', withdraw: 'Withdraw the flag', alt: 'Or send it as a GitHub issue',
      flagState: (reasons, date) => `You flagged this, ${date}${reasons ? ': ' + reasons : ''}.`,
      stale: date => `This entry has changed since you flagged it (${date}).`,
      unsent: 'Kept on this device until you send it:', isSent: 'Sent.',
      date: when => `${when.getDate()} ${MONTHS.en[when.getMonth()]}`,
      sub: 'Every entry is a draft until the editor has read it.',
      intro: 'If something in the lexicon looks wrong, flag it on its own page. Flags are kept on this device until you send them from here.',
      countH: 'Where it stands',
      counts: { done: 'reviewed by the editor', drafts: 'drafts, not yet reviewed', flag: 'flagged, not yet sent', waiting: 'sent, not yet on the site' },
      sendH: 'Send',
      sendHelp: 'Your flags not yet sent are gathered into one report. Share it, copy it, or open it as a GitHub issue; then tap “Sent”.',
      sendNothing: 'Nothing to send.',
      reportLabel: 'The report', share: 'Share', issue: 'Open a GitHub issue',
      tooLong: 'The report is too long to open as an issue from a link: copy it and paste it there.',
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
  const FLAG = 'M6 21V4M6 5h11l-2.5 4L17 13H6';

  // The verdicts ------------------------------------------------------------------------------------
  // One record for the device: {verdicts: {id: {v: 'flag', r: reasons, n: note, t: when, rev: the
  // record's revision, sent: when it was sent}}}. Where storage is blocked the flags last for
  // the visit.
  //
  // The site gives no verdict but 'flag'. On the morning of 15 November 2026 it also offered the
  // editor "looks right", so a device may still hold verdicts with v: 'ok' (and an "editor" field,
  // which is dropped at the next save). They are read and kept here, and the review page puts
  // them into the report with the flags (see "ok" in standing), so that nothing tapped that
  // morning is lost. Nothing else on the site shows or makes one.
  let memory = null;
  function load() {
    if (memory) return memory;
    let kept = null;
    try { kept = JSON.parse(localStorage.getItem(KEY)); } catch {}
    const state = { verdicts: {} };
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

  // What a flag says of itself, on the entry's page.
  function stateLine(id, rev, up) {
    const verdict = verdictOf(id);
    if (!verdict || verdict.v !== 'flag') return null;
    const date = t('date')(new Date(verdict.t));
    if (verdict.rev !== rev) return el('p', 'verdict-state', t('stale')(date));
    const reasons = verdict.r.map(reason => t('reasons')[reason]).join(', ');
    const pieces = [t('flagState')(reasons, date)];
    if (verdict.n) pieces.push(' ', el('q', '', verdict.n, ''));
    if (verdict.sent) pieces.push(' ', t('isSent'));
    else {
      const link = el('a', '', t('title'));
      link.href = `${up}review.html`;
      pieces.push(' ', t('unsent'), ' ', link, '.');
    }
    return el('p', 'verdict-state', pieces);
  }

  // The flag of a record: on its page (with the box under it and a line saying what was flagged)
  // and on the back of a practice card (as a small button; the box opens over the round).
  function controls({ id, rev, english, where, up = '', changed }) {
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
      if (where === 'game') { flag.setAttribute('aria-label', t('flag')); flag.title = t('flag'); }
      const state = where === 'entry' ? stateLine(id, rev, up) : null;
      if (state) state.setAttribute('role', 'status');
      box.replaceChildren(...(state ? [state] : []), el('div', 'verdict-row', flag));
      form = null;
      if (box.isConnected) polish(box);
    }
    draw();
    return { box, draw };
  }

  // An entry's page ---------------------------------------------------------------------------------
  // The flag stands where "Suggest a correction" stood (which is still there without scripts, and
  // is the way to GitHub inside the box).
  const article = document.querySelector('article.concept[data-rev]');
  const entry = article && /\/c\/([a-z0-9-]+?)(?:\.html)?$/.exec(location.pathname);
  if (article && entry) {
    const id = entry[1], suggest = article.querySelector('.suggest'), foot = article.querySelector('.c-sources');
    const made = controls({
      id, rev: article.dataset.rev, where: 'entry', up: '../',
      english: (article.querySelector('h1.hw')?.firstChild?.textContent || id).trim()
    });
    if (suggest) suggest.hidden = true;
    (foot || article).append(made.box);
    polish(made.box);
  }

  // The review page ---------------------------------------------------------------------------------
  const page = q('review'), data = window.lexiconPractice;
  if (page && data) {
    const cards = data.cards, byId = new Map(cards.map(card => [card.i, card]));
    let report = null;

    // What stands where: the site's own count, and the reader's flags.
    function standing() {
      const verdicts = Object.entries(load().verdicts).filter(([id]) => byId.has(id));
      const fresh = ([id, verdict]) => verdict.rev === byId.get(id).h;
      const unsent = verdicts.filter(([, verdict]) => !verdict.sent);
      const done = cards.filter(card => card.d).length;
      return {
        done, drafts: cards.length - done,
        flags: unsent.filter(pair => pair[1].v === 'flag'),
        // An entry marked right on this site before it kept only the flag (see load): still sent,
        // if the entry reads as it did then. apply_review.py would refuse it otherwise.
        ok: unsent.filter(pair => pair[1].v === 'ok' && fresh(pair)),
        // Sent, and the site does not show it yet: a flagged entry still reads as it did (and an
        // entry marked right that morning is still a draft).
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
      // The counts.
      const rows = [['done', state.done], ['drafts', state.drafts], ['flag', state.flags.length]];
      if (state.waiting.length) rows.push(['waiting', state.waiting.length]);
      q('r-counts').replaceChildren(...rows.map(([key, n]) => {
        const row = el('div', '', [el('dt', '', number(n)), el('dd', '', t('counts')[key])]);
        row.dataset.count = key;
        return row;
      }));
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
        ...(state.ok.length ? [el('li', '', t('pendingOk')(state.ok.length))] : []));
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
    // The reader says that the report has gone: its flags are kept, as sent.
    q('r-sent').addEventListener('click', () => {
      if (!report) return;
      const state = load(), now = Date.now();
      report.ids.forEach(id => { if (state.verdicts[id]) state.verdicts[id].sent = now; });
      save(state);
      report = null;
      draw();
    });
    // Back from an entry without the page being loaded again: its flag counts at once.
    addEventListener('pageshow', event => { if (event.persisted) draw(); });
    q('r-lang').hidden = false;
    document.querySelector('.r-static')?.remove();
    page.hidden = false;
    draw();
  }

  window.lexiconReview = { controls, verdictOf };
})();
