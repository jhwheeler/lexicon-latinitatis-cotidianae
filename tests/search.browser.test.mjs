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
  // The shared page goes without the service worker, so that each test sees the files as they are
  // fetched (a held or counted request is a real one); the offline test has a context of its own.
  page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
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

test('the search data never holds the page up: it is fetched once the page has loaded, before the first search', async () => {
  // Leave the page every test starts on, so that its own fetch of the data is not counted here.
  await page.goto('about:blank');
  const requested = [];
  page.on('request', request => requested.push(new URL(request.url()).pathname.split('/').pop()));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  assert.equal(requested.includes('search-data.js'), false);
  assert.equal(requested.includes('legacy.js'), false);
  assert.ok((await page.evaluate(() => document.documentElement.outerHTML.length)) < 60000);
  // Nothing typed, nothing focused: the data comes by itself when the page is idle.
  await page.waitForFunction(() => window.lexiconData);
  assert.equal(requested.includes('search-data.js'), true);
  page.removeAllListeners('request');
});

test('a search with thousands of matches draws only the first, and more on request', async () => {
  await search('a');
  const total = Number(/^([\d,]+) matching/.exec(await page.locator('#results').textContent())[1].replace(/,/g, ''));
  assert.ok(total > 1000);
  assert.equal(await page.locator('.search-result').count(), 30);
  const more = page.locator('#more-results');
  assert.match(await more.textContent(), /^Show 30 more · [\d,]+ not shown$/);
  assert.ok((await more.boundingBox()).height >= 44);
  await more.click();
  assert.equal(await page.locator('.search-result').count(), 60);
  // A narrower search has no more to show; an empty one clears the button with the results.
  await search('pyjama');
  assert.equal(await more.isHidden(), true);
  await page.locator('#clear').click();
  assert.equal(await more.isHidden(), true);
});

test('while the data is on its way the search says so, and then answers', async () => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/assets/search-data.js', async route => { await held; await route.continue(); });
  await page.goto(url);
  await page.locator('#search').fill('pyjama');
  await page.waitForFunction(() => document.getElementById('results').textContent === 'Loading the lexicon…');
  assert.equal(await page.locator('form.toolbar.loading').count(), 1);
  release();
  await page.waitForFunction(() => /matching/.test(document.getElementById('results').textContent));
  assert.equal(await page.locator('form.toolbar.loading').count(), 0);
  await page.unroute('**/assets/search-data.js');
});

test('the lexicon is kept on the device: it opens and searches offline, as an app of its own', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const app = await context.newPage();
  await app.goto(url);
  assert.equal(await app.locator('link[rel="manifest"]').getAttribute('href'), 'manifest.webmanifest');
  const manifest = await (await app.request.get(pageUrl('manifest.webmanifest'))).json();
  assert.equal(manifest.display, 'standalone');
  await app.evaluate(() => navigator.serviceWorker.ready);
  await app.waitForFunction(() => navigator.serviceWorker.controller);
  // An entry read while online is there offline; so are the front page, a category and the search.
  await app.goto(pageUrl('c/pyjamas.html'));
  await app.waitForLoadState('networkidle');
  await context.setOffline(true);
  await app.goto(pageUrl('index.html?q=pyjama'));
  await app.waitForFunction(() => /matching/.test(document.getElementById('results').textContent));
  assert.ok(await app.locator('.search-result').count() > 0);
  await app.goto(pageUrl('k/vestitus.html'));
  assert.ok(await app.locator('#category-view a').count() > 0);
  await app.goto(pageUrl('c/pyjamas.html'));
  assert.equal(await app.locator('h1.hw').count(), 1);
  // The practice pages too: the cards and the clock.
  await app.goto(pageUrl('practice.html'));
  assert.equal(await app.locator('#p-start').isVisible(), true);
  await app.locator('#p-start').click();
  assert.equal(await app.locator('#g-show').isVisible(), true);
  await app.goto(pageUrl('hora.html'));
  assert.equal(await app.locator('#go').isVisible(), true);
  assert.equal(await app.evaluate(() => document.fonts.check('18px "Lexicon Serif"')), true);
  // The guidance pages, never opened here, were saved when the lexicon was.
  for (const [path, title] of [['how-we-decide.html', 'How we decide'], ['how-practice-works.html', 'How the practice works']]) {
    await app.goto(pageUrl(path));
    assert.equal(await app.locator('h1').textContent(), title, `${path} offline`);
  }
  // A page never opened here says so, and leads back to the search.
  await app.goto(pageUrl('c/soap.html'));
  assert.match(await app.locator('h1').textContent(), /not saved on this device/);
  await context.close();
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

test('a list can show only the words or only the phrases, and the choice carries to the next list', async () => {
  await page.goto(pageUrl('words.html'));
  const shown = () => page.locator('.wlist > li:not([hidden])').count();
  const all = await shown();
  const group = page.locator('[data-kind-filter]');
  assert.equal(await group.isVisible(), true);
  await group.locator('button[data-kind="phrase"]').click();
  const phrases = await shown();
  assert.ok(phrases > 100 && phrases < all);
  assert.equal(await page.locator('.wlist > li:not([hidden])[data-kind="word"]').count(), 0);
  assert.match(await group.locator('.kind-count').textContent(), /^[\d,]+ phrases$/);
  // No letter is left as a bare heading, and its link goes with it.
  const empty = await page.locator('.az-letter:not([hidden])').evaluateAll(sections =>
    sections.filter(section => !section.querySelector('li:not([hidden])')).length);
  assert.equal(empty, 0);
  assert.equal(await page.locator('.az-nav a:not([hidden])').count(), await page.locator('.az-letter:not([hidden])').count());
  for (const button of await group.locator('button').all()) assert.ok((await button.boundingBox()).height >= 44);
  // The choice is kept on a category's page, and the words are the rest.
  await page.goto(pageUrl('k/sermo.html'));
  assert.equal(await page.locator('[data-kind-filter] button[data-kind="phrase"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.wlist > li:not([hidden])[data-kind="word"]').count(), 0);
  const sermoPhrases = await shown();
  await page.locator('[data-kind-filter] button[data-kind="word"]').click();
  const sermoWords = await shown();
  await page.locator('[data-kind-filter] button[data-kind="all"]').click();
  assert.equal(await shown(), sermoPhrases + sermoWords);
  await page.evaluate(() => localStorage.removeItem('lexicon-kind'));
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
  // The guidance pages have no script of their own: all of each is there, and its links work.
  await plain.goto(pageUrl('how-we-decide.html'));
  assert.equal(await plain.locator('ol.rules li').count(), 11);
  await plain.goto(pageUrl('how-practice-works.html'));
  assert.equal(await plain.locator('h1').textContent(), 'How the practice works');
  assert.equal(await plain.locator('main script').count(), 0);
  assert.ok(await plain.locator('#sources li').count() >= 10);
  assert.equal(await plain.locator('.settings').isVisible(), false);
  assert.equal(await plain.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await plain.locator('#evidence a[href="#s-cepeda-2006"]').first().click();
  assert.match(plain.url(), /#s-cepeda-2006$/);
  assert.equal(await plain.locator('#s-cepeda-2006').isVisible(), true);
  await plain.locator('.lead a[href="how-we-decide.html"]').click();
  await plain.waitForURL(/how-we-decide\.html$/);
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
                 'c/perhaps.html', 'l/fortasse.html', 'rulings.html', 'how-we-decide.html', 'how-practice-works.html', 'practice.html', 'hora.html', 'review.html'];
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of pages) {
      await page.goto(pageUrl(path));
      assert.equal(await overflows(), false, `${path} overflows at ${width}px`);
      const small = await page.evaluate(() => [...document.querySelectorAll(
        '.settings > summary, .head-search-field, .filter button, .cat-menu > summary, .cat-home, .clear, .page-contents a, .toc a, .hero h1 a, .site-name, .wlist a, .az-nav a, .az a, .suggest a, .how-sources a, '
        + '.plist a, .practice summary, .practice button, .practice a, .verdict button, .verdict a, .icon-btn, .mode-chip, .go, #answer, .keys button, .ref summary, .links a')]
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
        .map(el => [el.textContent.trim().slice(0, 24), Math.round(el.getBoundingClientRect().height)])
        .filter(([, height]) => height < 44));
      assert.deepEqual(small, [], `${path} at ${width}px has controls under 44px`);
    }
  }
  for (const [path, field] of [['index.html', '#search'], ['k/culina.html', '#search'], ['c/kind.html', '#site-search'], ['words.html', '#site-search'],
                               ['practice.html', '#site-search'], ['hora.html', '#answer']]) {
    await page.goto(pageUrl(path));
    assert.ok(parseFloat(await page.locator(field).evaluate(el => getComputedStyle(el).fontSize)) >= 16, path);
  }
});

// Theme and display ----------------------------------------------------------------------------

