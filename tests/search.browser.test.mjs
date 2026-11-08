import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

let browser, page, originals;
const url = new URL('../index.html', import.meta.url).href;
const resultIds = () => page.locator('.search-result').evaluateAll(nodes => nodes.map(n => n.dataset.resultFor));
const search = query => page.locator('#search').fill(query);
const pageUrl = path => new URL('../' + path, import.meta.url).href;
const overflows = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);

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
  assert.equal(await first.getAttribute('data-result-for'), 'c-pyjamas');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.match(await first.locator('.search-snippets').textContent(), /pyjamas/);
  assert.equal(await first.locator('mark').count() > 0, true);
  assert.equal(await first.locator('.search-context .entry-body').count(), 0);
  await first.locator('.search-context > summary').click();
  await first.locator('.search-context .entry-body').waitFor();
  assert.match(await first.locator('.search-context').textContent(), /dinner gown/);
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

test('the index opens on the contents, which lead to each category and back', async () => {
  assert.equal(await page.locator('#contents').isVisible(), true);
  assert.equal(await page.locator('.categories').isVisible(), false);
  assert.equal(await page.locator('[data-entry]:visible').count(), 0);
  assert.equal(await page.locator('.toc a').count(), await page.locator('[data-category-section]').count());
  assert.equal(await page.locator('#results').textContent(), `${originals.length} entries`);
  await page.locator('.toc a[href="#culina"]').click();
  await page.waitForURL(/#culina$/);
  assert.equal(await page.locator('#contents').isVisible(), false);
  assert.equal(await page.locator('[data-category-section]:visible').count(), 1);
  assert.equal(await page.locator('#culina').isVisible(), true);
  assert.equal(await page.locator('[data-filter="culina"]').getAttribute('aria-current'), 'true');
  assert.equal(await page.evaluate(() => scrollY), 0);
  await page.goBack();
  await page.locator('#contents').waitFor();
  assert.equal(await page.locator('[data-entry]:visible').count(), 0);
  await page.goto(pageUrl('c/cooking-pot.html'));
  await page.locator('.kind a').click();
  await page.waitForURL(/index\.html#culina$/);
  await page.locator('#culina').waitFor();
  assert.equal(await page.locator('#contents').isVisible(), false);
});

test('a category keeps a search within it; Clear and Escape return to the view, entries intact', async () => {
  await page.locator('.toc a[href="#vestitus"]').click();
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 3);
  assert.match(await page.locator('#results').textContent(), /in Vestītus/);
  await page.locator('[data-filter="corpus"]').click();
  assert.equal(await page.locator('#empty').isVisible(), true);
  await page.locator('#search').press('Escape');
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('[data-entry]:visible').count(), await page.locator('[data-entry][data-category="corpus"]').count());
  assert.deepEqual(await page.locator('[data-entry]').evaluateAll(nodes => nodes.map(n => n.innerHTML)), originals);
  await search('nītere'); await page.locator('#clear').click();
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('[data-filter="corpus"]').getAttribute('aria-current'), 'true');
  await page.locator('.chip-home').click();
  await page.locator('#contents').waitFor();
  assert.equal(await page.locator('[data-entry]:visible').count(), 0);
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
});

test('source-only and alias-only matches are explained and retain context', async () => {
  await search('John C. Traupman');
  const source = page.locator('.search-result').filter({ hasText: 'Source note' }).first();
  assert.equal(await source.locator('mark').count() > 0, true);
  await source.locator('.search-context > summary').click();
  await source.locator('.entry-sources[open]').waitFor();
  await search('pajamas');
  assert.match(await page.locator('[data-result-for="c-pyjamas"]').textContent(), /alternative search term/);
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
  assert.equal(await page.locator('.search-result').count(), 6);
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

test('desktop has a single-line title and, in a category, a sidebar beside the search', async () => {
  await page.goto(url + '#vestitus');
  await search('pyjama');
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return {
        headerHeight: rect('.hero').height,
        titleLines: (() => { const range = document.createRange(); range.selectNodeContents(document.querySelector('h1 a'));
          return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size; })(),
        sidebarRight: rect('.categories').right,
        searchLeft: rect('.toolbar').left,
        resultTop: rect('.search-result').top,
        open: document.getElementById('category-menu').open,
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    });
    assert.equal(layout.open, true);
    assert.equal(layout.overflow, false);
    assert.equal(layout.titleLines, 1);
    assert.ok(layout.headerHeight < 120);
    assert.ok(layout.sidebarRight < layout.searchLeft);
    assert.ok(layout.resultTop < 250);
  }
  assert.doesNotMatch(await page.locator('.hero').textContent(), /Theo|Theodore|Theodōr/);
  await search('');
  await page.evaluate(() => window.scrollTo(0, 300));
  assert.ok(Math.abs((await page.locator('.toolbar').boundingBox()).y) < 2);
  assert.ok(Math.abs((await page.locator('.categories').boundingBox()).y) < 2, 'the sidebar sticks level with the search');
});

