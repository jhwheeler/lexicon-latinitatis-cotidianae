"""Run with python3 -m unittest tests.test_standing_notes -v."""
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('standing_notes', ROOT / 'scripts/standing_notes.py')
standing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(standing)

LS = '<a href="https://logeion.org/fortasse" rel="noopener noreferrer" target="_blank">Lewis &amp; Short: fortasse</a>'
PERSEUS = '<a href="https://github.com/PerseusDL/canonical-latinLit" rel="noopener noreferrer" target="_blank">Perseus Latin texts</a>'


def written(record):
    return json.dumps(record, ensure_ascii=False, indent=2) + '\n'


class StandingNotesTests(unittest.TestCase):
    def record(self, sources):
        return {'id': 'perhaps', 'english': 'perhaps', 'sources': sources, 'review': {'status': 'draft', 'date': '2026-11-15', 'by': 'Claude'}}

    def test_only_the_lines_of_the_notes_change(self):
        record = self.record([
            LS,
            'Quotations marked “Lewis &amp; Short” are given as Lewis &amp; Short cites them, in the house spelling; they have not been checked against a modern edition.',
            f'Cicero, <em>De officiis</em> 1.124, checked against the {PERSEUS} (9 November 2026).',
            'The example sentences marked “composed” are ours.'])
        text, changed = standing.cleaned(written(record))
        self.assertEqual([new for _, new in changed], ['', 'Cicero, <em>De officiis</em> 1.124.', ''])
        self.assertEqual(text, written(self.record([LS, 'Cicero, <em>De officiis</em> 1.124.'])))
        # Line for line: what is not a source is untouched, and the last line loses its comma.
        before, after = written(record).split('\n'), text.split('\n')
        self.assertEqual([line for line in before if line not in after and '“' not in line and 'checked against' not in line], [])

    def test_a_record_left_without_sources_keeps_the_field(self):
        text, changed = standing.cleaned(written(self.record(['The example sentence marked “composed” is ours.'])))
        self.assertEqual(len(changed), 1)
        self.assertEqual(text, written(self.record([])))

    def test_a_record_without_them_is_not_rewritten(self):
        text = written(self.record([LS, 'Cicero as Lewis &amp; Short quotes him.'])).replace('  "id"', '  "id" ')
        self.assertEqual(standing.cleaned(text), (text, []))

    def test_the_records_carry_none(self):
        for path in sorted((ROOT / 'data/concepts').glob('*.json')):
            for source in json.loads(path.read_text(encoding='utf-8'))['sources']:
                self.assertEqual(standing.builder.without_standing_notes(source), source, path.name)


if __name__ == '__main__':
    unittest.main()
