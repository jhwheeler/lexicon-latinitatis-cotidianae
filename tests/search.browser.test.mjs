import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// The pages are served over HTTP, as the published site is: pages opened from disk share their
// saved preferences unreliably between one page and the next.
let browser, page, server, base, url;
const pageUrl = path => base + path;
const resultIds = () => page.locator('.search-result').evaluateAll(nodes => nodes.map(n => n.dataset.resultFor));
// Typing searches at once; only the first search waits for the data to load.
const search = async query => {
  await page.locator('#search').fill(query);
  if (query) await page.waitForFunction(() => /matching/.test(document.getElementById('results').textContent));
};
const overflows = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
// A preference saved on one page is read by the next.
const settle = () => page.waitForTimeout(200);

before(async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  server = spawn('python3', ['-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', root],
                 { stdio: ['ignore', 'pipe', 'pipe'] });
  base = await new Promise((resolve, reject) => {
    const read = chunk => { const port = /port (\d+)/.exec(String(chunk)); if (port) resolve(`http://127.0.0.1:${port[1]}/`); };
    server.stdout.on('data', read);
    server.stderr.on('data', read);
    server.on('exit', code => reject(new Error(`The test server stopped (${code})`)));
  });
  url = pageUrl('index.html');
  browser = await chromium.launch({
    executablePath: process.env.LEXICON_CHROMIUM_EXECUTABLE || undefined,
    args: JSON.parse(process.env.LEXICON_CHROMIUM_ARGS || '[]')
  });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
});
beforeEach(async () => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(url);
});
after(async () => { await browser?.close(); server?.kill(); });

// Search ------------------------------------------------------------------------------------

test('pyjama shows the matching lemma first, with the matching lines, linked to its page', async () => {
  await search('pyjama');
  const first = page.locator('.search-result').first();
  assert.equal(await first.locator('h3').textContent(), 'vestis nocturna');
  assert.equal(await first.getAttribute('data-result-for'), 'c-pyjamas');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.match(await first.locator('.search-snippets').textContent(), /pyjamas/);
  assert.equal(await first.locator('mark').count() > 0, true);
  await first.locator('h3 a').click();
  await page.waitForURL(/c\/pyjamas\.html$/);
  assert.match(await page.locator('h1').textContent(), /^pyjamas/);
});

test('macrons, decomposed accents and i/j share matching and visible highlights', async () => {
  await search('synthesis dormitoria');
  assert.equal(await page.locator('.search-result').first().locator('h3 mark').textContent(), 'synthesis dormītōria');
  const ids = await resultIds();
  await search('synthesis dormītoria');
  assert.deepEqual(await resultIds(), ids);
  await search('jam'); const withJ = await resultIds();
  await search('iam');
  assert.deepEqual(await resultIds(), withJ);
  assert.equal(await page.locator('.search-result mark').count() > 0, true);
});

