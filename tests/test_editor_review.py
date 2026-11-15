"""Run with python3 -m unittest discover -s tests -v."""
import datetime
import importlib.util
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f'scripts/{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


editor = load('editor_review')
review = load('apply_review')


class EditorReviewTests(unittest.TestCase):
    """The editor's private review page (Jack, 15 November 2026: only he reviews, and not on the
    site). The page itself is tested in tests/editor.browser.test.mjs."""

    @classmethod
    def setUpClass(cls):
        cls.files = editor.page_files(today=datetime.date(2026, 11, 15))
        cls.index = json.loads(cls.files['d/index.js'][len('window.editorIndex='):-2])
        cls.records = {path.stem: json.loads(path.read_text(encoding='utf-8')) for path in (ROOT / 'data/concepts').glob('*.json')}

    def chunk(self, category):
        text = self.files[f'd/{category}.js']
        head = f'editorChunk({json.dumps(category)},'
        self.assertTrue(text.startswith(head) and text.endswith(');\n'))
        return json.loads(text[len(head):-3])

    def test_the_index_has_every_record_once_with_its_revision_and_state(self):
        rows = self.index['records']
        self.assertEqual(sorted(row[0] for row in rows), sorted(self.records))
        self.assertEqual(self.index['built'], '2026-11-15')
        self.assertEqual(self.index['site'], editor.builder.SITE_URL)
        catalog = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
        self.assertEqual([category['id'] for category in self.index['categories']], [category['id'] for category in catalog['categories']])
        for key, rev, english, latin, category, done in rows:
            record = self.records[key]
            self.assertEqual(rev, editor.builder.record_revision(record))
            self.assertEqual(self.index['categories'][category]['id'], record['domain'])
            self.assertEqual(done, 1 if record['review']['status'] == 'reviewed' else 0)
            self.assertTrue(english.startswith(record['english']) and latin)
            # A verdict's document is named by the record.
            self.assertRegex(key, r'\A[A-Za-z0-9_\-.~:@+]+\Z')

    def test_each_entry_is_in_its_category_as_the_site_draws_it_without_links(self):
        seen = set()
        for category in self.index['categories']:
            entries = self.chunk(category['id'])
            for key, html in entries.items():
                self.assertEqual(self.records[key]['domain'], category['id'])
                self.assertNotIn('<a ', html)
                self.assertNotIn('</a>', html)
                self.assertNotIn('class="suggest"', html)
                self.assertIn(f'data-rev="{editor.builder.record_revision(self.records[key])}"', html)
            self.assertFalse(seen & set(entries))
            seen |= set(entries)
        self.assertEqual(seen, set(self.records))
        soap = self.chunk(self.records['soap']['domain'])['soap']
        self.assertIn('<h1 class="hw">soap', soap)
        self.assertIn('class="lemma" lang="la"', soap)
        self.assertRegex(soap, r'<footer class="c-sources">.*(Draft of|Reviewed) ')

    def test_the_page_asks_nothing_of_other_sites(self):
        for path in ('index.html', 'review.js', 'editor.css'):
            text = self.files[path]
            self.assertFalse(re.search(r'(src|href)="(https?:)?//', text), path)
        self.assertIn('<title>Recēnsiō · Lexicon Latīnitātis Cotīdiānae</title>', self.files['index.html'])
        self.assertEqual(self.files['lexicon.css'], (ROOT / 'src/styles.css').read_text(encoding='utf-8'))
        fonts = set(re.findall(r'url\((fonts/[^)]+)\)', self.files['lexicon.css']))
        self.assertTrue(fonts and all(font in self.files for font in fonts))

    def test_saved_verdicts_become_a_report_the_apply_script_reads(self):
        soap, perhaps = (editor.builder.record_revision(self.records[key]) for key in ('soap', 'perhaps'))
        lines = [
            '{"notice":"what the database tool says first","count":2,"nextCursor":""}',
            json.dumps({'data': {'date': '2026-11-15', 'id': 'perhaps', 'note': 'short e?', 'reasons': ['quantity'], 'rev': perhaps,
                                 't': 1794754600000, 'verdict': 'flag'}, 'id': 'perhaps', 'updatedAt': '2026-11-15T14:56:40Z', 'version': 2}),
            'a line that is not a document',
            json.dumps({'data': {'date': '2026-11-15', 'note': '', 'reasons': [], 'rev': soap, 't': 1794754500000, 'verdict': 'ok'},
                        'id': 'soap', 'updatedAt': '2026-11-15T14:55:03Z', 'version': 1}),
        ]
        verdicts = review.read_report('Applied from the page.\n\n' + editor.report(lines[1:]))
        self.assertEqual([(v['id'], v['verdict'], v['rev']) for v in verdicts], [('soap', 'ok', soap), ('perhaps', 'flag', perhaps)])
        self.assertEqual(verdicts[1]['note'], 'short e?')
        self.assertNotIn('version', verdicts[0])
        # The data alone, one object per line, is read too.
        self.assertEqual(review.read_report(editor.report([json.dumps(verdicts[0])])), [verdicts[0]])


if __name__ == '__main__':
    unittest.main()