test('the header: the name, one search field, and the settings; the pages are in the footer', async () => {
  for (const [path, inPlace] of [['index.html', true], ['k/culina.html', true], ['c/kind.html', false], ['l/caccabus.html', false],
                                 ['words.html', false], ['latin.html', false], ['rulings.html', false], ['how-we-decide.html', false],
                                 ['how-practice-works.html', false]]) {
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

test('the footer of every page links to How we decide, Rulings, How the practice works and About', async () => {
  for (const [path, about] of [['index.html', '#about'], ['c/kind.html', '../index.html#about'], ['k/culina.html', '../index.html#about'],
                               ['words.html', 'index.html#about'], ['rulings.html', 'index.html#about'], ['practice.html', 'index.html#about'],
                               ['how-practice-works.html', 'index.html#about']]) {
    await page.goto(pageUrl(path));
    const foot = page.locator('footer');
    for (const label of ['How we decide', 'Rulings', 'How the practice works']) assert.equal(await foot.getByRole('link', { name: label, exact: true }).count(), 1, `${path}: ${label}`);
    assert.equal(await foot.getByRole('link', { name: 'About', exact: true }).getAttribute('href'), about, path);
    assert.equal(await foot.getByRole('link', { name: 'How the practice works', exact: true }).getAttribute('href'),
                 (path.includes('/') ? '../' : '') + 'how-practice-works.html', path);
    // The guidance stands together, before About; on a phone the footer still fits.
    assert.deepEqual((await page.locator('footer.site-foot a, .foot-links a').allTextContents()).slice(0, 4),
                     ['How we decide', 'Rulings', 'How the practice works', 'About'], path);
    await page.setViewportSize({ width: 320, height: 700 });
    assert.equal(await overflows(), false, `${path}: the footer fits a phone`);
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await page.goto(pageUrl('k/culina.html'));
  await page.locator('footer').getByRole('link', { name: 'How the practice works', exact: true }).click();
  await page.waitForURL(/how-practice-works\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'How the practice works');
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

test('under an entry’s sources one quiet link leads to How to read the sources; on a phone it is 44px tall', async () => {
  // The notes that stood under Sources in record after record are said once (Jack, 15 November 2026).
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(pageUrl('c/perhaps.html'));
  const link = page.locator('.c-sources .how-sources a');
  assert.equal(await link.count(), 1);
  assert.equal(await link.textContent(), 'How to read the sources');
  const box = await link.boundingBox();
  assert.ok(box.height >= 44, `the link is ${box.height}px tall`);
  // Quiet: the grey of the page's other small links, not ink, and after the sources themselves.
  assert.equal(await link.evaluate(el => getComputedStyle(el).color),
               await page.evaluate(() => { const probe = document.createElement('i'); probe.style.color = 'var(--soft)'; document.body.append(probe); const colour = getComputedStyle(probe).color; probe.remove(); return colour; }));
  assert.ok(box.y > (await page.locator('.c-sources p').first().boundingBox()).y);
  assert.doesNotMatch(await page.locator('.c-sources').textContent(), /marked “(Lewis & Short|composed)”/);
  await link.click();
  await page.waitForURL(/how-we-decide\.html#sources$/);
  const heading = page.locator('#sources h2');
  assert.equal(await heading.textContent(), 'How to read the sources');
  await page.waitForFunction(() => { const top = document.querySelector('#sources').getBoundingClientRect().top; return top >= 0 && top < innerHeight / 2; });
  assert.match(await page.locator('#sources').textContent(), /is given as Lewis & Short’s dictionary cites it/);
  assert.match(await page.locator('#sources').textContent(), /marked composed is a sentence of ours/);
  assert.equal(await overflows(), false);
  // The page's own contents lead to it too, with a control for a thumb.
  const jump = page.locator('.page-contents a[href="#sources"]');
  assert.ok((await jump.boundingBox()).height >= 44);
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

test('the words of one root lead to one another: the acrobat to the trampoline, on the entry and on the word’s page', async () => {
  // The page for acrobat gave petaurista and did not lead to petaurum, which the lexicon has under
  // trampoline (Jack, 13 November 2026).
  await page.goto(pageUrl('c/acrobat.html'));
  const line = page.locator('.term .family');
  assert.equal(await line.textContent(), 'Same family: petaurum (trampoline).');
  assert.equal(await line.locator('.fam-label').evaluate(el => getComputedStyle(el).fontStyle), 'italic');
  assert.equal(await line.locator('[lang="la"]').evaluate(el => getComputedStyle(el).fontStyle), 'normal');
  await line.locator('a', { hasText: 'trampoline' }).click();
  await page.waitForURL(/c\/trampoline\.html$/);
  assert.match(await page.locator('.term .family').textContent(), /^Same family: petaurista \(acrobat\), petauristārius \(acrobat\)\.$/);
  // "See also" keeps its own line and label
  await page.goto(pageUrl('c/send.html'));
  const labels = await page.locator('.see').evaluateAll(nodes => nodes.map(p => p.textContent.slice(0, 12)));
  assert.equal(labels.filter(text => text.startsWith('Same family:')).length, 1);
  assert.equal(labels.filter(text => text.startsWith('See also ')).length, 1);
  // The word's page: each word of the family leads to its own page, with the English it is entered under
  await page.goto(pageUrl('l/petaurista.html'));
  const family = page.locator('.word .family');
  assert.equal(await family.textContent(), 'Same family: petauristārius (acrobat), petaurum (trampoline).');
  assert.deepEqual(await family.locator('a').evaluateAll(nodes => nodes.map(a => [a.textContent, a.getAttribute('href')])),
                   [['petauristārius', 'petauristarius.html'], ['petaurum', 'petaurum.html']]);
  await family.locator('a', { hasText: 'petaurum' }).click();
  await page.waitForURL(/l\/petaurum\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'petaurum');
  assert.match(await page.locator('.word .family').textContent(), /petaurista \(acrobat\)/);
  // A word without a family has no line; a word that is two words has a line for each
  await page.goto(pageUrl('l/fortasse.html'));
  assert.equal(await page.locator('.family').count(), 0);
  await page.goto(pageUrl('l/volo.html'));
  assert.deepEqual(await page.locator('.family .fam-label').allTextContents(),
                   ['Same family as volō, volāre, volāvī, volātum:', 'Same family as volō, velle, voluī:']);
});

test('a long family: every link reaches a page, the entry shows the nearest and sends on, and a phone does not scroll sideways', async () => {
  await page.goto(pageUrl('c/send.html'));
  const line = page.locator('.term .family');
  assert.equal(await line.locator('span[lang="la"]').count(), 8);
  assert.match(await line.textContent(), /, and \d+ more on the page of mittō\.$/);
  const hrefs = await line.locator('a').evaluateAll(nodes => nodes.map(a => a.href));
  assert.ok(hrefs.length > 8);
  for (const href of hrefs) assert.equal((await page.request.get(href)).status(), 200, href);
  await line.locator('a[lang="la"]').click();
  await page.waitForURL(/l\/mitto\.html$/);
  const all = await page.locator('.word .family a').evaluateAll(nodes => nodes.map(a => a.href));
  assert.ok(all.length > 20, 'the word’s own page lists the whole family');
  for (const href of all) assert.equal((await page.request.get(href)).status(), 200, href);
  for (const path of ['l/mitto.html', 'c/send.html', 'l/eo.html', 'l/facio.html', 'c/acrobat.html']) {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pageUrl(path));
      assert.equal(await page.locator('.family').first().isVisible(), true, path);
      assert.equal(await overflows(), false, `${path} overflows at ${width}px`);
    }
  }
  // On a phone the family comes after the reasons that fold under the answer
  await page.goto(pageUrl('c/send.html'));
  const side = await page.locator('.term .side').first().boundingBox(), under = await page.locator('.term .family').boundingBox();
  assert.ok(under.y >= side.y + side.height - 1, 'the family line is the last thing under the answer');
});

test('every word of a Latin text leads to its word: a headline underlined, an example quietly', async () => {
  // Potest ex casā vir magnus exīre: only ex, vir and magnus were links (Jack, 13 November 2026).
  await page.goto(pageUrl('c/a-great-man-can-come-from-a-hovel.html'));
  const headline = page.locator('.term .lemma b');
  assert.equal(await headline.textContent(), 'Potest ex casā vir magnus exīre.');
  const links = await headline.locator('a').evaluateAll(nodes => nodes.map(a => [a.textContent, a.getAttribute('href')]));
  assert.deepEqual(links, [['Potest', '../l/possum.html'], ['ex', '../l/ex.html'], ['casā', '../l/casa.html'],
                           ['vir', '../l/vir.html'], ['magnus', '../l/magnus.html'], ['exīre', '../l/exeo.html']]);
  for (const [, href] of links) {
    assert.equal((await page.request.get(new URL(href, page.url()).href)).status(), 200, href);
  }
  assert.equal(await headline.locator('a').first().evaluate(a => getComputedStyle(a).textDecorationLine), 'underline');
  await headline.locator('a', { hasText: 'Potest' }).click();
  await page.waitForURL(/l\/possum\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'possum');

  // An example: every word can be tapped, in the same ink, with no underline until the pointer is on it.
  await page.goto(pageUrl('c/hut.html'));
  const sentence = page.locator('.ex .la.tap').first();
  const word = sentence.locator('a').first();
  assert.equal(await word.evaluate(a => getComputedStyle(a).textDecorationLine), 'none');
  assert.equal(await word.evaluate(a => getComputedStyle(a).color), await sentence.evaluate(p => getComputedStyle(p).color));
  await word.hover();
  assert.equal(await word.evaluate(a => getComputedStyle(a).textDecorationLine), 'underline');
  const target = (await word.getAttribute('href')).replace('../', '');
  await word.click();
  await page.waitForURL(address => address.pathname.endsWith('/' + target));
  assert.equal(await page.locator('article.word h1').count(), 1);

  // A word's own page does not link to itself, and nothing scrolls sideways on a phone.
  await page.setViewportSize({ width: 390, height: 760 });
  for (const path of ['c/a-great-man-can-come-from-a-hovel.html', 'c/hut.html', 'l/casa.html']) {
    await page.goto(pageUrl(path));
    assert.equal(await overflows(), false, `${path} overflows at 390px`);
  }
  assert.equal(await page.locator('a[href="casa.html"]').count(), 0);
  assert.equal(await page.locator('.ex .la.tap a').count() > 0, true);

  // The display options reach the linked words, and give them back exactly.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(pageUrl('c/a-great-man-can-come-from-a-hovel.html'));
  await page.evaluate(() => { ['lexicon-macrons', 'lexicon-j', 'lexicon-v'].forEach(key => localStorage.removeItem(key)); });
  await page.reload();
  await page.locator('.settings > summary').click();
  await page.locator('.settings-panel [data-display="macrons"][data-value="off"]').click();
  await page.locator('.settings-panel [data-display="v"][data-value="u"]').click();
  assert.equal(await headline.textContent(), 'Potest ex casa uir magnus exire.');
  assert.deepEqual(await headline.locator('a').evaluateAll(nodes => nodes.map(a => a.getAttribute('href'))), links.map(([, href]) => href));
  await page.locator('.settings-panel [data-display="macrons"][data-value="on"]').click();
  await page.locator('.settings-panel [data-display="v"][data-value="v"]').click();
  assert.equal(await headline.textContent(), 'Potest ex casā vir magnus exīre.');
  await settle();
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

// Practice --------------------------------------------------------------------------------------

// What practice keeps on the device; each test starts without it. Most tests read the interface in
// English; Latin, the default, has a test of its own.
const PRACTICE_KEYS = ['lexicon-practice', 'lexicon-practice-deck', 'lexicon-seen', 'lexicon-lists', 'lexicon-practice-lang'];
const forgetPractice = () => page.evaluate(keys => {
  keys.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('lexicon-practice-round');
}, PRACTICE_KEYS);
const openPractice = async (fresh = true, language = 'en') => {
  if (fresh) {
    await page.goto(pageUrl('practice.html'));
    await forgetPractice();
    if (language) await page.evaluate(code => localStorage.setItem('lexicon-practice-lang', code), language);
    await settle();
  }
  await page.goto(pageUrl('practice.html'));
  await page.locator('#practice:not([hidden])').waitFor();
};
// The deck's line: [cards, due now, new].
const deckCount = async () => {
  const text = await page.locator('#p-count').textContent();
  const found = /^([\d,]+) cards? · ([\d,]+) due now · ([\d,]+) new$/.exec(text);
  assert.ok(found, text);
  return found.slice(1).map(n => Number(n.replace(/,/g, '')));
};
const kept = key => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const keep = (key, value) => page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [key, value]);
const gameOpen = () => page.locator('#p-game').evaluate(node => node.open);
const startRound = async () => { await page.locator('#p-start').click(); await page.locator('#p-game[open]').waitFor(); };
const shownCard = async () => (await page.locator('#g-entry').getAttribute('href')).slice(2, -5);
// Show each card of the round and mark it; the ids, in order.
const playRound = async (mark = '#g-got') => {
  const ids = [];
  while (await page.locator('#g-show').isVisible()) {
    await page.locator('#g-show').click();
    ids.push(await shownCard());
    await page.locator(mark).click();
  }
  return ids;
};
const openGroup = id => page.locator(`.pgroup:has(#${id}) > summary`).click();
// The start of the day n days after a moment, by the browser's clock: a day starts at 04:00.
const dayStart = (moment, n) => page.evaluate(([at, days]) => {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getHours() < 4 ? 1 : 0) + days, 4).getTime();
}, [moment, n]);
// Chance held still, until the page is loaded again. At 0.999 nothing is shuffled, so a round is
// its due cards (the missed first, then the longest overdue) and then its new ones, and every
// spread wait is its longest; at 0 every spread wait is its shortest.
const holdChance = (value = 0.999) => page.evaluate(fixed => { Math.random = () => fixed; }, value);
// Chance that can be repeated: a small generator with a seed, in place of Math.random.
const seedChance = seed => page.evaluate(start => {
  let state = start >>> 0;
  Math.random = () => { state = (state + 0x6D2B79F5) >>> 0; let x = Math.imul(state ^ (state >>> 15), 1 | state); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}, seed);
// Show each card of the round and mark it "Got it"; for each its id and what it was called (new, due, lapsed).
const playAndNote = async () => {
  const seen = [];
  while (await page.locator('#g-show').isVisible()) {
    const status = await page.locator('#g-status').textContent();
    await page.locator('#g-show').click();
    seen.push({ id: await shownCard(), status });
    await page.locator('#g-got').click();
  }
  return seen;
};
// A deck of the reader's own, so that a test knows its cards.
const listDeck = async (items, extra = {}) => {
  await keep('lexicon-lists', [{ id: 'l1', name: 'Test', items }]);
  await keep('lexicon-practice-deck', { kind: ['w', 'p', 's'], part: [], cat: [], src: [], mine: ['list:l1'], ...extra });
  await settle();
  await openPractice(false);
};

test('a practice round: a layer of its own, the Latin on request, a mark that is saved, a card not due again', async () => {
  await openPractice();
  const [total, due, fresh] = await deckCount();
  assert.ok(total > 5000 && due === 0 && fresh === total, 'the deck starts as every word, all new');
  assert.equal(await page.locator('#p-now').textContent(), 'Words');
  assert.equal(await page.locator('#p-start').textContent(), 'Start');
  assert.equal(await gameOpen(), false);
  await startRound();
  assert.equal(await page.locator('#g-pos').textContent(), '1 / 12');
  assert.equal(await page.locator('#g-status').textContent(), 'new');
  assert.equal(await page.locator('#g-deck').textContent(), 'Words');
  assert.equal(await page.locator('#g-back').isVisible(), false);
  assert.ok((await page.locator('#g-cue').textContent()).length > 0);
  // A tap on the card itself shows its answer.
  await page.locator('#g-card').click();
  assert.equal(await page.locator('#g-back').isVisible(), true);
  assert.ok((await page.locator('#g-la').textContent()).length > 0);
  assert.equal(await page.locator('#g-la').getAttribute('lang'), 'la');
  assert.equal(await page.locator('#g-cue').getAttribute('lang'), 'en');
  const first = await shownCard();
  assert.match(first, /^[a-z0-9-]+$/);
  // Got it: a new card that is right first time was known already, and comes back in three or
  // four days, at the start of the day.
  const before = Date.now();
  await page.locator('#g-got').click();
  let saved = (await kept('lexicon-practice')).cards;
  assert.equal(saved[first].b, 3);
  assert.ok([await dayStart(before, 3), await dayStart(before, 4)].includes(saved[first].due) && saved[first].t >= before);
  assert.equal(await page.locator('#g-pos').textContent(), '2 / 12');
  // The keyboard: Space shows, 1 is Again (back in ten minutes), 2 is Got it.
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#g-back').isVisible(), true);
  const second = await shownCard();
  await page.keyboard.press('1');
  saved = (await kept('lexicon-practice')).cards;
  assert.equal(saved[second].b, 0);
  assert.ok(saved[second].due <= Date.now() + 11 * 60e3);
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Enter');
  const third = await shownCard();
  await page.keyboard.press('2');
  assert.equal((await kept('lexicon-practice')).cards[third].b, 3);
  // The rest of the round, then its summary.
  const rest = await playRound();
  assert.equal(rest.length, 9);
  assert.equal(new Set([first, second, third, ...rest]).size, 12);
  const head = await page.evaluate(id => /^(.+?)(?=\s*(?:,|\(|$))/.exec(window.lexiconPractice.cards.find(card => card.i === id).l)[1], second);
  assert.equal(await page.locator('#g-end').textContent(), `Round done: Got it 11, Again 1. ${(total - 12).toLocaleString('en')} new. «Again»: ${head}`,
               'the summary names the word that was missed');
  assert.equal(await page.locator('#g-next').isVisible(), true);
  assert.equal(await page.locator('#g-early').isVisible(), false);
  // The way out leads to the lobby, with its meter brought up to date.
  await page.locator('#g-exit').click();
  assert.equal(await gameOpen(), false);
  assert.match(await page.locator('#p-meter-text').textContent(), /^11 known · 1 learning · [\d,]+ new$/);
  assert.equal(await page.locator('#p-start').textContent(), 'Start');
  // Opened again, nothing marked is due, so none of it comes back.
  await openPractice(false);
  assert.deepEqual(await deckCount(), [total, 0, total - 12]);
  await startRound();
  const next = await playRound();
  assert.equal(next.length, 12);
  assert.equal(next.some(id => [first, second, third, ...rest].includes(id)), false);
  // Another round from the end of one.
  await page.locator('#g-next').click();
  assert.equal(await page.locator('#g-pos').textContent(), '1 / 12');
  // Once its time has come, a card is due, and is in the next round, among the new ones.
  await page.evaluate(id => {
    const progress = JSON.parse(localStorage.getItem('lexicon-practice'));
    progress.cards[id].due = Date.now() - 1000;
    localStorage.setItem('lexicon-practice', JSON.stringify(progress));
    localStorage.removeItem('lexicon-practice-round');
  }, first);
  await settle();
  await openPractice(false);
  assert.equal((await deckCount())[1], 1);
  await startRound();
  const again = await playAndNote();
  assert.equal(again.length, 12);
  assert.deepEqual(again.filter(card => card.status === 'due').map(card => card.id), [first]);
  assert.equal(again.filter(card => card.status === 'new').length, 11);
  assert.equal((await kept('lexicon-practice')).cards[first].b, 4);
  await forgetPractice();
});

test('the round’s layer covers the page; X and Escape close it; a round left open is taken up again', async () => {
  await page.setViewportSize({ width: 390, height: 760 });
  await openPractice();
  await listDeck(['train', 'soap', 'bone', 'perhaps']);
  const covered = () => page.evaluate(() => [[195, 20], [195, 380], [195, 740]].every(([x, y]) => !!document.elementFromPoint(x, y).closest('#p-game')));
  const locked = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden');
  assert.equal(await locked(), false);
  await startRound();
  assert.equal(await covered(), true, 'no header, search or footer shows');
  assert.equal(await locked(), true, 'the page does not scroll under the layer');
  assert.equal(await page.locator('header.site-top').evaluate(node => !!document.elementFromPoint(100, 30).closest('header.site-top')), false);
  await page.locator('#g-show').click();
  const card = await shownCard();
  // X closes; the lobby offers to go on, and going on finds the same card with its answer.
  await page.locator('#g-close').click();
  assert.equal(await gameOpen(), false);
  assert.equal(await locked(), false);
  assert.equal(await page.locator('#p-start').textContent(), 'Continue');
  await startRound();
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-marks').isVisible(), true);
  // Escape closes too.
  await page.keyboard.press('Escape');
  assert.equal(await gameOpen(), false);
  assert.equal(await page.locator('#p-start').textContent(), 'Continue');
  await startRound();
  // The entry's page and back: the round is still there, at the same card, with the answer shown.
  await page.locator('#g-entry').click();
  await page.waitForURL(new RegExp(`c/${card}\\.html$`));
  assert.match(await page.locator('h1.hw').textContent(), /\w/);
  await page.goBack();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-marks').isVisible(), true);
  assert.equal(await page.locator('#g-pos').textContent(), '1 / 4');
  assert.equal(await covered(), true);
  // So it is when the page is loaded afresh.
  await page.reload();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-marks').isVisible(), true);
  await page.locator('#g-got').click();
  assert.equal(await page.locator('#g-pos').textContent(), '2 / 4');
  assert.ok(card in (await kept('lexicon-practice')).cards);
  // A change of deck drops the round that was begun with the old one.
  await page.locator('#g-close').click();
  await page.locator('#p-deck > summary').click();
  await page.locator('#p-kind button[data-id="s"]').click();
  assert.equal(await page.locator('#p-start').textContent(), 'Start');
  await page.reload();
  await page.locator('#practice:not([hidden])').waitFor();
  assert.equal(await gameOpen(), false);
  await forgetPractice();
});

test('the back of a card: where the answer comes from, the other words, and an example only if it has the answer', async () => {
  await openPractice();
  await listDeck(['train', 'concern', 'play-dough', 'perhaps', 'bone']);
  await startRound();
  const backs = {};
  while (await page.locator('#g-show').isVisible()) {
    await page.locator('#g-show').click();
    backs[await shownCard()] = await page.evaluate(() => {
      const text = id => { const node = document.getElementById(id); return node.getClientRects().length ? node.textContent : null; };
      return { la: text('g-la'), origin: text('g-origin'), also: text('g-also'), example: text('g-ex-la'), source: document.querySelector('#g-ex-en .src')?.textContent,
        star: !!document.querySelector('#g-la .ours') };
    });
    await page.locator('#g-got').click();
  }
  // The period and the first citations, as the entry's page gives them.
  assert.equal(backs.train.la, 'trāmen, trāminis n.');
  assert.equal(backs.train.origin, 'modern · M-O s.v. train; Traupman 211, 219, 397');
  assert.equal(backs.perhaps.origin, 'classical · Cic. Div. Caec. 40; Traupman 344');
  // A word of our own says so in words, beside its asterisk.
  assert.equal(backs['play-dough'].origin, 'our formation');
  assert.deepEqual([backs['play-dough'].star, backs.train.star], [true, false]);
  // The record's other words.
  assert.equal(backs.train.also, 'Also: trāmen ferriviārium, hamaxostichus, trāmen commūne');
  assert.equal(backs.bone.also, null);
  // The example has the answer in it, or there is none.
  assert.match(backs.train.example, /[Tt]rām(en|ine)/);
  assert.equal(backs.perhaps.example, 'Fortasse.');
  assert.equal(backs.perhaps.source, 'composed');
  assert.match(backs['play-dough'].example, /massā lūsōriā/);
  assert.equal(backs.concern.la, 'cūra, cūrae f.');
  assert.equal(backs.concern.example, null, 'none of its record’s examples has cūra in it');
  assert.equal(backs.bone.example, null);
  // With a source chosen, its sentence is the one shown.
  await page.locator('#g-exit').click();
  await forgetPractice();
  await page.evaluate(() => localStorage.setItem('lexicon-practice-lang', 'en'));
  await listDeck(['double-verb'], { src: ['cicero'] });
  await startRound();
  await page.locator('#g-show').click();
  assert.match(await page.locator('#g-ex-la').textContent(), /^prīncipiō duplicāvit/);
  assert.equal(await page.locator('#g-ex-en .src').textContent(), 'Cic. Rep. 2.35');
  await forgetPractice();
});

test('one step back: a mark is undone, for a new card and for a known one, until the next mark', async () => {
  await openPractice();
  const known = { b: 4, due: Date.now() - 5000, t: 5 };
  await keep('lexicon-practice', { cards: { soap: known }, at: 5 });
  await listDeck(['train', 'soap', 'bone']);
  await holdChance();
  await startRound();
  const undo = page.locator('#g-undo');
  const cards = async () => (await kept('lexicon-practice')).cards;
  assert.equal(await undo.isVisible(), false, 'nothing to undo yet');
  // The known card is due and, the round not being shuffled here, comes first: Got it, then back,
  // and its record is as it was.
  await page.locator('#g-show').click();
  assert.equal(await shownCard(), 'soap');
  await page.locator('#g-got').click();
  assert.equal((await cards()).soap.b, 5);
  assert.equal(await page.locator('#g-pos').textContent(), '2 / 3');
  assert.equal(await undo.isVisible(), true);
  await undo.click();
  assert.deepEqual((await cards()).soap, known);
  assert.equal(await shownCard(), 'soap');
  assert.equal(await page.locator('#g-marks').isVisible(), true, 'the answer is shown, ready to be marked again');
  assert.equal(await page.locator('#g-pos').textContent(), '1 / 3');
  assert.equal(await page.locator('#g-status').textContent(), 'due');
  assert.equal(await undo.isVisible(), false, 'one step only');
  // Marked again, the other way; Backspace takes that back too.
  await page.locator('#g-again').click();
  assert.equal((await cards()).soap.b, 0);
  await page.keyboard.press('Backspace');
  assert.deepEqual((await cards()).soap, known);
  await page.locator('#g-got').click();
  // A new card: back means it has no record again.
  await page.locator('#g-show').click();
  const fresh = await shownCard();
  await page.locator('#g-got').click();
  assert.equal((await cards())[fresh].b, 3);
  await page.keyboard.press('z');
  assert.equal(fresh in (await cards()), false);
  assert.equal(await shownCard(), fresh);
  assert.equal(await page.locator('#g-status').textContent(), 'new');
  await page.locator('#g-again').click();
  assert.equal((await cards())[fresh].b, 0);
  // The last card of the round can be taken back from the summary, and the tally with it.
  await page.locator('#g-show').click();
  const last = await shownCard();
  await page.locator('#g-got').click();
  assert.match(await page.locator('#g-end').textContent(), /^Round done: Got it 2, Again 1\..* «Again»: \S+$/);
  await undo.click();
  assert.equal(await shownCard(), last);
  assert.equal(last in (await cards()), false);
  assert.equal(await page.locator('#g-pos').textContent(), '3 / 3');
  // The step back is kept with the round: it is still offered after the page is loaded again.
  await page.locator('#g-again').click();
  await page.reload();
  await page.locator('#p-game[open]').waitFor();
  assert.match(await page.locator('#g-end').textContent(), /^Round done: Got it 1, Again 2\./);
  await undo.click();
  assert.equal(await shownCard(), last);
  assert.equal(last in (await cards()), false);
  await forgetPractice();
});

// Spacing (Jack, 15 November 2026) ------------------------------------------------------------
// A page of its own, on Sofia's time, whose clock the test sets; the helpers above act on it
// meanwhile. The time stands still at what was set, so a record's times can be compared exactly.
const sofia = (day, time) => new Date(`2026-11-${day}T${time}:00+02:00`).getTime();   // 16 November 2026 is a Monday
const withClock = async run => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', timezoneId: 'Europe/Sofia' });
  const shared = page;
  page = await context.newPage();
  // The clock is set, and the lobby opened at that time: the cards due then.
  const at = async moment => { await page.clock.setFixedTime(new Date(moment)); await openPractice(false); return (await deckCount())[1]; };
  try { await page.clock.setFixedTime(new Date(sofia(16, '20:00'))); await run(at); } finally { page = shared; await context.close(); }
};
// Play the round: "Again" for these ids, "Got it" for the rest; then leave it. What each card was called.
const playMissing = async (...missed) => {
  const called = {};
  await startRound();
  while (await page.locator('#g-show').isVisible()) {
    const status = await page.locator('#g-status').textContent();
    await page.locator('#g-show').click();
    const id = await shownCard();
    called[id] = status;
    await page.locator(missed.includes(id) ? '#g-again' : '#g-got').click();
  }
  const end = await page.locator('#g-end').textContent();
  await page.locator('#g-exit').click();
  return { called, end };
};
const progressCards = async () => (await kept('lexicon-practice')).cards;
// The round as it is kept for the visit: its cards in order.
const roundIds = async () => { const round = await page.evaluate(() => JSON.parse(localStorage.getItem('lexicon-practice-round'))); return [round.current, ...round.queue]; };

test('the front of a card says what the cue leaves open: the other English names, the gloss, an example in English', async () => {
  await openPractice();
  // A round at the card for "in turn", which could be several Latin words (Jack, 15 November 2026).
  const begin = current => page.evaluate(id => localStorage.setItem('lexicon-practice-round', JSON.stringify(
    { queue: ['soap'], current: id, shown: false, done: false, got: 0, again: 0, missed: [], size: 2, last: '', undo: null, open: true, at: Date.now() })), current);
  await begin('in-turn');
  await page.reload();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await page.locator('#g-cue').textContent(), 'in turn adverb');
  assert.equal(await page.locator('#g-more').textContent(), 'Also: take turns, in turns, alternately');
  assert.equal(await page.locator('#g-gloss').textContent(), 'in turn, back');
  const context = await page.locator('#g-context').textContent();
  assert.match(context, /^“.+ in turn”$/);
  // Nothing on the front is Latin: the answer is not given away.
  assert.equal(await page.locator('#g-back').isHidden(), true);
  assert.equal(await page.locator('#g-hints [lang="la"]').count(), 0);
  assert.doesNotMatch(await page.locator('#g-hints').textContent(), /vicissim|invicem/);
  // Turned, the example stands on the back with its Latin and is not said twice.
  await page.locator('#g-show').click();
  assert.equal(await page.locator('#g-context').isHidden(), true);
  assert.equal(await page.locator('#g-more').isVisible(), true);
  assert.equal(await page.locator('#g-ex-en span').first().textContent(), context.slice(1, -1));
  assert.match(await page.locator('#g-ex-la').textContent(), /vicissim/);
  // In Latin the label is the back's own: Item.
  await page.locator('#g-close').click();
  await page.evaluate(() => localStorage.setItem('lexicon-practice-lang', 'la'));
  await page.reload();
  await page.locator('#p-start').click();
  await page.locator('#p-game[open]').waitFor();
  assert.match(await page.locator('#g-more').textContent(), /^Item: take turns/);
  await page.locator('#g-close').click();
  // A card with nothing to add has none of the three lines, and a saying is not given as its own example.
  await page.evaluate(() => localStorage.setItem('lexicon-practice-lang', 'en'));
  const bare = await page.evaluate(() => {
    const cards = window.lexiconPractice.cards;
    const fold = s => s.toLowerCase().replace(/[^a-z]/g, '');
    return { none: cards.find(card => !card.o && !card.g && !card.q).i, same: (cards.find(card => card.q && fold(card.q[0][1]) === fold(card.e)) || {}).i || null };
  });
  // From another page: closing the round's layer keeps the round once more a moment later (the
  // dialog's own close event), and on a slow machine that came after the line below and undid it.
  await page.goto(url);
  await begin(bare.none);
  await page.goto(pageUrl('practice.html'));
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await page.locator('#g-hints p:not([hidden])').count(), 0);
  if (bare.same) {
    await begin(bare.same);
    await page.reload();
    await page.locator('#p-game[open]').waitFor();
    assert.equal(await page.locator('#g-context').isHidden(), true);
  }
  await forgetPractice();
});

test('the round outlives the visit: an entry opened from its card leads back to it, a new visit takes it up, and after twelve hours it is gone', async () => {
  await openPractice();
  await startRound();
  await page.locator('#g-show').click();
  const card = await shownCard();
  // The entry opened from the card has a quiet link back to the round, in the practice's language.
  await page.locator('#g-entry').click();
  await page.waitForURL(new RegExp(`c/${card}\\.html$`));
  const back = page.locator('.round-back a');
  assert.equal(await back.textContent(), '← Back to the round');
  assert.equal(await back.getAttribute('lang'), 'en');
  assert.equal((await back.boundingBox()).height >= 44, true);
  await page.evaluate(() => localStorage.removeItem('lexicon-practice-lang'));
  await page.reload();
  assert.equal(await back.textContent(), '← Redī ad cursum');
  assert.equal(await back.getAttribute('lang'), 'la');
  await page.evaluate(() => localStorage.setItem('lexicon-practice-lang', 'en'));
  // Another entry has none.
  await page.goto(pageUrl(`c/${card === 'soap' ? 'bone' : 'soap'}.html`));
  assert.equal(await page.locator('.round-back').count(), 0);
  // A new visit, as after a sheet over the app on an iPhone: nothing of the session is left and
  // there is nothing to go back to. The link leads to the round, at that card, its answer shown.
  await page.goto(pageUrl(`c/${card}.html`));
  await page.evaluate(() => sessionStorage.clear());
  await back.click();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-marks').isVisible(), true);
  // So does the practice page opened afresh, with nothing of the session left.
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(pageUrl('practice.html'));
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await shownCard(), card);
  // A round the version before left in sessionStorage is taken up once, and moved.
  await page.evaluate(() => {
    const round = JSON.parse(localStorage.getItem('lexicon-practice-round'));
    delete round.at;
    sessionStorage.setItem('lexicon-practice-round', JSON.stringify(round));
    localStorage.removeItem('lexicon-practice-round');
  });
  await page.reload();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await shownCard(), card);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('lexicon-practice-round')), null);
  // Two hours on, the lobby offers the round and does not open it by itself; the entry still leads back.
  const age = hours => page.evaluate(h => {
    const round = JSON.parse(localStorage.getItem('lexicon-practice-round'));
    round.at = Date.now() - h * 3600e3;
    localStorage.setItem('lexicon-practice-round', JSON.stringify(round));
  }, hours);
  await age(2);
  await page.goto(pageUrl('practice.html'));
  await page.locator('#practice:not([hidden])').waitFor();
  assert.equal(await page.locator('#p-game[open]').count(), 0);
  assert.equal(await page.locator('#p-start').textContent(), 'Continue');
  await page.goto(pageUrl(`c/${card}.html`));
  assert.equal(await page.locator('.round-back').count(), 1);
  // Thirteen hours on it is gone, from the entry and from the lobby.
  await age(13);
  await page.reload();
  assert.equal(await page.locator('.round-back').count(), 0);
  await page.goto(pageUrl('practice.html'));
  await page.locator('#practice:not([hidden])').waitFor();
  assert.equal(await page.locator('#p-start').textContent(), 'Start');
  assert.equal(await page.evaluate(() => localStorage.getItem('lexicon-practice-round')), null);
  await forgetPractice();
});

test('spacing: a missed word comes back the same day, the next day, then three days on; a word known at sight after three or four days', async () => {
  await withClock(async at => {
    const monday = sofia(16, '20:00');
    await openPractice();
    await listDeck(['soap', 'bone']);
    await holdChance();   // every spread wait is its longest
    // Monday 20:00: soap is missed; bone, never seen before, is known.
    let round = await playMissing('soap');
    assert.deepEqual(round.called, { soap: 'new', bone: 'new' });
    let cards = await progressCards();
    assert.deepEqual(cards.soap, { b: 0, due: monday + 600e3, t: monday }, 'missed: the first box, ten minutes');
    assert.deepEqual(cards.bone, { b: 3, due: sofia(20, '04:00'), t: monday }, 'known at sight: the 3-day box, due at the start of Friday');
    assert.equal(round.end, 'Round done: Got it 1, Again 1. Nothing is due. The next card comes back within the hour. «Again»: sāpō');
    // Ten minutes later it is due, and not before. Got right, it skips the hour and waits for the next day.
    assert.equal(await at(sofia(16, '20:09')), 0);
    assert.equal(await at(sofia(16, '20:10')), 1);
    round = await playMissing();
    assert.deepEqual(round.called, { soap: 'lapsed' });
    assert.deepEqual((await progressCards()).soap, { b: 2, due: sofia(17, '04:00'), t: sofia(16, '20:10') }, 'relearnt: the 1-day box, due from the start of Tuesday');
    assert.equal(round.end, 'Round done: Got it 1, Again 0. Nothing is due. The next card comes back in 8 hours.');
    // Not again on Monday, however late; Tuesday begins at 04:00, and at 17:00, 21 hours after the mark, the word is due.
    assert.equal(await at(sofia(16, '23:59')), 0);
    assert.equal(await at(sofia(17, '03:59')), 0);
    assert.equal(await at(sofia(17, '04:00')), 1);
    assert.equal(await at(sofia(17, '17:00')), 1);
    await holdChance();
    round = await playMissing();
    assert.deepEqual(round.called, { soap: 'due' });
    assert.deepEqual((await progressCards()).soap, { b: 3, due: sofia(21, '04:00'), t: sofia(17, '17:00') }, 'up a box: three or four days, here four');
    assert.equal(round.end, 'Round done: Got it 1, Again 0. Nothing is due. The next card comes back in 3 days.', 'bone, on Friday: days of the calendar');
    // A card got right in the 1-day box is not shown again that day, nor the next.
    assert.equal(await at(sofia(17, '23:00')), 0);
    assert.equal(await at(sofia(18, '17:00')), 0);
    // The word known at sight on Monday comes back on Friday, the other on Saturday.
    assert.equal(await at(sofia(20, '03:59')), 0);
    assert.equal(await at(sofia(20, '04:00')), 1);
    assert.equal(await at(sofia(21, '04:00')), 2);
    await forgetPractice();
  });
});

test('spacing: a day starts at 04:00, so a session after midnight belongs to the evening before', async () => {
  await withClock(async at => {
    // 01:00 on Tuesday is still Monday.
    const night = sofia(17, '01:00');
    await page.clock.setFixedTime(new Date(night));
    await openPractice();
    await listDeck(['soap', 'bone']);
    await holdChance(0);   // every spread wait is its shortest
    await playMissing('soap');
    assert.deepEqual((await progressCards()).bone, { b: 3, due: sofia(19, '04:00'), t: night }, 'three days after Monday: Thursday');
    assert.equal(await at(sofia(17, '01:10')), 1);
    const round = await playMissing();
    assert.deepEqual((await progressCards()).soap, { b: 2, due: sofia(17, '04:00'), t: sofia(17, '01:10') }, 'the next day begins at 04:00 the same morning');
    assert.equal(round.end, 'Round done: Got it 1, Again 0. Nothing is due. The next card comes back in 3 hours.');
    assert.equal(await at(sofia(17, '03:59')), 0);
    assert.equal(await at(sofia(17, '09:00')), 1);
    // Marked at 04:00 or after, a card belongs to the new day.
    await holdChance(0);
    await playMissing();
    assert.deepEqual((await progressCards()).soap, { b: 3, due: sofia(20, '04:00'), t: sofia(17, '09:00') });
    await forgetPractice();
  });
});

test('spacing: the longer waits are spread over whole days, and a card missed in any box starts again', async () => {
  await withClock(async at => {
    const now = sofia(16, '20:00'), ids = ['soap', 'bone', 'train', 'judge', 'cooking-pot', 'perhaps'];
    const stored = () => ({ cards: Object.fromEntries(ids.map((id, n) => [id, { b: n + 1, due: now - 1000, t: 5 }])), at: 5 });
    const days = async chance => {
      await keep('lexicon-practice', stored());
      await listDeck(ids);
      await holdChance(chance);
      await playMissing();
      const cards = await progressCards();
      return ids.map(id => [cards[id].b, (cards[id].due - sofia(16, '04:00')) / 86400e3]);
    };
    await openPractice();
    // From the boxes 1 to 6: the hour box (a card of the hub's) goes to the 1-day box; the 35-day box to about 80 days.
    assert.deepEqual(await days(0), [[2, 1], [3, 3], [4, 6], [5, 14], [6, 30], [7, 70]]);
    assert.deepEqual(await days(0.999), [[2, 1], [3, 4], [4, 8], [5, 18], [6, 40], [7, 90]]);
    // With chance as it comes, each wait is a whole number of days within its bounds.
    await keep('lexicon-practice', stored());
    await listDeck(ids);
    await seedChance(7);
    await playMissing('judge');
    const cards = await progressCards();
    const bounds = { soap: [1, 1], bone: [3, 4], train: [6, 8], 'cooking-pot': [30, 40], perhaps: [70, 90] };
    for (const [id, [fewest, most]] of Object.entries(bounds)) {
      const wait = (cards[id].due - sofia(16, '04:00')) / 86400e3;
      assert.ok(Number.isInteger(wait) && wait >= fewest && wait <= most, `${id}: ${wait}`);
    }
    assert.deepEqual(cards.judge, { b: 0, due: now + 600e3, t: now }, 'missed in the 7-day box: the first box, ten minutes');
    await forgetPractice();
  });
});

test('spacing: at most half of a round is repetition while the deck has new words, and the two are mixed', async () => {
  await openPractice();
  const [total] = await deckCount();
  // Thirty words with a record, all due: three missed a few minutes ago, two due ten days ago, the rest yesterday.
  const now = Date.now(), day = 86400e3;
  const ids = await page.evaluate(() => {
    const heads = new Set();
    return window.lexiconPractice.cards.filter(card => !card.t).filter(card => { const head = /^(.+?)(?=\s*(?:,|\(|$))/.exec(card.l)[1]; return !heads.has(head) && heads.add(head); })
      .slice(0, 30).map(card => card.i);
  });
  const missed = ids.slice(0, 3), old = ids.slice(3, 5), yesterday = ids.slice(5);
  const stored = { cards: {}, at: 5 };
  missed.forEach(id => { stored.cards[id] = { b: 0, due: now - 60e3, t: now - 660e3 }; });
  old.forEach(id => { stored.cards[id] = { b: 4, due: now - 10 * day, t: now - 17 * day }; });
  yesterday.forEach(id => { stored.cards[id] = { b: 2, due: now - day, t: now - 2 * day }; });
  await keep('lexicon-practice', stored);
  await settle();
  // Two rounds from the same state, each with its own chance.
  const begin = async seed => {
    await page.evaluate(() => localStorage.removeItem('lexicon-practice-round'));
    await openPractice(false);
    await seedChance(seed);
    await startRound();
    return roundIds();
  };
  const first = await begin(1);
  assert.deepEqual(await deckCount(), [total, 30, total - 30]);
  assert.equal(first.length, 12);
  const due = first.filter(id => ids.includes(id));
  assert.equal(due.length, 6, 'six repetitions');
  assert.equal(first.filter(id => !ids.includes(id)).length, 6, 'six new words');
  // Which repetitions: the missed ones, then the longest overdue, then one of yesterday's.
  assert.deepEqual(due.filter(id => missed.includes(id)).sort(), [...missed].sort());
  assert.deepEqual(due.filter(id => old.includes(id)).sort(), [...old].sort());
  assert.equal(due.filter(id => yesterday.includes(id)).length, 1);
  // Mixed: not the repetitions and then the new words, nor the other way round.
  const turns = round => round.filter((id, n) => n && ids.includes(id) !== ids.includes(round[n - 1])).length;
  assert.ok(turns(first) > 1, first.map(id => (ids.includes(id) ? 'd' : 'n')).join(''));
  // No two cards of a round share a Latin headword.
  const headsOf = round => page.evaluate(list => list.map(id => /^(.+?)(?=\s*(?:,|\(|$))/.exec(window.lexiconPractice.cards.find(card => card.i === id).l)[1]), round);
  assert.equal(new Set(await headsOf(first)).size, 12);
  // Another time, the same rule gives another round: other new words, another of yesterday's, another order.
  const others = [await begin(2), await begin(3)], second = others[1];
  for (const round of others) {
    assert.equal(round.filter(id => ids.includes(id)).length, 6);
    assert.deepEqual(round.filter(id => missed.includes(id) || old.includes(id)).sort(), [...missed, ...old].sort());
    assert.notDeepEqual(round, first);
    assert.notDeepEqual(round.filter(id => !ids.includes(id)).sort(), first.filter(id => !ids.includes(id)).sort());
  }
  assert.ok(new Set([first, ...others].map(round => round.find(id => yesterday.includes(id)))).size > 1, 'among cards due on the same day the choice is by chance');
  // The round played: the cards are called what they are, and what was not taken is still waiting.
  const played = await playAndNote();
  assert.deepEqual(played.map(card => card.id), second);
  assert.deepEqual(played.map(card => card.status), second.map(id => (missed.includes(id) ? 'lapsed' : ids.includes(id) ? 'due' : 'new')));
  assert.equal(await page.locator('#g-end').textContent(), `Round done: Got it 12, Again 0. 24 due now, ${(total - 36).toLocaleString('en')} new.`);
  assert.equal(await page.locator('#g-next').isVisible(), true);
  // The next round again has six of each, and nothing that was just marked.
  await page.locator('#g-next').click();
  const third = await roundIds();
  assert.equal(third.filter(id => ids.includes(id)).length, 6);
  assert.equal(third.some(id => second.includes(id)), false, 'nothing of the round just played');
  await forgetPractice();
});

test('spacing: the more words wait, the more of a round is repetition; the waits grow to a year and stop', async () => {
  await openPractice();
  const now = Date.now(), day = 86400e3;
  const ids = await page.evaluate(() => {
    const heads = new Set();
    return window.lexiconPractice.cards.filter(card => !card.t).filter(card => { const head = /^(.+?)(?=\s*(?:,|\(|$))/.exec(card.l)[1]; return !heads.has(head) && heads.add(head); })
      .slice(0, 80).map(card => card.i);
  });
  // How many of a new round are repetitions when so many words are waiting (the deck has thousands of new ones).
  const share = async count => {
    const waiting = ids.slice(0, count);
    // From another page: the practice page keeps its round as it is left.
    await page.goto(url);
    await keep('lexicon-practice', { cards: Object.fromEntries(waiting.map(id => [id, { b: 2, due: now - day, t: now - 2 * day }])), at: 5 });
    await page.evaluate(() => localStorage.removeItem('lexicon-practice-round'));
    await openPractice(false);
    await startRound();
    const round = await roundIds();
    await page.locator('#g-close').click();
    return round.filter(id => waiting.includes(id)).length;
  };
  assert.equal(await share(36), 6);
  assert.equal(await share(37), 8);
  assert.equal(await share(72), 8);
  assert.equal(await share(73), 10);
  // A card in the top box stays there, and comes back in about a year.
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem('lexicon-practice-round'));
  await keep('lexicon-practice', { cards: { [ids[0]]: { b: 9, due: now - day, t: 5 }, [ids[1]]: { b: 8, due: now - day, t: 5 } }, at: 5 });
  await listDeck(ids.slice(0, 2));
  await startRound();
  for (let n = 0; n < 2; n++) { await page.locator('#g-show').click(); await page.locator('#g-got').click(); }
  const cards = await progressCards();
  for (const id of ids.slice(0, 2)) {
    assert.equal(cards[id].b, 9);
    const wait = (cards[id].due - now) / day;
    assert.ok(wait > 298 && wait < 421, `${id}: ${wait}`);
  }
  await forgetPractice();
});

test('spacing: with no new words left a round is all repetitions, and with few new ones the due fill it', async () => {
  await openPractice();
  const ids = await page.evaluate(() => {
    const heads = new Set();
    return window.lexiconPractice.cards.filter(card => !card.t).filter(card => { const head = /^(.+?)(?=\s*(?:,|\(|$))/.exec(card.l)[1]; return !heads.has(head) && heads.add(head); })
      .slice(0, 14).map(card => card.i);
  });
  const now = Date.now();
  const due = list => ({ cards: Object.fromEntries(list.map((id, n) => [id, { b: 2, due: now - (n + 1) * 86400e3, t: 5 }])), at: 5 });
  // Fourteen words, all due: twelve of them, the longest overdue, and no new one.
  await keep('lexicon-practice', due(ids));
  await listDeck(ids);
  assert.deepEqual(await deckCount(), [14, 14, 0]);
  await seedChance(3);
  await startRound();
  let round = await roundIds();
  assert.deepEqual([...round].sort(), ids.slice(2).sort(), 'the two due most lately wait for the next round');
  assert.notDeepEqual(round, ids.slice(2).reverse(), 'and they are not in the order of their dates');
  let played = await playAndNote();
  assert.deepEqual([...new Set(played.map(card => card.status))], ['due']);
  assert.equal(await page.locator('#g-end').textContent(), 'Round done: Got it 12, Again 0. 2 due now.');
  await page.locator('#g-exit').click();
  // Twelve due and two new: six repetitions, the two new words, and four more repetitions to fill the round.
  await keep('lexicon-practice', due(ids.slice(0, 12)));
  await listDeck(ids);
  assert.deepEqual(await deckCount(), [14, 12, 2]);
  await seedChance(3);
  await startRound();
  round = await roundIds();
  assert.equal(round.length, 12);
  assert.deepEqual(round.filter(id => ids.indexOf(id) >= 12).sort(), ids.slice(12).sort());
  assert.deepEqual(round.filter(id => ids.indexOf(id) < 12).sort(), ids.slice(2, 12).sort());
  // Three due and the deck full of new words: the three, and nine new.
  await keep('lexicon-practice', due(ids.slice(0, 3)));
  await keep('lexicon-practice-deck', { kind: ['w'], part: [], cat: [], src: [], mine: [] });
  await page.evaluate(() => localStorage.removeItem('lexicon-practice-round'));
  await settle();
  await openPractice(false);
  assert.deepEqual((await deckCount()).slice(1), [3, (await deckCount())[0] - 3]);
  await startRound();
  played = await playAndNote();
  assert.equal(played.length, 12);
  assert.deepEqual(played.filter(card => card.status === 'due').map(card => card.id).sort(), ids.slice(0, 3).sort());
  assert.equal(played.filter(card => card.status === 'new').length, 9);
  await forgetPractice();
});

test('the practice interface is in Latin unless English is chosen; the two marks differ by more than their words', async () => {
  await openPractice(true, null);
  const lang = () => page.locator('html').getAttribute('lang');
  assert.equal(await lang(), 'la');
  assert.equal(await page.locator('h1').textContent(), 'Exercitātiō');
  assert.equal(await page.title(), 'Exercitātiō · Lexicon Latīnitātis Cotīdiānae');
  assert.equal(await page.locator('#p-start').textContent(), 'Incipe');
  assert.match(await page.locator('#p-count').textContent(), /^[\d,]+ chartae · 0 nunc repetendae · [\d,]+ novae$/);
  assert.match(await page.locator('#p-meter-text').textContent(), /^0 nōtae · 0 discuntur · [\d,]+ novae$/);
  assert.equal(await page.locator('#p-saved').textContent(), 'Prōgressus in hōc nāvigātrō servātur.');
  assert.equal(await page.locator('#p-lang button[data-lang="la"]').getAttribute('aria-pressed'), 'true');
  // The site's own header and footer stay English, and say so.
  assert.deepEqual(await page.locator('header.site-top, footer.site-foot').evaluateAll(nodes => nodes.map(n => n.lang)), ['en', 'en']);
  await page.locator('#p-deck > summary').click();
  assert.equal(await page.locator('#p-deck .deck-label').textContent(), 'Fasciculus');
  assert.deepEqual(await page.locator('#p-kind .pt-name').allTextContents(), ['Verba singula', 'Locūtiōnēs cotīdiānae', 'Sententiae et dicta']);
  assert.deepEqual(await page.locator('#p-part .pt-name').allTextContents(), ['Nōmina', 'Verba', 'Adjectīva', 'Adverbia', 'Cētera']);
  // The categories go by their Latin names alone; the authors keep theirs.
  await openGroup('p-cat');
  assert.match(await page.locator('#p-cat button[data-id="culina"]').textContent(), /^Culīna et potūs[\d,]+$/);
  assert.equal(await page.locator('#p-cat .pt-en').count(), 0);
  assert.equal(await page.locator('#p-src button[data-id="cicero"] .pt-name span').getAttribute('lang'), 'en');
  await page.locator('#p-deck > summary').click();
  // The round.
  await listDeck(['judge', 'play-dough'], { kind: ['w'] });
  assert.equal(await lang(), 'la');
  await startRound();
  assert.equal(await page.locator('#g-show').textContent(), 'Respōnsum ostende');
  assert.equal(await page.locator('#g-status').textContent(), 'nova');
  assert.equal(await page.locator('#g-close').getAttribute('aria-label'), 'Exī');
  const origins = {};
  for (let n = 0; n < 2; n++) {
    await page.locator('#g-show').click();
    origins[await shownCard()] = await page.locator('#g-origin').textContent();
    if (n === 0) {
      assert.equal(await page.locator('#g-again').textContent(), 'Iterum');
      assert.equal(await page.locator('#g-got').textContent(), 'Teneō');
      assert.equal(await page.locator('#g-entry').textContent(), 'In lexicō īnspice');
      assert.match(await page.locator('#g-also').textContent(), /^Item: /);
      // An icon each, and not the same colours: one is outlined, the other filled.
      const looks = await page.locator('#g-again, #g-got').evaluateAll(nodes => nodes.map(node => {
        const style = getComputedStyle(node);
        return { icon: !!node.querySelector('svg'), fill: style.backgroundColor, ink: style.color, edge: style.borderTopColor, round: parseFloat(style.borderTopLeftRadius) };
      }));
      assert.ok(looks.every(look => look.icon && look.round >= 8));
      assert.notEqual(looks[0].fill, looks[1].fill);
      assert.notEqual(looks[0].ink, looks[1].ink);
      assert.notEqual(looks[0].edge, looks[1].edge);
    }
    await page.locator('#g-got').click();
  }
  assert.equal(origins.judge, 'aetātis classicae · Phaedr. 3.13.3; Traupman 195, 335');
  assert.equal(origins['play-dough'], 'locūtiō nostra');
  assert.match(await page.locator('#g-end').textContent(), /^Cursus cōnfectus: «Teneō» 2, «Iterum» 0\. Nihil hīc repetendum\. Proxima charta redībit post [34] diēs\.$/);
  assert.equal(await page.locator('#g-early').textContent(), 'Repete tamen nunc');
  await page.locator('#g-exit').click();
  // English on request, kept on the device.
  await page.locator('#p-lang button[data-lang="en"]').click();
  assert.equal(await lang(), 'en');
  assert.equal(await page.locator('h1').textContent(), 'Practice');
  assert.match(await page.locator('#p-count').textContent(), /^2 cards · 0 due now · 0 new$/);
  assert.equal(await page.evaluate(() => localStorage.getItem('lexicon-practice-lang')), 'en');
  await settle();
  await openPractice(false);
  assert.equal(await lang(), 'en');
  assert.equal(await page.locator('#p-start').textContent(), 'Practise early');
  await page.locator('#p-lang button[data-lang="la"]').click();
  assert.equal(await page.locator('#p-start').textContent(), 'Repete tamen nunc');
  assert.match(await page.locator('#p-state').textContent(), /^Nihil hīc repetendum\. Proxima charta redībit post [34] diēs\.$/);
  // The display options write the Latin their way, the interface's too, and leave the English alone.
  await page.evaluate(() => { localStorage.setItem('lexicon-macrons', 'off'); localStorage.setItem('lexicon-j', 'i'); });
  await settle();
  await openPractice(false);
  assert.equal(await page.locator('h1').textContent(), 'Exercitatio');
  await startRound();
  let seen = 0;
  while (await page.locator('#g-show').isVisible()) {
    await page.locator('#g-show').click();
    if (await shownCard() === 'judge') {
      seen++;
      assert.equal(await page.locator('#g-cue').textContent(), 'judge (in a court of law) noun');
      assert.equal(await page.locator('#g-la').textContent(), 'iudex, iudicis m./f.');
      assert.match(await page.locator('#g-origin').textContent(), /Phaedr\. 3\.13\.3/);
    }
    await page.locator('#g-got').click();
  }
  assert.equal(seen, 1);
  await page.evaluate(() => { localStorage.removeItem('lexicon-macrons'); localStorage.removeItem('lexicon-j'); });
  await forgetPractice();
});

test('the deck: a category and a source narrow it, choices in a group add up, and the choice is kept', async () => {
  await openPractice();
  const [words] = await deckCount();
  await page.locator('#p-deck > summary').click();
  const pick = (group, id) => page.locator(`#p-deck button[data-group="${group}"][data-id="${id}"]`).click();
  const pressed = (group, id) => page.locator(`#p-deck button[data-group="${group}"][data-id="${id}"]`).getAttribute('aria-pressed');
  // A category narrows; a second category adds to the first.
  await openGroup('p-cat');
  assert.equal(await page.locator('#p-cat button').count(), await page.evaluate(() => window.lexiconPractice.categories.length));
  assert.match(await page.locator('#p-cat button[data-id="culina"]').textContent(), /^Culīna et potūsKitchen, meals & drinks[\d,]+$/);
  await pick('cat', 'culina');
  const [kitchen] = await deckCount();
  assert.ok(kitchen > 100 && kitchen < words);
  await pick('cat', 'vestitus');
  const [both] = await deckCount();
  assert.ok(both > kitchen && both < words);
  await pick('cat', 'vestitus');
  assert.deepEqual((await deckCount())[0], kitchen);
  // A source narrows the category; a second source adds to the first; a work is part of its author.
  await openGroup('p-src');
  await pick('src', 'cicero');
  const [cicero] = await deckCount();
  assert.ok(cicero > 0 && cicero < kitchen);
  assert.equal(await page.locator('#p-src button[data-id="cicero"] .pt-n').textContent(), String(cicero));
  await pick('src', 'vergil');
  const [mixed] = await deckCount();
  assert.ok(mixed > cicero && mixed < kitchen, 'Cicero or Vergil, within the kitchen');
  assert.equal(await page.locator('#p-now').textContent(), 'Words · Culīna et potūs · Cicero, Vergil');
  assert.equal(await page.locator('#p-src-now').textContent(), 'Cicero, Vergil');
  // Every card of the round is in the kitchen and from one of the two.
  const round = await page.evaluate(() => {
    const data = window.lexiconPractice, wanted = ['cicero', 'vergil'].map(id => data.sources.findIndex(source => source.id === id));
    return { wanted, cards: Object.fromEntries(data.cards.map(card => [card.i, card])) };
  });
  await startRound();
  assert.equal(await page.locator('#g-deck').textContent(), 'Words · Culīna et potūs · Cicero, Vergil');
  await page.locator('#g-show').click();
  const card = round.cards[await shownCard()];
  assert.ok([card.k, ...(card.x || [])].includes('culina') && card.s.some(n => round.wanted.includes(n)) && !card.t);
  await page.keyboard.press('Escape');
  // The choices are kept on the device.
  await settle();
  await openPractice(false);
  assert.deepEqual((await deckCount())[0], mixed);
  await page.locator('#p-deck > summary').click();
  assert.deepEqual([await pressed('cat', 'culina'), await pressed('src', 'cicero'), await pressed('src', 'vergil'), await pressed('cat', 'vestitus')],
                   ['true', 'true', 'true', 'false']);
  await openGroup('p-cat'); await openGroup('p-src');
  await pick('src', 'cicero'); await pick('src', 'vergil');
  await page.locator('.pworks > summary').click();
  await pick('src', 'vergil');
  const [vergil] = await deckCount();
  await pick('src', 'vergil'); await pick('src', 'vergil-georgics');
  const [georgics] = await deckCount();
  assert.ok(georgics > 0 && georgics <= vergil);
  assert.equal(await page.locator('#p-src-now').textContent(), 'Vergil, Georgics');
  await pick('src', 'vergil-georgics');
  // Part of speech: a choice among the words, which adds up like the others.
  await pick('part', 'n');
  const [nouns] = await deckCount();
  await pick('part', 'v');
  const [nounsAndVerbs] = await deckCount();
  assert.ok(nouns > 0 && nouns < nounsAndVerbs && nounsAndVerbs < kitchen);
  await pick('part', 'n'); await pick('part', 'v'); await pick('part', 'o');
  const [other] = await deckCount();
  await pick('part', 'o'); await pick('part', 'a'); await pick('part', 'd');
  assert.equal(nounsAndVerbs + other + (await deckCount())[0] >= kitchen, true, 'every word is a noun, a verb, an adjective, an adverb or something else');
  await pick('part', 'a'); await pick('part', 'd');
  // Kinds: the phrases are added to the words, and one kind is always chosen.
  await pick('kind', 'p');
  const [withPhrases] = await deckCount();
  assert.ok(withPhrases > kitchen);
  await pick('kind', 'w');
  assert.equal(await page.locator('#p-now').textContent(), 'Everyday phrases · Culīna et potūs');
  assert.equal(await page.locator('#p-part-line').isVisible(), false, 'parts of speech are a choice among the words');
  assert.equal((await deckCount())[0], withPhrases - kitchen);
  await pick('kind', 'p');
  assert.equal(await pressed('kind', 'p'), 'true', 'the last kind cannot be taken away');
  // The sayings by themselves, from every category.
  await pick('cat', 'culina'); await pick('kind', 's'); await pick('kind', 'p');
  assert.equal(await page.locator('#p-now').textContent(), 'Sayings and quotations');
  await startRound();
  await page.locator('#g-show').click();
  assert.equal(round.cards[await shownCard()].t, 's');
  await page.locator('#g-close').click();
  await pick('kind', 'w'); await pick('kind', 's'); await pick('cat', 'culina'); await pick('part', 'n');
  // Clearing the choices gives every word again.
  await page.locator('#p-clear').click();
  assert.deepEqual((await deckCount())[0], words);
  assert.equal(await page.locator('#p-clear').isVisible(), false);
  await forgetPractice();
});

test('words looked up are remembered on the device and can be practised', async () => {
  await openPractice();
  for (const id of ['cooking-pot', 'soap', 'how-are-you']) await page.goto(pageUrl(`c/${id}.html`));
  const seen = await kept('lexicon-seen');
  assert.deepEqual(Object.keys(seen).sort(), ['cooking-pot', 'how-are-you', 'soap']);
  assert.ok(Object.values(seen).every(when => Math.abs(when - Date.now()) < 60e3));
  // A word's page is not an entry, and is not recorded.
  await page.goto(pageUrl('l/caccabus.html'));
  assert.equal(Object.keys(await kept('lexicon-seen')).length, 3);
  await settle();
  await openPractice(false);
  await page.locator('#p-deck > summary').click();
  await page.locator('#p-mine-group > summary').click();
  const looked = page.locator('#p-mine button[data-id="seen"]');
  assert.match(await looked.textContent(), /^Words I looked up2$/);
  await looked.click();
  assert.deepEqual(await deckCount(), [2, 0, 2]);
  assert.equal(await page.locator('#p-now').textContent(), 'Words · Words I looked up');
  // The phrase looked up is there once the phrases are chosen.
  await page.locator('#p-kind button[data-id="p"]').click();
  assert.deepEqual(await deckCount(), [3, 0, 3]);
  await startRound();
  const ids = await playRound();
  assert.deepEqual([...ids].sort(), ['cooking-pot', 'how-are-you', 'soap']);
  // Nothing due and nothing new: when the next card comes back, and practising early.
  assert.match(await page.locator('#g-end').textContent(), /^Round done: Got it 3, Again 0\. Nothing is due\. The next card comes back in [34] days\.$/);
  assert.equal(await page.locator('#g-next').isVisible(), false);
  await page.locator('#g-early').click();
  assert.equal(await page.locator('#g-pos').textContent(), '1 / 3');
  assert.equal(await page.locator('#g-status').textContent(), 'due');
  // The lobby says the same, and offers the same.
  await page.locator('#g-close').click();
  assert.equal(await page.locator('#p-start').textContent(), 'Continue');
  await page.locator('#p-kind button[data-id="p"]').click(); await page.locator('#p-kind button[data-id="p"]').click();
  assert.match(await page.locator('#p-state').textContent(), /^Nothing is due\. The next card comes back in [34] days\.$/);
  assert.equal(await page.locator('#p-start').textContent(), 'Practise early');
  // Only the 500 most recent are kept.
  await page.evaluate(() => {
    const many = Object.fromEntries(Array.from({ length: 505 }, (_, n) => [`old-${n}`, 1000 + n]));
    localStorage.setItem('lexicon-seen', JSON.stringify(many));
  });
  await settle();
  await page.goto(pageUrl('c/tickle.html'));
  const trimmed = await kept('lexicon-seen');
  assert.equal(Object.keys(trimmed).length, 500);
  assert.ok('tickle' in trimmed && 'old-504' in trimmed && !('old-0' in trimmed));
  await forgetPractice();
});

test('a list of one’s own: pasted, matched by id, English or Latin, chosen, kept and deleted', async () => {
  await openPractice();
  await page.locator('#p-deck > summary').click();
  await page.locator('#p-kind button[data-id="s"]').click();   // a choice left over from before
  await page.locator('#p-mine-group > summary').click();
  await page.locator('#p-list-name').fill('Morning');
  await page.locator('#p-list-text').fill('brush-teeth\nCooking Pot, SAPO\nsheet (of paper)\nhow are you?\nnonsenseword\n\nbrush-teeth');
  // What the items should find: an id, an English headword without regard to case, a Latin head
  // without its macrons, a headword with its sense, a phrase; and one item that is nowhere.
  const expected = await page.evaluate(() => {
    const fold = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/j/g, 'i').replace(/v/g, 'u');
    const cards = window.lexiconPractice.cards;
    return cards.filter(card => ['brush-teeth', 'cooking-pot', 'sheet-of-paper', 'how-are-you'].includes(card.i)
      || fold(card.l.split(/[,(]/)[0].trim()) === 'sapo').map(card => card.i).sort();
  });
  assert.ok(expected.includes('soap') && expected.length >= 5);
  await page.locator('#p-list-form button[type="submit"]').click();
  assert.equal(await page.locator('#p-list-status').textContent(), 'Matched 5 of 6 items. Not found: nonsenseword. The deck is now “Morning”.');
  // The new list is the deck, whole: its phrase with its words, and nothing left over to narrow it.
  assert.equal(await page.locator('#p-now').textContent(), 'Words, Everyday phrases · Morning');
  assert.deepEqual(await deckCount(), [expected.length, 0, expected.length]);
  assert.match(await page.locator('#p-mine').textContent(), /Not found in the lexicon: nonsenseword/);
  const lists = await kept('lexicon-lists');
  assert.equal(lists.length, 1);
  assert.deepEqual([lists[0].name, lists[0].items], ['Morning', ['brush-teeth', 'Cooking Pot', 'SAPO', 'sheet (of paper)', 'how are you?', 'nonsenseword']]);
  await startRound();
  assert.deepEqual((await playRound()).sort(), expected);
  await page.locator('#g-exit').click();
  for (const field of ['#p-list-name', '#p-list-text']) {
    assert.ok(parseFloat(await page.locator(field).evaluate(el => getComputedStyle(el).fontSize)) >= 16, field);
  }
  // Nothing is made of a list that finds nothing.
  await page.locator('#p-list-name').fill('Nothing');
  await page.locator('#p-list-text').fill('qqqq, zzzz');
  await page.locator('#p-list-form button[type="submit"]').click();
  assert.match(await page.locator('#p-list-status').textContent(), /^None of these items was found/);
  assert.equal((await kept('lexicon-lists')).length, 1);
  // Kept on the device, and chosen like any other choice; deleted with two taps.
  await settle();
  await openPractice(false);
  await page.locator('#p-deck > summary').click();
  await page.locator('#p-mine-group > summary').click();
  const mine = page.locator('#p-mine button[data-group="mine"]:not([data-id="seen"])');
  assert.equal(await mine.getAttribute('aria-pressed'), 'true');
  assert.match(await mine.textContent(), /^Morning\d+$/);
  await mine.click();
  assert.equal(await page.locator('#p-mine-now').textContent(), 'not chosen');
  await mine.click();
  const remove = page.locator('#p-mine .p-delete');
  await remove.click();
  assert.equal(await remove.textContent(), 'Tap again to delete');
  assert.equal((await kept('lexicon-lists')).length, 1);
  await remove.click();
  assert.equal(await page.locator('#p-mine .p-delete').count(), 0);
  assert.deepEqual(await kept('lexicon-lists'), []);
  assert.deepEqual((await kept('lexicon-practice-deck')).mine, []);
  assert.equal(await page.locator('#p-mine-now').textContent(), 'not chosen');
  await forgetPractice();
});

test('progress is exported as text and imported, also from the hub drill; the later answer wins', async () => {
  await openPractice();
  await page.locator('#p-backup > summary').click();
  const give = async record => {
    await page.locator('#p-import-text').fill(JSON.stringify(record));
    await page.locator('#p-import').click();
    return page.locator('#p-import-status').textContent();
  };
  const day = 24 * 3600e3, now = Date.now();
  // The hub's record: word cards are "v:<record id>"; its sentence cards and unknown words are left out.
  assert.equal(await give({ cards: { 'v:cooking-pot': { b: 3, due: now + 3 * day, t: 1000 }, 'v:soap': { b: 0, due: now - 1000, t: 1000 },
                                     'v:no-such-record': { b: 2, due: now + day, t: 1000 }, 'quantitas-12': { b: 4, due: now + day, t: 1000 },
                                     'v:perhaps': { b: 'three', due: now } }, at: 5 }),
               'Imported 2 cards; 3 not in the lexicon.');
  let cards = (await kept('lexicon-practice')).cards;
  assert.deepEqual(Object.keys(cards).sort(), ['cooking-pot', 'soap']);
  assert.deepEqual(cards['cooking-pot'], { b: 3, due: now + 3 * day, t: 1000 });
  assert.deepEqual((await deckCount()).slice(1, 2), [1], 'soap is due');
  assert.match(await page.locator('#p-meter-text').textContent(), /^1 known · 1 learning · /);
  // An older answer does not replace a later one; a later one does.
  assert.equal(await give({ cards: { 'v:cooking-pot': { b: 0, due: 0, t: 500 } } }), 'Imported 0 cards; 1 left as they were, marked here more recently.');
  assert.equal((await kept('lexicon-practice')).cards['cooking-pot'].b, 3);
  assert.equal(await give({ cards: { 'cooking-pot': { b: 5, due: now + 16 * day, t: 2000 } } }), 'Imported 1 card.');
  assert.equal((await kept('lexicon-practice')).cards['cooking-pot'].b, 5);
  assert.match(await give('not progress'), /^That is not an export of progress/);
  // Export gives it back, with the reader's lists.
  await keep('lexicon-lists', [{ id: 'l1', name: 'Kitchen', items: ['soap'] }]);
  await settle();
  await openPractice(false);
  await page.locator('#p-backup > summary').click();
  assert.equal(await page.locator('#p-export-box').isVisible(), false);
  await page.locator('#p-export').click();
  const exported = JSON.parse(await page.locator('#p-export-text').inputValue());
  assert.equal(exported.cards['cooking-pot'].b, 5);
  assert.deepEqual(exported.lists, [{ name: 'Kitchen', items: ['soap'] }]);
  assert.equal(await page.locator('#p-copy').isVisible(), true);
  // On another device (nothing kept), the export brings both back; in Latin it says so in Latin.
  await forgetPractice();
  await settle();
  await openPractice(false);
  await page.locator('#p-backup > summary').click();
  assert.equal(await give(exported), 'Importātae 2 chartae; 1 index additus.');
  assert.equal((await kept('lexicon-lists'))[0].name, 'Kitchen');
  assert.equal((await kept('lexicon-practice')).cards.soap.b, 0);
  await forgetPractice();
});

test('practice on a phone: the lobby and the round fit, with controls for a thumb and fields that do not zoom', async () => {
  const sizes = selector => page.evaluate(sel => [...document.querySelectorAll(sel)]
    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
    .map(el => [el.textContent.trim().slice(0, 24) || el.id, Math.round(el.getBoundingClientRect().height)]), selector);
  for (const [width, height] of [[390, 760], [320, 568]]) {
    await page.setViewportSize({ width, height });
    for (const language of ['la', 'en']) {
      await openPractice(true, language);
      await keep('lexicon-lists', [{ id: 'l1', name: 'A list with a rather long name to wrap', items: ['train', 'judge', 'pyjamas', 'nowhere-to-be-found'] }]);
      await settle();
      await openPractice(false);
      // The lobby, with everything open.
      for (const summary of await page.locator('#practice summary').all()) await summary.click();
      await page.locator('#p-export').click();
      assert.equal(await overflows(), false, `the lobby overflows at ${width}px (${language})`);
      const small = (await sizes('.practice button, .practice summary, .practice a, .practice input, .practice textarea')).filter(([, h]) => h < 44);
      assert.deepEqual(small, [], `the lobby at ${width}px (${language}) has controls under 44px`);
      const fields = await page.locator('#practice input, #practice textarea').evaluateAll(nodes => nodes.map(n => parseFloat(getComputedStyle(n).fontSize)));
      assert.ok(fields.length >= 4 && fields.every(size => size >= 16));
      assert.ok((await page.locator('#p-start').boundingBox()).height >= 52);
      // The round: front, back, and the end.
      await page.locator('#p-mine button[data-group="mine"]:not([data-id="seen"])').click();
      await startRound();
      const check = async what => {
        assert.equal(await overflows(), false, `${what} overflows at ${width}px (${language})`);
        const box = await page.locator('#p-game').boundingBox();
        assert.deepEqual([box.x, box.y, box.width, box.height], [0, 0, width, height], `${what}: the layer is the whole screen`);
        assert.deepEqual((await sizes('#p-game button, #p-game a')).filter(([, h]) => h < 44), [], `${what} at ${width}px (${language})`);
        assert.deepEqual((await sizes('#p-game .pbtn')).filter(([, h]) => h < 52), [], `${what}: its buttons are 52px or more`);
        // The buttons stay at the foot of the screen, and the card stands clear of them.
        const actions = await page.locator('.pgame-actions').boundingBox(), stage = await page.locator('#g-stage').boundingBox();
        assert.ok(actions.y + actions.height <= height + 1 && stage.y + stage.height <= actions.y + 1, what);
        const card = await page.locator('#g-card').evaluate(node => { const s = getComputedStyle(node); return [parseFloat(s.borderTopLeftRadius), s.boxShadow !== 'none', parseFloat(s.borderTopWidth)]; });
        assert.ok(card[0] >= 12 && card[1] && card[2] >= 1, 'the card is a card: corners, a border, a shadow');
        assert.ok((await page.locator('#g-card').boundingBox()).width <= width - 24);
      };
      await check('the front of a card');
      for (let n = 0; n < 3; n++) {
        await page.locator('#g-show').click();
        await check('the back of a card');
        await page.locator(n ? '#g-got' : '#g-again').click();
      }
      await check('the end of a round');
      assert.equal(await page.locator('#g-undo').isVisible(), true);
      await page.locator('#g-exit').click();
    }
  }
  await forgetPractice();
});

test('practice works when nothing can be saved, and says so', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 760 }, serviceWorkers: 'block' });
  const blocked = await context.newPage();
  await blocked.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked'); } });
  });
  await blocked.goto(pageUrl('practice.html'));
  assert.equal(await blocked.locator('#p-saved').textContent(), 'Prōgressus in hōc nāvigātrō servātur.');
  await blocked.locator('#p-start').click();
  await blocked.locator('#g-show').click();
  await blocked.locator('#g-got').click();
  assert.equal(await blocked.locator('#g-pos').textContent(), '2 / 12');
  await blocked.locator('#g-undo').click();
  assert.equal(await blocked.locator('#g-pos').textContent(), '1 / 12');
  await blocked.locator('#g-close').click();
  assert.equal(await blocked.locator('#p-saved').textContent(), 'Prōgressus in hōc nāvigātrō servārī nōn potest: pāginā clausā perībit.');
  // The language can still be changed for the visit.
  await blocked.locator('#p-lang button[data-lang="en"]').click();
  assert.equal(await blocked.locator('#p-start').textContent(), 'Continue');
  await blocked.goto(pageUrl('c/soap.html'));
  assert.match(await blocked.locator('h1').textContent(), /^soap/);
  await context.close();
});