test('rules that run one above the other end at the same edges', async () => {
  for (const [width, hash] of [[1280, ''], [1280, '#culina'], [390, ''], [390, '#culina']]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl('rulings.html'));
    await page.goto(url + hash);
    const edges = await page.evaluate(() => {
      const box = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
      return { toolbar: box('.toolbar'), clear: box('.clear'), main: box('main'),
        heading: box(location.hash ? '.category:not([hidden]) .category-heading' : '.home h2') };
    });
    assert.deepEqual(edges.toolbar, edges.main, `search rule at ${width}px ${hash}`);
    assert.deepEqual(edges.heading, edges.main, `heading rule at ${width}px ${hash}`);
    assert.ok(edges.clear[1] <= edges.toolbar[1] && edges.clear[0] > edges.toolbar[0], 'Clear stands on the search rule');
  }
});

test('mobile category disclosure preserves the query, selected filter and keyboard focus', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + '#corpus');
  await page.locator('#category-menu:not([open])').waitFor();
  await search('pyjama');
  await page.locator('#category-menu > summary').click();
  await page.locator('[data-filter="vestitus"]').click();
  assert.equal(await page.locator('#category-menu').getAttribute('open'), null);
  assert.equal(await page.locator('#active-category').textContent(), 'Vestītus');
  assert.equal(await page.locator('#search').inputValue(), 'pyjama');
  assert.equal(await page.locator('.search-result').count(), 3);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#category-menu > summary')), true);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('#category-menu[open]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('[data-filter="vestitus"]').getAttribute('aria-current'), 'true');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('#category-menu:not([open])').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.ok((await page.locator('.search-result').first().boundingBox()).y < 300);
});

test('light is the default even on a dark system; the keyboard toggle persists its choice', async () => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
  await search('pyjama');
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
  await toggle.focus(); await toggle.press('Space');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('#search').inputValue(), 'pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
});

test('in dark mode, headings and labels are not red', async () => {
  await page.evaluate(() => localStorage.setItem('lexicon-theme', 'dark'));
  await page.goto(pageUrl('c/perhaps.html'));
  const colours = await page.evaluate(() => ['.sec-head h2', '.lab', '.side .n'].map(s => getComputedStyle(document.querySelector(s)).color));
  const red = colour => { const [r, g, b] = colour.match(/\d+/g).map(Number); return r - Math.max(g, b) > 40; };
  assert.deepEqual(colours.slice(0, 2).map(red), [false, false], `headings and labels: ${colours}`);
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
});

test('mobile theme toggle works when saving preferences is blocked', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});

test('concept records are searchable, notes count as source notes, and old anchors still lead to them', async () => {
  await search('hiccup');
  assert.equal(await page.locator('.search-result').first().getAttribute('data-result-for'), 'c-hiccup');
  assert.match(await page.locator('.search-result').first().locator('.eyebrow').textContent(), /Definition/);
  await search('short final vowel');
  const note = page.locator('[data-result-for="c-perhaps"]');
  assert.match(await note.locator('.eyebrow').textContent(), /Source note/);
  await search('');
  await page.goto(url + '#entry-528');
  assert.equal(await page.locator('#c-swimming').isVisible(), true);
});