test('a search can be linked to: the address keeps the query, and the category it is limited to', async () => {
  await search('pyjama');
  await page.waitForURL(/index\.html\?q=pyjama$/);
  await page.goto(url + '?q=pyjama');
  await page.locator('#search-results:not([hidden])').waitFor();
  assert.equal(await page.locator('#search').inputValue(), 'pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.equal(await page.locator('#contents').isVisible(), false);
  await page.goto(url + '?q=pyjama&cat=vestitus');
  await page.locator('#search-results:not([hidden])').waitFor();
  assert.equal(await page.locator('.search-result').count(), 3);
  assert.match(await page.locator('#results').textContent(), /in Vestītus/);
  await page.goto(pageUrl('k/vestitus.html?q=pyjama'));
  await page.locator('#search-results:not([hidden])').waitFor();
  assert.equal(await page.locator('.search-result').count(), 3);
});

test('the search data loads only when it is needed', async () => {
  const requested = [];
  page.on('request', request => requested.push(new URL(request.url()).pathname.split('/').pop()));
  await page.goto(url);
  await page.waitForLoadState('load');
  assert.equal(requested.includes('search-data.js'), false);
  assert.equal(requested.includes('legacy.js'), false);
  assert.ok((await page.evaluate(() => document.documentElement.outerHTML.length)) < 60000);
  await page.locator('#search').focus();
  await page.waitForFunction(() => window.lexiconData);
  assert.equal(requested.includes('search-data.js'), true);
  page.removeAllListeners('request');
});

test('source notes and alternative search terms are explained', async () => {
  await search('short final vowel');
  assert.match(await page.locator('[data-result-for="c-perhaps"] .eyebrow').textContent(), /Source note/);
  await search('pajamas');
  assert.match(await page.locator('[data-result-for="c-pyjamas"]').textContent(), /alternative search term/);
  await search('hiccup');
  assert.equal(await page.locator('.search-result').first().getAttribute('data-result-for'), 'c-hiccup');
  assert.match(await page.locator('.search-result').first().locator('.eyebrow').textContent(), /Definition/);
});

test('a record is found as a definition by its headword, which its answer line does not repeat', async () => {
  await search('cooking pot');
  const first = page.locator('.search-result').first();
  assert.equal(await first.getAttribute('data-result-for'), 'c-cooking-pot');
  assert.match(await first.locator('.eyebrow').textContent(), /Definition/);
  assert.equal(await first.locator('h3').textContent(), 'caccabus (cacabus), caccabī m.');
});

test('a Latin word is found from any of its forms, with a note naming the form', async () => {
  await search('piscinam');
  const first = page.locator('.search-result').first();
  assert.equal(await first.getAttribute('data-result-for'), 'c-swimming-pool');
  assert.match(await first.locator('.eyebrow').textContent(), /Definition/);
  assert.equal(await first.locator('.form-of').textContent(), '“piscinam” is a form of piscīna.');
  await search('cucurrit');
  assert.equal(await page.locator('.search-result').first().getAttribute('data-result-for'), 'c-run');
  // The headword itself needs no note.
  await search('piscina');
  assert.equal(await page.locator('[data-result-for="c-swimming-pool"] .form-of').count(), 0);
});

test('when nothing matches, the entries one letter off are offered', async () => {
  await page.locator('#search').fill('pyjams');
  await page.waitForFunction(() => /close spelling/.test(document.getElementById('results').textContent));
  assert.deepEqual(await resultIds(), ['c-pyjamas']);
  assert.match(await page.locator('.search-result .eyebrow').first().textContent(), /Close spelling/);
  assert.equal(await page.locator('#empty').isVisible(), false);
  await page.locator('#search').fill('piscnia');
  await page.waitForFunction(() => document.querySelector('.search-result')?.dataset.resultFor === 'c-swimming-pool');
  await search('qqqqqq');
  assert.equal(await page.locator('#empty').isVisible(), true);
});

test('literal input never becomes HTML and no-match state recovers', async () => {
  await search('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#empty').isVisible(), true);
  assert.equal(await page.locator('#search-results img').count(), 0);
  await search('pyjama');
  assert.equal(await page.locator('#empty').isVisible(), false);
  assert.equal(await page.locator('.search-result').count(), 6);
});

// The front page and the categories -----------------------------------------------------------

test('the front page lists the categories; each opens its own page, with the categories beside it', async () => {
  assert.equal(await page.locator('#contents').isVisible(), true);
  const categories = await page.locator('.toc a').count();
  assert.equal(categories, 20);
  assert.match(await page.locator('#results').textContent(), /^[\d,]+ entries$/);
  await page.locator('.toc a[href="k/culina.html"]').click();
  await page.waitForURL(/k\/culina\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'Culīna et potūs');
  assert.equal(await page.locator('.cat-side a[aria-current="page"]').textContent(), 'Culīna et potūs');
  assert.equal(await page.locator('.cat-side ol a').count(), categories);
  await page.locator('.cat-side a[href="../k/vestitus.html"]').click();
  await page.waitForURL(/k\/vestitus\.html$/);
  await page.locator('.cat-side .cat-home').click();
  await page.waitForURL(/index\.html$/);
  await page.goto(pageUrl('c/cooking-pot.html'));
  await page.locator('.kind a').first().click();
  await page.waitForURL(/k\/culina\.html$/);
});

test('a category page lists each entry with its Latin, linked to its page', async () => {
  await page.goto(pageUrl('k/culina.html'));
  const entry = page.locator('.wlist a[href="../c/cooking-pot.html"]');
  assert.equal(await entry.locator('.w-en').textContent(), 'cooking pot noun');
  assert.equal(await entry.locator('.w-la').textContent(), 'caccabus');
  const count = await page.locator('.wlist li').count();
  assert.match(await page.locator('.category-heading .eyebrow').textContent(), new RegExp(`· ${count} entries$`));
  assert.equal(await page.locator('#results').textContent(), `${count.toLocaleString('en')} entries`);
  await entry.click();
  await page.waitForURL(/c\/cooking-pot\.html$/);
});