test('how the practice works: one page, every source linked, nothing asked of other sites, and it fits a phone', async () => {
  const asked = [];
  const note = request => { if (!request.url().startsWith(base)) asked.push(request.url()); };
  page.on('request', note);
  await page.goto(pageUrl('how-practice-works.html'));
  await page.waitForLoadState('networkidle');
  page.off('request', note);
  assert.deepEqual(asked, [], 'no request to another site');
  assert.equal(await page.title(), 'How the practice works · Lexicon Latīnitātis Cotīdiānae');
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.deepEqual(await page.locator('main h2').allTextContents(),
                   ['A round', 'When a word comes back', 'The evidence', 'Our own choices', 'What it does not do', 'Sources']);
  // The contents lead to each section.
  const contents = await page.locator('.page-contents a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  assert.deepEqual(contents, ['#round', '#waits', '#evidence', '#choices', '#limits', '#sources']);
  for (const href of contents) assert.equal(await page.locator(href).count(), 1, href);
  // Every source has a link to the work, and every citation in the text leads to a source in the list.
  const sources = await page.locator('#sources li').evaluateAll(nodes => nodes.map(n => [n.id, [...n.querySelectorAll('a')].map(a => a.href)]));
  assert.ok(sources.length >= 10);
  for (const [id, links] of sources) {
    assert.match(id, /^s-[a-z0-9-]+$/);
    assert.ok(links.length >= 1 && links.every(href => /^https:\/\//.test(href)), `${id} is linked`);
  }
  const cited = await page.locator('main a[href^="#s-"]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href').slice(1)))]);
  assert.deepEqual(cited.sort(), sources.map(([id]) => id).sort());
  await page.locator('#evidence a[href="#s-kang-2014"]').click();
  assert.match(page.url(), /#s-kang-2014$/);
  assert.equal(await page.locator('#s-kang-2014 a').getAttribute('href'), 'https://doi.org/10.3758/s13423-014-0636-z');
  // The Latin of the two marks is Latin to the display options: without macrons on request.
  assert.deepEqual(await page.locator('#round [lang="la"]').allTextContents(), ['Teneō', 'Iterum']);
  // Back to Practice and to How we decide.
  assert.equal(await page.locator('.lead a[href="practice.html"]').count(), 1);
  assert.equal(await page.locator('.lead a[href="how-we-decide.html"]').count(), 1);
  // The measure of the text is that of How we decide.
  const measure = selector => page.locator(selector).first().evaluate(el => Math.round(el.getBoundingClientRect().width));
  const here = await measure('#evidence');
  await page.goto(pageUrl('how-we-decide.html'));
  assert.equal(await measure('#rules'), here);
  // On a phone, in both themes: nothing scrolls sideways, not even the longest link of the sources.
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => localStorage.setItem('lexicon-theme', value), theme);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(pageUrl('how-practice-works.html'));
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert.equal(await overflows(), false, `${theme} at ${width}px`);
      const wide = await page.locator('main a, main li, main p').evaluateAll(nodes => nodes
        .filter(n => n.getBoundingClientRect().right > innerWidth + 0.5).map(n => n.textContent.slice(0, 30)));
      assert.deepEqual(wide, [], `${theme} at ${width}px`);
    }
  }
  await page.evaluate(() => localStorage.removeItem('lexicon-theme'));
});

