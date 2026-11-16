import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// The editor's review page (scripts/editor_review.py, src/editor/): built into a folder of its
// own and served from there, as the artifact serves it. The artifact's database is stood in for
// by a small one kept in sessionStorage, with the calls the page makes (doc().set, doc().delete,
// collection().get), so that a reload finds what was saved. The editor's own list, which is
// private and kept outside the repository, is stood in for by three records and an id that is
// none, written beside the page in the temporary folder.
const MINE = ['pyjamas', 'bread', 'window', 'no-such-record'];
let browser, page, server, base, folder;
const stub = () => {
  const KEY = 'stub-db';
  const all = () => JSON.parse(sessionStorage.getItem(KEY) || '{}');
  const save = docs => sessionStorage.setItem(KEY, JSON.stringify(docs));
  const refuse = () => sessionStorage.getItem('stub-fail') ? Promise.reject({ code: 'unavailable', message: 'down' }) : null;
  const db = {
    doc: path => ({
      set: data => refuse() || Promise.resolve(save({ ...all(), [path]: data })),
      delete: () => { if (refuse()) return refuse(); const docs = all(); delete docs[path]; save(docs); return Promise.resolve(); }
    }),
    collection: name => ({
      get: () => Promise.resolve({ docs: Object.entries(all()).filter(([path]) => path.startsWith(name + '/'))
        .map(([path, data]) => ({ id: path.slice(name.length + 1), exists: true, data: () => data })) })
    })
  };
  window.claude = { use: name => Promise.resolve(name === 'db' ? db : null) };
};
const saved = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('stub-db') || '{}'));
const count = async label => Number((await page.locator('#e-counts div', { hasText: label }).locator('dt').textContent()).replace(/,/g, ''));
const heading = () => page.locator('#e-page h1.hw').textContent();
// The queue as the page orders it: the highest priority first, then by the English headword.
// The queue as the page should read it: the bands from the highest (a record's band is the highest
// its reasons give, by the script's table), the priority inside a band, then the headword. The
// reasons are in the order the page names them: the risk first.
const ranking = () => page.evaluate(() => { const bands = window.editorIndex.bands; return window.editorIndex.records
  .map(([id, , english, , cat, , priority, reasons]) => ({ id, english: english.toLowerCase(), cat, priority,
    band: Math.max(0, ...reasons.map(code => bands[code] || 0)), reasons: [...reasons].sort((a, b) => (bands[b] || 0) - (bands[a] || 0)) }))
  .sort((a, b) => b.band - a.band || b.priority - a.priority || (a.english < b.english ? -1 : a.english > b.english ? 1 : a.id < b.id ? -1 : 1)); });
// Wait until the entry of this record is the one shown.
const shown = id => page.waitForFunction(id => document.querySelector('.e-open a')?.href.endsWith(`/c/${id}.html`), id);

before(async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  folder = mkdtempSync(join(tmpdir(), 'editor-review-'));
  const out = join(folder, 'page'), list = join(folder, 'mine.txt');
  writeFileSync(list, MINE.join('\n') + '\n');
  // The page is built from a copy of the repository in which no entry is reviewed yet: the tests
  // count from nought and follow the queue from its top, whatever the editor has read since.
  const repo = join(folder, 'repo');
  for (const part of ['data', 'src', 'scripts', 'refs']) cpSync(join(root, part), join(repo, part), { recursive: true });
  execFileSync('python3', ['-c', `
import json, pathlib, sys
for path in pathlib.Path(sys.argv[1], 'data/concepts').glob('*.json'):
    text = path.read_text(encoding='utf-8')
    if '"reviewed"' in text:
        record = json.loads(text)
        record['review'] = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}
        path.write_text(json.dumps(record, ensure_ascii=False), encoding='utf-8')
`, repo]);
  const said = String(execFileSync('python3', [join(repo, 'scripts/editor_review.py'), '--out', out, '--mine', list]));
  assert.match(said, /3 records, ahead inside each band\. Ids that are not records, ignored: 1\./);
  server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', out],
                 { stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const read = chunk => { const port = /port (\d+)/.exec(String(chunk)); if (port) resolve(`http://127.0.0.1:${port[1]}/`); };
    server.stdout.on('data', read);
    server.stderr.on('data', read);
    server.on('exit', code => reject(new Error(`The test server stopped (${code})`)));
  });
  browser = await chromium.launch({
    executablePath: process.env.LEXICON_CHROMIUM_EXECUTABLE || undefined,
    args: JSON.parse(process.env.LEXICON_CHROMIUM_ARGS || '[]')
  });
});
beforeEach(async () => {
  await page?.context().close();
  page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.addInitScript(stub);
  await page.goto(base);
  await page.waitForFunction(() => document.getElementById('e-store').textContent === 'Jūdicia servantur.');
});
after(async () => { await browser?.close(); server?.kill(); if (folder) rmSync(folder, { recursive: true, force: true }); });