test('a search on a category page stays within it; Clear and Escape bring its list back', async () => {
  await page.goto(pageUrl('k/vestitus.html'));
  const entries = await page.locator('.wlist li').count();
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 3);
  assert.match(await page.locator('#results').textContent(), /in Vestītus/);
  assert.equal(await page.locator('#category-view').isVisible(), false);
  await page.locator('#search').press('Escape');
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('#category-view').isVisible(), true);
  assert.equal(await page.locator('.wlist li').count(), entries);
  await search('pyjama'); await page.locator('#clear').click();
  assert.equal(await page.locator('#search').inputValue(), '');
  assert.equal(await page.locator('#category-view').isVisible(), true);
});

test('a record listed under a second category is found there too', async () => {
  await page.goto(pageUrl('k/domus.html'));
  assert.equal(await page.locator('.wlist a[href="../c/soap.html"]').count(), 1);
  await search('soap');
  assert.equal((await resultIds())[0], 'c-soap', 'the headword itself comes before soap bubble and liquid soap');
  assert.match(await page.locator('[data-result-for="c-soap"] .eyebrow').textContent(), /^Culīna et potūs/);
});

test('an empty search in a category names it and can search everything, keeping the query', async () => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl('k/vestitus.html'));
    await search('climb');
    assert.equal(await page.locator('.search-result').count(), 0);
    assert.equal(await page.locator('#empty-message').textContent(), 'No matches in Vestītus.');
    assert.match(await page.locator('#results').textContent(), /^0 matching entries in Vestītus/);
    await page.getByRole('button', { name: 'Search all categories', exact: true }).click();
    await page.waitForURL(/index\.html\?q=climb$/);
    await page.locator('#search-results:not([hidden])').waitFor();
    assert.equal(await page.locator('#search').inputValue(), 'climb');
    assert.equal(await page.locator('#empty').isVisible(), false);
    assert.match(await page.locator('#search-result-list').textContent(), /scandō/);
    await search('no-such-lemma-12345');
    assert.equal(await page.locator('#empty-message').textContent(), 'No entries match that search.');
    assert.equal(await page.locator('#search-all').isVisible(), false);
  }
});