test('record cards on the index use the format of their pages', async () => {
  await page.goto(url + '#culina');
  const card = page.locator('#c-cooking-pot');
  assert.match(await card.locator('h3').textContent(), /^cooking pot noun/);
  assert.equal(await card.locator('.rec .lead strong[lang="la"]').textContent(), 'caccabus (cacabus), caccabī m.');
  assert.match(await card.locator('.rec .lead .rec-meta').textContent(), /^noun, second declension · classical/);
  assert.equal(await card.locator('.rec.ex > li').count(), 1);
  assert.match(await card.locator('.footnotes').textContent(), /^caccabus: short a, double c \(Lewis & Short cācabus/);
  assert.equal(await card.locator('.rec > li').evaluateAll(items => items.every(li => getComputedStyle(li).listStyleType === 'none')), true);
});

test('a note on a form opens with the form, the claim and the authority it departs from', async () => {
  await page.goto(pageUrl('c/perhaps.html'));
  assert.match(await page.locator('.side.note').textContent(), /^1fortasse: short final e \(Lewis & Short fortassē, without evidence\)\. Catull\. 85\.1/);
  assert.equal(await page.locator('.side.note span[lang="la"]').first().evaluate(el => getComputedStyle(el).fontStyle), 'italic');
});

test('a concept page has its notes, a ruling link and no horizontal overflow on a phone', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(new URL('../c/perhaps.html', import.meta.url).href);
  assert.match(await page.locator('h1').textContent(), /perhaps/);
  assert.equal(await page.locator('.side.note').count(), 1);
  const ruling = page.locator('.ruling-link').first();
  assert.match(await ruling.getAttribute('href'), /rulings\.html#r-fortasse$/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await ruling.click();
  await page.waitForURL(/rulings\.html#r-fortasse$/);
  assert.equal(await page.locator('#r-fortasse').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
});


test('examples can be narrowed to quotations or to composed sentences', async () => {
  await page.goto(pageUrl('c/tickle.html'));
  const filter = page.getByRole('group', { name: 'Show examples' });
  assert.equal(await filter.isVisible(), true);
  const visible = () => page.locator('.ex > li:visible').count();
  assert.equal(await visible(), 4);
  await filter.getByRole('button', { name: 'From authors' }).click();
  assert.equal(await visible(), 1);
  assert.match(await page.locator('.ex > li:visible').textContent(), /Plin\. NH 11\.198/);
  await filter.getByRole('button', { name: 'Composed' }).click();
  assert.equal(await visible(), 3);
  assert.equal(await filter.getByRole('button', { name: 'Composed' }).getAttribute('aria-pressed'), 'true');
  await filter.getByRole('button', { name: 'All' }).click();
  assert.equal(await visible(), 4);
});

test('Latin words link to their own pages, which lead back to every entry that uses them', async () => {
  await page.goto(pageUrl('c/perhaps.html'));
  await page.locator('.term .lemma a', { hasText: 'fortasse' }).click();
  await page.waitForURL(/l\/fortasse\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'fortasse');
  assert.match(await page.locator('.uses').textContent(), /perhaps/);
  assert.match(await page.locator('.notes-list').textContent(), /short final vowel/);
  await page.locator('.uses a', { hasText: 'perhaps' }).click();
  await page.waitForURL(/c\/perhaps\.html$/);
});

test('on a wide screen the reasons stand in the margin; on a phone they follow the word', async () => {
  await page.goto(pageUrl('c/cooking-pot.html'));
  const box = selector => page.locator(selector).first().boundingBox();
  let lemma = await box('.term .lemma'), note = await box('.side.note');
  assert.ok(note.x >= lemma.x + 500, 'the note sits in the right margin');
  assert.ok(Math.abs(note.y - lemma.y) < 120, 'beside the word it explains');
  await page.setViewportSize({ width: 390, height: 844 });
  lemma = await box('.term .lemma'); note = await box('.side.note');
  assert.ok(note.y > lemma.y + lemma.height, 'below the word');
  assert.ok(Math.abs(note.x - lemma.x) < 24);
  assert.equal(await overflows(), false);
});

test('every page is usable on a phone: no sideways scrolling, 44px controls, no zoom on search', async () => {
  const pages = ['index.html', 'index.html#culina', 'c/cooking-pot.html', 'c/tickle.html', 'c/perhaps.html', 'l/fortasse.html', 'rulings.html', 'how-we-decide.html'];
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(pageUrl(path));
      assert.equal(await overflows(), false, `${path} overflows at ${width}px`);
      const small = await page.evaluate(() => [...document.querySelectorAll(
        '.site-nav a, .theme-toggle, .filter button, #category-menu > summary, .clear, .page-contents a, .search-context > summary, .entry-sources > summary, .toc a, .hero h1 a, .record-meta a')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
        .map(el => [el.textContent.trim().slice(0, 24), Math.round(el.getBoundingClientRect().height)])
        .filter(([, height]) => height < 44));
      assert.deepEqual(small, [], `${path} at ${width}px has controls under 44px`);
    }
  }
  await page.goto(url);
  assert.ok(parseFloat(await page.locator('#search').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
  await page.goto(url + '#corpus');
  await page.locator('#category-menu > summary').click();
  const chips = await page.locator('.chip').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
  assert.ok(chips.every(height => height >= 44));
});

test('the theme toggle works on every page and the choice carries across pages', async () => {
  await page.goto(pageUrl('c/tickle.html'));
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.goto(pageUrl('rulings.html'));
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.goto(url);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
});