test('the lobby counts the entries, and Incipe opens the first still to read as the site draws it', async () => {
  const left = await count('recēnsenda restant');
  assert.equal(left > 7000, true);
  assert.equal(await page.locator('#e-cats li').count(), 20);
  await page.locator('#e-start').click();
  await page.waitForSelector('#e-page article.concept');
  assert.equal(await page.locator('#lobby').isHidden(), true);
  assert.equal(await page.locator('#e-page .lemma').count() > 0, true);
  assert.equal(await page.locator('#e-page article a').count(), 0);
  assert.match(await page.locator('.e-open a').getAttribute('href'), /^https:\/\/jhwheeler\.github\.io\/lexicon-latinitatis-cotidianae\/c\/[a-z0-9-]+\.html$/);
  assert.match(await page.locator('#e-where').textContent(), /restant$/);
});

test('Incipe opens the entry of highest priority still to read, and the queue goes on in that order', async () => {
  const order = await ranking(), alphabet = await page.evaluate(() => window.editorIndex.records[0][0]);
  // Risk first: the queue opens in the highest band, where a judgement of ours stands in place of
  // a source, and an attested word of his own list (bread) waits in a lower one for all that.
  assert.equal(order[0].band, 3);
  assert.equal(['ours', 'unsourced', 'provisional'].includes(order[0].reasons[0]), true);
  assert.equal(order.every((record, n) => !n || order[n - 1].band >= record.band), true);
  const bread = order.find(record => record.id === 'bread');
  assert.equal(bread.reasons.includes('mine') && bread.band < 3, true);
  assert.equal(order.indexOf(bread) > order.filter(record => record.band === 3).length - 1, true);
  assert.notEqual(order[0].id, alphabet);
  assert.equal(order[3].priority >= order[4].priority || order[3].band > order[4].band, true);
  await page.locator('#e-start').click();
  await shown(order[0].id);
  await page.locator('#e-ok').click();
  await shown(order[1].id);
  await page.locator('#e-skip').click();
  await shown(order[2].id);
  await page.locator('#e-ok').click();
  await shown(order[3].id);
  // The one skipped is still to read, so Incipe comes back to it, not to the one marked right.
  await page.locator('#e-close').click();
  await page.locator('#e-start').click();
  await shown(order[1].id);
});