test('the practice lobby links to How the practice works, in Latin and in English', async () => {
  await openPractice(true, null);
  const link = page.locator('#practice .p-how a');
  assert.equal(await page.locator('html').getAttribute('lang'), 'la');
  assert.equal(await link.textContent(), 'Quā ratiōne repetātur');
  assert.equal(await link.getAttribute('href'), 'how-practice-works.html');
  // It stands with the note that progress is kept on the device, under Start.
  const saved = await page.locator('#p-saved').boundingBox(), how = await link.boundingBox(), start = await page.locator('#p-start').boundingBox();
  assert.ok(start.y < saved.y && saved.y < how.y, 'under the note');
  assert.ok(how.height >= 44, 'a target for a thumb');
  await page.locator('#p-lang button[data-lang="en"]').click();
  assert.equal(await link.textContent(), 'How the practice works');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await overflows(), false);
  await link.click();
  await page.waitForURL(/how-practice-works\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'How the practice works');
  // And back.
  await page.locator('.lead a[href="practice.html"]').click();
  await page.waitForURL(/practice\.html$/);
  assert.equal(await page.locator('#p-saved').textContent(), 'Progress is kept in this browser.');
  await page.locator('#p-lang button[data-lang="la"]').click();
  assert.equal(await page.locator('#practice .p-how a').textContent(), 'Quā ratiōne repetātur');
  await forgetPractice();
});

