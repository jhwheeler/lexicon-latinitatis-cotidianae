"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f'scripts/{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = load('build')
converter = load('html_to_data')


class ConverterTests(unittest.TestCase):
    def setUp(self):
        self.page = builder.build()

    def test_round_trip_reproduces_data(self):
        catalog, entries = converter.convert(self.page)
        self.assertEqual(catalog, json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8')))
        for key, items in entries.items():
            path = ROOT / f'data/entries/{key}.json'
            self.assertEqual(converter.dump(items), path.read_text(encoding='utf-8'), key)

    def test_round_trip_reproduces_template(self):
        shell = converter.template(self.page)
        for name, text in zip(('page.html', 'styles.css', 'search.js'), shell):
            self.assertEqual(text, (ROOT / f'src/{name}').read_text(encoding='utf-8'), name)

    def test_hand_added_entry_is_extracted(self):
        card = ('<article class="entry" id="test-1" data-entry data-entry-id="entry-99999" '
                'data-category="labor" data-search="test &amp;amp; alias">\n'
                '<header class="entry-head"><div><p class="eyebrow">Test &amp; check</p>'
                '<h3 lang="la">probātiō, probātiōnis f.</h3></div><div class="tags"></div></header>\n'
                '<div class="entry-body"><ul>\n<li><strong lang="la">probō</strong> — test; '
                '<a target="_blank" href="https://logeion.uchicago.edu/probo">L&amp;S</a></li>\n</ul>'
                '<p class="source-note">Note.</p></div>\n</article>')
        marker = 'data-category-section="labor"'
        start = self.page.index(marker)
        end = self.page.index('</div></section>', start)
        page = self.page[:end] + card + self.page[end:]
        _, entries = converter.convert(page)
        self.assertEqual(entries['labor'][-1], {
            'id': 'entry-99999', 'anchor': 'test-1', 'english': 'Test & check',
            'latin': 'probātiō, probātiōnis f.', 'tags': [], 'keywords': 'test &amp; alias',
            'blocks': [
                {'type': 'list', 'items': [{'html': '<strong lang="la">probō</strong> — test; '
                                            '<a href="https://logeion.uchicago.edu/probo" target="_blank">L&amp;S</a>'}]},
                {'type': 'paragraph', 'html': 'Note.', 'class': 'source-note'}]})

    def test_markup_outside_schema_rejected(self):
        for old, new in (('<div class="entry-body"><ul>', '<div class="entry-body"><table></table><ul>'),
                         ('<div class="entry-body"><ul>', '<div class="entry-body">stray text<ul>'),
                         ('<div class="entry-body"><ul>\n<li>', '<div class="entry-body"><ul>\n<li class="x">')):
            with self.subTest(new=new), self.assertRaises(ValueError):
                converter.convert(self.page.replace(old, new, 1))


if __name__ == '__main__':
    unittest.main()