test('links to the old single page lead to the pages that hold their targets now', async () => {
  for (const [hash, path] of [['#culina', 'k/culina.html'], ['#theodorus', 'k/sermo.html'], ['#entry-528', 'c/swimming.html'],
                              ['#play-179', 'c/climbing-frame.html'], ['#c-perhaps', 'c/perhaps.html'],
                              ['#fn-perhaps-1', 'c/perhaps.html#fn-perhaps-1']]) {
    await page.goto('about:blank');
    await page.goto(url + hash);
    await page.waitForURL(address => address.href.endsWith(path));
  }
  // Within the page too, and the page's own anchors stay where they are.
  await page.goto(url);
  await page.evaluate(() => { location.hash = 'vestitus'; });
  await page.waitForURL(address => address.href.endsWith('k/vestitus.html'));
  await page.goto(url + '#about');
  await page.waitForTimeout(300);
  assert.match(page.url(), /index\.html#about$/);
});

test('the A–Z pages list every entry and every Latin word, by letter', async () => {
  const total = Number((await page.locator('#results').textContent()).replace(/\D/g, ''));
  await page.goto(pageUrl('words.html'));
  assert.equal(await page.locator('.wlist li').count(), total);
  assert.equal(await page.locator('.az-nav a').first().textContent(), 'A');
  await page.locator('.az-nav a[href="#letter-c"]').click();
  assert.ok(Math.abs((await page.locator('#letter-c').boundingBox()).y) < 80);
  await page.locator('.wlist a[href="c/cooking-pot.html"]').click();
  await page.waitForURL(/c\/cooking-pot\.html$/);
  await page.goto(pageUrl('latin.html'));
  await page.locator('.wlist a[href="l/caccabus.html"]').click();
  await page.waitForURL(/l\/caccabus\.html$/);
});

test('guidance and review notes live in the footer and remain reachable', async () => {
  assert.equal(await page.locator('.hero details:not(.settings)').count(), 0);
  assert.equal(await page.locator('footer details').count(), 2);
  await page.locator('.foot-links a[href="#about"]').click();
  assert.match(page.url(), /#about$/);
  await page.locator('footer details.principles > summary').click();
  assert.equal(await page.locator('footer details.principles').getAttribute('open') !== null, true);
});

// Without scripts --------------------------------------------------------------------------

test('without scripts every page still works: the contents and the lists stand in for the search', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const plain = await context.newPage();
  await plain.goto(url);
  assert.equal(await plain.locator('.toolbar').isVisible(), false);
  assert.equal(await plain.locator('.settings').isVisible(), false, 'the settings need scripts');
  assert.equal(await plain.locator('.noscript-note').isVisible(), true);
  await plain.locator('.toc a[href="k/culina.html"]').click();
  await plain.waitForURL(/k\/culina\.html$/);
  assert.equal(await plain.locator('.toolbar').isVisible(), false);
  assert.equal(await plain.locator('.cat-side').isVisible(), true);
  assert.ok(await plain.locator('.wlist li').count() > 100);
  await plain.locator('.wlist a[href="../c/cooking-pot.html"]').click();
  await plain.waitForURL(/c\/cooking-pot\.html$/);
  assert.equal(await plain.locator('.side.note').first().isVisible(), true);
  await plain.goto(pageUrl('words.html'));
  await plain.locator('.az-nav a[href="#letter-p"]').click();
  assert.equal(await plain.locator('.wlist a[href="c/pyjamas.html"]').isVisible(), true);
  await plain.setViewportSize({ width: 390, height: 844 });
  await plain.goto(pageUrl('k/culina.html'));
  assert.equal(await plain.locator('.settings').isVisible(), false);
  await plain.locator('.cat-menu > summary').click();
  await plain.locator('.cat-menu a[href="../k/vestitus.html"]').click();
  await plain.waitForURL(/k\/vestitus\.html$/);
  assert.equal(await plain.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  // The header's search is a plain form: it opens the front page with the query.
  await plain.goto(pageUrl('c/kind.html'));
  await plain.locator('#site-search').fill('pyjama');
  await plain.locator('#site-search').press('Enter');
  await plain.waitForURL(/index\.html\?q=pyjama$/);
  assert.equal(await plain.locator('#contents').isVisible(), true);
  await context.close();
});

// Layout -------------------------------------------------------------------------------------

test('phone and dark layouts keep matching text usable without horizontal overflow', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await search('pyjama');
  assert.equal(await page.locator('.search-result').first().locator('h3').textContent(), 'vestis nocturna');
  assert.equal(await overflows(), false);
  await page.emulateMedia({ colorScheme: 'light' });
});

test('desktop: a one-line title, and on a category page the categories beside the search, sticking with it', async () => {
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    const header = await page.evaluate(() => {
      const range = document.createRange(); range.selectNodeContents(document.querySelector('.hero h1 a'));
      return { height: document.querySelector('.hero').getBoundingClientRect().height,
        lines: new Set([...range.getClientRects()].map(r => Math.round(r.top))).size };
    });
    assert.equal(header.lines, 1);
    assert.ok(header.height < 120);
    await page.goto(pageUrl('k/vestitus.html'));
    await search('pyjama');
    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      return { sidebarRight: rect('.cat-side').right, searchLeft: rect('.toolbar').left, resultTop: rect('.search-result').top,
        menu: getComputedStyle(document.querySelector('.cat-menu')).display, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.equal(layout.overflow, false);
    assert.equal(layout.menu, 'none');
    assert.ok(layout.sidebarRight < layout.searchLeft);
    assert.ok(layout.resultTop < 300);
  }
  await search('');
  await page.evaluate(() => window.scrollTo(0, 600));
  assert.ok(Math.abs((await page.locator('.toolbar').boundingBox()).y) < 2);
  assert.ok(Math.abs((await page.locator('.cat-side').boundingBox()).y) < 2, 'the categories stick level with the search');
  assert.doesNotMatch(await page.locator('.site-top').textContent(), /Theo|Theodore|Theodōr/);
});

test('rules that run one above the other end at the same edges', async () => {
  for (const [width, path] of [[1280, 'index.html'], [1280, 'k/culina.html'], [390, 'index.html'], [390, 'k/culina.html']]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(pageUrl(path));
    const edges = await page.evaluate(() => {
      const box = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right)]; };
      const column = document.querySelector('.cat-main') ? '.cat-main' : 'main';
      return { toolbar: box('.toolbar'), clear: box('.clear'), column: box(column),
        heading: box(document.querySelector('.category-heading') ? '.category-heading' : '.home h2') };
    });
    assert.deepEqual(edges.toolbar, edges.column, `search rule at ${width}px on ${path}`);
    assert.deepEqual(edges.heading, edges.column, `heading rule at ${width}px on ${path}`);
    assert.ok(edges.clear[1] <= edges.toolbar[1] && edges.clear[0] > edges.toolbar[0], 'Clear stands on the search rule');
  }
});

