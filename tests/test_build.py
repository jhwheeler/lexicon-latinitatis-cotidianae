"""Run with python3 -m unittest discover -s tests -v."""
import copy
import importlib.util
import json
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
        self.assertIn('url(fonts/lexicon-serif-400.woff2)', outputs['assets/lexicon.css'])
        self.assertIsInstance(outputs['assets/fonts/lexicon-serif-400.woff2'], bytes)

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
        page = outputs['k/culina.html']
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
        record['terms'].append({'latin': 'caccabus magnus', 'status': 'alternative', 'period': 'ours'})
        self.save_record(record)
        outputs = builder.build_site(self.root)
        self.assertIn('l/malum.html', outputs)
        self.assertIn('l/malum-2.html', outputs)
        concept = outputs['c/cooking-pot.html']
        self.assertIn('<b><a href="../l/caccabus.html">caccabus</a> magnus</b>', concept)
        self.assertIn('<b lang="la">caccabus magnus</b>', outputs['l/caccabus.html'])

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
