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

    def write(self, path, data):
        (self.root / path).write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')

    def test_committed_output_matches_sources(self):
        self.assertEqual(builder.build(), (ROOT / 'index.html').read_text(encoding='utf-8'))

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
        self.assertIn(f'{total} grouped entries', page)
        self.assertIn(f'{len(entries)} entries</span>', page)
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


if __name__ == '__main__':
    unittest.main()