test('on a phone the categories fold into a menu above the search', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl('k/corpus.html'));
  assert.equal(await page.locator('.cat-side').isVisible(), false);
  assert.equal(await page.locator('.cat-menu').getAttribute('open'), null);
  assert.equal(await page.locator('.cat-current').textContent(), 'Corpus et mōtus');
  await page.locator('.cat-menu > summary').click();
  const heights = await page.locator('.cat-menu ol a').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height));
  assert.ok(heights.every(height => height >= 44));
  await page.locator('.cat-menu a[href="../k/vestitus.html"]').click();
  await page.waitForURL(/k\/vestitus\.html$/);
  await page.setViewportSize({ width: 320, height: 700 });
  assert.equal(await overflows(), false);
});

test('every page is usable on a phone: no sideways scrolling, 44px controls, no zoom on search', async () => {
  const pages = ['index.html', 'k/culina.html', 'words.html', 'latin.html', 'c/cooking-pot.html', 'c/tickle.html',
                 'c/perhaps.html', 'l/fortasse.html', 'rulings.html', 'how-we-decide.html'];
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(pageUrl(path));
      assert.equal(await overflows(), false, `${path} overflows at ${width}px`);
      const small = await page.evaluate(() => [...document.querySelectorAll(
        '.settings > summary, .head-search-field, .filter button, .cat-menu > summary, .cat-home, .clear, .page-contents a, .toc a, .hero h1 a, .site-name, .wlist a, .az-nav a, .az a, .suggest a')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
        .map(el => [el.textContent.trim().slice(0, 24), Math.round(el.getBoundingClientRect().height)])
        .filter(([, height]) => height < 44));
      assert.deepEqual(small, [], `${path} at ${width}px has controls under 44px`);
    }
  }
  for (const [path, field] of [['index.html', '#search'], ['k/culina.html', '#search'], ['c/kind.html', '#site-search'], ['words.html', '#site-search']]) {
    await page.goto(pageUrl(path));
    assert.ok(parseFloat(await page.locator(field).evaluate(el => getComputedStyle(el).fontSize)) >= 16, path);
  }
});

// Theme and display ----------------------------------------------------------------------------

test('the header: the name, one search field, and the settings; the pages are in the footer', async () => {
  for (const [path, inPlace] of [['index.html', true], ['k/culina.html', true], ['c/kind.html', false], ['l/caccabus.html', false],
                                 ['words.html', false], ['latin.html', false], ['rulings.html', false], ['how-we-decide.html', false]]) {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pageUrl(path));
      assert.equal(await page.locator('header.site-top nav, header.site-top .site-nav').count(), 0, `${path}: no links in the header`);
      assert.equal(await page.locator('.settings > summary').isVisible(), true, `${path} at ${width}px`);
      // Never two fields: where the page searches in place, the header has none.
      const fields = await page.locator('input[type="search"]').evaluateAll(nodes => nodes.filter(n => n.getClientRects().length).length);
      assert.equal(fields, 1, `${path} at ${width}px has one search field`);
      assert.equal(await page.locator('#site-search').count(), inPlace ? 0 : 1, path);
      assert.equal(await overflows(), false, `${path} at ${width}px`);
    }
  }
});