test('practice is reached from the front page and from every footer, never from the header', async () => {
  const links = page.locator('.plist a');
  assert.deepEqual(await links.evaluateAll(nodes => nodes.map(n => n.getAttribute('href'))), ['practice.html', 'hora.html']);
  const practice = await page.locator('#practice-title').boundingBox(), contents = await page.locator('#contents-title').boundingBox();
  assert.ok(practice.y < contents.y, 'above the list of categories');
  await links.first().click();
  await page.waitForURL(/practice\.html$/);
  assert.equal(await page.locator('h1').textContent(), 'Exercitātiō');
  await page.locator('.p-more a').click();
  await page.waitForURL(/hora\.html$/);
  for (const [path, href] of [['index.html', 'practice.html'], ['c/kind.html', '../practice.html'], ['k/culina.html', '../practice.html'], ['practice.html', 'practice.html']]) {
    await page.goto(pageUrl(path));
    assert.equal(await page.locator('footer').getByRole('link', { name: 'Practice', exact: true }).getAttribute('href'), href, path);
    assert.equal(await page.locator('header.site-top a[href*="practice"]').count(), 0, path);
  }
  // Without scripts the page says what it needs, in English, and leads elsewhere.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto(pageUrl('practice.html'));
  assert.equal(await plain.locator('.noscript-note').isVisible(), true);
  assert.equal(await plain.locator('#practice').isVisible(), false);
  assert.equal(await plain.locator('#p-lang').isVisible(), false);
  assert.equal(await plain.locator('#p-game').isVisible(), false);
  assert.equal(await plain.locator('html').getAttribute('lang'), 'en');
  await context.close();
});