test('a quiet line under the strip says why an entry is here, three reasons at most; none, no line', async () => {
  const LABELS = { mine: 'in libellīs', frequent: 'verbum frequēns', daily: 'vītae cotīdiānae', ours: 'verbum nostrum', recent: 'verbum recēns',
    quantity: 'ā Lewis et Short discēdit', provisional: 'jūdicium exspectat', kind: 'respōnsum dubium', unsourced: 'sine fonte', composed: 'exemplum nostrum', phrase: 'plūra verba prō ūnō' };
  const order = await ranking();
  await page.locator('#e-start').click();
  await shown(order[0].id);
  assert.equal(await page.locator('#e-why').isVisible(), true);
  assert.equal(await page.locator('#e-why').textContent(), order[0].reasons.slice(0, 3).map(code => LABELS[code]).join(' · '));
  assert.match(await page.locator('#e-why').textContent(), /^(verbum nostrum|sine fonte|jūdicium exspectat)/);
  const strip = await page.locator('.e-top').boundingBox(), why = await page.locator('#e-why').boundingBox();
  assert.equal(why.y >= strip.y + strip.height, true);
  // An entry with more than three reasons shows the three weightiest.
  const many = order.find(record => record.reasons.length > 3 && !record.english.includes('('));
  await page.locator('#e-close').click();
  await page.locator('#e-find').fill(many.english);
  await page.locator('#e-found button').first().click();
  await shown(many.id);
  assert.equal(await page.locator('#e-why').textContent(), many.reasons.slice(0, 3).map(code => LABELS[code]).join(' · '));
  // An entry with no reason has no line. It was opened by name, so the queue goes on from the top.
  const none = order.find(record => !record.reasons.length && !record.english.includes('('));
  assert.equal(none.priority, 0);
  await page.locator('#e-close').click();
  await page.locator('#e-find').fill(none.english);
  await page.locator('#e-found button').first().click();
  await shown(none.id);
  assert.equal(await page.locator('#e-why').isHidden(), true);
  assert.equal(await page.locator('#e-why').textContent(), '');
  await page.locator('#e-ok').click();
  await shown(order[0].id);
  assert.equal(await page.locator('#e-why').isVisible(), true);
});

test('Ōrdō: the four bands are counted, the riskiest first, and each starts its queue', async () => {
  const order = await ranking();
  const first = page.locator('#e-first button');
  assert.equal(await page.locator('#e-first-h').textContent(), 'Ōrdō');
  assert.equal(await first.count(), 4);
  const sizes = [3, 2, 1, 0].map(band => order.filter(record => record.band === band).length);
  const number = n => n.toLocaleString('en');
  for (const [n, name] of ['Nostra', 'Recentia et disputāta', 'Exempla nostra', 'Cētera'].entries()) {
    const text = await first.nth(n).textContent();
    assert.equal(text.startsWith(name) && text.endsWith(`${number(sizes[n])} ex ${number(sizes[n])} restant`), true, text);
  }
  // Far fewer call for a judgement than there are entries, and most have nothing of ours.
  assert.equal(sizes[0] > 100 && sizes[0] < 1000 && sizes[3] > sizes[0], true);
  // The section stands above the categories.
  assert.equal((await page.locator('#e-first').boundingBox()).y < (await page.locator('#e-cats').boundingBox()).y, true);
  await first.nth(0).click();
  await shown(order[0].id);
  assert.match(await page.locator('#e-where').textContent(), new RegExp(` · ${number(sizes[0])} restant$`));
  await page.locator('#e-ok').click();
  await shown(order[1].id);
  await page.locator('#e-close').click();
  assert.equal((await first.nth(0).textContent()).endsWith(`${number(sizes[0] - 1)} ex ${number(sizes[0])} restant`), true);
  // The second band starts where the first ends.
  await first.nth(1).click();
  await shown(order[sizes[0]].id);
  await page.locator('#e-ok').click();
  await shown(order[sizes[0] + 1].id);
  await page.locator('#e-close').click();
  assert.equal((await first.nth(1).textContent()).endsWith(`${number(sizes[1] - 1)} ex ${number(sizes[1])} restant`), true);
});

test('a category opened from the lobby runs in order of priority, not of the alphabet', async () => {
  const order = (await ranking()).filter(record => record.cat === 7);
  const alphabet = await page.evaluate(() => window.editorIndex.records.find(row => row[4] === 7)[0]);
  assert.notEqual(order[0].id, alphabet);
  await page.locator('#e-cats button').nth(7).click();
  await shown(order[0].id);
  for (const record of order.slice(1, 4)) {
    await page.locator('#e-ok').click();
    await shown(record.id);
  }
  assert.equal(order[0].band >= order[3].band, true);
});