test('the header search on a record page opens the front page with its results', async () => {
  await page.goto(pageUrl('c/kind.html'));
  await page.locator('#site-search').fill('pyjama');
  await page.locator('#site-search').press('Enter');
  await page.waitForURL(/index\.html\?q=pyjama$/);
  await page.waitForFunction(() => /matching/.test(document.getElementById('results').textContent));
  assert.equal(await page.locator('#search').inputValue(), 'pyjama');
  assert.equal(await page.locator('.search-result').first().locator('h3').textContent(), 'vestis nocturna');
});

test('the slash key goes to the search, but not while typing', async () => {
  for (const [path, field] of [['c/kind.html', '#site-search'], ['index.html', '#search'], ['k/culina.html', '#search']]) {
    await page.goto(pageUrl(path));
    await page.locator('body').click({ position: { x: 4, y: 400 } });
    await page.keyboard.press('/');
    assert.equal(await page.evaluate(() => document.activeElement.id), field.slice(1), path);
    assert.equal(await page.locator(field).inputValue(), '', `${path}: the slash is not typed`);
    await page.keyboard.type('a/b');
    assert.equal(await page.locator(field).inputValue(), 'a/b', `${path}: a slash can be typed in the field`);
  }
});

test('on a phone the search is in view at once, under the name, full width', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['c/kind.html', 'l/caccabus.html', 'rulings.html']) {
    await page.goto(pageUrl(path));
    const box = await page.locator('.head-search').boundingBox(), name = await page.locator('.site-name').boundingBox();
    const column = await page.locator('header.site-top').boundingBox();
    assert.ok(box.y >= name.y + name.height - 1, `${path}: under the name`);
    assert.ok(Math.abs(box.x - column.x) < 1 && Math.abs(box.width - column.width) < 1, `${path}: the column's full width`);
    assert.ok(box.y + box.height < 160, path);
    assert.ok((await page.locator('#site-search').boundingBox()).height >= 44);
    assert.ok((await page.locator('.settings > summary').boundingBox()).height >= 44);
  }
});

test('the footer of every page links to How we decide, Rulings and About', async () => {
  for (const [path, about] of [['index.html', '#about'], ['c/kind.html', '../index.html#about'], ['k/culina.html', '../index.html#about'],
                               ['words.html', 'index.html#about'], ['rulings.html', 'index.html#about']]) {
    await page.goto(pageUrl(path));
    const foot = page.locator('footer');
    for (const label of ['How we decide', 'Rulings']) assert.equal(await foot.getByRole('link', { name: label, exact: true }).count(), 1, `${path}: ${label}`);
    assert.equal(await foot.getByRole('link', { name: 'About', exact: true }).getAttribute('href'), about, path);
  }
  await page.goto(pageUrl('c/kind.html'));
  await page.locator('footer').getByRole('link', { name: 'About', exact: true }).click();
  await page.waitForURL(/index\.html#about$/);
  assert.equal(await page.locator('#about').isVisible(), true);
});

test('the settings hold the display options and the theme, on a phone as on a wide screen', async () => {
  for (const path of ['index.html', 'k/culina.html', 'c/perhaps.html']) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pageUrl(path));
      await page.locator('.settings > summary').click();
      const buttons = page.locator('.settings-panel button');
      assert.equal(await buttons.count(), 8);
      assert.ok((await buttons.evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height))).every(h => h >= 44));
      assert.equal(await overflows(), false, `${path} at ${width}px with the settings open`);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.settings').getAttribute('open'), null);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.evaluate(() => { localStorage.removeItem('lexicon-macrons'); localStorage.removeItem('lexicon-theme'); });
  await settle();
  await page.reload();
  await page.locator('.settings > summary').click();
  await page.locator('.settings-panel').getByRole('button', { name: 'Hidden', exact: true }).click();
  assert.equal(await page.locator('.hero h1').textContent(), 'Lexicon Latinitatis Cotidianae');
  await page.locator('.settings-panel').getByRole('button', { name: 'Dark', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('.settings-panel [data-theme-choice="dark"]').getAttribute('aria-pressed'), 'true');
  await settle();
  await page.goto(pageUrl('rulings.html'));
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.locator('.settings > summary').click();
  assert.equal(await page.locator('.settings-panel [data-display="macrons"][data-value="off"]').getAttribute('aria-pressed'), 'true');
  await page.locator('.settings-panel').getByRole('button', { name: 'Shown', exact: true }).click();
  await page.locator('.settings-panel').getByRole('button', { name: 'Light', exact: true }).click();
  await settle();
});

