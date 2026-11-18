"""Run with python3 -m unittest discover -s tests -v."""
import contextlib
import datetime
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('apply_review', ROOT / 'scripts/apply_review.py')
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
revision = review.builder.record_revision

T = int(datetime.datetime(2026, 11, 14, 16, 0, tzinfo=datetime.timezone.utc).timestamp() * 1000)


class ApplyReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'data/concepts').mkdir(parents=True)
        for key in ('soap', 'perhaps', 'cooking-pot'):
            shutil.copy(ROOT / f'data/concepts/{key}.json', self.root / f'data/concepts/{key}.json')
            # The editor's verdicts change the data every day (perhaps was reviewed on 16 November
            # 2026): each test starts from drafts in its own copy, whatever the records say.
            record = self.record(key)
            record['review'] = {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'}
            self.save(record)

    def record(self, key):
        return json.loads((self.root / f'data/concepts/{key}.json').read_text(encoding='utf-8'))

    def save(self, record):
        (self.root / f'data/concepts/{record["id"]}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    def verdict(self, key, kind='ok', **more):
        return {'id': key, 'rev': revision(self.record(key)), 'verdict': kind, 'reasons': [], 'note': '', 't': T, **more}

    def report(self, *verdicts):
        """A report as review.html writes it, in the middle of a chat message."""
        return ('Here is today’s review, thank you.\n\nLexicon review report, 14 November 2026: 1 marked right, 1 flagged.\n'
                'To apply it: python3 scripts/apply_review.py (see docs/review.md).\n\nFlagged:\n- soap (c/soap.html): vowel length\n\n'
                '```json\n{"lexicon-review":1,"verdicts":[\n' + ',\n'.join(json.dumps(v, ensure_ascii=False) for v in verdicts) + '\n]}\n```\n\nSent from my iPhone')

    def flags(self):
        return (self.root / 'notes/review-flags.md').read_text(encoding='utf-8')

    def test_the_report_is_found_in_the_text_around_it(self):
        verdicts = [self.verdict('soap'), self.verdict('perhaps', 'flag', reasons=['quantity'], note='short e?')]
        self.assertEqual(review.read_report(self.report(*verdicts)), verdicts)
        # Without the fence, and on one line, as a chat may hand it on.
        self.assertEqual(review.read_report('see: {"lexicon-review": 1, "verdicts": []} thanks'), [])

    def test_a_malformed_report_is_refused(self):
        good = self.verdict('soap')
        cases = {
            'No review report found': 'Nothing to see here.',
            'cannot be read': '{"lexicon-review":1,"verdicts":[{"id":"soap",',
            'Unknown report version': '{"lexicon-review":2,"verdicts":[]}',
            'no list of verdicts': '{"lexicon-review":1}',
            'no record id': json.dumps({'lexicon-review': 1, 'verdicts': [{**good, 'id': '../etc'}]}),
            'has no revision': json.dumps({'lexicon-review': 1, 'verdicts': [{**good, 'rev': 'latest'}]}),
            'neither "ok" nor "flag"': json.dumps({'lexicon-review': 1, 'verdicts': [{**good, 'verdict': 'reviewed'}]}),
            'has no time': json.dumps({'lexicon-review': 1, 'verdicts': [{k: v for k, v in good.items() if k != 't'}]}),
            'unknown reasons': json.dumps({'lexicon-review': 1, 'verdicts': [{**good, 'reasons': ['spelling']}]}),
            'not YYYY-MM-DD': json.dumps({'lexicon-review': 1, 'verdicts': [{**good, 'date': '14 November'}]}),
        }
        for message, text in cases.items():
            with self.subTest(message=message), self.assertRaisesRegex(review.Malformed, message):
                review.read_report(text)
        # From the command line: nothing is written, and the exit is not zero.
        path = self.root / 'report.txt'
        path.write_text('{"lexicon-review":1,"verdicts":[{"id":"soap"}]}', encoding='utf-8')
        errors = io.StringIO()
        with contextlib.redirect_stderr(errors):
            self.assertEqual(review.main([str(path), '--root', str(self.root)]), 1)
        self.assertIn('Not applied', errors.getvalue())
        self.assertEqual(self.record('soap')['review']['status'], 'draft')
        self.assertFalse((self.root / 'notes/review-flags.md').exists())

    def test_looks_right_marks_the_record_reviewed_and_keeps_its_revision(self):
        before = self.record('soap')
        raw = (self.root / 'data/concepts/cooking-pot.json').read_text(encoding='utf-8')
        done = review.apply([self.verdict('soap', date='2026-11-15')], self.root)
        self.assertEqual(done['reviewed'], ['soap'])
        after = self.record('soap')
        self.assertEqual(after['review'], {'status': 'reviewed', 'date': '2026-11-15', 'by': 'Jack'})
        self.assertEqual({k: v for k, v in after.items() if k != 'review'}, {k: v for k, v in before.items() if k != 'review'})
        self.assertEqual(list(after), list(before), 'the fields keep their order')
        self.assertEqual(revision(after), revision(before), 'marking it reviewed does not change the revision')
        self.assertTrue((self.root / 'data/concepts/soap.json').read_text(encoding='utf-8').endswith('}\n'))
        self.assertEqual((self.root / 'data/concepts/cooking-pot.json').read_text(encoding='utf-8'), raw, 'other records are untouched')
        # Without the device's date, the day of the verdict's time; another reviewer by name.
        review.apply([self.verdict('perhaps')], self.root, by='Raya')
        self.assertEqual(self.record('perhaps')['review'], {'status': 'reviewed', 'date': '2026-11-14', 'by': 'Raya'})
        # Applied twice, nothing more happens.
        again = review.apply([self.verdict('soap', date='2026-11-16')], self.root)
        self.assertEqual((again['reviewed'], again['already']), ([], ['soap']))
        self.assertEqual(self.record('soap')['review']['date'], '2026-11-15')

    def test_looks_right_is_refused_for_a_record_that_has_changed_since(self):
        verdict = self.verdict('soap')
        record = self.record('soap')
        record['terms'][0]['gloss'] = 'soap, in bars'
        self.save(record)
        done = review.apply([verdict], self.root)
        self.assertEqual((done['reviewed'], done['changed']), ([], ['soap']))
        self.assertEqual(self.record('soap')['review']['status'], 'draft')
        self.assertIn('NOT marked reviewed: soap', review.summary(done))

    def test_a_flag_is_written_newest_first_and_reopens_a_reviewed_record(self):
        review.apply([self.verdict('soap')], self.root)
        first = self.verdict('perhaps', 'flag', reasons=['quantity', 'example'], note='final e:\n short or long?', date='2026-11-14')
        done = review.apply([first], self.root)
        self.assertEqual((done['flagged'], done['reopened']), (['perhaps'], []))
        line = next(line for line in self.flags().splitlines() if line.startswith('- '))
        self.assertTrue(line.startswith(f'- 2026-11-14 · **perhaps** · [`perhaps`]({review.builder.SITE_URL}c/perhaps.html) · rev `{first["rev"]}` · '
                                        'vowel length, example · “final e: short or long?”'), line)
        self.assertEqual(self.record('perhaps')['review']['status'], 'draft')
        # A later flag goes above it; a reviewed record that is flagged is a draft again.
        second = self.verdict('soap', 'flag', t=T + 86400000, date='2026-11-15')
        done = review.apply([second, first], self.root)
        self.assertEqual((done['flagged'], done['reopened'], done['repeated']), (['soap'], ['soap'], ['perhaps']))
        self.assertEqual(self.record('soap')['review'], {'status': 'draft', 'date': '2026-11-15', 'by': 'Jack'})
        lines = [line for line in self.flags().splitlines() if line.startswith('- ')]
        self.assertEqual(len(lines), 2)
        self.assertIn('**soap**', lines[0])
        self.assertIn('no reason given', lines[0])
        self.assertIn('**perhaps**', lines[1])
        self.assertTrue(self.flags().startswith('# Flagged entries'))
        # A flag on a text that has changed since says so; an unknown record is reported, not fatal.
        stale = self.verdict('cooking-pot', 'flag', reasons=['word'], t=T + 2 * 86400000)
        record = self.record('cooking-pot')
        record['also'] = record.get('also', []) + ['stewpot']
        self.save(record)
        done = review.apply([stale, {**stale, 'id': 'no-such-record'}], self.root)
        self.assertEqual((done['flagged'], done['unknown']), (['cooking-pot'], ['no-such-record']))
        self.assertIn('(the entry has changed since) · wrong word', self.flags().splitlines()[9])

    def test_a_report_that_is_not_the_editors_gives_flags_and_marks_nothing_reviewed(self):
        """Only the editor reviews (Jack, 15 November 2026): with flags_only a report's "looks
        right" is left out and counted, and its flags are written as ever."""
        done = review.apply([self.verdict('soap'), self.verdict('perhaps', 'flag', reasons=['meaning'])], self.root, flags_only=True)
        self.assertEqual(done['ignored'], ['soap'])
        self.assertEqual(done['reviewed'], [])
        self.assertEqual(done['flagged'], ['perhaps'])
        self.assertEqual(self.record('soap')['review']['status'], 'draft')
        self.assertIn('**perhaps**', self.flags())
        self.assertIn('1 verdict of "looks right" left out: only the editor reviews: soap', review.summary(done))
        with contextlib.redirect_stdout(io.StringIO()) as out:
            path = self.root / 'report.txt'
            path.write_text(self.report(self.verdict('cooking-pot')), encoding='utf-8')
            self.assertEqual(review.main([str(path), '--flags-only', '--root', str(self.root)]), 0)
        self.assertIn('left out', out.getvalue())
        self.assertEqual(self.record('cooking-pot')['review']['status'], 'draft')

    def test_from_the_command_line(self):
        path = self.root / 'report.txt'
        path.write_text(self.report(self.verdict('soap'), self.verdict('perhaps', 'flag', reasons=['meaning'])), encoding='utf-8')
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertEqual(review.main([str(path), '--root', str(self.root)]), 0)
        self.assertIn('1 record marked reviewed: soap', out.getvalue())
        self.assertIn('1 flag written to notes/review-flags.md: perhaps', out.getvalue())
        self.assertIn('Rebuild the site', out.getvalue())
        self.assertEqual(self.record('soap')['review']['by'], 'Jack')

    def test_the_flags_file_in_the_repository_has_its_head(self):
        text = (ROOT / 'notes/review-flags.md').read_text(encoding='utf-8')
        self.assertTrue(text.startswith('# Flagged entries'))
        self.assertIn(review.MARK, text)


if __name__ == '__main__':
    unittest.main()
