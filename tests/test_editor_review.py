"""Run with python3 -m unittest discover -s tests -v."""
import datetime
import importlib.util
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / f'scripts/{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


editor = load('editor_review')
review = load('apply_review')
# A stand-in for the editor's own list, which is private and kept outside the repository: two
# records and an id that is none.
MINE = ['soap', 'perhaps', 'no-such-record']


class EditorReviewTests(unittest.TestCase):
    """The editor's private review page (Jack, 15 November 2026: only he reviews, and not on the
    site). The page itself is tested in tests/editor.browser.test.mjs."""

    @classmethod
    def setUpClass(cls):
        cls.site = editor.builder.load_site(ROOT)
        cls.files = editor.page_files(today=datetime.date(2026, 11, 15), mine=MINE, site=cls.site)
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
        for key, rev, english, latin, category, done, priority, reasons in rows:
            record = self.records[key]
            self.assertEqual(rev, editor.builder.record_revision(record))
            self.assertEqual(self.index['categories'][category]['id'], record['domain'])
            self.assertEqual(done, 1 if record['review']['status'] == 'reviewed' else 0)
            self.assertTrue(english.startswith(record['english']) and latin)
            # A verdict's document is named by the record.
            self.assertRegex(key, r'\A[A-Za-z0-9_\-.~:@+]+\Z')

    def test_every_row_carries_a_priority_that_its_reasons_explain(self):
        """Jack, 16 November 2026: "would be good to have more high prio items first". The page
        reads the highest first and says why, so the number must be the sum of the named weights."""
        bands = {weight for _, weight in editor.FREQUENT}
        for key, _, _, _, _, _, priority, reasons in self.index['records']:
            self.assertIsInstance(priority, int, key)
            self.assertEqual(len(set(reasons)), len(reasons), key)
            self.assertLessEqual(set(reasons), set(editor.REASONS), key)
            # What is left when the fixed weights are taken away is the frequency's band, or nothing.
            rest = priority - sum(editor.REASONS[code] for code in reasons if code != 'frequent')
            if 'frequent' in reasons:
                self.assertIn(rest, bands, key)
            else:
                self.assertEqual(rest, 0, key)
            # The weightiest reason first.
            weights = [rest if code == 'frequent' else editor.REASONS[code] for code in reasons]
            self.assertEqual(weights, sorted(weights, reverse=True), key)
        rows = {row[0]: row for row in self.index['records']}
        # et is the second lemma of the frequency list, and "and" is in the first category.
        self.assertEqual(rows['and'][6:], [editor.FREQUENT[0][1] + editor.DAILY, ['frequent', 'daily']])
        self.assertEqual(editor.frequency_ranks(self.site)['and'], 2)

    def test_risk_sets_the_band_and_the_editors_own_list_only_orders_inside_it(self):
        """Jack, 16 November 2026, on the first order, which put his own list before everything:
        "it is giving me words like mālum, really? come on". An attested word is not read first
        because he says it often: the band comes from the risk, the list from --mine adds a
        little inside the band, and an id that is no record is ignored."""
        rows = self.index['records']
        mine = [row for row in rows if 'mine' in row[7]]
        self.assertEqual(sorted(row[0] for row in mine), ['perhaps', 'soap'])
        plain = editor.priorities(self.site)
        self.assertFalse(any('mine' in reasons for _, reasons in plain.values()))
        self.assertEqual(plain['soap'][0], editor.priorities(self.site, mine=MINE)['soap'][0] - editor.MINE)
        # The list weighs no more than a very frequent word, and no use makes a band.
        self.assertLessEqual(editor.MINE, editor.FREQUENT[0][1])
        self.assertEqual(editor.band(['mine', 'frequent', 'daily']), 0)
        self.assertEqual([editor.band([code]) for code in ('ours', 'unsourced', 'quantity', 'recent', 'kind', 'composed', 'phrase')],
                         [3, 3, 3, 2, 2, 1, 1])
        self.assertEqual(editor.band(['frequent', 'composed', 'recent']), 2)
        self.assertEqual(editor.band([]), 0)
        self.assertLessEqual(set(editor.BANDS), set(editor.REASONS))
        # The page is given the table, so that it and the script cannot disagree.
        self.assertEqual(self.index['bands'], editor.BANDS)
        # As the lexicon stands: a few hundred entries call for a judgement, and most have nothing of ours.
        sizes = [sum(editor.band(row[7]) == band for row in rows) for band in (3, 2, 1, 0)]
        self.assertTrue(100 < sizes[0] < 1000 < sizes[3], sizes)
        # apple, an attested word with one sentence of ours, is in the lowest band but one.
        self.assertEqual(editor.band(next(row for row in rows if row[0] == 'apple')[7]), 1)

    def test_the_list_is_read_from_a_file_outside_the_repository(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'mine.txt'
            path.write_text('soap\n\n# a comment\n  perhaps \nsoap\n', encoding='utf-8')
            self.assertEqual(editor.read_mine(path), ['soap', 'perhaps'])
        with self.assertRaisesRegex(ValueError, 'private'):
            editor.read_mine(ROOT / 'README.md')

    def test_a_word_of_ours_outranks_an_attested_one_otherwise_equal_and_the_weights_are_named(self):
        def record(key, period, **more):
            return {'id': key, 'english': 'thing', 'pos': 'noun', 'domain': 'natura', 'sources': ['A book.'],
                    'terms': [{'latin': 'xyzzum, xyzzī n.', 'status': 'recommended', 'period': period, 'evidence': ['Cic. Off. 1.1']}],
                    'review': {'status': 'draft', 'date': '2026-11-16', 'by': 'Claude'}, **more}
        site = {'catalog': {'filters': ['all', 'sermo']},
                'records': {r['id']: r for r in (
                    record('t-attested', 'classical'), record('t-ours', 'ours'), record('t-modern', 'modern'),
                    record('t-unsourced', 'classical', sources=[]), record('t-daily', 'classical', domain='sermo'),
                    record('t-composed', 'classical', phrases=[{'latin': 'Xyzzum cape.', 'english': 'Take it.', 'source': 'composed'}]),
                    record('t-quoted', 'classical', phrases=[{'latin': 'Xyzzum cape.', 'english': 'Take it.', 'source': 'composed'},
                                                             {'latin': 'Xyzzum cēpit.', 'english': 'He took it.', 'source': 'Cic. Off. 1.1'}]),
                    record('t-note', 'classical', notes={'a': {'form': 'xyzzum', 'claim': 'short y', 'against': 'Lewis &amp; Short', 'html': ''}}))}}
        site['records']['t-phrase'] = dict(record('t-phrase', 'classical'), terms=[
            {'latin': 'xyzzum (xyzum) magnum', 'status': 'recommended', 'period': 'classical', 'evidence': ['Andresian p. 9']}])
        ranked = editor.priorities(site)
        self.assertEqual(ranked['t-attested'], (0, []))
        self.assertEqual(ranked['t-ours'], (editor.OURS, ['ours']))
        self.assertEqual(ranked['t-modern'], (editor.RECENT, ['recent']))
        self.assertEqual(ranked['t-unsourced'], (editor.UNSOURCED, ['unsourced']))
        self.assertEqual(ranked['t-daily'], (editor.DAILY, ['daily']))
        self.assertEqual(ranked['t-composed'], (editor.COMPOSED, ['composed']))
        # One sentence of ours is enough, whatever else is quoted.
        self.assertEqual(ranked['t-quoted'], (editor.COMPOSED, ['composed']))
        self.assertEqual(ranked['t-note'], (editor.QUANTITY, ['quantity']))
        # Evidence that is Andresian's alone counts as recent, and two words for one as a phrase.
        self.assertEqual(ranked['t-phrase'], (editor.RECENT + editor.PHRASE, ['recent', 'phrase']))
        # The numbers are the script's named constants: change one and the order changes with it.
        with mock.patch.object(editor, 'OURS', 0):
            self.assertEqual(editor.priorities(site)['t-ours'], (0, []))
        for name in ('MINE', 'DAILY', 'OURS', 'RECENT', 'QUANTITY', 'KIND', 'UNSOURCED', 'COMPOSED', 'PHRASE'):
            self.assertIsInstance(getattr(editor, name), int, name)
            self.assertGreater(getattr(editor, name), 0, name)
        self.assertEqual([limit for limit, _ in editor.FREQUENT], [1000, 2000, 5000])
        self.assertEqual(sorted((w for _, w in editor.FREQUENT), reverse=True), [w for _, w in editor.FREQUENT])
        # A record the answer-kinds script lists carries that reason.
        suspect = next(editor.answer_kinds.suspects(ROOT))[0]['id']
        self.assertIn('kind', editor.priorities(self.site)[suspect][1])

    def test_each_entry_is_in_its_category_as_the_site_draws_it_without_links(self):
        seen = set()
        for category in self.index['categories']:
            entries = self.chunk(category['id'])
            for key, html in entries.items():
                self.assertEqual(self.records[key]['domain'], category['id'])
                self.assertNotIn('<a ', html)
                self.assertNotIn('</a>', html)
                self.assertNotIn('class="suggest"', html)
                # Nor the words of the link to "How to read the sources", which would stand there dead.
                self.assertNotIn('how-sources', html)
                self.assertNotIn('How to read the sources', html)
                self.assertIn(f'data-rev="{editor.builder.record_revision(self.records[key])}"', html)
            self.assertFalse(seen & set(entries))
            seen |= set(entries)
        self.assertEqual(seen, set(self.records))
        soap = self.chunk(self.records['soap']['domain'])['soap']
        self.assertIn('<h1 class="hw">soap', soap)
        self.assertIn('class="lemma" lang="la"', soap)
        self.assertRegex(soap, r'<footer class="c-sources">.*(Not yet reviewed\.|Reviewed )')

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
