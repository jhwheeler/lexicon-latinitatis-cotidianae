import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

let browser, page;
const pageUrl = path => new URL('../' + path, import.meta.url).href;
const url = pageUrl('index.html');
const resultIds = () => page.locator('.search-result').evaluateAll(nodes => nodes.map(n => n.dataset.resultFor));
// Typing searches at once; only the first search waits for the data to load.
const search = async query => {
  await page.locator('#search').fill(query);
  if (query) await page.waitForFunction(() => /matching/.test(document.getElementById('results').textContent));
};
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
});
after(async () => { await browser?.close(); });

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
  assert.equal(await page.locator('.hero details:not(.display-menu)').count(), 0);
  assert.equal(await page.locator('footer details').count(), 2);
  await page.locator('.about-link a').click();
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
  assert.equal(await plain.locator('.theme-toggle').isVisible(), false);
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
  await plain.locator('.cat-menu > summary').click();
  await plain.locator('.cat-menu a[href="../k/vestitus.html"]').click();
  await plain.waitForURL(/k\/vestitus\.html$/);
  assert.equal(await plain.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
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
        '.site-nav a, .theme-toggle, .filter button, .cat-menu > summary, .cat-home, .clear, .page-contents a, .toc a, .hero h1 a, .display-menu > summary, .wlist a, .az-nav a, .az a, .suggest a')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
        .map(el => [el.textContent.trim().slice(0, 24), Math.round(el.getBoundingClientRect().height)])
        .filter(([, height]) => height < 44));
      assert.deepEqual(small, [], `${path} at ${width}px has controls under 44px`);
    }
  }
  for (const path of ['index.html', 'k/culina.html']) {
    await page.goto(pageUrl(path));
    assert.ok(parseFloat(await page.locator('#search').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
  }
});

// Theme and display ----------------------------------------------------------------------------

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
  await page.emulateMedia({ colorScheme: 'light' });
});

test('in dark mode, headings and labels are not red', async () => {
  await page.evaluate(() => localStorage.setItem('lexicon-theme', 'dark'));
  for (const [path, selectors] of [['c/perhaps.html', ['.sec-head h2', '.lab']], ['k/culina.html', ['.category-heading h1', '.cat-home']]]) {
    await page.goto(pageUrl(path));
    const colours = await page.evaluate(list => list.map(s => getComputedStyle(document.querySelector(s)).color), selectors);
    const red = colour => { const [r, g, b] = colour.match(/\d+/g).map(Number); return r - Math.max(g, b) > 40; };
    assert.deepEqual(colours.map(red), selectors.map(() => false), `${path}: ${colours}`);
  }
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
});

test('the theme toggle works when saving preferences is blocked', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } }));
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await search('pyjama');
  assert.equal(await page.locator('.search-result').count(), 6);
  assert.equal(await overflows(), false);
});

test('the theme toggle works on every page and the choice carries across pages', async () => {
  await page.goto(pageUrl('c/tickle.html'));
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  for (const path of ['rulings.html', 'k/culina.html', 'words.html']) {
    await page.goto(pageUrl(path));
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', path);
  }
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.goto(url);
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
});

test('display options hide macrons or write i for j on every page, and search still finds words', async () => {
  await page.evaluate(() => { localStorage.removeItem('lexicon-macrons'); localStorage.removeItem('lexicon-j'); });
  await page.reload();
  const brand = () => page.locator('.hero h1').textContent();
  assert.equal(await brand(), 'Lexicon Latīnitātis Cotīdiānae');
  await page.locator('.display-menu > summary').click();
  await page.getByRole('button', { name: 'Hidden', exact: true }).click();
  assert.equal(await brand(), 'Lexicon Latinitatis Cotidianae');
  await search('synthesis dormitoria');
  assert.equal(await page.locator('.search-result').first().locator('h3').textContent(), 'synthesis dormitoria');
  await page.getByRole('button', { name: 'iam', exact: true }).click();
  await search('jam');
  assert.equal(await page.locator('.search-result').count() > 0, true);
  assert.doesNotMatch(await page.locator('#search-result-list [lang="la"]').allTextContents().then(t => t.join(' ')), /j/);
  await page.goto(pageUrl('k/culina.html'));
  assert.doesNotMatch(await page.locator('.wlist').textContent(), /[āēīōūȳ]/);
  await page.goto(pageUrl('c/perhaps.html'));
  assert.match(await page.locator('.ex').textContent(), /Venietne avia\?/);
  assert.equal(await page.locator('[data-display="macrons"][data-value="off"]').getAttribute('aria-pressed'), 'true');
  await page.locator('.display-menu > summary').click();
  await page.getByRole('button', { name: 'Shown', exact: true }).click();
  await page.getByRole('button', { name: 'jam', exact: true }).click();
  assert.match(await page.locator('.ex').textContent(), /Veniētne avia\?/);
  await page.goto(url);
  assert.equal(await brand(), 'Lexicon Latīnitātis Cotīdiānae');
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