test('Rēctē saves a verdict on the text as it stands and goes on; Retrō comes back; Tolle takes it away', async () => {
  await page.locator('#e-start').click();
  await page.waitForSelector('#e-page article.concept');
  const first = await heading(), rev = await page.locator('#e-page article').getAttribute('data-rev');
  await page.locator('#e-ok').click();
  await page.waitForFunction(was => { const h = document.querySelector('#e-page h1.hw'); return h && h.textContent !== was; }, first);
  await page.waitForFunction(() => Object.keys(JSON.parse(sessionStorage.getItem('stub-db') || '{}')).length === 1);
  const [[path, verdict]] = Object.entries(await saved());
  assert.match(path, /^verdicts\/[a-z0-9-]+$/);
  assert.equal(verdict.id, path.slice('verdicts/'.length));
  assert.equal(verdict.rev, rev);
  assert.equal(verdict.verdict, 'ok');
  assert.deepEqual(verdict.reasons, []);
  assert.match(verdict.date, /^20\d\d-\d\d-\d\d$/);
  assert.equal(typeof verdict.t, 'number');

  await page.locator('#e-back').click();
  await page.waitForFunction(was => document.querySelector('#e-page h1.hw')?.textContent === was, first);
  assert.match(await page.locator('#e-state').textContent(), /^«Rēctē» dīxistī diē \d+ \p{L}+\./u);
  assert.equal(await page.locator('#e-ok').getAttribute('aria-pressed'), 'true');
  await page.locator('#e-state button').click();
  await page.waitForFunction(() => Object.keys(JSON.parse(sessionStorage.getItem('stub-db') || '{}')).length === 0);
  assert.equal(await page.locator('#e-ok').getAttribute('aria-pressed'), 'false');
});

test('Notā takes reasons and a few words, and the lobby lists what was flagged; a reload keeps it all', async () => {
  const left = await count('recēnsenda restant');
  await page.locator('#e-cats button').nth(4).click();
  await page.waitForSelector('#e-page article.concept');
  const first = await heading();
  await page.locator('#e-flag').click();
  assert.equal(await page.locator('#e-buttons').isHidden(), true);
  await page.locator('#e-chips button', { hasText: 'quantitās' }).click();
  await page.locator('#e-chips button', { hasText: 'fōns' }).click();
  await page.locator('#e-note').fill('  the  a is short ');
  await page.locator('#e-box button[type=submit]').click();
  await page.waitForFunction(was => { const h = document.querySelector('#e-page h1.hw'); return h && h.textContent !== was; }, first);
  await page.locator('#e-ok').click();
  await page.waitForFunction(() => Object.keys(JSON.parse(sessionStorage.getItem('stub-db') || '{}')).length === 2);
  const flag = Object.values(await saved()).find(verdict => verdict.verdict === 'flag');
  assert.deepEqual(flag.reasons, ['quantity', 'source']);
  assert.equal(flag.note, 'the a is short');

  await page.locator('#e-close').click();
  assert.equal(await count('notāta'), 1);
  assert.equal(await count('«Rēctē», nōndum in lexicō'), 1);
  assert.equal(await count('recēnsenda restant'), left - 2);
  assert.match(await page.locator('#e-flags li').textContent(), /quantitās, fōns — the a is short/);

  await page.reload();
  await page.waitForFunction(() => document.getElementById('e-store').textContent === 'Jūdicia servantur.');
  assert.equal(await count('notāta'), 1);
  assert.equal(await count('recēnsenda restant'), left - 2);
  // The flagged entry opens from the list with its box filled in as it was.
  await page.locator('#e-flags button').click();
  await page.waitForSelector('#e-page article.concept');
  assert.match(await page.locator('#e-state').textContent(), /^Notāvistī diē/);
  await page.locator('#e-flag').click();
  assert.equal(await page.locator('#e-note').inputValue(), 'the a is short');
  assert.equal(await page.locator('#e-chips button[aria-pressed=true]').count(), 2);
});