test('light is the default even on a dark system; the keyboard toggle persists its choice', async () => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light');
  await search('pyjama');
  const summary = page.locator('.settings > summary');
  await summary.focus(); await summary.press('Enter');
  const dark = page.getByRole('button', { name: 'Dark', exact: true });
  await dark.focus(); await dark.press('Space');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('#search').inputValue(), 'pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  await settle();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'dark');
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await settle();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.emulateMedia({ colorScheme: 'light' });
});

test('in dark mode, headings and labels are not red', async () => {
  await page.evaluate(() => localStorage.setItem('lexicon-theme', 'dark'));
  await settle();
  for (const [path, selectors] of [['c/perhaps.html', ['.sec-head h2', '.lab']], ['k/culina.html', ['.category-heading h1', '.cat-home']]]) {
    await page.goto(pageUrl(path));
    const colours = await page.evaluate(list => list.map(s => getComputedStyle(document.querySelector(s)).color), selectors);
    const red = colour => { const [r, g, b] = colour.match(/\d+/g).map(Number); return r - Math.max(g, b) > 40; };
    assert.deepEqual(colours.map(red), selectors.map(() => false), `${path}: ${colours}`);
  }
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await settle();
});

test('the theme can be chosen when saving preferences is blocked', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.mouse.click(4, 820);   // in the margin, away from any link
  assert.equal(await page.locator('.settings').getAttribute('open'), null, 'a tap outside closes the settings');
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.equal(await overflows(), false);
});

test('the theme toggle works on every page and the choice carries across pages', async () => {
  await page.goto(pageUrl('c/tickle.html'));
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await settle();
  for (const path of ['rulings.html', 'k/culina.html', 'words.html']) {
    await page.goto(pageUrl(path));
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', path);
  }
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await settle();
  await page.goto(url);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
});

test('display options hide macrons or write i for j on every page, and search still finds words', async () => {
  await page.evaluate(() => { localStorage.removeItem('lexicon-macrons'); localStorage.removeItem('lexicon-j'); });
  await settle();
  await page.reload();
  const brand = () => page.locator('.hero h1').textContent();
  assert.equal(await brand(), 'Lexicon Latīnitātis Cotīdiānae');
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Hidden', exact: true }).click();
  assert.equal(await brand(), 'Lexicon Latinitatis Cotidianae');
  await search('synthesis dormitoria');
  assert.equal(await page.locator('.search-result').first().locator('h3').textContent(), 'synthesis dormitoria');
  await page.getByRole('button', { name: 'iam', exact: true }).click();
  await search('jam');
  assert.equal(await page.locator('.search-result').count() > 0, true);
  assert.doesNotMatch(await page.locator('#search-result-list [lang="la"]').allTextContents().then(t => t.join(' ')), /j/);
  await settle();
  await page.goto(pageUrl('k/culina.html'));
  assert.doesNotMatch(await page.locator('.wlist').textContent(), /[āēīōūȳ]/);
  await page.goto(pageUrl('c/perhaps.html'));
  assert.match(await page.locator('.ex').textContent(), /Venietne avia\?/);
  assert.equal(await page.locator('.settings [data-display="macrons"][data-value="off"]').getAttribute('aria-pressed'), 'true');
  await page.locator('.settings > summary').click();
  await page.getByRole('button', { name: 'Shown', exact: true }).click();
  await page.getByRole('button', { name: 'jam', exact: true }).click();
  assert.match(await page.locator('.ex').textContent(), /Veniētne avia\?/);
  await settle();
  await page.goto(url);
  assert.equal(await brand(), 'Lexicon Latīnitātis Cotīdiānae');
});