test('a strip of paper stands where a phone’s status bar is, and has no height where there is none', async () => {
  for (const path of ['index.html', 'k/culina.html', 'c/soap.html', 'words.html', 'practice.html']) {
    await page.goto(pageUrl(path));
    const strip = await page.evaluate(() => {
      const style = getComputedStyle(document.body, '::before');
      return { position: style.position, top: style.top, height: style.height, paper: style.backgroundColor === getComputedStyle(document.body).backgroundColor,
        above: Number(style.zIndex) };
    });
    assert.deepEqual(strip, { position: 'fixed', top: '0px', height: '0px', paper: true, above: 1000 }, path);
  }
  // What sticks to the top still sticks at the top.
  await page.goto(pageUrl('k/culina.html'));
  await page.evaluate(() => window.scrollTo(0, 600));
  assert.ok(Math.abs((await page.locator('.toolbar').boundingBox()).y) < 2);
});

// Review ------------------------------------------------------------------------------------------
// The site keeps only the flag (Jack, 15 November 2026): the editor reviews in a private page of
// his own, so these tests also check that nothing of his is offered here.

// What the review keeps on the device; each test starts and ends without it.
const forgetReview = () => page.evaluate(keys => {
  ['lexicon-review', ...keys].forEach(key => localStorage.removeItem(key));
  localStorage.removeItem('lexicon-practice-round');
}, PRACTICE_KEYS);
// A fresh device, reading in English (Latin, the default, has a test of its own).
const beginReview = async ({ language = 'en' } = {}) => {
  await page.goto(pageUrl('review.html'));
  await forgetReview();
  if (language) await page.evaluate(code => localStorage.setItem('lexicon-practice-lang', code), language);
  await settle();
};
const openReview = async () => { await page.goto(pageUrl('review.html')); await page.locator('#review:not([hidden])').waitFor(); };
const verdicts = async () => ((await kept('lexicon-review')) || { verdicts: {} }).verdicts;
const revisionOf = id => page.locator('article.concept').getAttribute('data-rev');
const reviewCount = async key => Number((await page.locator(`#r-counts [data-count="${key}"] dt`).textContent()).replace(/,/g, ''));

