"""Run with python3 -m unittest discover -s tests -v."""
import copy
import importlib.util
import json
import re
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

# Building the site takes several seconds, and most tests build it from an untouched copy of the
# data. Those builds are all the same, so the first is kept and handed out again (each caller gets
# a dictionary of its own). A test that changes a file gets a build of its own, as before. The
# copy is known to be untouched by a hash of every file under data/ and src/, names and bytes.
import hashlib

_build_site = builder.build_site
_untouched = {}


def _state(root):
    digest = hashlib.blake2b(_state_of_data(root).encode(), digest_size=16)
    # The builder also reads two tables under refs/ where they exist (a temporary copy has none).
    for path in sorted((Path(root) / 'refs').glob('*.tsv')) if (Path(root) / 'refs').exists() else []:
        digest.update(f'{path.name} {path.stat().st_size}\0'.encode())
    return digest.hexdigest()


def build_site(root=ROOT):
    state = _state(root)
    # Two states are kept: the repository's own, and its data and sources copied without refs/,
    # which is what a test's temporary copy is until the test changes it.
    if state not in _untouched and len(_untouched) < 2 and _first_of_its_kind(root):
        _untouched[state] = (_build_site(root), None)
        _untouched[state] = (_untouched[state][0], dict(builder.LINK_TOTALS))
    if state not in _untouched:
        return _build_site(root)
    outputs, totals = _untouched[state]
    builder.LINK_TOTALS.update(totals)
    return dict(outputs)


def _first_of_its_kind(root):
    """Whether this tree is the repository's data and sources, unchanged."""
    if '' not in _pristine:
        _pristine[''] = _state_of_data(ROOT)
    return _state_of_data(root) == _pristine['']


_pristine = {}


def _state_of_data(root):
    digest = hashlib.blake2b(digest_size=16)
    for folder in ('data', 'src'):
        for path in sorted((Path(root) / folder).rglob('*')):
            if path.is_file():
                digest.update(str(path.relative_to(root)).encode() + b'\0' + path.read_bytes() + b'\0')
    return digest.hexdigest()


