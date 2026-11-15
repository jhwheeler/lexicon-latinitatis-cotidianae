import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// The editor's review page (scripts/editor_review.py, src/editor/): built into a folder of its
// own and served from there, as the artifact serves it. The artifact's database is stood in for
// by a small one kept in sessionStorage, with the calls the page makes (doc().set, doc().delete,
// collection().get), so that a reload finds what was saved.
let browser, page, server, base, out;
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

before(async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  out = mkdtempSync(join(tmpdir(), 'editor-review-'));
  execFileSync('python3', [join(root, 'scripts/editor_review.py'), '--out', out]);
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
after(async () => { await browser?.close(); server?.kill(); if (out) rmSync(out, { recursive: true, force: true }); });

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
  await page.locator('#e-cats button').first().click();
  await page.waitForSelector('#e-page article.concept');
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