test('an entry is flagged in one tap: a box of reasons and a line to write, kept on the device and shown on return', async () => {
  await page.setViewportSize({ width: 390, height: 760 });
  await beginReview();
  await page.goto(pageUrl('c/soap.html'));
  const rev = await revisionOf();
  assert.match(rev, /^[0-9a-f]{8}$/);
  // The flag stands where "Suggest a correction" stood, and stands alone.
  assert.equal(await page.locator('.suggest').isVisible(), false);
  const flag = page.locator('.verdict-flag');
  assert.equal(await flag.textContent(), 'Flag');
  assert.equal(await flag.getAttribute('aria-pressed'), 'false');
  assert.deepEqual(await page.locator('.verdict-row > *').allTextContents(), ['Flag']);
  assert.equal(await page.locator('.verdict-state').count(), 0);
  assert.equal(await page.locator('.flagbox').count(), 0);
  // One tap opens the box.
  await flag.click();
  assert.equal(await page.locator('.flagbox').isVisible(), true);
  assert.deepEqual(await page.locator('.flagbox-chip').allTextContents(), ['wrong word', 'vowel length', 'meaning', 'example', 'source', 'other']);
  // On a phone: nothing sideways, controls for a thumb, a field that does not zoom.
  assert.equal(await overflows(), false);
  const small = await page.evaluate(() => [...document.querySelectorAll('.verdict button, .verdict a, .verdict input')]
    .filter(el => el.getClientRects().length).map(el => [el.textContent.trim() || el.className, Math.round(el.getBoundingClientRect().height)]).filter(([, h]) => h < 44));
  assert.deepEqual(small, []);
  assert.ok(parseFloat(await page.locator('.flagbox-note').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
  // Cancel leaves nothing behind.
  await page.locator('.flagbox-cancel').click();
  assert.equal(await page.locator('.flagbox').count(), 0);
  assert.deepEqual(await verdicts(), {});
  // Two reasons, a few words, Save.
  await flag.click();
  await page.locator('.flagbox-chip[data-reason="quantity"]').click();
  await page.locator('.flagbox-chip[data-reason="example"]').click();
  await page.locator('.flagbox-chip[data-reason="word"]').click(); await page.locator('.flagbox-chip[data-reason="word"]').click();
  await page.locator('.flagbox-note').fill('  sāpō   or sapō? ');
  // For a stranger with an account, the same flag as a GitHub issue, filled in.
  const issue = page.locator('.flagbox-alt a');
  await issue.evaluate(link => { link.addEventListener('click', event => event.preventDefault()); link.click(); });
  const address = new URL(await issue.getAttribute('href'));
  assert.equal(address.origin + address.pathname, 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae/issues/new');
  assert.equal(address.searchParams.get('title'), 'Correction: soap');
  assert.match(address.searchParams.get('body'), new RegExp(`c/soap\\.html\\nRevision: ${rev}\\n\\nWhat looks wrong: vowel length, example\\n\\nsāpō   or sapō\\?`));
  const before = Date.now();
  await page.locator('.flagbox-save').click();
  assert.equal(await page.locator('.flagbox').count(), 0);
  const saved = (await verdicts()).soap;
  assert.deepEqual({ ...saved, t: 0 }, { v: 'flag', r: ['quantity', 'example'], n: 'sāpō or sapō?', t: 0, rev });
  assert.ok(saved.t >= before);
  assert.equal(await flag.getAttribute('aria-pressed'), 'true');
  const state = /^You flagged this, \d+ [A-Z][a-z]+: vowel length, example\. sāpō or sapō\? Kept on this device until you send it: Review\.$/;
  assert.match(await page.locator('.verdict-state').textContent(), state);
  assert.equal(await page.locator('.verdict-state a').getAttribute('href'), '../review.html');
  assert.equal(await overflows(), false);
  // It is there on return, and the box opens with what was said.
  await page.reload();
  assert.match(await page.locator('.verdict-state').textContent(), state);
  assert.equal(await page.locator('.verdict-flag').getAttribute('aria-pressed'), 'true');
  await page.locator('.verdict-flag').click();
  assert.deepEqual(await page.locator('.flagbox-chip[aria-pressed="true"]').allTextContents(), ['vowel length', 'example']);
  assert.equal(await page.locator('.flagbox-note').inputValue(), 'sāpō or sapō?');
  // Changed, then withdrawn.
  await page.locator('.flagbox-chip[data-reason="example"]').click();
  await page.locator('.flagbox-save').click();
  assert.deepEqual((await verdicts()).soap.r, ['quantity']);
  await page.locator('.verdict-flag').click();
  await page.locator('.flagbox-withdraw').click();
  assert.deepEqual(await verdicts(), {});
  assert.equal(await page.locator('.verdict-state').count(), 0);
  assert.equal(await page.locator('.verdict-flag').getAttribute('aria-pressed'), 'false');
  // A bare flag, with no reason and no words, is still a flag.
  await page.locator('.verdict-flag').click();
  await page.locator('.flagbox-save').click();
  assert.match(await page.locator('.verdict-state').textContent(), /^You flagged this, \d+ [A-Z][a-z]+\. Kept on this device/);
  // A flag given on another text of the record says so, and does not stand for this one.
  await keep('lexicon-review', { verdicts: { soap: { v: 'flag', r: ['meaning'], n: 'an old note', t: Date.now() - 86400000, rev: 'deadbeef' } } });
  await settle();
  await page.reload();
  assert.match(await page.locator('.verdict-state').textContent(), /^This entry has changed since you flagged it \(\d+ [A-Z][a-z]+\)\.$/);
  assert.equal(await page.locator('.verdict-flag').getAttribute('aria-pressed'), 'false');
  await page.locator('.verdict-flag').click();
  assert.equal(await page.locator('.flagbox-chip[aria-pressed="true"]').count(), 0);
  assert.equal(await page.locator('.flagbox-note').inputValue(), '');
  assert.equal(await page.locator('.flagbox-withdraw').count(), 0);
  await page.locator('.flagbox-save').click();
  assert.equal((await verdicts()).soap.rev, rev);
  assert.match(await page.locator('.verdict-state').textContent(), /^You flagged this, /);
  await forgetReview();
});

test('the site keeps only the flag: no “looks right”, no reviewer’s switch, no queue; a verdict of the earlier version is still sent', async () => {
  await page.setViewportSize({ width: 390, height: 760 });
  await beginReview();
  const revs = {};
  for (const id of ['soap', 'train']) { await page.goto(pageUrl(`c/${id}.html`)); revs[id] = await revisionOf(); }
  // What the site as it was on the morning of 15 November 2026 could leave on the editor's phone:
  // the reviewer's switch on, entries marked right, a queue for the visit.
  const t = Date.now() - 3600e3;
  const morning = { editor: true, verdicts: {
    soap: { v: 'ok', r: [], n: '', t, rev: revs.soap },
    bone: { v: 'ok', r: [], n: '', t: t + 1000, rev: 'deadbeef' } } };   // given on an earlier text: not sent
  await keep('lexicon-review', morning);
  await page.evaluate(() => sessionStorage.setItem('lexicon-review-queue', JSON.stringify(['soap', 'train', 'bone'])));
  await settle();
  // An entry's page offers the flag and nothing else, however it is opened.
  const editors = '.verdict-ok, .verdict-next, .verdict-bar, [role="switch"]';
  for (const path of ['c/soap.html', 'c/soap.html?review=1', 'c/train.html', 'c/bone.html?review=1']) {
    await page.goto(pageUrl(path));
    assert.deepEqual(await page.locator('.verdict-row > *').allTextContents(), ['Flag'], path);
    assert.equal(await page.locator('.verdict button, .verdict a').count(), 1, path);
    assert.equal(await page.locator(editors).count(), 0, path);
    assert.equal(await page.locator('.verdict-state').count(), 0, path);
    assert.equal(await page.locator('.verdict-flag').getAttribute('aria-pressed'), 'false', path);
    assert.equal(await page.locator('body.reviewing').count(), 0, path);
    assert.equal(await page.getByText(/looks right|marked right|I am the reviewer|Reviewed by/i).count(), 0, path);
  }
  // So does the back of a practice card.
  await openPractice();
  await listDeck(['train', 'soap']);
  await startRound();
  for (let n = 0; n < 2; n += 1) {
    await page.locator('#g-show').click();
    assert.deepEqual(await page.locator('#g-verdict button').evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label'))), ['Flag']);
    assert.equal(await page.locator(`#p-game :is(${editors})`).count(), 0);
    await page.locator('#g-got').click();
  }
  // The review page has the counts and the report: no switch, no queue, no Start.
  await openReview();
  assert.equal(await page.locator('#r-editor, .r-switch, [role="switch"], #r-queue, #r-start, #r-more, #review a[href*="review=1"]').count(), 0);
  assert.deepEqual(await page.locator('#review h2').allTextContents(), ['Where it stands', 'Send']);
  assert.equal(await page.getByText(/looks right|I am the reviewer|What to review next/i).count(), 0);
  const total = await page.evaluate(() => window.lexiconPractice.cards.length);
  assert.deepEqual(await page.locator('#r-counts [data-count]').evaluateAll(rows => rows.map(row => [row.dataset.count, row.querySelector('dd').textContent])),
    [['done', 'reviewed by the editor'], ['drafts', 'drafts, not yet reviewed'], ['flag', 'flagged, not yet sent']]);
  assert.deepEqual([await reviewCount('done'), await reviewCount('drafts'), await reviewCount('flag')], [0, total, 0]);
  // What was marked right that morning is not lost: it waits to be sent, and goes into the report.
  assert.equal(await page.locator('#r-pending').textContent(), 'Marked right: 1');
  assert.equal(await page.locator('#r-build').isVisible(), true);
  await page.locator('#r-build').click();
  const text = await page.locator('#r-report').inputValue();
  assert.match(text, /^Lexicon review report, \d+ [A-Z][a-z]+ 20\d\d: 1 marked right, 0 flagged\.\n/);
  assert.match(text, /\nMarked right: soap\n/);
  const day = new Date(t), two = n => String(n).padStart(2, '0'), date = `${day.getFullYear()}-${two(day.getMonth() + 1)}-${two(day.getDate())}`;
  assert.deepEqual(JSON.parse(/```json\n([\s\S]*?)\n```$/.exec(text)[1]),
    { 'lexicon-review': 1, verdicts: [{ id: 'soap', rev: revs.soap, verdict: 'ok', reasons: [], note: '', t, date }] });
  // Nothing has been written yet, so the stored record is as it was; Sent keeps the verdicts and
  // drops the reviewer's switch.
  assert.deepEqual(await kept('lexicon-review'), morning);
  await page.locator('#r-sent').click();
  const stored = await kept('lexicon-review');
  assert.deepEqual(Object.keys(stored), ['verdicts']);
  assert.ok(stored.verdicts.soap.sent > t && stored.verdicts.soap.v === 'ok' && !('sent' in stored.verdicts.bone));
  assert.equal(await page.locator('#r-send-help').textContent(), 'Nothing to send.');
  assert.equal(await reviewCount('waiting'), 1);
  // A reader who flags such an entry replaces the old verdict with the flag.
  await settle();
  await page.goto(pageUrl('c/soap.html'));
  await page.locator('.verdict-flag').click();
  await page.locator('.flagbox-save').click();
  assert.equal((await verdicts()).soap.v, 'flag');
  await page.evaluate(() => sessionStorage.removeItem('lexicon-review-queue'));
  await forgetReview();
});

test('the report: every flag not yet sent, as text and JSON; shared, copied or opened as an issue; Sent keeps them as sent', async () => {
  await beginReview();
  const revs = {};
  for (const id of ['soap', 'tickle', 'bone']) { await page.goto(pageUrl(`c/${id}.html`)); revs[id] = await revisionOf(); }
  const t = Date.now() - 3600e3;
  // Two flags, and with them an entry marked right on the site as it was before (see the test above).
  await keep('lexicon-review', { verdicts: {
    soap: { v: 'flag', r: ['quantity', 'source'], n: 'sāpō or sapō?', t, rev: revs.soap },
    tickle: { v: 'ok', r: [], n: '', t: t + 1000, rev: revs.tickle },
    bone: { v: 'flag', r: [], n: '', t: t + 2000, rev: revs.bone } } });
  await settle();
  await openReview();
  assert.equal(await reviewCount('flag'), 2);
  assert.equal(await page.locator('#r-counts [data-count="waiting"]').count(), 0);
  assert.equal(await page.locator('#r-send-help').textContent(), 'Your flags not yet sent are gathered into one report. Share it, copy it, or open it as a GitHub issue; then tap “Sent”.');
  assert.match(await page.locator('#r-pending').textContent(), /^soap: vowel length, source sāpō or sapō\?boneMarked right: 1$/);
  assert.deepEqual(await page.locator('#r-pending a').evaluateAll(links => links.map(link => link.getAttribute('href'))), ['c/soap.html', 'c/bone.html']);
  assert.equal(await page.locator('#r-report-box').isVisible(), false);
  await page.evaluate(() => { navigator.share = async data => { window.shared = data; }; });
  await page.locator('#r-build').click();
  const text = await page.locator('#r-report').inputValue();
  // A few lines to read…
  assert.match(text, /^Lexicon review report, \d+ [A-Z][a-z]+ 20\d\d: 1 marked right, 2 flagged\.\nTo apply it: python3 scripts\/apply_review\.py/);
  assert.match(text, /\nFlagged:\n- soap \(c\/soap\.html\): vowel length, source\. “sāpō or sapō\?”\n- bone \(c\/bone\.html\)\n\nMarked right: tickle\n/);
  // …and the verdicts for scripts/apply_review.py.
  const block = /```json\n([\s\S]*?)\n```$/.exec(text);
  assert.ok(block, 'the report ends with a fenced JSON block');
  const report = JSON.parse(block[1]);
  assert.equal(report['lexicon-review'], 1);
  const day = new Date(t), two = n => String(n).padStart(2, '0'), date = `${day.getFullYear()}-${two(day.getMonth() + 1)}-${two(day.getDate())}`;
  assert.deepEqual(report.verdicts, [
    { id: 'soap', rev: revs.soap, verdict: 'flag', reasons: ['quantity', 'source'], note: 'sāpō or sapō?', t, date },
    { id: 'tickle', rev: revs.tickle, verdict: 'ok', reasons: [], note: '', t: t + 1000, date },
    { id: 'bone', rev: revs.bone, verdict: 'flag', reasons: [], note: '', t: t + 2000, date }]);
  // Share where the device has it; an issue filled in from a link.
  assert.equal(await page.locator('#r-share').isVisible(), true);
  await page.locator('#r-share').click();
  assert.equal(await page.evaluate(() => window.shared.text), text);
  const issue = new URL(await page.locator('#r-issue').getAttribute('href'));
  assert.equal(issue.origin + issue.pathname, 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae/issues/new');
  assert.equal(issue.searchParams.get('body'), text);
  assert.equal(await page.locator('#r-status').textContent(), '');
  assert.equal(await page.locator('#r-copy').isVisible(), true);
  // Sent: nothing waits to go, and nothing is lost.
  await page.locator('#r-sent').click();
  assert.equal(await reviewCount('flag'), 0);
  assert.equal(await page.locator('#r-report-box').isVisible(), false);
  assert.equal(await page.locator('#r-build').isVisible(), false);
  assert.equal(await page.locator('#r-send-help').textContent(), 'Nothing to send.');
  assert.equal(await page.locator('#r-pending').textContent(), '');
  const stored = await verdicts();
  assert.ok(stored.soap.sent > t && stored.tickle.sent > t && stored.bone.sent > t);
  assert.equal(stored.soap.n, 'sāpō or sapō?');
  assert.equal(await reviewCount('waiting'), 3);
  await settle();
  await page.goto(pageUrl('c/soap.html'));
  assert.match(await page.locator('.verdict-state').textContent(), /^You flagged this, \d+ [A-Z][a-z]+: vowel length, source\. sāpō or sapō\? Sent\.$/);
  assert.equal(await page.locator('.verdict-state a').count(), 0);
  // A report that was lost can be sent again.
  await openReview();
  assert.match(await page.locator('#r-waiting').textContent(), /^3 sent, not yet on the site\. Send again$/);
  await page.locator('#r-waiting button').click();
  assert.equal(await reviewCount('flag'), 2);
  assert.match(await page.locator('#r-pending').textContent(), /Marked right: 1$/);
  // A report too long for a link is copied, not opened.
  const many = await page.evaluate(() => Object.fromEntries(window.lexiconPractice.cards.slice(0, 150).map(card => [card.i, { v: 'flag', r: ['other'], n: 'a note of some length, as a reader would write it', t: Date.now(), rev: card.h }])));
  await keep('lexicon-review', { verdicts: many });
  await settle();
  await openReview();
  await page.locator('#r-build').click();
  assert.match(await page.locator('#r-status').textContent(), /^The report is too long to open as an issue/);
  assert.equal(new URL(await page.locator('#r-issue').getAttribute('href')).searchParams.get('body'), null);
  assert.equal(JSON.parse(/```json\n([\s\S]*?)\n```$/.exec(await page.locator('#r-report').inputValue())[1]).verdicts.length, 150);
  await forgetReview();
});

test('a practice card is flagged without leaving the round or losing the step back', async () => {
  await page.setViewportSize({ width: 390, height: 760 });
  await openPractice();
  await page.evaluate(() => localStorage.removeItem('lexicon-review'));
  await listDeck(['train', 'soap']);
  await startRound();
  await page.locator('#g-show').click();
  await page.locator('#g-got').click();
  await page.locator('#g-show').click();
  const card = await shownCard();
  const rev = await page.evaluate(id => window.lexiconPractice.cards.find(c => c.i === id).h, card);
  // The flag is the one control beside the way to the entry.
  const flag = page.locator('#g-verdict .verdict-flag');
  assert.equal(await page.locator('#g-verdict button').count(), 1);
  assert.equal(await flag.getAttribute('aria-label'), 'Flag');
  assert.equal(await flag.getAttribute('aria-pressed'), 'false');
  assert.ok((await flag.boundingBox()).height >= 44 && (await flag.boundingBox()).width >= 44);
  // The flag's box comes up over the round; its keys are its own.
  await flag.click();
  const sheet = page.locator('.flagsheet[open]');
  await sheet.waitFor();
  assert.equal(await overflows(), false);
  const box = await sheet.boundingBox();
  assert.ok(box.y + box.height <= 760 + 1 && box.width <= 390);
  await sheet.locator('.flagbox-chip[data-reason="example"]').click();
  await sheet.locator('.flagbox-note').fill('12 z');
  await page.keyboard.press('1');
  assert.equal(await sheet.locator('.flagbox-note').inputValue(), '12 z1');
  assert.ok(parseFloat(await sheet.locator('.flagbox-note').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
  assert.deepEqual((await sheet.locator('button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().height))).filter(h => h < 44), []);
  await sheet.locator('.flagbox-save').click();
  assert.equal(await page.locator('.flagsheet').count(), 0);
  assert.deepEqual({ ...(await verdicts())[card], t: 0 }, { v: 'flag', r: ['example'], n: '12 z1', t: 0, rev });
  // The round is as it was: the same card, its answer shown, the step back still offered.
  assert.equal(await gameOpen(), true);
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-marks').isVisible(), true);
  assert.equal(await page.locator('#g-pos').textContent(), '2 / 2');
  assert.equal(await page.locator('#g-undo').isVisible(), true);
  assert.equal(card in (await kept('lexicon-practice')).cards, false, 'the card itself is not marked');
  assert.equal(await page.locator('#g-verdict .verdict-flag').getAttribute('aria-pressed'), 'true');
  // Escape closes the box, not the round.
  await page.locator('#g-verdict .verdict-flag').click();
  await page.locator('.flagsheet[open]').waitFor();
  await page.keyboard.press('Escape');
  await page.locator('.flagsheet').waitFor({ state: 'detached' });
  assert.equal(await gameOpen(), true);
  assert.equal(await shownCard(), card);
  // The step back still goes to the card before, and the flag is on the card when it returns.
  await page.locator('#g-undo').click();
  assert.notEqual(await shownCard(), card);
  assert.equal(await page.locator('#g-verdict .verdict-flag').getAttribute('aria-pressed'), 'false');
  await page.locator('#g-got').click();
  await page.locator('#g-show').click();
  assert.equal(await shownCard(), card);
  assert.equal(await page.locator('#g-verdict .verdict-flag').getAttribute('aria-pressed'), 'true');
  // It is there when the round is taken up again, and it waits on the review page to be sent.
  await page.reload();
  await page.locator('#p-game[open]').waitFor();
  assert.equal(await page.locator('#g-verdict .verdict-flag').getAttribute('aria-pressed'), 'true');
  await openReview();
  assert.equal(await reviewCount('flag'), 1);
  assert.equal(await page.locator('#r-pending a').getAttribute('href'), `c/${card}.html`);
  await forgetReview();
});

test('the review is in Latin unless English was chosen for practice; its page fits a phone in both', async () => {
  for (const [width, height] of [[390, 760], [320, 568]]) {
    await page.setViewportSize({ width, height });
    for (const language of [null, 'en']) {
      await beginReview({ language });
      await page.goto(pageUrl('c/soap.html'));
      const rev = await revisionOf();
      await keep('lexicon-review', { verdicts: { soap: { v: 'flag', r: ['quantity'], n: 'a note long enough to wrap over the line on a narrow phone', t: Date.now(), rev } } });
      await settle();
      await openReview();
      assert.equal(await page.locator('html').getAttribute('lang'), language || 'la');
      await page.locator('#r-build').click();
      assert.equal(await overflows(), false, `review.html overflows at ${width}px (${language})`);
      const small = await page.evaluate(() => [...document.querySelectorAll('.review button, .review a, .review textarea')]
        .filter(el => el.getClientRects().length).map(el => [el.textContent.trim().slice(0, 24) || el.id, Math.round(el.getBoundingClientRect().height)]).filter(([, h]) => h < 44));
      assert.deepEqual(small, [], `review.html at ${width}px (${language})`);
      assert.ok(parseFloat(await page.locator('#r-report').evaluate(el => getComputedStyle(el).fontSize)) >= 16);
    }
  }
  // Latin, the default.
  await beginReview({ language: null });
  await openReview();
  assert.equal(await page.locator('h1').textContent(), 'Recēnsiō');
  assert.equal(await page.title(), 'Recēnsiō · Lexicon Latīnitātis Cotīdiānae');
  assert.equal(await page.locator('.eyebrow').textContent(), 'Nihil hīc prō certō habētur, nisi quod recēnsor lēgit et probāvit.');
  assert.equal(await page.locator('.r-intro').textContent(), 'Sī quid in lexicō vitiōsum vidētur, in ipsā pāginā notā. Notae in hōc nāvigātrō servantur, dōnec eās hinc mittās.');
  assert.deepEqual(await page.locator('#review h2').allTextContents(), ['Summa', 'Mitte']);
  assert.deepEqual(await page.locator('#r-counts dd').allTextContents(), ['in lexicō probāta', 'recēnsenda restant', 'notāta, nōndum missa']);
  assert.equal(await page.locator('#r-send-help').textContent(), 'Nihil mittendum est.');
  assert.equal(await page.locator('#r-build').isVisible(), false);
  assert.equal(await page.locator('#r-editor, [role="switch"]').count(), 0);
  assert.deepEqual(await page.locator('header.site-top, footer.site-foot').evaluateAll(nodes => nodes.map(n => n.lang)), ['en', 'en']);
  await page.goto(pageUrl('c/soap.html'));
  const rev = await revisionOf();
  assert.equal(await page.locator('.verdict').getAttribute('lang'), 'la');
  assert.deepEqual(await page.locator('.verdict-row > *').allTextContents(), ['Notā']);
  await page.locator('.verdict-flag').click();
  assert.equal(await page.locator('.flagbox-ask').textContent(), 'Quid vitiī est?');
  assert.deepEqual(await page.locator('.flagbox-chip').allTextContents(), ['verbum', 'quantitās', 'sēnsus', 'exemplum', 'fōns', 'aliud']);
  await page.locator('.flagbox-chip[data-reason="quantity"]').click();
  await page.locator('.flagbox-save').click();
  assert.match(await page.locator('.verdict-state').textContent(), /^Notāvistī diē \d+ [A-Z][a-zāī]+: quantitās\. In hōc nāvigātrō servātur, dōnec mittās: Recēnsiō\.$/);
  // The report is in English whatever the page's language, and Sent is "Missa".
  await openReview();
  assert.equal(await page.locator('#r-send-help').textContent(),
    'Quae notāvistī nec adhūc mīsistī in ūnam relātiōnem colliguntur. Eam commūnicā, exscrībe, vel per GitHub mitte; deinde «Missa» tange.');
  assert.equal(await page.locator('#r-pending').textContent(), 'soap: quantitās');
  assert.equal(await page.locator('#r-build').textContent(), 'Mitte');
  await page.locator('#r-build').click();
  assert.match(await page.locator('#r-report').inputValue(), /^Lexicon review report, .*: 0 marked right, 1 flagged\./);
  assert.equal(await page.locator('#r-sent').textContent(), 'Missa');
  await page.locator('#r-sent').click();
  assert.match(await page.locator('#r-waiting').textContent(), /^1 missum, nōndum in lexicō\. Iterum mitte$/);
  // A flag given on an earlier text of the entry.
  await keep('lexicon-review', { verdicts: { soap: { v: 'flag', r: [], n: '', t: Date.now() - 86400000, rev: 'deadbeef' } } });
  await settle();
  await page.goto(pageUrl('c/soap.html'));
  assert.match(await page.locator('.verdict-state').textContent(), /^Haec pāgina mūtāta est postquam notāvistī \(diē \d+ [A-Z][a-zāī]+\)\.$/);
  // The page's own switch changes the language for practice too.
  await openReview();
  await page.locator('#r-lang button[data-lang="en"]').click();
  assert.equal(await page.locator('h1').textContent(), 'Review');
  assert.equal(await page.locator('.eyebrow').textContent(), 'Every entry is a draft until the editor has read it.');
  assert.equal(await page.locator('.r-intro').textContent(), 'If something in the lexicon looks wrong, flag it on its own page. Flags are kept on this device until you send them from here.');
  assert.equal(await page.evaluate(() => localStorage.getItem('lexicon-practice-lang')), 'en');
  // Without scripts the page says how things stand and where to report a problem.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto(pageUrl('review.html'));
  assert.match(await plain.locator('.r-static').textContent(), /^Reviewed by the editor: [\d,]+; drafts: [\d,]+\./);
  assert.match(await plain.locator('.noscript-note').textContent(), /^Flagging an entry needs JavaScript\. Without it, report a problem on GitHub\.$/);
  assert.equal(await plain.locator('#review').isVisible(), false);
  await plain.goto(pageUrl('c/soap.html'));
  assert.equal(await plain.locator('.suggest a').isVisible(), true, 'the way to GitHub stands in for the flag');
  await context.close();
  await forgetReview();
});

// The clock ---------------------------------------------------------------------------------------

test('the clock game asks nothing of other sites, keeps its score, and leads back to the lexicon', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 760 }, serviceWorkers: 'block' });
  const clock = await context.newPage();
  const requested = [];
  clock.on('request', request => requested.push(request.url()));
  await clock.goto(pageUrl('index.html'));
  await clock.evaluate(() => { localStorage.setItem('hcu-mode', '"w2n"'); localStorage.setItem('hcu-lang', '"en"'); });
  await clock.goto(pageUrl('hora.html'));
  await clock.locator('#go').waitFor();
  await clock.waitForLoadState('networkidle');
  assert.ok(requested.some(address => address.endsWith('assets/fonts/lexicon-serif-400.woff2')), 'the lexicon’s own serif');
  assert.deepEqual(requested.filter(address => !address.startsWith(base)), []);
  assert.equal(await clock.title(), 'Hōra cum ūnciā · Lexicon Latīnitātis Cotīdiānae');
  assert.equal(await clock.locator('link[rel="manifest"]').getAttribute('href'), 'manifest.webmanifest');
  // Name to number, in English: a deūnx is eleven twelfths.
  const twelfths = { 'ūncia': 1, 'sextāns': 2, 'quadrāns': 3, 'triēns': 4, 'quīncūnx': 5, 'sēmis': 6, 'septūnx': 7, 'bēs': 8, 'dōdrāns': 9, 'dēxtāns': 10, 'deūnx': 11 };
  assert.equal(await clock.locator('#cueLabel').textContent(), 'How many twelfths?');
  assert.equal(await clock.locator('#keys').isVisible(), false);
  await clock.locator('#answer').fill(String(twelfths[await clock.locator('#cue').textContent()]));
  await clock.locator('#go').click();
  assert.match(await clock.locator('#fb').textContent(), /^Correct!/);
  assert.equal(await clock.locator('#tOk').textContent(), '1');
  assert.equal((await clock.evaluate(() => JSON.parse(localStorage.getItem('hcu-score')))).ok, 1);
  await clock.locator('#go').click();
  await clock.locator('#answer').fill('99');
  await clock.locator('#go').click();
  assert.match(await clock.locator('#fb').textContent(), /^Not quite\./);
  // The menu: the drill, the options, the language; every control big enough for a thumb.
  await clock.locator('#openMenu').click();
  await clock.waitForTimeout(300);
  const small = await clock.evaluate(() => [...document.querySelectorAll('.icon-btn, .opt, .seg button, .reset, .go, #answer, .mode-chip, .ref summary, .links a')]
    .filter(el => el.getClientRects().length)
    .map(el => [el.textContent.trim().slice(0, 24) || el.id, Math.round(el.getBoundingClientRect().height)])
    .filter(([, height]) => height < 44));
  assert.deepEqual(small, []);
  await clock.locator('.seg button[data-lang="la"]').click();
  assert.equal(await clock.locator('html').getAttribute('lang'), 'la');
  await clock.locator('#closeMenu').click();
  assert.equal(await clock.locator('#cueLabel').textContent(), 'Quot ūnciae?');
  assert.equal(await clock.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  // The theme is the lexicon's: light until dark is chosen there.
  assert.equal(await clock.locator('html').getAttribute('data-theme'), 'light');
  await clock.evaluate(() => localStorage.setItem('lexicon-theme', 'dark'));
  await clock.reload();
  assert.equal(await clock.locator('html').getAttribute('data-theme'), 'dark');
  // Back to the lexicon, and on to the vocabulary.
  assert.equal(await clock.locator('.links a[href="index.html"]').isVisible(), true);
  await clock.locator('.links a[href="practice.html"]').click();
  await clock.waitForURL(/practice\.html$/);
  assert.equal(await clock.locator('#p-start').isVisible(), true);
  await context.close();
});

// The clock's colours are the lexicon's (Jack, 15 November 2026): the ground, the card, the ink and
// the red of the practice round, with lapis for the twelfths and for a right answer. Its theme is
// the lexicon's too, whatever the system prefers.
test('the clock wears the lexicon’s colours in both themes and follows its theme, not the system’s', async () => {
  const rgb = hex => `rgb(${[1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16)).join(', ')})`;
  const lexicon = {
    light: { paper: '#ffffff', ink: '#141414', rubric: '#b0171f', accent: '#b0171f', ground: '#f2f0eb', card: '#ffffff', lapis: '#24457a', lapisSoft: '#e1e8f3' },
    dark: { paper: '#1c1b19', ink: '#e4dfd6', rubric: '#d8d1c4', accent: '#d4968a', ground: '#141311', card: '#24221f', lapis: '#9db4d6', lapisSoft: '#2a3345' }
  };
  // What the game wore until then: its grounds and ink, bronze, verdigris, green and its own red.
  const old = ['#e8ecea', '#f7f8f6', '#eef1ef', '#1c2422', '#5a6662', '#c8d0cc', '#94642a', '#fbf8f2', '#2d7767', '#d3e6e0', '#2c7546', '#a3392f',
               '#131917', '#151c1a', '#e5eae7', '#99a7a2', '#33403c', '#d2a163', '#1c1710', '#6bc1ad', '#22413a', '#7bc693', '#e6897e'].map(rgb);
  const twelfths = { 'ūncia': 1, 'sextāns': 2, 'quadrāns': 3, 'triēns': 4, 'quīncūnx': 5, 'sēmis': 6, 'septūnx': 7, 'bēs': 8, 'dōdrāns': 9, 'dēxtāns': 10, 'deūnx': 11 };
  const hours = ['prīma', 'secunda', 'tertia', 'quārta', 'quīnta', 'sexta', 'septima', 'octāva', 'nōna', 'decima', 'ūndecima', 'duodecima'];
  const parts = ['ūnciā', 'sextante', 'quadrante', 'triente', 'quīncūnce', 'sēmisse', 'septūnce', 'besse', 'dōdrante', 'dēxtante', 'deūnce'];
  const style = (page, selector, property) => page.locator(selector).first().evaluate((node, name) => getComputedStyle(node)[name], property);
  // Every colour that any element of the page computes to, the dial's fills and strokes included.
  const colours = page => page.evaluate(() => {
    const found = new Set();
    const names = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                   'outlineColor', 'textDecorationColor', 'accentColor', 'caretColor', 'fill', 'stroke'];
    for (const node of document.querySelectorAll('*')) {
      for (const pseudo of [null, '::before', '::after', '::placeholder', '::backdrop']) {
        const computed = getComputedStyle(node, pseudo);
        for (const name of names) found.add(computed[name]);
      }
    }
    return [...found];
  });

  for (const [theme, system] of [['light', 'dark'], ['dark', 'light']]) {
    const want = lexicon[theme];
    const context = await browser.newContext({ viewport: { width: 390, height: 760 }, serviceWorkers: 'block', colorScheme: system });
    const page = await context.newPage();
    await page.goto(pageUrl('index.html'));
    await page.evaluate(chosen => {
      if (chosen === 'dark') localStorage.setItem('lexicon-theme', 'dark');
      localStorage.setItem('hcu-mode', '"w2n"');
    }, theme);

    // The practice round, for comparison.
    await page.goto(pageUrl('practice.html'));
    await page.locator('#p-start').click();
    await page.locator('#g-show').click();
    const round = {
      ground: await style(page, '#p-game', 'backgroundColor'), ink: await style(page, '#p-game', 'color'),
      card: await style(page, '.pgame-card', 'backgroundColor'), hair: await style(page, '.pgame-card', 'borderTopColor'),
      fill: await style(page, '#g-got', 'backgroundColor'), onFill: await style(page, '#g-got', 'color'),
      rubric: await style(page, '#g-again', 'color'), accent: await style(page, '#g-again', 'borderTopColor')
    };
    assert.equal(round.ground, rgb(want.ground), `${theme}: the round's ground is the stylesheet's`);

    await page.goto(pageUrl('hora.html'));
    await page.locator('#go').waitFor();
    // The system prefers the other scheme, and the clock does not follow it.
    assert.equal(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches), system === 'dark');
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await page.locator('meta[name="theme-color"]').count(), 1);
    assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), want.ground);
    assert.equal(await style(page, 'html', 'colorScheme'), theme);
    // Ground, card, ink and lines as in the round; the main button filled with ink, as Teneō is.
    assert.equal(await style(page, 'body', 'backgroundColor'), round.ground);
    assert.equal(await style(page, '.top', 'backgroundColor'), round.ground);
    assert.equal(await style(page, 'body', 'color'), round.ink);
    assert.equal(await style(page, '.card', 'backgroundColor'), round.card);
    assert.equal(await style(page, '.card', 'borderTopColor'), round.hair);
    assert.equal(await style(page, '.ref', 'backgroundColor'), round.card);
    assert.equal(await style(page, '#go', 'backgroundColor'), round.fill);
    assert.equal(await style(page, '#go', 'color'), round.onFill);
    assert.equal(await style(page, '#answer', 'backgroundColor'), rgb(want.paper));

    // Five right answers: right is lapis, with a tick, and so is a run of five.
    for (let turn = 0; turn < 5; turn += 1) {
      await page.locator('#answer').fill(String(twelfths[await page.locator('#cue').textContent()]));
      await page.locator('#go').click();
      assert.equal(await style(page, '#fb .v', 'color'), rgb(want.lapis));
      assert.equal(await page.locator('#fb .v.ok svg').count(), 1, 'a tick, not the colour alone');
      assert.equal(await style(page, '#fb .v svg', 'color'), rgb(want.lapis));
      if (turn < 4) await page.locator('#go').click();
    }
    assert.equal(await style(page, '#tRun.hot', 'color'), rgb(want.lapis));
    // The twelfths are lapis: the sectors of the dial and the coin sign under it.
    const fills = await page.locator('#dial .sec').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fill));
    assert.equal(fills.length, 12);
    assert.ok(fills.includes(rgb(want.lapis)));
    assert.deepEqual([...new Set(fills)].filter(fill => fill !== rgb(want.lapis) && fill !== rgb(want.lapisSoft)), []);
    assert.equal(await style(page, '#dialCap', 'color'), rgb(want.lapis));
    const seen = new Set(await colours(page));

    // A wrong answer is red as Iterum is: the word in the rubric's colour, the cross in the mark's.
    await page.locator('#go').click();
    await page.locator('#answer').fill('99');
    await page.locator('#go').click();
    assert.equal(await style(page, '#fb .v.no', 'color'), round.rubric);
    assert.equal(await page.locator('#fb .v.no svg').count(), 1, 'a cross, not the colour alone');
    assert.equal(await style(page, '#fb .v svg', 'color'), round.accent);
    assert.equal(await page.locator('#tRun.hot').count(), 0);
    (await colours(page)).forEach(colour => seen.add(colour));

    // A clock question, with the hands and the mark at twelve; the long vowels left out is nearly right.
    await page.evaluate(() => { localStorage.setItem('hcu-mode', '"t2w"'); localStorage.setItem('hcu-mkeys', 'true'); });
    await page.reload();
    await page.locator('#go').waitFor();
    assert.equal(await page.locator('#dial .hand').count(), 4, 'two hands, each on a ground of its own');
    assert.deepEqual(await page.locator('#dial .hand').evaluateAll(nodes => nodes.map(node => getComputedStyle(node).stroke)),
      [rgb(want.paper), rgb(want.paper), round.ink, round.ink]);
    assert.equal(await page.locator('#dial path:not(.sec)').last().evaluate(node => getComputedStyle(node).stroke), round.accent);
    for (let turn = 0; ; turn += 1) {
      assert.ok(turn < 40, 'a time whose Latin has a long vowel');
      const [hour, minutes] = (await page.locator('#cue').textContent()).split(':').map(Number);
      const latin = `${hours[hour - 1]} cum ${parts[minutes / 5 - 1]}`;
      const bare = latin.normalize('NFD').replace(/\u0304/g, '').normalize('NFC');
      await page.locator('#answer').fill(bare);
      await page.locator('#go').click();
      if (bare !== latin) break;
      await page.locator('#go').click();
    }
    assert.equal(await style(page, '#fb .v.half', 'color'), round.rubric);
    assert.equal(await style(page, '#fb .v svg', 'color'), round.accent);
    // The table and the drawer: headings in the rubric's colour, the control in use underlined in the mark's.
    await page.locator('#ref summary').click();
    assert.equal(await style(page, '#ref th', 'color'), round.rubric);
    assert.equal(await style(page, '#ref td.nota', 'color'), rgb(want.lapis));
    await page.locator('#openMenu').click();
    assert.equal(await style(page, '#menu', 'backgroundColor'), round.card);
    assert.equal(await style(page, '#menu h2', 'color'), round.rubric);
    assert.equal(await style(page, '.seg button[aria-pressed="true"]', 'textDecorationColor'), round.accent);
    assert.equal(await style(page, '.opt input', 'accentColor'), round.accent);
    (await colours(page)).forEach(colour => seen.add(colour));

    // Nothing of the old palette is left: no bronze, no verdigris, no green.
    assert.deepEqual(old.filter(colour => seen.has(colour)), [], `${theme}: the old colours`);
    for (const colour of [want.ground, want.card, want.ink, want.accent, want.lapis, want.lapisSoft]) assert.ok(seen.has(rgb(colour)), `${theme}: ${colour}`);
    await context.close();
  }

  // Where the system prefers dark and nothing was chosen in the lexicon, the clock is light.
  const context = await browser.newContext({ viewport: { width: 390, height: 760 }, serviceWorkers: 'block', colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto(pageUrl('hora.html'));
  await page.locator('#go').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await style(page, 'body', 'backgroundColor'), rgb(lexicon.light.ground));
  assert.equal(await style(page, 'body', 'color'), rgb(lexicon.light.ink));
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute('content'), lexicon.light.ground);
  await context.close();
});