builder.build_site = build_site


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in ('data', 'src'):
            shutil.copytree(ROOT / path, self.root / path)
        # Grouped cards are being converted to records, so pick a category that still has some;
        # once none has, the tests of the card format use a card of their own.
        categories = [c['id'] for c in self.read('data/catalog.json')['categories']]
        self.category = next((c for c in categories if self.read(f'data/entries/{c}.json')), None)
        if self.category is None:
            self.category = categories[0]
            self.write(f'data/entries/{self.category}.json', [{
                'id': 'entry-90000', 'english': 'Test card', 'latin': 'probātiō, probātiōnis f.', 'tags': [],
                'blocks': [{'type': 'paragraph', 'html': '<strong lang="la">probātiō</strong>, a test.'}]}])
        self.path = f'data/entries/{self.category}.json'
        self.card = self.read(self.path)[0]['id']

    def read(self, path):
        return json.loads((self.root / path).read_text(encoding='utf-8'))

    def record(self, key):
        return self.read(f'data/concepts/{key}.json')

    def save_record(self, record, key=None):
        self.write(f'data/concepts/{key or record["id"]}.json', record)

    def write(self, path, data):
        (self.root / path).write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')

    def practice(self, outputs):
        """The practice cards, read back from their script."""
        script = outputs['assets/practice-data.js']
        self.assertTrue(script.startswith('window.lexiconPractice = ') and script.endswith(';\n'))
        return json.loads(script[len('window.lexiconPractice = '):-2])

    def test_the_fast_scan_of_a_page_agrees_with_the_parser(self):
        """check_links reads the pages with patterns, not with the HTML parser, which took most of a
        build. On a sample of every kind of page the two must find the same IDs and the same links."""
        outputs = builder.build_site()
        pages = [path for path in sorted(outputs) if path.endswith('.html')]
        sample = [path for path in pages if '/' not in path] + pages[::40]
        self.assertGreater(len(sample), 400)
        for path in sample:
            parsed, scanned = builder.Document(), builder.Scanned(outputs[path])
            parsed.feed(outputs[path])
            self.assertEqual(scanned.ids, parsed.ids, path)
            self.assertEqual(scanned.links, parsed.links, path)
        # Scripts, styles and comments are not markup, and entities are read as the parser reads them.
        page = builder.Scanned('<!-- <a id="no" href="no.html"> --><script>var a = \'<a id="no2" href="x.html">\';</script>'
                               '<style>a[href="y"] {}</style><p id="yes"><a data-id="z" href="c/a.html?x=1&amp;y=2">a</a>'
                               '<a href="https://example.org/">b</a></p>')
        self.assertEqual(page.ids, {'yes'})
        self.assertEqual(page.links, ['c/a.html?x=1&y=2'])
        with self.assertRaisesRegex(ValueError, 'Duplicate HTML ID: twice'):
            builder.Scanned('<p id="twice"></p><p id="twice"></p>')

    def test_the_generated_site_is_not_kept_in_the_repository(self):
        """The site is built when it is published (.github/workflows/pages.yml), and what a local
        build writes beside the sources is ignored by git (Jack, 15 November 2026): every file the
        builder writes is under a name that .gitignore lists."""
        ignored = {line.strip() for line in (ROOT / '.gitignore').read_text(encoding='utf-8').splitlines()}
        for path in builder.build_site():
            top = path.split('/')[0]
            self.assertIn(f'/{top}/' if '/' in path else f'/{top}', ignored, path)
        self.assertEqual(builder.stale(self.root, builder.build_site(self.root)), [])

    def test_deterministic_build(self):
        self.assertEqual(builder.build(self.root), builder.build(self.root))

    def test_new_entry_updates_counts_and_preserves_unicode(self):
        entries = self.read(self.path)
        new = copy.deepcopy(entries[0]) if entries else {'tags': [], 'blocks': [{'type': 'paragraph', 'html': 'Test.'}]}
        new.update(id='entry-99999', english='A < B & C', latin='lūdicrum, lūdicrī n.')
        new.pop('anchor', None)
        entries.append(new)
        self.write(self.path, entries)
        outputs = builder.build_site(self.root)
        cards = sum(len(self.read(f'data/entries/{c["id"]}.json')) for c in self.read('data/catalog.json')['categories'])
        records = [self.read(p) for p in (self.root / 'data/concepts').glob('*.json')]
        listed = sum(1 for r in records if self.category in [r['domain']] + r.get('also_under', []))
        self.assertIn(f'{cards + len(records):,} entries</span>', outputs['index.html'])
        # The front page's contents give each category's count and link to its page.
        latin = next(c['latin'] for c in self.read('data/catalog.json')['categories'] if c['id'] == self.category)
        self.assertIn(f'<a href="k/{self.category}.html"><span class="toc-la" lang="la">{latin}</span>'
                      f'<span class="toc-n">{len(entries) + listed}<span class="vh"> entries</span></span>', outputs['index.html'])
        page = outputs[f'k/{self.category}.html']
        self.assertIn(f'{len(entries) + listed} entries</p>', page)
        self.assertIn('A &lt; B &amp; C', page)
        self.assertIn('lūdicrum, lūdicrī n.', page)

    def test_duplicate_entry_rejected_across_categories(self):
        catalog = self.read('data/catalog.json')
        other = f'data/entries/{next(c["id"] for c in catalog["categories"] if c["id"] != self.category)}.json'
        twin = copy.deepcopy(self.read(self.path)[0])
        twin.pop('anchor', None)
        self.write(other, self.read(other) + [twin])
        with self.assertRaisesRegex(ValueError, 'Duplicate entry'):
            builder.build(self.root)

    def test_unknown_field_rejected(self):
        entries = self.read(self.path)
        entries[0]['latni'] = 'misspelling'
        self.write(self.path, entries)
        with self.assertRaisesRegex(ValueError, 'Unknown fields'):
            builder.build(self.root)

    def test_unknown_block_rejected(self):
        entries = self.read(self.path)
        entries[0]['blocks'].append({'type': 'unknown'})
        self.write(self.path, entries)
        with self.assertRaisesRegex(ValueError, 'Unknown block'):
            builder.build(self.root)

    def test_unlisted_topic_file_rejected(self):
        self.write('data/entries/unlisted.json', self.read(self.path))
        with self.assertRaisesRegex(ValueError, 'Unlisted or missing'):
            builder.build(self.root)

    def test_missing_filter_rejected(self):
        catalog = self.read('data/catalog.json')
        catalog['filters'].pop()
        self.write('data/catalog.json', catalog)
        with self.assertRaisesRegex(ValueError, 'Filters must cover'):
            builder.build(self.root)

    def test_invalid_category_path_rejected(self):
        catalog = self.read('data/catalog.json')
        catalog['categories'][0]['id'] = '../escape'
        self.write('data/catalog.json', catalog)
        with self.assertRaisesRegex(ValueError, 'Invalid category ID'):
            builder.build(self.root)

    def test_dangling_fragment_rejected(self):
        entries = self.read(self.path)
        entries[0]['blocks'].append({'type': 'paragraph', 'html': '<a href="#missing-entry">See also</a>'})
        self.write(self.path, entries)
        with self.assertRaisesRegex(ValueError, 'Broken fragment'):
            builder.build(self.root)

    def test_invalid_rich_text_rejected(self):
        for html in ('<script>alert(1)</script>', '<strong>unclosed', '<em>bad</strong>',
                     '<a href="javascript:alert(1)">bad</a>', '<span onclick="alert(1)">bad</span>'):
            with self.subTest(html=html), self.assertRaises(ValueError):
                builder.rich(html)

    def test_missing_template_token_rejected(self):
        path = self.root / 'src/page.html'
        path.write_text(path.read_text(encoding='utf-8').replace('{{record_count}}', '123'), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Missing template token'):
            builder.build(self.root)

    # Concept records, notes and rulings ---------------------------------------------

    def test_records_render_with_notes_pages_and_rulings(self):
        outputs = builder.build_site(self.root)
        category = outputs['k/sermo.html']
        self.assertIn('<a href="../c/perhaps.html"><span class="w-en">perhaps <span class="w-pos">adverb</span></span>'
                      '<span class="w-la" lang="la">fortasse</span></a>', category)
        self.assertIn('"id":"c-perhaps","u":"c/perhaps.html","k":"sermo"', outputs['assets/search-data.js'])
        page = outputs['c/perhaps.html']
        self.assertIn('<title>perhaps in Latin: fortasse · ', page)
        self.assertIn('<aside class="side note" id="fn-perhaps-1">', page)
        self.assertIn('href="../rulings.html#r-fortasse"', page)
        self.assertIn('<a href="../k/sermo.html">', page)
        self.assertIn('<link rel="canonical" href="https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/c/perhaps.html">', page)
        rulings = outputs['rulings.html']
        self.assertIn('id="r-fortasse"', rulings)
        self.assertIn('href="rulings.html"', outputs['how-we-decide.html'])
        self.assertIn('href="how-we-decide.html"', rulings)
        self.assertIn('<a href="c/perhaps.html">perhaps</a>', rulings)
        for path in ('', 'c/perhaps.html', 'k/sermo.html', 'words.html', 'latin.html', 'rulings.html', 'l/fortasse.html'):
            self.assertIn(f'cotidianae/{path}</loc>', outputs['sitemap.xml'])
        self.assertIn('href="../l/fortasse.html"', page)
        self.assertIn('<h1 class="hw">perhaps <span class="pos">adverb</span></h1>', page)
        word = outputs['l/fortasse.html']
        self.assertIn('<h1 class="hw" lang="la">fortasse</h1>', word)
        self.assertIn('href="../c/perhaps.html"', word)
        self.assertIn('href="../rulings.html#r-fortasse"', word)
        self.assertIn('<a href="l/fortasse.html" lang="la">fortasse</a>', rulings)
        self.assertIn('<a href="l/caccabus.html"><span class="w-la" lang="la">caccabus</span>', outputs['latin.html'])
        # Every entry and word page offers a correction, filled in with its address.
        self.assertIn('issues/new?title=Correction%3A%20perhaps&amp;body=Page%3A%20https%3A//jhwheeler.github.io/'
                      'lexicon-latinitatis-cotidianae/c/perhaps.html', page)
        self.assertIn('issues/new?title=Correction%3A%20fortasse', word)
        self.assertIn('url(fonts/lexicon-serif-400.woff2)', outputs['assets/lexicon.css'])
        self.assertIsInstance(outputs['assets/fonts/lexicon-serif-400.woff2'], bytes)

    def test_how_the_practice_works_is_a_guidance_page_with_every_source_linked(self):
        outputs = builder.build_site(self.root)
        page = outputs['how-practice-works.html']
        self.assertIn('<title>How the practice works · Lexicon Latīnitātis Cotīdiānae</title>', page)
        self.assertEqual(page.count('<h1'), 1)
        self.assertIn('<h1 class="page-title">How the practice works</h1>', page)
        self.assertIn('<link rel="canonical" href="https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/how-practice-works.html">', page)
        self.assertNotIn('{{', page)
        # A guidance page like How we decide: the shell's header and footer, and no script but the page's own.
        self.assertEqual(re.findall(r'<script src="([^"]+)"', page), ['assets/lexicon.js'])
        self.assertIn('<form class="head-search" role="search" action="index.html" method="get">', page)
        # It leads back to Practice and to How we decide, and both lead to it.
        main = page[page.index('<main'):page.index('</main>')]
        self.assertIn('<a href="practice.html">Practice</a>', main)
        self.assertIn('<a href="how-we-decide.html">How we decide</a>', main)
        self.assertIn('<a href="how-practice-works.html" hreflang="en" data-t="how">How the practice works</a>', outputs['practice.html'])
        script = outputs['assets/practice.js']
        self.assertIn("how: 'Quā ratiōne repetātur',", script)
        self.assertIn("how: 'How the practice works',", script)
        # Every source in the list is linked, and the text cites exactly the sources the list has.
        sources = main[main.index('<section id="sources">'):]
        entries = re.findall(r'<li id="(s-[\w-]+)">(.*?)</li>', sources, re.S)
        self.assertGreaterEqual(len(entries), 10)
        for key, entry in entries:
            with self.subTest(source=key):
                self.assertRegex(entry, r'<a href="https://[^"]+">')
        cited = set(re.findall(r'<a href="#(s-[\w-]+)">', main))
        self.assertEqual(cited, {key for key, _ in entries})
        # It states the rules the practice script has: the numbers on the page are the script's.
        for constant in ('ROUND = 12, ROUND_DUE = 6,', 'AGAIN_WAIT = HOUR / 6,', 'DAY_STARTS = 4;',
                         'WAIT_DAYS = [null, null, [1, 1], [3, 4], [6, 8], [14, 18], [30, 40], [70, 90], [150, 210], [300, 420]];',
                         'ROUND_DUE_MORE = [[72, 10], [36, 8]];'):
            self.assertIn(constant, script)
        for said in ('A round is 12 cards', 'at most half of a round', 'due again in 10 minutes', 'due the next day',
                     'in 3–4 days, 6–8, 14–18, and 30–40, then in 70–90, 150–210, and 300–420', 'more than 36 waiting, 8 of the 12', 'more than 72, 10',
                     'starting at 04:00'):
            self.assertIn(said, main)
        # In the sitemap, kept on the device by the service worker, and in the footer of every page.
        self.assertIn('cotidianae/how-practice-works.html</loc>', outputs['sitemap.xml'])
        files = json.loads(re.search(r'const FILES = (\[.*?\]);', outputs['sw.js'])[1])
        self.assertIn('how-practice-works.html', files)
        self.assertIn('how-we-decide.html', files)
        for path, up in (('index.html', ''), ('c/perhaps.html', '../'), ('k/sermo.html', '../'), ('l/fortasse.html', '../'),
                         ('practice.html', ''), ('how-practice-works.html', '')):
            with self.subTest(path=path):
                foot = outputs[path][outputs[path].rindex('<footer'):]
                self.assertIn(f'<a href="{up}rulings.html">Rulings</a> · <a href="{up}how-practice-works.html">How the practice works</a> · ', foot)
                self.assertNotIn('how-practice-works', outputs[path][outputs[path].index('<header class="site-top'):outputs[path].index('</header>')])
        # No request to another site: the page loads only the lexicon's own files.
        self.assertEqual(re.findall(r'(?:src|<link[^>]*href)="(https?:[^"]+)"', page.replace(
            '<link rel="canonical" href="https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/how-practice-works.html">', '')), [])
        builder.check_links(outputs)

    def test_old_single_page_links_lead_to_the_new_pages(self):
        outputs = builder.build_site(self.root)
        index = outputs['index.html']
        self.assertIn("s.src = 'assets/legacy.js'", index)
        self.assertLess(len(index), 60000)
        legacy = outputs['assets/legacy.js']
        # Categories, their old names and the converted cards are in the table; records and their
        # notes follow a pattern.
        self.assertIn('"culina":"k/culina.html"', legacy)
        self.assertIn('"theodorus":"k/sermo.html"', legacy)
        self.assertIn('"entry-550":"c/perhaps.html"', legacy)
        self.assertNotIn('"c-perhaps"', legacy)
        self.assertIn("'c/' + m[1] + '.html'", legacy)

    def test_a_note_on_a_form_opens_with_form_claim_and_authority(self):
        outputs = builder.build_site(self.root)
        opening = ('<b class="nf" lang="la">fortasse</b>: short final e (Lewis &amp; Short '
                   '<span lang="la">fortassē</span>, without evidence). Catull. 85.1')
        for path in ('c/perhaps.html', 'l/fortasse.html'):
            self.assertIn(opening, outputs[path], path)
        self.assertEqual(builder.note_html({'html': 'Plain note.'}), 'Plain note.')
        self.assertEqual(builder.note_html({'form': 'ānsāta', 'claim': 'long a before ns', 'html': 'From ānsa.'}),
                         '<b class="nf" lang="la">ānsāta</b>: long a before ns. From ānsa.')

    def test_front_page_lists_the_categories_and_each_has_a_page(self):
        outputs = builder.build_site(self.root)
        index = outputs['index.html']
        self.assertIn('<section id="contents" class="home"', index)
        self.assertIn('<a href="k/culina.html"><span class="toc-la" lang="la">Culīna et potūs</span>', index)
        self.assertIn('<a href="words.html">the English words</a>', index)
        self.assertIn('data-theme="light"', index)
        self.assertIn("=== 'dark' ? 'dark' : 'light'", index)
        self.assertIn('<form class="toolbar" role="search" action="index.html" method="get">', index)
        # The header: the name, the search (except where the page searches in place), the settings.
        header = lambda html: html[html.index('<header class="site-top'):html.index('</header>')]
        self.assertIn('<details class="settings"><summary aria-label="Display and theme"', index)
        self.assertNotIn('head-search', index)
        self.assertNotIn('<nav', header(index))
        # The foot: three short rows, each under its name; the front page searches in place, so its
        # first row has Practice alone.
        self.assertIn('<nav class="foot-links" aria-label="The lexicon’s pages"><p><span class="foot-h">Use</span> <span class="foot-l">'
                      '<a href="practice.html">Practice</a></span></p><p><span class="foot-h">How it is made</span> <span class="foot-l">'
                      '<a href="#about">About</a> · <a href="how-we-decide.html">How we decide</a> · <a href="rulings.html">Rulings</a> · '
                      '<a href="how-practice-works.html">How the practice works</a> · <a href="review.html">Review</a></span></p>'
                      '<p><span class="foot-h">Project</span> ', index)
        record = outputs['c/kind.html']
        self.assertIn('<form class="head-search" role="search" action="../index.html" method="get">', header(record))
        self.assertIn('name="q"', header(record))
        self.assertIn('data-theme-choice="dark"', header(record))
        self.assertNotIn('<nav', header(record))
        self.assertIn('<a href="../index.html#about">About</a> · <a href="../how-we-decide.html">How we decide</a> · <a href="../rulings.html">Rulings</a> · '
                      '<a href="../how-practice-works.html">How the practice works</a> · <a href="../review.html">Review</a>', record)
        for path in ('words.html', 'latin.html', 'rulings.html', 'how-we-decide.html', 'how-practice-works.html', 'l/caccabus.html'):
            up = '../' if '/' in path else ''
            self.assertIn(f'<form class="head-search" role="search" action="{up}index.html" method="get">', outputs[path], path)
            self.assertIn(f'<a href="{up}index.html#about">About</a>', outputs[path], path)
        page = outputs['k/culina.html']
        self.assertNotIn('head-search', page)
        self.assertIn('data-theme-choice="dark"', page)
        self.assertIn('<div class="catpage" data-category="culina"', page)
        self.assertIn('<a href="../k/culina.html" lang="la" aria-current="page">Culīna et potūs</a>', page)
        self.assertIn('<form class="toolbar" role="search" action="../index.html" method="get">', page)
        self.assertIn('<input type="hidden" name="cat" value="culina">', page)
        self.assertIn('<a href="../c/cooking-pot.html"><span class="w-en">cooking pot <span class="w-pos">noun</span></span>'
                      '<span class="w-la" lang="la">caccabus</span></a>', page)
        self.assertIn('<script src="../assets/search.js" defer></script>', page)
        words = outputs['words.html']
        self.assertIn('<nav class="az-nav" aria-label="Letters"><a href="#letter-a">A</a>', words)
        self.assertIn('<span class="w-cat" lang="la">Culīna et potūs</span>', words)

    def test_a_record_can_be_listed_under_other_categories(self):
        record = self.record('cooking-pot')
        record['also_under'] = ['domus']
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn('href="../c/cooking-pot.html"', outputs['k/domus.html'])
        self.assertIn('<a href="../k/culina.html">Kitchen, meals &amp; drinks</a> · <a href="../k/domus.html">',
                      outputs['c/cooking-pot.html'])
        self.assertEqual(outputs['words.html'].count('href="c/cooking-pot.html"'), 1)
        self.assertEqual(outputs['assets/search-data.js'].count('"id":"c-cooking-pot"'), 1)
        self.assertIn('"x":["domus"]', outputs['assets/search-data.js'])
        for bad in (['culina'], ['nowhere'], ['domus', 'domus']):
            with self.subTest(also_under=bad):
                record['also_under'] = bad
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, 'Invalid also_under'):
                    builder.build_site(self.root)

    def test_note_numbers_follow_reading_order(self):
        record = self.record('perhaps')
        record['notes']['second'] = {'html': 'Second note.'}
        record['terms'][-1]['notes'] = ['second']
        record['phrases'][0]['notes'] = ['short-e']
        self.save_record(record)
        page = builder.build_site(self.root)['c/perhaps.html']
        self.assertRegex(page, r'id="fn-perhaps-2">(?:(?!</aside>).)*Second note\.')

    def test_record_errors_rejected(self):
        cases = {
            'Unknown note': lambda r: r['terms'][0].update(notes=['missing']),
            'Unused notes': lambda r: r['notes'].update(spare={'html': 'Never cited.'}),
            'Unknown ruling': lambda r: r['notes']['short-e'].update(ruling='no-such-ruling'),
            'No recommended term': lambda r: [t.update(status='alternative') for t in r['terms']],
            'Invalid period': lambda r: r['terms'][0].update(period='ancient'),
            'Unknown related': lambda r: r.update(related=['no-such-concept']),
            'which still exists': lambda r: r.update(replaces=[self.card]),
            'Unknown fields': lambda r: r.update(lattin='x'),
            'Invalid review': lambda r: r['review'].update(status='done'),
            'needs both form and claim': lambda r: r['notes']['short-e'].pop('claim'),
            'has against without a form': lambda r: r['notes'].update(
                **{'short-e': {'html': 'Evidence.', 'against': 'Lewis &amp; Short'}}),
        }
        original = self.record('perhaps')
        for message, change in cases.items():
            with self.subTest(message=message):
                record = copy.deepcopy(original)
                change(record)
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, message):
                    builder.build_site(self.root)
        self.save_record(original)

    def test_grammar_is_read_from_the_dictionary_form(self):
        cases = {'caccabus (cacabus), caccabī m.': 'noun, second declension', 'rādula, rādulae f.': 'noun, first declension',
                 'cortex, corticis m.': 'noun, third declension', 'ructus, ructūs m.': 'noun, fourth declension',
                 'diēs, diēī m.': 'noun, fifth declension', 'ferrāmenta, ferrāmentōrum n. pl.': 'noun, second declension, plural',
                 'subtēgulāneum, -ī n.': 'noun, second declension', 'tītillō, tītillāre': 'verb, first conjugation',
                 'singultiō, singultīre': 'verb, fourth conjugation', 'dēcoquō, dēcoquere, dēcoxī, dēcoctum': 'verb, third conjugation',
                 'loquor, loquī': 'verb, third conjugation, deponent', 'ōlla ānsāta': '', 'fortasse': ''}
        for latin, expected in cases.items():
            with self.subTest(latin=latin):
                self.assertEqual(builder.grammar({'latin': latin}), expected)
        self.assertEqual(builder.grammar({'latin': 'tītillō, tītillāre', 'grammar': 'verb, transitive'}), 'verb, transitive')

    def test_a_comparative_is_not_read_as_a_verb(self):
        for latin in ('major, majus', 'jūnior, jūniōris', 'interior, interius'):
            with self.subTest(latin=latin):
                self.assertEqual(builder.grammar({'latin': latin}), '')
        self.assertEqual(builder.grammar({'latin': 'cōnfiteor, cōnfitērī, cōnfessus sum'}), 'verb, second conjugation, deponent')
        self.assertEqual(builder.grammar({'latin': 'ferō, ferre, tulī, lātum'}), 'verb')

    def test_wiktionary_links_for_words_that_inflect(self):
        titles = {'caccabus': 'caccabus', 'jam': 'iam', 'Jēsūs': 'Iesus', 'conjūnx': 'coniunx', 'āēr': 'aer',
                  'videō': 'video', 'Rōma': 'Roma', 'Ecce!': 'ecce'}
        for head, title in titles.items():
            with self.subTest(head=head):
                self.assertEqual(builder.wiktionary_title(head), title)
        kinds = {'caccabus (cacabus), caccabī m.': 'Declension', 'auctor, auctōris m./f.': 'Declension',
                 'bonus, bona, bonum': 'Declension', 'fidēlis, fidēle': 'Declension', 'major, majus': 'Declension',
                 'hic, haec, hoc': 'Declension', 'pār, paris': 'Declension', 'manifestus, manifesta, manifestum (+ gen.)': 'Declension',
                 'tītillō, tītillāre': 'Conjugation', 'cōnfiteor, cōnfitērī, cōnfessus sum': 'Conjugation',
                 'nōlō, nōlle, nōluī': 'Conjugation', 'fortasse': '', 'ā, ab + abl.': '', 'Licet.': '', 'edepol, pol': ''}
        for latin, kind in kinds.items():
            with self.subTest(latin=latin):
                self.assertEqual(builder.inflection({'latin': latin}), kind)
        self.assertEqual(builder.inflection({'latin': 'colluō', 'grammar': 'verb, third conjugation'}), 'Conjugation')
        self.assertEqual(builder.inflection({'latin': 'animī', 'grammar': 'noun, genitive of animus'}), '')
        self.assertEqual(builder.inflection({'latin': 'frūstrā', 'grammar': 'adverb'}), '')
        # The words that name the declension or conjugation carry the link; there is no separate label.
        link = builder.grammar_html({'latin': 'jūs, jūris n.'})
        self.assertIn('href="https://en.wiktionary.org/wiki/ius#Latin"', link)
        self.assertTrue(link.startswith('noun, <a class="wikt"'))
        self.assertTrue(link.endswith('>third declension</a>'))
        self.assertNotIn('on Wiktionary</a>', link)
        both = builder.grammar_html({'latin': 'bonus', 'grammar': 'adjective, first and second declension; comparative melior'})
        self.assertIn('>first and second declension</a>; comparative melior', both)
        # A verb whose grammar names no conjugation gets the bare word, linked.
        self.assertTrue(builder.grammar_html({'latin': 'ferō, ferre, tulī, lātum'}).endswith('>conjugation</a>'))
        # Several words, or a word that does not inflect: no link here (the word's page lists Wiktionary).
        self.assertEqual(builder.grammar_html({'latin': 'ōlla ānsāta'}), '')
        self.assertEqual(builder.grammar_html({'latin': 'jam', 'grammar': 'adverb'}), 'adverb')

    def test_latinitium_links_by_lewis_and_short_entry_number(self):
        table = builder.load_latinitium(builder.ROOT)
        base = 'https://latinitium.com/latin-dictionaries/?t='
        self.assertEqual(builder.latinitium_url('soror', table), base + 'lsn44798')
        self.assertEqual(builder.latinitium_url('videō', table), base + 'lsn50883')
        self.assertEqual(builder.latinitium_url('Rōma', table), base + 'lsn41840')
        self.assertEqual(builder.latinitium_url('jūs', table), base + 'lsn25394,lsn25395')
        self.assertEqual(builder.latinitium_url('pedūlia', table), '')

    def test_part_of_speech_validated(self):
        record = self.record('perhaps')
        for pos in ('adverbial', ['adverb', 'adverb'], []):
            with self.subTest(pos=pos):
                record['pos'] = pos
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, 'Invalid part of speech'):
                    builder.build_site(self.root)

    def test_word_pages_get_distinct_slugs_and_link_within_longer_terms(self):
        record = self.record('cooking-pot')
        record['terms'].append({'latin': 'malum, malī n.', 'status': 'alternative', 'period': 'classical'})
        record['terms'].append({'latin': 'mālum, mālī n.', 'status': 'alternative', 'period': 'classical'})
        # A word of a longer term links to its own page only where it has one (an invented word has none).
        record['terms'].append({'latin': 'caccabus fictīcius', 'status': 'alternative', 'period': 'ours'})
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn('l/malum.html', outputs)
        self.assertIn('l/malum-2.html', outputs)
        self.assertNotIn('l/ficticius.html', outputs)
        concept = outputs['c/cooking-pot.html']
        self.assertIn('<b><a href="../l/caccabus.html">caccabus</a> fictīcius</b>', concept)
        self.assertIn('<b lang="la">caccabus fictīcius</b>', outputs['l/caccabus.html'])

    def test_the_readers_are_not_cited_as_an_author_would_be(self):
        record = self.record('perhaps')
        record['phrases'] = [
            {'latin': 'Fortasse pluet.', 'english': 'Perhaps it will rain.', 'source': 'Libellus IV, <span lang="la">Diēs fēstus</span>'},
            {'latin': 'Fortasse veniet.', 'english': 'Perhaps he will come.', 'source': '<span lang="la">Culīna Theodōrī</span>'}]
        record['sources'] = ['<span lang="la">Theodōrus et pater · Ad Larem avītum</span>, Libellī I–VII, as they stood on 7 November 2026.']
        self.save_record(record)
        outputs = builder.build_site(self.root)
        page = outputs['c/perhaps.html']
        # The example's place in the readers stays in the data; the page calls it composed.
        self.assertEqual(page.count('<span class="src composed">composed</span>'), 2)
        self.assertIn('<li data-source="composed">', page)
        for hidden in ('Libellus', 'Theodōrus et pater', 'Culīna Theodōrī', '<span class="sc">Sources</span>'):
            self.assertNotIn(hidden, page)
        self.assertNotIn('Libellus', outputs['assets/search-data.js'].split('"id":"c-perhaps"')[1].split('"id":')[0])
        # Nor do the practice cards: its two examples are sentences of ours, with no label.
        card = next(card for card in self.practice(outputs)['cards'] if card['i'] == 'perhaps')
        self.assertEqual([example[2] for example in card['q']], ['', ''])
        self.assertNotRegex(outputs['assets/practice-data.js'], r'Libellus [IVX]|Theodōrus et pater|Culīna Theodōrī')
        # With another source beside the readers, only that one is shown.
        record['sources'].append('Anna Andresian, <em>Vocabula Picta</em> (2014), p. 43.')
        self.save_record(record)
        page = builder.build_site(self.root)['c/perhaps.html']
        self.assertIn('<span class="sc">Sources</span>Anna Andresian', page)
        self.assertNotIn('Theodōrus et pater', page)

    def test_lists_mark_words_and_phrases(self):
        record = self.record('perhaps')
        record['pos'] = 'phrase'
        # A reviewed entry carries a class in the lists; the test's own copy is a draft, whatever the editor has read.
        record['review'] = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}
        self.save_record(record)
        outputs = builder.build_site(self.root)
        for path, link in (('k/sermo.html', '../c/perhaps.html'), ('words.html', 'c/perhaps.html')):
            with self.subTest(path=path):
                self.assertIn(f'<li data-kind="phrase"><a href="{link}">', outputs[path])
                self.assertIn('<li data-kind="word">', outputs[path])
                self.assertIn('data-kind-filter hidden>', outputs[path])
        # The Latin index has the phrase too, whole, leading to its entry, beside the words.
        latin = outputs['latin.html']
        self.assertIn('data-kind-filter hidden>', latin)
        self.assertIn('<li data-kind="word"><a href="l/', latin)
        record['terms'][0]['latin'] = 'Fortasse ita est.'
        self.save_record(record)
        latin = builder.build_site(self.root)['latin.html']
        self.assertIn('<li data-kind="phrase"><a href="c/perhaps.html"><span class="w-la" lang="la">Fortasse ita est.</span>', latin)

    def test_the_indexes_run_from_a_to_z(self):
        outputs = builder.build_site(self.root)
        for path in ('latin.html', 'words.html'):
            with self.subTest(path=path):
                letters = re.findall(r'<section class="az-letter" id="letter-(.)">', outputs[path])
                self.assertEqual(letters, sorted(letters))
                self.assertEqual(len(letters), len(set(letters)))
        # An enclitic stands among the words of its letter, not ahead of the alphabet.
        latin = outputs['latin.html']
        self.assertLess(latin.index('id="letter-a"'), latin.index('lang="la">-ne<'))
        self.assertLess(latin.index('id="letter-n"'), latin.index('lang="la">-ne<'))

    def test_sources_are_citations_and_each_work_is_cited_once(self):
        traupman = 'John C. Traupman, <em>Conversational Latin for Oral Proficiency</em>'
        for sources, message in (
                ([traupman + ', p. 211, each phrase checked against the searchable text of the book.'], 'describes how it was read'),
                ([traupman + ' (printed page numbers): p. 294.'], 'describes how it was read'),
                ([traupman + ', pp. 211, 219.', traupman + ', p. 294.'], 'Traupman is cited more than once'),
                (['Anna Andresian, <em>Vocabula Picta</em> (2014), p. 43.'] * 2, 'same source twice')):
            with self.subTest(message=message):
                record = self.record('perhaps')
                record['sources'] = sources
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, message):
                    builder.build_site(self.root)
        record = self.record('perhaps')
        record['sources'] = [traupman + ', pp. 211, 219, 294.']
        self.save_record(record)
        self.assertIn('<em>Conversational Latin for Oral Proficiency</em>, pp. 211, 219, 294.</p>',
                      builder.build_site(self.root)['c/perhaps.html'])

    def test_the_standing_notes_under_sources_are_said_once(self):
        # Jack, 15 November 2026: the sentences repeated from record to record under Sources are
        # said once, on the policy page, and every entry that has sources leads there.
        outputs = builder.build_site(self.root)
        page = outputs['how-we-decide.html']
        self.assertIn('<section id="sources">\n<h2>How to read the sources</h2>', page)
        self.assertIn('<a href="#sources">Sources</a>', page)
        section = page[page.index('<section id="sources">'):page.index('<section id="rulings">')]
        # The section is cut to the essentials (Jack, 16 November 2026): what a reader needs in order
        # to read an entry's Sources, in four points or fewer and under 150 words.
        for said in ('“Lewis &amp; Short” after a quotation', 'as Lewis &amp; Short’s dictionary cites them',
                     'not been checked against a modern edition', '“Composed”', 'The sentence is ours',
                     '“Traupman 103”', '“M-O s.v. sieve”', 'by printed page', 'by headword',
                     'checked against a text of that author', 'our own collections of quotations',
                     'href="https://github.com/PerseusDL/canonical-latinLit"', 'href="https://github.com/cltk/lat_text_latin_library"'):
            with self.subTest(said=said):
                self.assertIn(said, section)
        self.assertLessEqual(section.count('<li>'), 4)
        words = re.sub(r'<[^>]+>', ' ', section).split()
        self.assertLess(len(words), 150, 'the section is for a reader; what an editor needs goes in docs/records.md')
        # What was cut is kept for the editor, under "Sources are citations" in docs/records.md.
        docs = (ROOT / 'docs/records.md').read_text(encoding='utf-8')
        fuller = docs[docs.index('#### How the sources were read'):docs.index('### How a page shows a record')]
        for kept in ('Leo (1896)', 'Parry (1857)', 'Purser', 'Mayhoff (Teubner, 1906)', 'Clementine Vulgate', 'Hetzenauer',
                     'on 9, 11, and 12 November 2026', "From N onwards that numbering differs from Meyer's", '"Levi–Bini p. 23"',
                     '"Andresian p. 24"', 'digitisation at columbia.edu', 'scan at archive.org', 'saved on 4 November 2026',
                     'post-classical unless Lewis & Short has them', 'supports the word it names'):
            with self.subTest(kept=kept):
                self.assertIn(kept, fuller)
        link = '<p class="how-sources"><a href="../how-we-decide.html#sources">How to read the sources</a></p>'
        self.assertEqual(outputs['c/perhaps.html'].count(link), 1)
        self.assertLess(outputs['c/perhaps.html'].index('<span class="sc">Sources</span>'), outputs['c/perhaps.html'].index(link))
        # A word's page has no sources of its own, and no such line.
        self.assertNotIn('how-sources', outputs['l/fortasse.html'])
        # No entry repeats them.
        gone = re.compile(r'marked “Lewis &amp; Short” are (?:given|copied)|marked “composed” (?:is|are) ours|read in the (?:digitization|scan) at'
                          r'|Quotations? from the Lat[iī]nit[aā]s loci collections?[^<.;]*, (?:as )?checked (?:there )?against the editions? (?:named there|they name)\.<'
                          r'|labelled as ours are composed for family conversation|Dictionary links (?:support|document) the component words'
                          # "Cicero’s letters checked against the Perseus Latin texts (9 November 2026).", a whole line.
                          r'|<p>(?:<span class="sc">Sources</span>)?[A-Z][\w’ ,]* checked against the <a href="[^"]+"[^>]*>'
                          r'(?:Perseus Latin texts|Latin Library texts \(CLTK mirror\))</a>(?: \(\d+ November 2026\))?\.</p>')
        for path, text in outputs.items():
            if path.startswith(('c/', 'l/')) and gone.search(text):
                self.fail(f'{path} still carries a standing note: {gone.search(text).group(0)}')
        # An entry without sources has no "Sources" and no way to the section; its other lines stand.
        record = self.record('perhaps')
        record['sources'] = []
        # The test's own copy is a draft, whatever the editor has read.
        record['review'] = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}
        self.save_record(record)
        page = builder.build_site(self.root)['c/perhaps.html']
        self.assertNotIn('how-sources', page)
        self.assertNotIn('<span class="sc">Sources</span>', page)
        self.assertIn('<footer class="c-sources"><p class="review-state"><a href="../index.html#about">Not yet reviewed</a>.</p>', page)
        self.assertIn('<p class="suggest">', page)
        # Nor has one whose only source is the readers, which the site does not cite.
        record['sources'] = ['<span lang="la">Theodōrus et pater · Ad Larem avītum</span>, Libellī I–VII, as they stood on 7 November 2026.']
        self.save_record(record)
        self.assertNotIn('how-sources', builder.build_site(self.root)['c/perhaps.html'])

    def test_a_record_that_carries_a_standing_note_is_refused(self):
        perseus = '<a href="https://github.com/PerseusDL/canonical-latinLit" rel="noopener noreferrer" target="_blank">Perseus Latin texts</a>'
        graesse = 'J. G. Th. Graesse, <em>Orbis Latinus</em>'
        for source, advice in (
                ('Quotations marked “Lewis &amp; Short” are given as Lewis &amp; Short cites them, in the house spelling; '
                 'they have not been checked against a modern edition.', 'delete the line: Quotations marked'),
                ('The example sentences marked “composed” are ours.', 'delete the line: The example sentences'),
                ('The example sentence marked “composed” is ours.', 'delete the line: The example sentence '),
                ('Quotations from the Latinitas loci collections (loci-cicero-epistulae, loci-plautus), checked against the editions named there.',
                 'delete the line: Quotations from'),
                (f'Cicero’s letters checked against the {perseus} (9 November 2026).', 'delete the line: Cicero’s letters'),
                (f'Cicero, <em>De officiis</em> 1.124, checked against the {perseus}.', r'give only the citation: Cicero, <em>De officiis</em> 1\.124\.$'),
                (graesse + ', edition of F. Benedict (1909), Latin–German, read in the digitization at columbia.edu (cited as Graesse, '
                 '<em>Orbis Latinus</em> s.v.); its forms are post-classical unless Lewis &amp; Short has them.',
                 r'give only the citation: J\. G\. Th\. Graesse, <em>Orbis Latinus</em>, ed\. F\. Benedict \(1909\)\.$'),
                ('<a href="https://logeion.org/fortasse" rel="noopener noreferrer" target="_blank">Lewis &amp; Short: fortasse</a>. '
                 'The example sentence marked “composed” is ours.', r'give only the citation: <a href=[^>]+>Lewis &amp; Short: fortasse</a>$'),
                # In any wording, and with a remark of the record's own joined to it.
                ('The example sentence marked “composed” is ours, after Terence.', 'take it out of the line'),
                (graesse + ' (1861), read in the scan at archive.org, pp. 12–13.', 'take it out of the line')):
            with self.subTest(source=source[:50]):
                record = self.record('perhaps')
                record['sources'] = [source]
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, 'concept perhaps carries a standing note, which is said once, in “How to read the sources” '
                                                        'on src/how-we-decide.html; ' + advice):
                    builder.build_site(self.root)
        # A citation that recurs is not one, nor a sentence that says something of its own record.
        kept = ['John C. Traupman, <em>Conversational Latin for Oral Proficiency</em>, pp. 344, 359.',
                graesse + ', ed. F. Benedict (1909).', 'Cicero, <em>De officiis</em> 1.124.',
                f'Caesar checked against the {perseus}; the quotations keep that edition’s spelling <span lang="la">conloquium</span>.',
                'Lewis &amp; Short cites the Livy passage as Liv. 39.15.']
        for source in kept:
            self.assertEqual(builder.without_standing_notes(source), source)
        record = self.record('perhaps')
        record['sources'] = kept
        self.save_record(record)
        page = builder.build_site(self.root)['c/perhaps.html']
        for source in kept:
            self.assertIn(f'{source}</p>', page)

    def test_a_line_that_belongs_on_the_quotation_is_refused(self):
        # Jack, 16 November 2026: "do the pass: mark the quotation, delete the line". A line under
        # Sources that says a passage is as Lewis & Short quotes it is refused, and the message
        # says where the mark belongs.
        for source in ('Cicero as Lewis &amp; Short quotes him.', 'Passages as Lewis &amp; Short quotes them.',
                       'Plautus as cited by L&amp;S.', 'Cicero (ND 2.143) as quoted in L&amp;S.',
                       'Horace quoted as Lewis &amp; Short cites him (s.v. quilibet: A. P. 9).',
                       'Tacitus from the Latinitas loci collection (loci-tacitus); the other passages as Lewis &amp; Short quotes them.',
                       'Horace and Gellius from the Latinitas loci collections; the other citations from Lewis &amp; Short.',
                       'Erasmus’s Latin is post-classical. Ovid, Suetonius and Cicero as Lewis &amp; Short quotes them.'):
            with self.subTest(source=source[:50]):
                record = self.record('perhaps')
                record['sources'] = [source]
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, 'concept perhaps says that a passage is given as Lewis & Short quotes it. '
                                                        'The mark belongs on the quotation, not under Sources: put “\\(Lewis &amp; Short\\)” '
                                                        'at the end of that example’s source or of that line of the term’s evidence'):
                    builder.build_site(self.root)
        # The mark itself is where it belongs, and a remark on the dictionary is no such line.
        record = self.record('perhaps')
        record['sources'] = ['Lewis &amp; Short cites the Livy passage as Liv. 39.15.',
                             'Lewis &amp; Short has no entry for <span lang="la">chemicum</span>.']
        record['phrases'][0]['source'] = 'Verg. A. 1.203 (Lewis &amp; Short)'
        self.save_record(record)
        builder.build_site(self.root)
        # The records the pass left for the editor are the only ones that still carry such a line.
        left = set()
        for path in sorted((ROOT / 'data/concepts').glob('*.json')):
            if any(builder.AS_LEWIS_AND_SHORT_QUOTES.search(source) for source in json.loads(path.read_text(encoding='utf-8'))['sources']):
                left.add(path.stem)
        self.assertEqual(left, set(builder.LEFT_FOR_THE_EDITOR))

    def test_a_source_that_cites_a_working_note_is_refused(self):
        # Jack, 16 November 2026: "a public entry should not cite a working note: remove them".
        repository = 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae'
        for source in (f'<a href="{repository}/blob/main/notes/smoothie-vocabulary-audit.md">Smoothie vocabulary: source audit and coverage</a>',
                       f'<a href="{repository}/blob/main/docs/records.md">Concept records</a>',
                       f'<a href="{repository}">The lexicon’s repository</a>',
                       '<a href="https://raw.githubusercontent.com/jhwheeler/latinitas/main/src/loci-plautus.md">loci-plautus</a>',
                       '<a href="https://github.com/jhwheeler/latinitas/blob/main/AGENTS.md">The house standards</a>',
                       'Caesar and Cicero (Att. 4.2.4) as quoted in the Latinitas house standards (AGENTS.md §4.1).',
                       'See notes/coinages-2026-11-13.md.'):
            with self.subTest(source=source[:60]):
                record = self.record('perhaps')
                record['sources'] = [source]
                self.save_record(record)
                with self.assertRaisesRegex(ValueError, 'concept perhaps cites a working note of ours; a public entry cites the published '
                                                        'source the note names, once it has been read, or nothing'):
                    builder.build_site(self.root)
        # Another repository, or a text kept at GitHub, is not ours.
        record = self.record('perhaps')
        record['sources'] = ['<a href="https://github.com/PerseusDL/canonical-latinLit/blob/master/README.md">Perseus Latin texts</a>, on the editions.']
        self.save_record(record)
        builder.build_site(self.root)
        for path in sorted((ROOT / 'data/concepts').glob('*.json')):
            for source in json.loads(path.read_text(encoding='utf-8'))['sources']:
                self.assertIsNone(builder.OUR_WORKING_NOTES.search(source), path.name)

    def test_a_coinage_is_not_recommended_beside_an_attested_word(self):
        # Coinages only where needed (Jack, 13 November 2026).
        original = self.record('perhaps')
        self.assertEqual([(t['status'], t['period']) for t in original['terms'][:2]],
                         [('recommended', 'classical'), ('alternative', 'classical')])
        record = copy.deepcopy(original)
        record['terms'][1].update(status='recommended', period='ours')
        self.save_record(record)
        with self.assertRaisesRegex(ValueError, 'concept perhaps recommends our own “forsitan” beside the attested “fortasse”'):
            builder.build_site(self.root)
        # Our own word as an alternative, or as the one answer where no attested word is recommended, is allowed.
        record['terms'][1].update(status='alternative')
        self.save_record(record)
        builder.build_site(self.root)
        record = copy.deepcopy(original)
        record['terms'][0].update(period='ours')
        self.save_record(record)
        self.assertIn('<span class="ours"', builder.build_site(self.root)['c/perhaps.html'])
        # No record of the lexicon breaks the rule.
        for path in sorted((ROOT / 'data/concepts').glob('*.json')):
            terms = json.loads(path.read_text(encoding='utf-8'))['terms']
            periods = {t['period'] == 'ours' for t in terms if t['status'] == 'recommended'}
            self.assertNotEqual(periods, {True, False}, path.name)

    def test_the_site_installs_as_an_app_and_is_kept_on_the_device(self):
        outputs = builder.build_site(self.root)
        manifest = json.loads(outputs['manifest.webmanifest'])
        self.assertEqual((manifest['display'], manifest['start_url'], manifest['scope']), ('standalone', 'index.html', './'))
        for icon in manifest['icons']:
            self.assertIsInstance(outputs[icon['src']], bytes)
        for path, up in (('index.html', ''), ('k/sermo.html', '../'), ('c/perhaps.html', '../'), ('rulings.html', '')):
            with self.subTest(path=path):
                self.assertIn(f'<link rel="manifest" href="{up}manifest.webmanifest">', outputs[path])
                self.assertIn(f'<link rel="apple-touch-icon" href="{up}assets/icons/icon-180.png">', outputs[path])
                self.assertIn('<meta name="apple-mobile-web-app-capable" content="yes">', outputs[path])
        worker = outputs['sw.js']
        self.assertNotIn('{{', worker)
        files = json.loads(re.search(r'const FILES = (\[.*?\]);', worker)[1])
        for path in ('index.html', 'k/sermo.html', 'assets/search-data.js', 'assets/search.js', 'assets/lexicon.css',
                     'assets/fonts/lexicon-serif-400.woff2', 'manifest.webmanifest',
                     'practice.html', 'hora.html', 'assets/practice.js', 'assets/practice-data.js',
                     'chartae.html', 'assets/chartae.js', 'assets/chartae-data.js',
                     *[game['file'] for game in builder.gap_games(self.root)],
                     'review.html', 'assets/review.js'):
            self.assertIn(path, files)
        self.assertTrue(all(path in outputs for path in files))
        self.assertFalse(any(path.startswith(('c/', 'l/')) for path in files))   # saved as they are read
        # Any change to a saved file changes the version, so the browser fetches the files afresh.
        record = self.record('perhaps')
        record['also'] = record.get('also', []) + ['perchance']
        self.save_record(record)
        version = lambda text: re.search(r"const VERSION = '(\w+)'", text)[1]
        self.assertNotEqual(version(worker), version(builder.build_site(self.root)['sw.js']))

    # Review -------------------------------------------------------------------------------

    def test_a_records_revision_names_its_text_and_not_its_review(self):
        record = self.record('perhaps')
        revision = builder.record_revision(record)
        self.assertRegex(revision, r'^[0-9a-f]{8}$')
        # The same whatever the review says, and however the fields are ordered.
        marked = copy.deepcopy(record)
        marked['review'] = {'status': 'reviewed', 'date': '2026-11-15', 'by': 'Jack'}
        self.assertEqual(builder.record_revision(marked), revision)
        self.assertEqual(builder.record_revision(dict(reversed(list(record.items())))), revision)
        # Another as soon as anything else changes: a term, an example, a note.
        for change in (lambda r: r['terms'][0].update(latin='fortassē'), lambda r: r['phrases'][0].update(english='Perhaps so.'),
                       lambda r: r.update(also=r.get('also', []) + ['perchance']), lambda r: r['terms'].reverse()):
            changed = copy.deepcopy(record)
            change(changed)
            self.assertNotEqual(builder.record_revision(changed), revision)

    def test_an_entry_names_the_other_senses_of_its_headword(self):
        """Jack, 16 November 2026, on "charge": "it's as if you only charge batteries. charge can
        mean many things". Each sense is a record of its own, so an entry leads to the others:
        the records with the same headword by their sense, then those that list the headword
        under `also`, by the sense in brackets there or as "see <their headword>"."""
        outputs = builder.build_site(self.root)
        page = outputs['c/charge-battery.html']
        self.assertIn('<p class="senses"><span class="sc">Other senses</span>'
                      '<a href="charge-accusation.html">an accusation</a> <span lang="la">crīmen</span> · '
                      '<a href="attack.html">in battle</a> <span lang="la">adorior</span> · '
                      '<a href="price.html">see price</a> <span lang="la">pretium</span></p>', page)
        # It stands under the headword, before the Latin; and it goes both ways.
        self.assertLess(page.index('class="senses"'), page.index('class="lemma"'))
        self.assertIn('<a href="charge-battery.html">a battery, a phone</a> <span lang="la">repleō</span>', outputs['c/charge-accusation.html'])
        # An entry never names itself, names another entry once, and has no line when it is alone.
        senses = builder.other_senses(builder.load_site(self.root))
        for key, found in senses.items():
            others = [other for other, _ in found]
            self.assertNotIn(key, others, key)
            self.assertEqual(len(others), len(set(others)), key)
        self.assertNotIn('perhaps', senses)
        self.assertNotIn('class="senses"', outputs['c/perhaps.html'])

    def test_the_site_carries_the_revision_and_shows_what_is_reviewed(self):
        # The test counts from nought: the entries the editor has reviewed are drafts again here.
        for path in (self.root / 'data/concepts').glob('*.json'):
            text = path.read_text(encoding='utf-8')
            if '"reviewed"' in text:
                record = json.loads(text)
                record['review'] = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}
                self.save_record(record, path.stem)
        outputs = builder.build_site(self.root)
        revision = builder.record_revision(self.record('perhaps'))
        self.assertIn(f'<article class="concept" data-record data-rev="{revision}" data-status="draft">', outputs['c/perhaps.html'])
        self.assertIn('<script src="../assets/review.js" defer></script>', outputs['c/perhaps.html'])
        # A draft says so in three words that lead to About, where the editor says what that means; it gives no date.
        self.assertIn('<p class="review-state"><a href="../index.html#about">Not yet reviewed</a>.</p>', outputs['c/perhaps.html'])
        self.assertNotIn('Draft of ', outputs['c/perhaps.html'])
        # Without scripts the way to GitHub stands where the flag will be.
        self.assertIn('<p class="suggest"><a href="https://github.com/', outputs['c/perhaps.html'])
        self.assertNotIn('review.js', outputs['l/fortasse.html'])
        card = next(card for card in self.practice(outputs)['cards'] if card['i'] == 'perhaps')
        self.assertEqual(card['h'], revision)
        self.assertNotIn('d', card)
        self.assertIn(' · 0 reviewed by the editor; the rest are drafts and await <a href="review.html">review</a></p>', outputs['index.html'])
        self.assertNotIn(' class="rv"', outputs['k/sermo.html'])
        # The review page: on the device, in the sitemap, linked from every footer.
        review = outputs['review.html']
        self.assertIn('<script src="assets/practice-data.js" defer></script>\n<script src="assets/review.js" defer></script>', review)
        self.assertIn(f'Reviewed by the editor: 0; drafts: {len(self.practice(outputs)["cards"]):,}.', review)
        # The site keeps only the flag: the page has no reviewer's switch and no queue of drafts
        # (the editor reviews in a private page of his own).
        for gone in ('r-editor', 'r-switch', 'role="switch"', 'I am the reviewer', 'r-queue', 'r-start', 'r-more', 'What to review next'):
            self.assertNotIn(gone, review)
        script = outputs['assets/review.js']
        for gone in ('Looks right', 'Recēnsor', 'I am the reviewer', 'verdict-ok', 'isEditor', 'lexicon-review-queue',
                     'lexicon-review-skipped', 'review=1', 'Praeterī', 'Proxima'):
            self.assertNotIn(gone, script)
        self.assertNotIn('review=1', outputs['assets/practice.js'])
        self.assertIn('cotidianae/review.html</loc>', outputs['sitemap.xml'])
        for path, up in (('index.html', ''), ('c/perhaps.html', '../'), ('review.html', '')):
            page = outputs[path]
            for link in (f'<a href="{up}practice.html">Practice</a>', f'<a href="{up}review.html">Review</a>'):
                self.assertIn(link, page[page.rindex('<footer'):])
            self.assertNotIn('review.html', page[page.index('<header class="site-top'):page.index('</header>')])
        self.assertIn('<script src="assets/review.js" defer></script>\n<script src="assets/practice.js" defer></script>', outputs['practice.html'])
        # Marked reviewed (as scripts/apply_review.py marks it), the record says so everywhere, under the same revision.
        record = self.record('perhaps')
        record['review'] = {'status': 'reviewed', 'date': '2026-11-15', 'by': 'Jack'}
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn(f'data-rev="{revision}" data-status="reviewed">', outputs['c/perhaps.html'])
        self.assertIn('<p class="review-state">Reviewed 15 November 2026.</p>', outputs['c/perhaps.html'])
        card = next(card for card in self.practice(outputs)['cards'] if card['i'] == 'perhaps')
        self.assertEqual((card['h'], card['d']), (revision, 1))
        self.assertIn(' · 1 reviewed by the editor; ', outputs['index.html'])
        self.assertIn('<li data-kind="word" class="rv"><a href="../c/perhaps.html">', outputs['k/sermo.html'])
        self.assertEqual(outputs['words.html'].count(' class="rv"'), 1)
        self.assertIn('Reviewed by the editor: 1; drafts: ', outputs['review.html'])
        # The reviewer's name stays in the record and is printed nowhere on the site.
        record['review']['by'] = 'Xenophilus Recensor'
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn('<p class="review-state">Reviewed 15 November 2026.</p>', outputs['c/perhaps.html'])
        for path, output in outputs.items():
            if isinstance(output, str):
                self.assertNotIn('Xenophilus', output, path)

    # Practice ----------------------------------------------------------------------------

    def test_the_picture_cards_have_their_pictures_their_credits_and_the_spacing_of_the_practice(self):
        """chartae.html (Jack, 20 November 2026): picture cards, Chartae pictae, each with its
        Latin name, a sentence, and the photographer's credit, an animal's with what it eats, spaced
        as the vocabulary practice spaces its cards (Jack, the same day: "do we not have a way of
        repeating in our other game already?")."""
        outputs = builder.build_site(self.root)
        script = outputs['assets/chartae-data.js']
        self.assertTrue(script.endswith(';\n') and 'window.lexiconChartae = ' in script)
        data = json.loads(script[script.index('{'):script.rindex('}') + 1])
        source = self.read('data/chartae.json')
        self.assertEqual([card['id'] for card in data['cards']], [card['id'] for card in source['cards']])
        self.assertEqual([group['id'] for group in data['groups']], [group['id'] for group in source['groups']])
        self.assertEqual([(group['id'], group['subject']) for group in data['groups']], [(group['id'], group['subject']) for group in source['groups']])
        self.assertEqual([subject['id'] for subject in data['subjects']][:4], ['animalia', 'plantae', 'corpus', 'cibi'])
        subject_of = {group['id']: group['subject'] for group in data['groups']}
        of = {key: sum(subject_of[card['group']] == key for card in data['cards']) for key in ('animalia', 'plantae', 'corpus', 'cibi')}
        # The description is made from the data, for every subject with cards, with the serial comma.
        self.assertIn(f'content="{len(data["cards"])} picture cards of animals, plants, the body, and food and drink '
                      f'({of["animalia"]} of animals, {of["plantae"]} of plants, {of["corpus"]} of the body, '
                      f'and {of["cibi"]} of food and drink) with their Latin names',
                      outputs['chartae.html'])
        self.assertEqual(builder.english_series(['a']), 'a')
        self.assertEqual(builder.english_series(['a', 'b']), 'a and b')
        self.assertEqual(builder.english_series(['a', 'b', 'c']), 'a, b, and c')
        self.assertIn('<title>Picture cards · ', outputs['chartae.html'])
        linked = 0
        for card in data['cards']:
            with self.subTest(card=card['id']):
                self.assertEqual(card['picture'], f'chartae/{card["id"]}.jpg')
                self.assertEqual(outputs[card['picture']][:3], b'\xff\xd8\xff')   # a JPEG
                self.assertTrue(card['latin'].startswith(card['latin'].split(',')[0]) and ',' in card['latin'])
                if 'record' in card:
                    linked += 1
                    self.assertIn(f'c/{card["record"]}.html', outputs)
                # Every picture is one that anyone may reuse, and says whose it is.
                image = card['image']
                self.assertIn(image['licence'], builder.PICTURE_LICENCES)
                self.assertEqual(image['licence_url'], builder.PICTURE_LICENCES[image['licence']])
                self.assertTrue(image['author'] and image['page'].startswith('https://commons.wikimedia.org/wiki/File:'))
        self.assertGreater(linked, len(data['cards']) * .9)
        # The pictures are the cards' and no others, and none is saved when the lexicon installs.
        self.assertEqual(sorted(path for path in outputs if path.startswith('chartae/')), sorted(card['picture'] for card in data['cards']))
        files = json.loads(re.search(r'const FILES = (\[.*?\]);', outputs['sw.js'])[1])
        self.assertFalse(any(path.startswith('chartae/') for path in files))
        # A sentence taken from the readers is shown as one of ours, and the readers are not named.
        readers = [card['id'] for card in source['cards'] if builder.composed({'source': card['source']})]
        self.assertTrue(readers)
        shown = {card['id']: card for card in data['cards']}
        self.assertTrue(all(shown[key]['source'] == '' for key in readers))
        self.assertTrue(all(shown[card['id']]['source'] == card['source'] for card in source['cards'] if card['id'] not in readers))
        for path in ('chartae.html', 'assets/chartae-data.js', 'assets/chartae.js'):
            self.assertNotRegex(outputs[path], r'Libellus|Theodōrus et pater|libell[īi]', path)
        # The spacing is the vocabulary practice's own: the same constants and the same functions.
        practice, game = outputs['assets/practice.js'], outputs['assets/chartae.js']
        for start in ('  const ROUND = ', '  const ROUND_DUE_MORE = ', '  const AGAIN_WAIT = ', '  const WAIT_DAYS = '):
            line = next(line for line in practice.splitlines() if line.startswith(start))
            self.assertIn(line + '\n', game, start)
        for name in ('dayStart', 'dueFrom', 'boxAfter'):
            body = re.search(r'^  function %s\(.*?^  \}\n' % name, practice, re.S | re.M)[0]
            self.assertIn(body, game, name)
        self.assertIn("progress: 'lexicon-chartae'", game)
        self.assertIn("lang: 'lexicon-practice-lang'", game)
        # The page: the site's header and footer, the two marks of the practice, and the ways to and from it.
        page = outputs['chartae.html']
        self.assertEqual(re.findall(r'<script src="([^"]+)"', page), ['assets/lexicon.js', 'assets/chartae-data.js', 'assets/chartae.js'])
        self.assertIn('<a href="how-practice-works.html" hreflang="en" data-t="how">How the practice works</a>', page)
        self.assertLess(page.index('class="pbtn pbtn-again" id="g-again"'), page.index('class="pbtn pbtn-got" id="g-got"'))
        self.assertIn('<a href="practice.html" data-t="vocabulary">Vocabulary</a>', page)
        self.assertIn('<a href="chartae.html">', outputs['practice.html'])
        # The builder refuses a card whose entry, licence or picture is not what it says.
        cards = self.read('data/chartae.json')
        broken = json.loads(json.dumps(cards)); broken['cards'][0]['record'] = 'no-such-record'
        self.write('data/chartae.json', broken)
        with self.assertRaisesRegex(ValueError, 'no record no-such-record'):
            builder.build_site(self.root)
        broken = json.loads(json.dumps(cards)); broken['cards'][0]['image']['licence'] = 'CC BY-NC 4.0'
        self.write('data/chartae.json', broken)
        with self.assertRaisesRegex(ValueError, 'the licence CC BY-NC 4.0 is not one of'):
            builder.build_site(self.root)
        self.write('data/chartae.json', cards)
        (self.root / 'src/chartae/stray.jpg').write_bytes(b'x')
        with self.assertRaisesRegex(ValueError, 'files that no card uses'):
            builder.build_site(self.root)
        (self.root / 'src/chartae/stray.jpg').unlink()
        (self.root / f'src/chartae/{cards["cards"][0]["id"]}.jpg').unlink()
        with self.assertRaisesRegex(ValueError, 'is missing'):
            builder.build_site(self.root)

    def test_every_picture_card_carries_the_preview_of_its_own_picture(self):
        """Jack, 21 November 2026, on 4G, of a card shown with its picture's place empty: "Saepe sīc
        fit"; and "Cōnsilium habeō: imāginēs in indice ipsō inclūdere possumus". Every card carries a
        small preview of its picture in the card data, made from the picture as it is now (its JPEG
        comment names the picture by a hash); the builder refuses a card whose preview is missing or
        was made from another picture, and a preview that no card uses."""
        import base64
        outputs = builder.build_site(self.root)
        script = outputs['assets/chartae-data.js']
        data = json.loads(script[script.index('{'):script.rindex('}') + 1])
        for card in data['cards']:
            with self.subTest(card=card['id']):
                preview = base64.b64decode(card['preview'], validate=True)
                self.assertEqual(preview, (self.root / builder.PREVIEWS / f'{card["id"]}.jpg').read_bytes())
                self.assertEqual(preview[:3], b'\xff\xd8\xff')
                self.assertLessEqual(len(preview), builder.PREVIEW_MOST)
                self.assertEqual(builder.jpeg_comment(preview), builder.preview_mark(outputs[card['picture']]))
                # Its size, from the frame header (SOF0 or SOF2): 102 high and 144 wide.
                at = re.search(rb'\xff[\xc0\xc2]', preview).start()
                self.assertEqual((int.from_bytes(preview[at + 7:at + 9], 'big'), int.from_bytes(preview[at + 5:at + 7], 'big')), builder.PREVIEW_SIZE)
        # The previews are not pictures of the site: they are in the card data, which the worker saves when it installs.
        self.assertFalse(any('chartae-previews' in path for path in outputs))
        files = json.loads(re.search(r'const FILES = (\[.*?\]);', outputs['sw.js'])[1])
        self.assertIn('assets/chartae-data.js', files)
        first = data['cards'][0]['id']
        preview = self.root / builder.PREVIEWS / f'{first}.jpg'
        kept = preview.read_bytes()
        # A preview made from another picture (the picture was fetched again, the preview not) is refused.
        preview.write_bytes((self.root / builder.PREVIEWS / f'{data["cards"][1]["id"]}.jpg').read_bytes())
        with self.assertRaisesRegex(ValueError, f'its preview data/chartae-previews/{first}.jpg was not made from the picture'):
            builder.build_site(self.root)
        # So is a picture changed under its preview.
        preview.write_bytes(kept)
        picture = self.root / f'src/chartae/{first}.jpg'
        picture.write_bytes(picture.read_bytes() + b'\0')
        with self.assertRaisesRegex(ValueError, 'was not made from the picture .* --previews'):
            builder.build_site(self.root)
        # A missing preview is refused, and says how to make it.
        preview.unlink()
        with self.assertRaisesRegex(ValueError, f'its preview data/chartae-previews/{first}.jpg is missing \\(run python3 scripts/fetch_picture.py --previews\\)'):
            builder.build_site(self.root)
        # A preview that no card uses is refused.
        preview.write_bytes(kept)
        (self.root / f'src/chartae/{first}.jpg').write_bytes(outputs[f'chartae/{first}.jpg'])
        (self.root / builder.PREVIEWS / 'stray.jpg').write_bytes(kept)
        with self.assertRaisesRegex(ValueError, 'chartae-previews has files that no card uses'):
            builder.build_site(self.root)

    def test_a_previews_jpeg_comment_is_read_from_the_segments_before_the_image(self):
        """The preview check reads the JPEG's comment without Pillow (the build has none)."""
        segment = lambda marker, body: b'\xff' + marker + (len(body) + 2).to_bytes(2, 'big') + body
        jpeg = b'\xff\xd8' + segment(b'\xe0', b'JFIF\0\1\1') + segment(b'\xfe', b'lexicon-preview of sha256:ab') + b'\xff\xda' + b'\0' * 8
        self.assertEqual(builder.jpeg_comment(jpeg), 'lexicon-preview of sha256:ab')
        self.assertEqual(builder.jpeg_comment(b'\xff\xd8' + segment(b'\xe0', b'JFIF') + b'\xff\xda\xff\xfe\0\4ab'), '')
        self.assertEqual(builder.jpeg_comment(b'GIF89a'), '')
        self.assertEqual(builder.preview_mark(b'x'), 'lexicon-preview of sha256:' + hashlib.sha256(b'x').hexdigest())

    def test_the_picture_cards_have_subjects_and_kinds_and_food_only_for_animals(self):
        """The picture cards are one game for every subject (Jack, 20 November 2026): each kind
        belongs to a subject; an animal's card says what it eats (food), a plant's may say what it
        bears (bears), and neither goes on a card of the other; a kind may wait for its cards."""
        cards = self.read('data/chartae.json')
        animal = next(card for card in cards['cards'] if card['group'] == 'villa')
        plant_kind = next(group['id'] for group in cards['groups'] if group['subject'] == 'plantae')

        def plant(**extra):
            data = json.loads(json.dumps(cards))
            card = {key: value for key, value in animal.items() if key not in ('food', 'record')}
            card.update(id='planta-probata', group=plant_kind, **extra)
            data['cards'].append(card)
            return data
        shutil.copy(self.root / f'src/chartae/{animal["id"]}.jpg', self.root / 'src/chartae/planta-probata.jpg')
        shutil.copy(self.root / builder.PREVIEWS / f'{animal["id"]}.jpg', self.root / builder.PREVIEWS / 'planta-probata.jpg')
        # A plant's card with what it bears, and an empty kind, are taken; the data says both.
        data = plant(bears='Glandēs.')
        data['groups'].append({'id': 'vacua', 'subject': 'plantae', 'latin': 'Vacua', 'english': 'Empty'})
        self.write('data/chartae.json', data)
        outputs = builder.build_site(self.root)
        script = outputs['assets/chartae-data.js']
        built = json.loads(script[script.index('{'):script.rindex('}') + 1])
        shown = {card['id']: card for card in built['cards']}
        self.assertEqual(shown['planta-probata']['bears'], 'Glandēs.')
        self.assertNotIn('food', shown['planta-probata'])
        self.assertIn({'id': 'vacua', 'subject': 'plantae', 'latin': 'Vacua', 'english': 'Empty'}, built['groups'])
        self.assertTrue(all(card['group'] != 'vacua' for card in built['cards']))
        # A plant's card without bears is taken too.
        self.write('data/chartae.json', plant())
        builder.build_site(self.root)
        # What is refused: food on a plant, bears on an animal, an animal without food, an unknown subject.
        self.write('data/chartae.json', plant(food='Aquā.'))
        with self.assertRaisesRegex(ValueError, 'food \\(what an animal eats\\) is only for a card of an animal'):
            builder.build_site(self.root)
        data = plant(); data['cards'][0]['bears'] = 'Ossa.'
        self.write('data/chartae.json', data)
        with self.assertRaisesRegex(ValueError, 'bears \\(what a plant bears\\) is only for a card of a plant'):
            builder.build_site(self.root)
        data = plant(); del data['cards'][0]['food']
        self.write('data/chartae.json', data)
        with self.assertRaisesRegex(ValueError, 'a card of an animal needs food'):
            builder.build_site(self.root)
        data = plant(); data['groups'][0]['subject'] = 'instrumenta'
        self.write('data/chartae.json', data)
        with self.assertRaisesRegex(ValueError, 'has an unknown subject instrumenta'):
            builder.build_site(self.root)
        # An id is one across every subject: it names the picture and the card's progress.
        data = plant(); data['cards'][-1]['id'] = animal['id']
        self.write('data/chartae.json', data)
        with self.assertRaisesRegex(ValueError, 'bad or repeated id'):
            builder.build_site(self.root)

    def test_the_picture_cards_carry_scientific_names_written_as_nomenclature_writes_them(self):
        """A card of an animal or a plant may give its scientific name after the English one (Jack,
        20 November 2026: "Hōc modō discēmus discrīmina"), written as zoology and botany write it:
        a capital on the first word only, and no macrons or other marks. A card without one is taken."""
        cards = self.read('data/chartae.json')
        named = [card for card in cards['cards'] if 'scientific' in card]
        self.assertTrue(named and any('scientific' not in card for card in cards['cards']))
        outputs = builder.build_site(self.root)
        script = outputs['assets/chartae-data.js']
        built = {card['id']: card for card in json.loads(script[script.index('{'):script.rindex('}') + 1])['cards']}
        for card in cards['cards']:
            self.assertEqual(built[card['id']].get('scientific'), card.get('scientific'), card['id'])
        # In the data the field stands right after the English name.
        first = named[0]
        self.assertEqual(list(first)[list(first).index('english') + 1], 'scientific')

        def with_name(name):
            data = json.loads(json.dumps(cards))
            data['cards'][0]['scientific'] = name
            self.write('data/chartae.json', data)
        # The anatomists' terms (Terminologia Anatomica) are written the same way: Hepar, Vesica urinaria.
        for name in ('Quercus ilex', 'Platanus × hispanica', 'Capsella bursa-pastoris', 'Brassica oleracea subsp. capitata', 'Hepar', 'Vesica urinaria'):
            with_name(name)
            builder.build_site(self.root)
        with_name('Canis lūpus')
        with self.assertRaisesRegex(ValueError, 'scientific name “Canis lūpus” has ū: it is written as zoology, botany, and anatomy write it'):
            builder.build_site(self.root)
        with_name('canis lupus')
        with self.assertRaisesRegex(ValueError, 'must begin with a capital letter'):
            builder.build_site(self.root)
        with_name('Canis Lupus')
        with self.assertRaisesRegex(ValueError, 'only the first word has a capital'):
            builder.build_site(self.root)
        with_name('Canis  lupus')
        with self.assertRaisesRegex(ValueError, 'has stray spaces'):
            builder.build_site(self.root)
        with_name(' Canis lupus')
        with self.assertRaisesRegex(ValueError, 'has stray spaces'):
            builder.build_site(self.root)

    def test_a_picture_card_may_carry_a_second_latin_word(self):
        """Where two Latin words mean the same thing (Jack, 20 November 2026: coma and capillus), one
        card has the second on its back: also, a full dictionary form, on a card of any subject,
        validated as the first word is, and carried into the page's data right after it."""
        cards = self.read('data/chartae.json')
        self.assertEqual(next(card for card in cards['cards'] if card['id'] == 'capillus')['also'], 'coma, comae f.')
        outputs = builder.build_site(self.root)
        script = outputs['assets/chartae-data.js']
        built = {card['id']: card for card in json.loads(script[script.index('{'):script.rindex('}') + 1])['cards']}
        for card in cards['cards']:
            self.assertEqual(built[card['id']].get('also'), card.get('also'), card['id'])
        self.assertEqual(list(built['capillus'])[:3], ['id', 'latin', 'also'])
        # On an animal's card too, and refused when it is empty or has stray spaces.
        data = json.loads(json.dumps(cards))
        data['cards'][0]['also'] = 'catulus, catulī m.'
        self.write('data/chartae.json', data)
        builder.build_site(self.root)
        for bad in ('', ' coma, comae f.', 'coma, comae f. '):
            data['cards'][0]['also'] = bad
            self.write('data/chartae.json', data)
            with self.subTest(also=bad), self.assertRaisesRegex(ValueError, 'also is empty or has stray spaces|Expected nonempty text'):
                builder.build_site(self.root)

    def test_the_body_is_a_third_subject_that_takes_neither_food_nor_bears(self):
        """The body came in as a third subject (Jack, 20 November 2026): its cards take neither what
        an animal eats nor what a plant bears; the animals still must have food, and only plants bear."""
        cards = self.read('data/chartae.json')
        self.assertIn({'id': 'corpus', 'latin': 'Corpus', 'english': 'The body'}, cards['subjects'])
        self.assertEqual([group['id'] for group in cards['groups'] if group['subject'] == 'corpus'], ['caput', 'truncus', 'bracchium', 'crus', 'intus'])
        body = [card for card in cards['cards'] if card['group'] in ('caput', 'truncus', 'bracchium', 'crus', 'intus')]
        self.assertTrue(body and all('food' not in card and 'bears' not in card for card in body))
        builder.build_site(self.root)
        index = cards['cards'].index(body[0])
        for name, value, message in (('food', 'Carne.', 'food \\(what an animal eats\\) is only for a card of an animal'),
                                     ('bears', 'Glandēs.', 'bears \\(what a plant bears\\) is only for a card of a plant')):
            data = json.loads(json.dumps(cards))
            data['cards'][index][name] = value
            self.write('data/chartae.json', data)
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, message):
                builder.build_site(self.root)
        # A kind may share its id with a card (the kind caput and the card caput): the two are kept apart.
        self.assertTrue({group['id'] for group in cards['groups']} & {card['id'] for card in cards['cards']})

    def test_food_and_drink_is_a_fourth_subject_without_scientific_names(self):
        """Food and drink came in as a fourth subject (Jack, 21 November 2026: "Postquam chartās
        partium corporum perfēceris, perge quaesō: 1. Cibī 2. Rēs familiārēs domesticaeque"): its
        cards take neither food nor bears, and carry no scientific name, since a dish is not a taxon."""
        cards = self.read('data/chartae.json')
        self.assertIn({'id': 'cibi', 'latin': 'Cibī', 'english': 'Food and drink'}, cards['subjects'])
        kinds = ['panes', 'fercula', 'lactea', 'carnes', 'condimenta', 'potiones']
        self.assertEqual([group['id'] for group in cards['groups'] if group['subject'] == 'cibi'], kinds)
        food = [card for card in cards['cards'] if card['group'] in kinds]
        self.assertTrue(food and all('food' not in card and 'bears' not in card and 'scientific' not in card for card in food))
        builder.build_site(self.root)
        index = cards['cards'].index(food[0])
        for name, value, message in (('food', 'Carne.', 'food \\(what an animal eats\\) is only for a card of an animal'),
                                     ('bears', 'Glandēs.', 'bears \\(what a plant bears\\) is only for a card of a plant')):
            data = json.loads(json.dumps(cards))
            data['cards'][index][name] = value
            self.write('data/chartae.json', data)
            with self.subTest(name=name), self.assertRaisesRegex(ValueError, message):
                builder.build_site(self.root)

    def test_practice_cards_are_one_per_record_with_kind_and_sources(self):
        sense = self.record('sheet-of-paper')
        outputs = builder.build_site(self.root)
        data = self.practice(outputs)
        cards = {card['i']: card for card in data['cards']}
        self.assertEqual(len(cards), len(list((self.root / 'data/concepts').glob('*.json'))))
        # A card: the English cue, the part of speech, the recommended Latin in its dictionary form, the category.
        pot = cards['cooking-pot']
        self.assertEqual((pot['e'], pot['p'], pot['l'], pot['k']), ('cooking pot', 'noun', 'caccabus (cacabus), caccabī m.', 'culina'))
        self.assertNotIn('t', pot)                         # a word
        self.assertNotIn('g', pot)                         # no gloss beyond the headword
        self.assertEqual(cards['perhaps']['g'], 'maybe, perhaps')
        self.assertEqual(cards['sheet-of-paper']['e'], f'{sense["english"]} ({sense["sense"]})')
        self.assertEqual(cards['soap']['x'], self.record('soap')['also_under'])
        # Kinds: a phrase is an everyday phrase unless it is a saying.
        for key, kind in (('how-are-you', 'p'), ('see-you-tomorrow', 'p'), ('its-too-early', 'p'), ('go-to-the-devil', 'p'),
                          ('practice-makes-perfect', 's'), ('the-bigger-they-come', 's'), ('a-great-man-can-come-from-a-hovel', 's'),
                          ('who-will-guard-the-guards', 's')):
            with self.subTest(key=key):
                self.assertEqual(cards[key].get('t'), kind)
        # Where the answer comes from: its period (none for classical) and the first places it is cited from.
        self.assertEqual(data['periods'], list(builder.PERIODS))
        hovel = cards['a-great-man-can-come-from-a-hovel']
        self.assertEqual((hovel.get('r'), hovel['v']), (None, ['Sen. Ep. 66.3']))
        train = cards['train']
        self.assertEqual((data['periods'][train['r']], train['v']), ('modern', ['M-O s.v. train', 'Traupman 211, 219, 397']))
        dough = cards['play-dough']
        self.assertEqual(data['periods'][dough['r']], 'ours')
        self.assertNotIn('v', dough)                       # our own word: nothing to cite
        # The record's other words, heads only, those to avoid left out, three at most.
        record = self.record('perhaps')
        others = [builder.term_head(t['latin']) for t in builder.ordered_terms(record)[1:] if t['status'] != 'avoid']
        self.assertEqual(cards['perhaps']['a'], others[:3])
        self.assertTrue(all(len(card.get('a', [])) <= 3 for card in data['cards']))
        self.assertNotIn('a', cards['bone'])
        # An example is on a card only if it contains the card's answer, in any of its forms.
        self.assertEqual([example[0] for example in cards['perhaps']['q']], ['Fortasse.', 'Fortasse pluet; paenulam indue.'])
        self.assertNotIn('q', cards['concern'])            # cūra: its record's examples are of its other words
        self.assertNotIn('q', cards['pile'])               # cumulus: "acervus terrae" is not it
        self.assertEqual([example[0] for example in cards['debug']['q']], ['mendum ēmendāre'])
        self.assertRegex(cards['pyjamas']['q'][0][0], 'veste nocturnā')
        self.assertTrue(all(len(card.get('q', [])) <= 2 for card in data['cards']))
        # Sources: the author, and the work under the author; only those with enough cards are offered.
        names = [source['id'] for source in data['sources']]
        for key in ('cicero', 'vergil', 'vergil-aeneid', 'plautus', 'traupman', 'pliny-elder', 'pliny-younger'):
            self.assertIn(key, names)
        aeneid = data['sources'][names.index('vergil-aeneid')]
        self.assertEqual((aeneid['name'], aeneid['of']), ('Aeneid', names.index('vergil')))
        self.assertTrue(all(source['n'] >= builder.PRACTICE_SOURCE_MIN for source in data['sources']))
        counted = sum(1 for card in data['cards'] if names.index('vergil') in card.get('s', []))
        self.assertEqual(counted, data['sources'][names.index('vergil')]['n'])
        tags = {names[n] for n in cards['perhaps']['s']}
        self.assertLessEqual({'vergil', 'vergil-aeneid', 'cicero', 'traupman'}, tags)
        quoted = next(example for example in cards['double-verb']['q'] if example[2].startswith('Verg. E.'))
        self.assertEqual({names[n] for n in quoted[3]}, {'vergil', 'vergil-eclogues'})
        self.assertEqual([category[0] for category in data['categories']], [key for key in self.read('data/catalog.json')['filters'] if key != 'all'])
        # The pages: reached from the footer of every page and from the front page, never from the header.
        self.assertIn('<a href="practice.html"><span class="toc-la">Vocabulary</span>', outputs['index.html'])
        self.assertIn('<a href="hora.html"><span class="toc-la" lang="la">Hōra cum ūnciā</span>', outputs['index.html'])
        # The gap games are one item of the front page's list, «Lacūnae», with every game's name as a link
        # (the coordinating session's choice, 20 November 2026), and a line of their own on the practice page.
        self.assertIn('<li class="plist-group"><p class="plist-head"><span class="toc-la" lang="la">Lacūnae</span>', outputs['index.html'])
        for game in builder.gap_games(self.root):
            self.assertIn(f'<a href="{game["file"]}" lang="la">{game["name"]}</a>', outputs['index.html'])
            self.assertIn(f'<a href="{game["file"]}" lang="la">{game["name"]}</a>', outputs['practice.html'])
        for path, up in (('index.html', ''), ('c/perhaps.html', '../'), ('k/sermo.html', '../'), ('practice.html', '')):
            with self.subTest(path=path):
                page = outputs[path]
                self.assertIn(f'<a href="{up}practice.html">Practice</a>', page[page.rindex('<footer'):])
                self.assertNotIn('practice.html', page[page.index('<header class="site-top'):page.index('</header>')])
        self.assertIn('<a href="chartae.html"><span class="toc-la" lang="la">Chartae pictae</span>', outputs['index.html'])
        gap_games = [game['file'] for game in builder.gap_games(self.root)]
        self.assertEqual(gap_games[:2], ['theodorus.html', 'quis-pulsat.html'])
        for path in ('practice.html', 'hora.html', 'chartae.html', *gap_games):
            self.assertIn(f'cotidianae/{path}</loc>', outputs['sitemap.xml'])
            self.assertIn('<link rel="manifest" href="manifest.webmanifest">', outputs[path])
        # The games that stand by themselves (the clock, and the gap games: Ubi est Theodōrus? and Quis
        # pulsat? since 20 November 2026) are held to the same rules.
        styles = (self.root / 'src/styles.css').read_text(encoding='utf-8')
        names = ('paper', 'ink', 'soft', 'muted', 'hair', 'rule', 'rubric', 'accent', 'mark', 'ground', 'card')

        def palette(text, selector):
            block = text[text.index(selector):]
            return dict(re.findall(r'--([a-z-]+):(#[0-9a-f]{6})', block[:block.index('}')]))
        for game in ('hora.html', *gap_games):
            with self.subTest(game=game):
                hora = outputs[game]
                # The game asks nothing of other sites: its only address is its own.
                self.assertEqual(re.findall(r'https?://[^"\s)]+', hora), [builder.SITE_URL + game])
                self.assertIn('url(assets/fonts/lexicon-serif-400.woff2)', hora)
                self.assertNotIn('claude:', hora)
                self.assertIn("navigator.serviceWorker.register('sw.js')", hora)
                # Its colours are the lexicon's (Jack, 15 November 2026): the stylesheet's names and values,
                # copied into the page, with lapis beside them; its theme is set as on every page, and the
                # browser's bar takes the ground's colour. Nothing of its old palette is left.
                for selector in (':root {', ':root[data-theme="dark"] {'):
                    with self.subTest(selector=selector):
                        ours, theirs = palette(hora, selector.replace(' {', '{')), palette(styles, selector)
                        self.assertEqual({name: ours.get(name) for name in names}, {name: theirs[name] for name in names})
                        self.assertEqual(set(ours) - set(names), {'lapis', 'lapis-soft'})
                self.assertIn(builder.THEME_INIT, hora)
                self.assertIn('<html lang="la" data-theme="light">', hora)
                self.assertEqual(re.findall(r'<meta name="theme-color"[^>]*>', hora), ['<meta name="theme-color" content="#f2f0eb">'])
                dark_ground = palette(styles, ':root[data-theme="dark"] {')['ground']
                self.assertIn(f"content = '{dark_ground}'", hora)
                self.assertNotIn('prefers-color-scheme', hora)
                for name in ('--bg', '--surface', '--sunk', '--line', '--bronze', '--verdigris', '--good', '--bad', '--warn'):
                    self.assertNotIn(name + ':', hora)
                    self.assertNotIn(f'var({name})', hora)
                # Its faces are the lexicon's too (Jack, 16 November 2026): the stylesheet's two stacks under
                # the stylesheet's names, each face declared from the site's own files, and no monospace.
                for name in ('serif', 'sans'):
                    with self.subTest(face=name):
                        stack = re.search(rf'--{name}:([^;]+);', styles).group(1)
                        self.assertIn(f'--{name}:{stack};', hora)
                for file in ('alegreya-sans-400.woff2', 'alegreya-sans-500.woff2'):
                    self.assertIn(f'url(assets/fonts/{file})', hora)
                    self.assertTrue((self.root / 'src/fonts' / file).is_file())
                hora_styles = re.sub(r'/\*.*?\*/', '', hora[hora.index('<style>'):hora.index('</style>')], flags=re.S)
                self.assertNotIn('mono', hora_styles)
                self.assertEqual(set(re.findall(r'var\(--(serif|sans|mono)\)', hora_styles)), {'serif', 'sans'})

    def test_the_gap_games_are_one_engine_with_a_file_per_game(self):
        """The gap games (20 November 2026): one engine, src/lacunae.html, and one data file per game in
        src/lacunae/; the builder writes a page for each and refuses a malformed file."""
        outputs = builder.build_site(self.root)
        games = builder.gap_games(self.root)
        self.assertEqual([(g['id'], g['file'], g['prefix']) for g in games],
                         [('theodorus', 'theodorus.html', 'uet-'), ('quis-pulsat', 'quis-pulsat.html', 'qp-'),
                          ('hic-an-ille', 'hic-an-ille.html', 'hi-'), ('bis-bina', 'bis-bina.html', 'bb-'),
                          ('heri-hodie-cras', 'heri-hodie-cras.html', 'hc-')])
        self.assertEqual([[r['id'] for r in g['rounds']] for g in games[2:]],
                         [['nom', 'acc', 'gen', 'dat', 'abl', 'plur', 'plur2'], ['quot', 'quotus', 'quoteni', 'quotiens', 'bis-bina'],
                          ['ambulo', 'video', 'lego', 'venio', 'sum', 'eo', 'volo', 'fero']])
        self.assertEqual([sum(''.join(r['text']).count('{') for r in g['rounds']) for g in games], [46, 50, 64, 64, 83])
        self.assertEqual([g['hints']['la'] for g in games], ['Prōnōmina ostendere'] * 3 + ['Numerōs ostendere', 'Persōnās et tempora ostendere'])
        # The verbs have a table each, shown only with its round.
        self.assertEqual([t.get('round') for t in games[4]['tabulae']], [r['id'] for r in games[4]['rounds']])
        self.assertEqual([r['id'] for r in games[0]['rounds']], ['ubi', 'quo', 'unde', 'qua', 'iter'])
        self.assertEqual([r['id'] for r in games[1]['rounds']], ['quis', 'quid', 'quem', 'cujus', 'cui', 'uter'])
        self.assertEqual(sum(''.join(r['text']).count('{') for r in games[1]['rounds']), 50)
        self.assertFalse((self.root / 'src/theodorus.html').exists(), 'the old page is the engine now')
        for game in games:
            with self.subTest(game=game['id']):
                page = outputs[game['file']]
                self.assertIn(f'<title>{game["name"]} · Lexicon Latīnitātis Cotīdiānae</title>', page)
                self.assertIn(f'<h1 lang="la">{game["name"]}</h1>', page)
                self.assertIn(f'"prefix": "{game["prefix"]}"', page)
                self.assertIn('"hints": ' + json.dumps(game['hints'], ensure_ascii=False), page)
                self.assertNotIn('{{', page)
                # The foot links lead to the other practice pages, the other gap games among them.
                links = page[page.index('<nav class="links"'):]
                links = links[:links.index('</nav>')]
                for other in ['index.html', 'practice.html', 'hora.html', 'chartae.html'] + [g['file'] for g in games if g is not game]:
                    self.assertIn(f'href="{other}"', links)
                self.assertNotIn(f'href="{game["file"]}"', links)
                # The tables of forms behind "Mōnstrā fōrmās" (Jack, 20 November 2026) are in the page.
                self.assertIn('"tabulae": ' + json.dumps(game['tabulae'], ensure_ascii=False), page)
                # The engine reads j as i (and cunque as cumque) in what is typed and in the forms.
                self.assertIn('.replace(/cunque/g, "cumque").replace(/j/g, "i")', page)
        self.assertIn('<title>Quis pulsat? · Lexicon Latīnitātis Cotīdiānae</title>', outputs['quis-pulsat.html'])
        self.assertIn('"prefix": "uet-"', outputs['theodorus.html'])
        self.assertEqual([(len(t['rows']), len(t['heads'])) for t in games[0]['tabulae']], [(15, 5)])
        self.assertEqual([(t.get('caption'), len(t['rows']), len(t['heads'])) for t in games[1]['tabulae']],
                         [('Dē plūribus', 12, 6), ('Dē duōbus', 7, 2)])
        self.assertIn('Mōnstrā fōrmās', outputs['quis-pulsat.html'])
        # A malformed game file stops the build, and says which file and what is wrong.
        path = self.root / 'src/lacunae/quis-pulsat.json'
        good = path.read_text(encoding='utf-8')

        def broken(change, message):
            game = json.loads(good)
            change(game)
            path.write_text(json.dumps(game, ensure_ascii=False), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, message):
                builder.gap_games(self.root)
            path.write_text(good, encoding='utf-8')
        broken(lambda g: g.pop('prefix'), r'quis-pulsat\.json: Missing fields')
        broken(lambda g: g['rounds'][1].update(id='quis'), r'quis-pulsat\.json: round quis: the id is used twice')
        broken(lambda g: g['rounds'][0].update(text=['Nesciō {|aliquis} quis pulset.']), r'quis-pulsat\.json: round quis: a gap with an empty form')
        broken(lambda g: g['rounds'][0].update(text=['Nesciō {Aliquis/|aliquis} quis.']), 'a gap with an empty form')
        broken(lambda g: g['rounds'][0].update(text=['Nesciō quis pulset.']), 'round quis: no gaps')
        broken(lambda g: g['rounds'][0].update(text=['Nesciō {Aliquis|aliquis} quis {pulset.']), 'a brace outside a gap')
        broken(lambda g: g.update(prefix='uet-'), 'two games with the same prefix')
        broken(lambda g: g.pop('tabulae'), r'Missing fields')
        broken(lambda g: g['tabulae'][1]['rows'][2].pop(), r'quis-pulsat\.json: table 2, row 3: 1 cells for 2 heads')
        broken(lambda g: g['tabulae'][0]['rows'][0].__setitem__(4, ''), r'table 1, row 1: an empty cell')
        broken(lambda g: g['tabulae'][0]['rows'][0].__setitem__(4, ' cujus'), r'table 1, row 1: an empty cell')
        broken(lambda g: g['tabulae'].clear(), 'no tables of forms')
        broken(lambda g: g.pop('hints'), r'Missing fields')
        broken(lambda g: g['hints'].pop('en'), r'Missing fields')
        broken(lambda g: g['tabulae'][0].update(round='cuius'), r"quis-pulsat\.json: table 1: no round 'cuius' in this game")
        broken(lambda g: g['rounds'][0].update(id='Quis'), 'the id must be lower-case')
        path.write_text('{"id": ', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, r'quis-pulsat\.json: not valid JSON'):
            builder.gap_games(self.root)

    def test_sources_are_read_from_the_opening_of_a_citation(self):
        cases = {
            'Verg. G. 3.284: <span lang="la">sed fugit intereā; fugit irreparābile tempus</span> (Lewis &amp; Short)': ['vergil', 'vergil-georgics'],
            'Cels. 2.30; Plin. NH 26.58 (Lewis &amp; Short, s.v. <span lang="la">pulticula</span>)': ['celsus', 'pliny-elder'],
            'Plin. Ep. 1.11.1: <span lang="la">ōlim mihi nūllās epistulās mittis</span>': ['pliny-younger'],
            'Cic. de Or. 2.141 (Lewis &amp; Short)': ['cicero'],          # too few cards for a tag of its own, but not the Orator
            'Cic. Q. fr. 1.1.4': ['cicero', 'cicero-quintus'],
            'Hor. S. 1.3.137': ['horace', 'horace-satires'],
            'Ter. Ph. 950': ['terence', 'terence-phormio'],
            'Traupman 73': ['traupman'],
            'Lewis &amp; Short s.v. <span lang="la">susque dēque</span>, from Gellius': ['lewis-short'],
            'M-O s.v. soap bubble': ['morgan-owens'],
            'Catull. 85.1': ['catullus'],
            'Mart. Cap. 3.277': [],
            'Jo. 6, 20: <span lang="la">Ego sum, nōlīte timēre.</span>': ['vulgate', 'vulgate-john'],
            'Vulg. Ps. 122 (123), 3': ['vulgate', 'vulgate-psalms'],
            'composed': [],
        }
        for citation, tags in cases.items():
            with self.subTest(citation=citation):
                self.assertEqual(builder.source_tags(citation), tags)
        self.assertEqual(builder.citation_label('Suet. Vesp. 16 (Lewis &amp; Short s.v. <span lang="la">vulpēs</span>): <span lang="la">vulpem pilum mūtāre</span>'),
                         'Suet. Vesp. 16')

    def test_an_example_belongs_on_a_card_only_if_it_contains_the_answer(self):
        index = builder.form_index([
            {'terms': [{'latin': 'dēns, dentis m.'}, {'latin': 'genū, genūs n.'}, {'latin': 'flectō, flectere, flexī, flexum'},
                       {'latin': 'sum, esse, fuī'}]}])
        has = lambda latin, example: builder.answer_test({'latin': latin}, index)(builder.example_words(example))
        # A word: any of its forms, from the stems the search is built on; i and j, u and v alike.
        self.assertTrue(has('cūra, cūrae f.', 'Mihi cūrae est.'))
        self.assertFalse(has('cūra, cūrae f.', 'nihil labōrō, nisi ut salvus sīs'))
        self.assertFalse(has('ēmendō, ēmendāre, ēmendāvī, ēmendātum', 'corrige, sōdēs, hoc'))
        self.assertTrue(has('ēmendō, ēmendāre, ēmendāvī, ēmendātum', 'lēgibus ēmendēs'))
        self.assertFalse(has('cumulus, cumulī m.', 'acervus terrae'))
        self.assertTrue(has('dīcō, dīcere, dīxī, dictum', 'Quid dīxistī?'))
        self.assertTrue(has('juvenis, juvenis', 'Iuuenēs vēnērunt.'))
        self.assertTrue(has('piper, piperis n.', 'sale pipereque'))          # the enclitic comes off
        # A word that does not inflect: the word itself, as a word.
        self.assertTrue(has('fortasse', 'Fortasse pluet.'))
        self.assertFalse(has('fortasse', 'forsan et haec ōlim meminisse juvābit'))
        self.assertFalse(has('jam', 'Jamdūdum vēnit.'))
        # Several words: each of them, in any order and any form.
        self.assertTrue(has('dentēs pūrgāre', 'faciēs lavanda erat, dentēs pūrgandī'))
        self.assertTrue(has('dentēs pūrgāre', 'Pūrgā dentem!'))
        self.assertFalse(has('dentēs pūrgāre', 'Dentēs pēnicillō fricā.'))
        self.assertTrue(has('genua flectere', 'Flexīs genibus ōrāvit.'))   # each word by the entry it is a form of
        self.assertFalse(has('genua flectere', 'genua dolent'))
        self.assertTrue(has('vestis nocturna', 'veste nocturnā etiamtum indūtus'))
        self.assertTrue(has('chartula cursuālis', 'Chartulam cursuālem aviae mittāmus.'))
        self.assertFalse(has('rēs pūblica, reī pūblicae f.', 'rēs pāce bellōque gestās'))
        self.assertTrue(has('in angustiīs esse (versārī)', 'In angustiīs sumus.'))
        self.assertFalse(has('in angustiīs esse (versārī)', 'Angustiae sunt.'))  # a preposition is wanted as it stands
        # The origin line: the period, and one or two citations without what they quote.
        self.assertEqual(builder.origin({'latin': 'x', 'period': 'classical', 'evidence': [
            'Cic. Tusc. 5.97: <span lang="la">cibī condīmentum esse famem</span> (Lewis &amp; Short)', 'Traupman 73', 'Traupman 73', 'M-O s.v. sauce']}),
            (0, ['Cic. Tusc. 5.97', 'Traupman 73']))
        self.assertEqual(builder.origin({'latin': 'x', 'period': 'ours'}), (list(builder.PERIODS).index('ours'), []))
        self.assertEqual(builder.origin({'latin': 'x', 'period': 'modern', 'evidence': ['M-O s.v. lighthouse, citing Plin. NH 36.83 and Suet.']})[1],
                         ['M-O s.v. lighthouse'])

    def test_a_phrase_is_a_saying_or_an_everyday_phrase(self):
        def kind(english, latin, evidence, pos='phrase'):
            return builder.practice_kind({'english': english, 'pos': pos,
                                          'terms': [{'latin': latin, 'status': 'recommended', 'period': 'classical', 'evidence': evidence}]})
        self.assertEqual(kind('soap', 'sāpō, sāpōnis m.', ['Plin. NH 28.191'], pos='noun'), 'w')
        # Traupman's list of proverbs and sayings (pp. 254–259), and the lines of Publilius Syrus.
        self.assertEqual(kind('practice makes perfect', 'Exercitātiō optima magistra est.', ['Traupman 258']), 's')
        self.assertEqual(kind('a woman loves or hates', 'Aut amat aut ōdit mulier, nīl est tertium.', ['Publil. Sent. A 6']), 's')
        self.assertEqual(kind('how are you?', 'Quid agis?', ['Traupman 15, 17–18', 'Traupman 330']), 'p')
        self.assertEqual(kind('no, thank you', 'benignē', ['Traupman 250, 393']), 'p')
        # Cited from authors alone: a statement is a saying, a turn of conversation is not.
        self.assertEqual(kind('time will tell', 'Vēritātem diēs aperit.', ['Sen. Ira 2.22.2']), 's')
        self.assertEqual(kind('who will guard the guards?', 'Quis custōdiet ipsōs custōdēs?', ['Juv. 6.347–348']), 's')
        self.assertEqual(kind('it’s too early', 'Nimis paene māne est.', ['Plaut. Persa 114']), 'p')
        self.assertEqual(kind('see you soon', 'Jam tē vidēbō.', ['Cic. Att. 12.2.2']), 'p')
        self.assertEqual(kind('all gone', 'Nihil superest.', ['Nep. Alc. 8.1']), 'p')
        self.assertEqual(kind('in short', 'ad summam', ['Cic. Att. 14.1.1', 'Traupman 108, 408']), 'p')
        self.assertEqual(kind('tell me a story!', 'Narrā mihi fābulam!', []), 'p')
        self.assertEqual(kind('to make a long story short', 'nē longum faciam', ['Hor. S. 1.3.137'], pos=['adverb', 'phrase']), 'p')

    def test_record_file_name_must_match_id(self):
        record = self.record('perhaps')
        self.save_record(record, key='maybe')
        with self.assertRaisesRegex(ValueError, 'matching its file name'):
            builder.build_site(self.root)

    def test_duplicate_ruling_rejected(self):
        rulings = self.read('data/rulings.json')
        rulings.append(copy.deepcopy(rulings[0]))
        self.write('data/rulings.json', rulings)
        with self.assertRaisesRegex(ValueError, 'Duplicate ruling'):
            builder.build_site(self.root)

    def test_stale_concept_page_detected(self):
        for path in ('c/removed.html', 'l/gone.html', 'assets/fonts/old.woff2'):
            (self.root / path).parent.mkdir(parents=True, exist_ok=True)
            (self.root / path).write_text('old', encoding='utf-8')
        self.assertEqual(builder.stale(self.root, builder.build_site(self.root)),
                         ['assets/fonts/old.woff2', 'c/removed.html', 'l/gone.html'])

    def test_a_saying_is_not_a_page_for_its_first_word(self):
        # Jack, 18 November 2026: the page for Eho was the saying "Eho, nōn tam cito!", defined
        # as "whoa, not so fast!", with an example of ohē that has no eho in it.
        self.assertEqual(builder.term_head('Eho, nōn tam cito!'), 'Eho, nōn tam cito!')
        self.assertEqual(builder.term_head('Grātulor (tibi)!'), 'Grātulor')
        self.assertEqual(builder.term_head('Rōma, Rōmae f.'), 'Rōma')
        record = self.record('perhaps')
        record['terms'] += [
            {'latin': 'Eho!', 'status': 'alternative', 'period': 'classical', 'gloss': 'ho!'},
            {'latin': 'Eho, nōn tam cito!', 'status': 'alternative', 'period': 'classical', 'gloss': 'whoa, not so fast!'},
            {'latin': 'Ohē!', 'status': 'alternative', 'period': 'classical', 'gloss': 'whoa!'}]
        record['phrases'] = [{'latin': 'etiam nunc — etiam — ohē, istīc astātō.', 'english': 'More, more: whoa, stand there.',
                              'source': 'Plaut. Aul. 55–56'}]
        self.save_record(record)
        outputs = builder.build_site(self.root)
        pages = [page for path, page in outputs.items() if path.startswith('l/') and '<h1 class="hw" lang="la">Eho' in page]
        self.assertEqual(len(pages), 1)
        self.assertIn('<h1 class="hw" lang="la">Eho!</h1>', pages[0])
        self.assertIn('<a href="cito.html">cito</a>!</b><span lang="la"></span>: <a href="../c/perhaps.html">', pages[0])   # the saying is listed under the word
        self.assertNotIn('astātō', pages[0])          # and the example of ohē is not its example
        ohe = next(page for path, page in outputs.items() if path.startswith('l/') and '<h1 class="hw" lang="la">Ohē!</h1>' in page)
        self.assertIn('astātō', ohe)
        # The word an entry recommends shows only the examples that have it, too.
        self.assertNotIn('astātō', outputs['l/fortasse.html'])

    def test_a_bracket_inside_a_saying_does_not_cut_it(self):
        self.assertEqual(builder.term_head('Nōlī (nōlīte) exscrībere ex proximō.'), 'Nōlī (nōlīte) exscrībere ex proximō.')
        self.assertEqual(builder.term_head('Attende (attendite).'), 'Attende')
        self.assertEqual(builder.term_head('caccabus (cacabus), caccabī m.'), 'caccabus')

    def test_a_one_word_saying_and_its_word_list_each_other(self):
        record = self.record('perhaps')
        record['terms'] += [
            {'latin': 'Sānē.', 'status': 'alternative', 'period': 'classical', 'gloss': 'certainly (as an answer)'},
            {'latin': 'sānē', 'status': 'alternative', 'period': 'classical', 'gloss': 'by all means'},
            {'latin': 'Sānē!', 'status': 'alternative', 'period': 'classical', 'gloss': 'indeed!'}]
        self.save_record(record)
        words = builder.word_index({record['id']: record})
        listed = lambda head: {term['latin'] for _, term in words[head]['within']}
        self.assertEqual(listed('sānē'), {'Sānē.', 'Sānē!'})
        self.assertEqual(listed('Sānē.'), {'sānē', 'Sānē!'})
        self.assertEqual(listed('Sānē!'), {'sānē', 'Sānē.'})
        builder.build_site(self.root)

    def test_words_that_share_a_head_are_set_out_apart(self):
        # volō, velle and volō, volāre had one page with the forms of whichever came first.
        use = lambda latin, gloss, **more: ({'id': gloss, 'english': gloss}, dict({'latin': latin, 'gloss': gloss}, **more))
        fly, want = use('volō, volāre, volāvī, volātum', 'fly'), use('volō, velle, voluī', 'want')
        short, loose = use('volō, volāre', 'hurry'), use('volō, volēbam', 'no auxiliary')
        groups = builder.word_homographs([fly, want, short, loose])
        self.assertEqual([(shown['latin'], [term['gloss'] for _, term in mine]) for shown, mine in groups],
                         [('volō, volāre, volāvī, volātum', ['fly', 'hurry']), ('volō, velle, voluī', ['want'])])
        self.assertEqual(builder.word_homographs([loose]), [])
        record = self.record('perhaps')
        record['terms'] += [dict(fly[1], status='alternative', period='classical'), dict(want[1], status='alternative', period='classical'),
                            {'latin': 'volō, volēbam', 'status': 'alternative', 'period': 'classical', 'gloss': 'no auxiliary'}]
        self.save_record(record)
        outputs = builder.build_site(self.root)
        page = next(page for path, page in outputs.items() if path.startswith('l/') and '<h1 class="hw" lang="la">volō</h1>' in page)
        self.assertIn('<p class="forms" lang="la">volō, volāre, volāvī, volātum</p>', page)
        self.assertIn('<p class="forms" lang="la">volō, velle, voluī</p>', page)
        self.assertNotIn('<p class="forms" lang="la">volō, volēbam</p>', page)

    def test_broken_link_between_pages_rejected(self):
        record = self.record('perhaps')
        record['related'] = [self.card]
        self.save_record(record)
        builder.build_site(self.root)
        self.write(self.path, [e for e in self.read(self.path) if e['id'] != self.card])
        with self.assertRaisesRegex(ValueError, 'Unknown related'):
            builder.build_site(self.root)


if __name__ == '__main__':
    unittest.main()
