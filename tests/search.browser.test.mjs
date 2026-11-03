import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

let browser, page, originals;
const url = new URL('../index.html', import.meta.url).href;
const resultIds = () => page.locator('.search-result').evaluateAll(nodes => nodes.map(n => n.dataset.resultFor));
const search = query => page.locator('#search').fill(query);

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.LEXICON_CHROMIUM_EXECUTABLE || undefined,
    args: JSON.parse(process.env.LEXICON_CHROMIUM_ARGS || '[]')
  });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
});
beforeEach(async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url);
  originals = await page.locator('[data-entry]').evaluateAll(nodes => nodes.map(n => n.innerHTML));
});
after(async () => { await browser?.close(); });

test('pyjama shows the matching lemma first, with focused text and expandable context', async () => {
  await search('pyjama');
  const first = page.locator('.search-result').first();
  assert.equal(await first.locator('h3').textContent(), 'synthesis dormītōria');
  assert.equal(await first.getAttribute('data-result-for'), 'entry-59');
  assert.equal(await page.locator('.search-result').count(), 5);
  assert.match(await first.locator('.search-snippets').textContent(), /pyjamas/);
  assert.equal(await first.locator('mark').count() > 0, true);
  assert.equal(await first.locator('.search-context .entry-body').count(), 0);
  await first.locator('.search-context > summary').click();
  await first.locator('.search-context .entry-body').waitFor();
  assert.match(await first.locator('.search-context').textContent(), /subūcula/);
  assert.match(await first.locator('.search-context').textContent(), /Sources & evidence/);
});

test('macrons, decomposed accents and i/j share matching and visible highlights', async () => {
  await search('synthesis dormitoria');
  assert.equal(await page.locator('.search-result').first().locator('h3 mark').textContent(), 'synthesis dormītōria');
  const ids = await resultIds();
  await search('synthesis dormi\u0304toria');
  assert.deepEqual(await resultIds(), ids);
  await search('jam'); const withJ = await resultIds();
  await search('iam');
  assert.deepEqual(await resultIds(), withJ);
  assert.equal(await page.locator('.search-result mark').count() > 0, true);
});

test('category filters constrain search; Clear and Escape restore all original content', async () => {
  await search('pyjama');
  await page.locator('[data-filter="vestitus"]').click();
  assert.equal(await page.locator('.search-result').count(), 2);
  await page.locator('[data-filter="corpus"]').click();
  assert.equal(await page.locator('#empty').isVisible(), true);
  await page.locator('#search').press('Escape');
  assert.equal(await page.locator('[data-entry]:visible').count(), 290);
  assert.deepEqual(await page.locator('[data-entry]').evaluateAll(nodes => nodes.map(n => n.innerHTML)), originals);
  await search('nītere'); await page.locator('#clear').click();
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('[data-filter="all"]').getAttribute('aria-pressed'), 'true');
});

test('source-only and alias-only matches are explained and retain context', async () => {
  await search('John C. Traupman');
  const source = page.locator('.search-result').filter({ hasText: 'Source note' }).first();
  assert.equal(await source.locator('mark').count() > 0, true);
  await source.locator('.search-context > summary').click();
  await source.locator('.entry-sources[open]').waitFor();
  await search('pajamas');
  assert.match(await page.locator('[data-result-for="entry-59"]').textContent(), /alternative search term/);
});

test('cross-references reveal their original target and clones have no duplicate IDs', async () => {
  await search('foothold');
  const result = page.locator('[data-result-for="entry-285"]');
  await result.locator('.search-context > summary').click();
  await result.locator('.search-context .entry-body').waitFor();
  assert.equal(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(n => n.id);
    return ids.length === new Set(ids).size;
  }), true);
  await result.locator('a[href="#play-179"]').click();
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('#play-179').isVisible(), true);
});

test('literal input never becomes HTML and no-match state recovers', async () => {
  await search('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#empty').isVisible(), true);
  assert.equal(await page.locator('#search-results img').count(), 0);
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 5);
});

test('guidance and review notes live in the footer and remain reachable', async () => {
  assert.equal(await page.locator('.hero details').count(), 0);
  assert.equal(await page.locator('footer details').count(), 2);
  await page.locator('.about-link a').click();
  assert.match(page.url(), /#about$/);
  await page.locator('footer details.principles > summary').click();
  assert.equal(await page.locator('footer details.principles').getAttribute('open') !== null, true);
});

test('phone and dark layouts keep matching text usable without horizontal overflow', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await search('pyjama');
  assert.equal(await page.locator('.search-result').first().locator('h3').textContent(), 'synthesis dormītōria');
  await page.locator('.search-result').first().locator('.search-context > summary').click();
  await page.locator('.search-result').first().locator('.search-context .entry-body').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});
