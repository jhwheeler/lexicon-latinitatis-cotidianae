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
        self.category = self.read('data/catalog.json')['categories'][0]['id']
        self.path = f'data/entries/{self.category}.json'

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
        new = copy.deepcopy(entries[0])
        new.update(id='entry-99999', english='A < B & C', latin='lūdicrum, lūdicrī n.')
        new.pop('anchor', None)
        entries.append(new)
        self.write(self.path, entries)
        page = builder.build(self.root)
        total = sum(len(self.read(f'data/entries/{c["id"]}.json')) for c in self.read('data/catalog.json')['categories'])
        records = sum(1 for p in (self.root / 'data/concepts').glob('*.json') if self.read(p)['domain'] == self.category)
        self.assertIn(f'{total} grouped entries', page)
        self.assertIn(f'{len(entries) + records} entries</span>', page)
        self.assertIn('A &lt; B &amp; C', page)
        self.assertIn('lūdicrum, lūdicrī n.', page)

    def test_duplicate_entry_rejected_across_categories(self):
        catalog = self.read('data/catalog.json')
        other = f'data/entries/{catalog["categories"][1]["id"]}.json'
        entries = self.read(other)
        entries[0]['id'] = self.read(self.path)[0]['id']
        self.write(other, entries)
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
        path.write_text(path.read_text(encoding='utf-8').replace('{{entry_count}}', '123'), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Missing template token'):
            builder.build(self.root)

    # Concept records, notes and rulings ---------------------------------------------

    def test_records_render_with_notes_pages_and_rulings(self):
        outputs = builder.build_site(self.root)
        index = outputs['index.html']
        self.assertIn('id="c-perhaps"', index)
        self.assertIn('data-record', index)
        self.assertIn('<li id="fn-perhaps-1">', index)
        self.assertIn('href="rulings.html#r-fortasse"', index)
        self.assertIn('<span class="legacy-anchor" id="entry-550"></span>', index)
        self.assertIn('href="c/perhaps.html"', index)
        page = outputs['c/perhaps.html']
        self.assertIn('<title>perhaps in Latin: fortasse · ', page)
        self.assertIn('href="../rulings.html#r-fortasse"', page)
        self.assertIn('<link rel="canonical" href="https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/c/perhaps.html">', page)
        rulings = outputs['rulings.html']
        self.assertIn('id="r-fortasse"', rulings)
        self.assertIn('href="rulings.html"', outputs['how-we-decide.html'])
        self.assertIn('href="how-we-decide.html"', rulings)
        self.assertIn('<a href="c/perhaps.html">perhaps</a>', rulings)
        self.assertIn('c/perhaps.html</loc>', outputs['sitemap.xml'])
        self.assertIn('rulings.html</loc>', outputs['sitemap.xml'])
        self.assertIn('<span class="legacy-anchor" id="theodorus"></span>', index)
        self.assertIn('href="../l/fortasse.html"', page)
        self.assertIn('<h1 class="hw">perhaps <span class="pos">adverb</span></h1>', page)
        word = outputs['l/fortasse.html']
        self.assertIn('<h1 class="hw" lang="la">fortasse</h1>', word)
        self.assertIn('href="../c/perhaps.html"', word)
        self.assertIn('href="../rulings.html#r-fortasse"', word)
        self.assertIn('l/fortasse.html</loc>', outputs['sitemap.xml'])
        self.assertIn('<a href="l/fortasse.html" lang="la">fortasse</a>', rulings)
        self.assertIn('href="l/caccabus.html"', index)
        self.assertIn('url(assets/fonts/lexicon-serif-400.woff2)', index)
        self.assertIn('url(fonts/lexicon-serif-400.woff2)', outputs['assets/lexicon.css'])
        self.assertIsInstance(outputs['assets/fonts/lexicon-serif-400.woff2'], bytes)

    def test_note_numbers_follow_reading_order(self):
        record = self.record('perhaps')
        record['notes']['second'] = {'html': 'Second note.'}
        record['terms'][-1]['notes'] = ['second']
        record['phrases'][0]['notes'] = ['short-e']
        self.save_record(record)
        index = builder.build_site(self.root)['index.html']
        self.assertIn('<li id="fn-perhaps-2">Second note.</li>', index)

    def test_record_errors_rejected(self):
        cases = {
            'Unknown note': lambda r: r['terms'][0].update(notes=['missing']),
            'Unused notes': lambda r: r['notes'].update(spare={'html': 'Never cited.'}),
            'Unknown ruling': lambda r: r['notes']['short-e'].update(ruling='no-such-ruling'),
            'No recommended term': lambda r: [t.update(status='alternative') for t in r['terms']],
            'Invalid period': lambda r: r['terms'][0].update(period='ancient'),
            'Unknown related': lambda r: r.update(related=['no-such-concept']),
            'which still exists': lambda r: r.update(replaces=['entry-1']),
            'Unknown fields': lambda r: r.update(lattin='x'),
            'Invalid review': lambda r: r['review'].update(status='done'),
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
        record['related'] = ['entry-1']
        self.save_record(record)
        builder.build_site(self.root)
        entries = self.read(self.path)
        entries = [e for e in entries if e['id'] != 'entry-1']
        if len(entries) != len(self.read(self.path)):
            self.write(self.path, entries)
            with self.assertRaisesRegex(ValueError, 'Unknown related'):
                builder.build_site(self.root)


if __name__ == '__main__':
    unittest.main()
