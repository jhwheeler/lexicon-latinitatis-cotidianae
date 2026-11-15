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

    def test_committed_output_matches_sources(self):
        self.assertEqual(builder.build(), (ROOT / 'index.html').read_text(encoding='utf-8'))
        for path, text in builder.build_site().items():
            with self.subTest(path=path):
                if isinstance(text, bytes):
                    self.assertEqual(text, (ROOT / path).read_bytes())
                else:
                    self.assertEqual(text, (ROOT / path).read_text(encoding='utf-8'))
        self.assertEqual(builder.stale(ROOT, builder.build_site()), [])

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
                         'WAIT_DAYS = [null, null, [1, 1], [3, 4], [6, 8], [14, 18], [30, 40]];'):
            self.assertIn(constant, script)
        for said in ('A round is 12 cards', 'at most half of a round', 'due again in 10 minutes', 'due the next day',
                     'in 3–4 days, 6–8, 14–18 and 30–40', 'starting at 04:00'):
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
        self.assertIn('<p class="foot-links"><a href="how-we-decide.html">How we decide</a> · <a href="rulings.html">Rulings</a> · '
                      '<a href="how-practice-works.html">How the practice works</a> · <a href="#about">About</a> · ', index)
        record = outputs['c/kind.html']
        self.assertIn('<form class="head-search" role="search" action="../index.html" method="get">', header(record))
        self.assertIn('name="q"', header(record))
        self.assertIn('data-theme-choice="dark"', header(record))
        self.assertNotIn('<nav', header(record))
        self.assertIn('<a href="../how-we-decide.html">How we decide</a> · <a href="../rulings.html">Rulings</a> · '
                      '<a href="../how-practice-works.html">How the practice works</a> · <a href="../index.html#about">About</a>', record)
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

    def test_the_site_carries_the_revision_and_shows_what_is_reviewed(self):
        outputs = builder.build_site(self.root)
        revision = builder.record_revision(self.record('perhaps'))
        self.assertIn(f'<article class="concept" data-record data-rev="{revision}" data-status="draft">', outputs['c/perhaps.html'])
        self.assertIn('<script src="../assets/review.js" defer></script>', outputs['c/perhaps.html'])
        self.assertIn('Draft of ', outputs['c/perhaps.html'])
        # Without scripts the way to GitHub stands where the flag will be.
        self.assertIn('<p class="suggest"><a href="https://github.com/', outputs['c/perhaps.html'])
        self.assertNotIn('review.js', outputs['l/fortasse.html'])
        card = next(card for card in self.practice(outputs)['cards'] if card['i'] == 'perhaps')
        self.assertEqual(card['h'], revision)
        self.assertNotIn('d', card)
        self.assertIn(' · 0 reviewed by the editor; the rest are drafts and await <a href="review.html">review</a></p>', outputs['index.html'])
        self.assertNotIn(' class="rv"', outputs['k/sermo.html'])
        # The review page: on the device, in the sitemap, linked from every footer beside Practice.
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
            self.assertIn(f'<a href="{up}practice.html">Practice</a> · <a href="{up}review.html">Review</a> · ', page[page.rindex('<footer'):])
            self.assertNotIn('review.html', page[page.index('<header class="site-top'):page.index('</header>')])
        self.assertIn('<script src="assets/review.js" defer></script>\n<script src="assets/practice.js" defer></script>', outputs['practice.html'])
        # Marked reviewed (as scripts/apply_review.py marks it), the record says so everywhere, under the same revision.
        record = self.record('perhaps')
        record['review'] = {'status': 'reviewed', 'date': '2026-11-15', 'by': 'Jack'}
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn(f'data-rev="{revision}" data-status="reviewed">', outputs['c/perhaps.html'])
        self.assertIn('<p>Reviewed 15 November 2026.</p>', outputs['c/perhaps.html'])
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
        self.assertIn('<p>Reviewed 15 November 2026.</p>', outputs['c/perhaps.html'])
        for path, output in outputs.items():
            if isinstance(output, str):
                self.assertNotIn('Xenophilus', output, path)

    # Practice ----------------------------------------------------------------------------

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
        for path, up in (('index.html', ''), ('c/perhaps.html', '../'), ('k/sermo.html', '../'), ('practice.html', '')):
            with self.subTest(path=path):
                page = outputs[path]
                self.assertIn(f'<a href="{up}practice.html">Practice</a>', page[page.rindex('<footer'):])
                self.assertNotIn('practice.html', page[page.index('<header class="site-top'):page.index('</header>')])
        for path in ('practice.html', 'hora.html'):
            self.assertIn(f'cotidianae/{path}</loc>', outputs['sitemap.xml'])
            self.assertIn('<link rel="manifest" href="manifest.webmanifest">', outputs[path])
        # The clock asks nothing of other sites: its only address is its own.
        hora = outputs['hora.html']
        self.assertEqual(re.findall(r'https?://[^"\s)]+', hora), [builder.SITE_URL + 'hora.html'])
        self.assertIn('url(assets/fonts/lexicon-serif-400.woff2)', hora)
        self.assertNotIn('claude:', hora)
        self.assertIn("navigator.serviceWorker.register('sw.js')", hora)
        # Its colours are the lexicon's (Jack, 15 November 2026): the stylesheet's names and values,
        # copied into the page, with lapis beside them; its theme is set as on every page, and the
        # browser's bar takes the ground's colour. Nothing of its old palette is left.
        styles = (self.root / 'src/styles.css').read_text(encoding='utf-8')
        names = ('paper', 'ink', 'soft', 'muted', 'hair', 'rule', 'rubric', 'accent', 'mark', 'ground', 'card')

        def palette(text, selector):
            block = text[text.index(selector):]
            return dict(re.findall(r'--([a-z-]+):(#[0-9a-f]{6})', block[:block.index('}')]))
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