test('the search finds an entry by its English or its Latin, macrons or none', async () => {
  await page.locator('#e-find').fill('pyjamas');
  assert.match(await page.locator('#e-found li').first().textContent(), /^pyjamas/);
  await page.locator('#e-find').fill('uestis nocturna');
  assert.match(await page.locator('#e-found').textContent(), /vestis nocturna/);
  await page.locator('#e-found button', { hasText: 'pyjamas' }).first().click();
  await page.waitForSelector('#e-page article.concept');
  assert.match(await heading(), /^pyjamas/);
});

test('a verdict the database refuses is kept, said to be unsaved, and saved when tried again', async () => {
  await page.evaluate(() => sessionStorage.setItem('stub-fail', '1'));
  await page.locator('#e-start').click();
  await page.waitForSelector('#e-page article.concept');
  await page.locator('#e-ok').click();
  await page.locator('#e-close').click();
  await page.waitForFunction(() => /^1 nōndum servātum\./.test(document.getElementById('e-store').textContent));
  assert.deepEqual(await saved(), {});
  assert.equal(await count('«Rēctē», nōndum in lexicō'), 1);
  // Still there after a reload, and saved as soon as the database answers.
  await page.evaluate(() => sessionStorage.removeItem('stub-fail'));
  await page.reload();
  await page.waitForFunction(() => Object.keys(JSON.parse(sessionStorage.getItem('stub-db') || '{}')).length === 1);
  await page.waitForFunction(() => document.getElementById('e-store').textContent === 'Jūdicia servantur.');
  assert.equal(await count('«Rēctē», nōndum in lexicō'), 1);
});

test('without the database the verdicts stay in the browser and are offered as a report', async () => {
  await page.context().close();
  page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(base);
  await page.waitForFunction(() => /in hōc nāvigātrō/.test(document.getElementById('e-store').textContent));
  await page.locator('#e-start').click();
  await page.waitForSelector('#e-page article.concept');
  await page.locator('#e-ok').click();
  await page.locator('#e-close').click();
  const text = await page.locator('#e-report').inputValue();
  assert.match(text, /^Lexicon review: 1 marked right, 0 flagged\./);
  const report = JSON.parse(text.slice(text.indexOf('{')));
  assert.equal(report['lexicon-review'], 1);
  assert.equal(report.verdicts.length, 1);
  assert.equal(report.verdicts[0].verdict, 'ok');
});

test('on a phone nothing scrolls sideways and every control is tall enough for a thumb', async () => {
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(await wide(), false);
  for (const button of await page.locator('#e-first button, #e-cats button').all()) assert.equal((await button.boundingBox()).height >= 44, true);
  // An entry with as many reasons as any: its line may wrap, and nothing runs off the side.
  const most = (await ranking()).reduce((a, b) => b.reasons.length > a.reasons.length ? b : a);
  await page.locator('#e-cats button').nth(most.cat).click();
  await page.waitForSelector('#e-page article.concept');
  assert.equal(await page.locator('#e-why').isVisible(), true);
  assert.equal(await wide(), false);
  for (const id of ['e-back', 'e-skip', 'e-flag', 'e-ok', 'e-close']) {
    const box = await page.locator('#' + id).boundingBox();
    assert.equal(box.height >= 44 && box.width >= 44, true, id);
  }
  const bar = await page.locator('#e-bar').boundingBox();
  assert.equal(Math.round(bar.y + bar.height), 844);
  await page.locator('#e-flag').click();
  assert.equal(await wide(), false);
  for (const chip of await page.locator('#e-chips button').all()) assert.equal((await chip.boundingBox()).height >= 44, true);
});