test('consonantal u can be written u: lower case only, combined with the other options, and restored exactly', async () => {
  await page.evaluate(() => { ['lexicon-macrons', 'lexicon-j', 'lexicon-v'].forEach(key => localStorage.removeItem(key)); });
  await settle();
  await page.goto(pageUrl('c/see.html'));
  const lemma = () => page.locator('.lemma').first().textContent();
  const original = await lemma();
  assert.equal(original, 'videō, vidēre, vīdī, vīsum');
  await page.locator('.settings > summary').click();
  assert.equal(await page.locator('.settings-panel [data-display="v"][data-value="v"]').getAttribute('aria-pressed'), 'true');
  await page.locator('.settings-panel').getByRole('button', { name: 'uideo', exact: true }).click();
  assert.equal(await lemma(), 'uideō, uidēre, uīdī, uīsum', 'macrons are untouched');
  assert.equal(await page.locator('.settings-panel [data-display="v"][data-value="u"]').getAttribute('aria-pressed'), 'true');
  await settle();
  // Capital V stays: Vae victīs → Vae uictīs.
  await page.goto(pageUrl('c/alas.html'));
  assert.match(await page.locator('.ex').textContent(), /Vae uictīs\./);
  // It combines with iam, in either order, and with hidden macrons.
  await page.goto(pageUrl('c/young.html'));
  await page.locator('.settings > summary').click();
  await page.locator('.settings-panel').getByRole('button', { name: 'iam', exact: true }).click();
  assert.equal(await page.locator('.lemma').first().textContent(), 'iuuenis, iuuenis');
  await page.locator('.settings-panel').getByRole('button', { name: 'Hidden', exact: true }).click();
  await page.locator('.settings-panel').getByRole('button', { name: 'video', exact: true }).click();
  assert.equal(await page.locator('.lemma').first().textContent(), 'iuvenis, iuvenis');
  await page.locator('.settings-panel').getByRole('button', { name: 'uideo', exact: true }).click();
  await page.locator('.settings-panel').getByRole('button', { name: 'jam', exact: true }).click();
  assert.equal(await page.locator('.lemma').first().textContent(), 'juuenis, juuenis');
  await page.locator('.settings-panel').getByRole('button', { name: 'Shown', exact: true }).click();
  await settle();
  // Search results are written the same way, and switching back restores the text exactly.
  await page.goto(url);
  await search('uideo');
  const see = page.locator('.search-result[data-result-for="c-see"]');
  assert.match(await see.locator('h3').textContent(), /^uideō, uidēre/);
  await page.locator('.settings > summary').click();
  await page.locator('.settings-panel').getByRole('button', { name: 'video', exact: true }).click();
  assert.match(await see.locator('h3').textContent(), /^videō, vidēre/);
  await settle();
  await page.goto(pageUrl('c/see.html'));
  assert.equal(await lemma(), original);
});

test('the search reads u and v alike in Latin, as it reads i and j', async () => {
  await search('uideo');
  assert.ok((await resultIds()).includes('c-see'));
  await search('uinum');
  const vinum = await resultIds();
  await search('vinum');
  assert.deepEqual(await resultIds(), vinum);
  assert.ok(vinum.length > 0);
  // A form found from its stem: uidemus is a form of videō.
  await search('uidemus');
  assert.ok((await resultIds()).includes('c-see'));
  await search('love');
  const love = await resultIds();
  assert.ok(love.length > 0);
});

// Concept and word pages -------------------------------------------------------------------------

test('a note on a form opens with the form, the claim and the authority it departs from', async () => {
  await page.goto(pageUrl('c/perhaps.html'));
  assert.match(await page.locator('.side.note').textContent(), /^1fortasse: short final e \(Lewis & Short fortassē, without evidence\)\. Catull\. 85\.1/);
  assert.equal(await page.locator('.side.note span[lang="la"]').first().evaluate(el => getComputedStyle(el).fontStyle), 'italic');
});

test('a concept page has its notes, a ruling link and no horizontal overflow on a phone', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl('c/perhaps.html'));
  assert.match(await page.locator('h1').textContent(), /perhaps/);
  assert.equal(await page.locator('.side.note').count(), 1);
  const ruling = page.locator('.ruling-link').first();
  assert.match(await ruling.getAttribute('href'), /rulings\.html#r-fortasse$/);
  assert.equal(await overflows(), false);
  await ruling.click();
  await page.waitForURL(/rulings\.html#r-fortasse$/);
  assert.equal(await page.locator('#r-fortasse').isVisible(), true);
  assert.equal(await overflows(), false);
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

test('a tap anywhere on a search result opens its entry', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pageUrl('index.html?q=soap'));
  await page.waitForSelector('.search-result');
  // The English line, not the Latin heading.
  await page.locator('.search-result .r-en').first().click();
  await page.waitForURL(/\/c\/[a-z0-9-]+\.html$/);
  await page.setViewportSize({ width: 1280, height: 900 });
});
