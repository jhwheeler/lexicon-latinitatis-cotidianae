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
        text = written(self.record([LS, 'Quintilian keeps his edition’s spelling <span lang="la">adfectūs</span>.'])).replace('  "id"', '  "id" ')
        self.assertEqual(standing.cleaned(text), (text, []))

    def test_a_line_only_a_person_can_put_right_is_listed_not_rewritten(self):
        # Jack, 16 November 2026: the mark "(Lewis & Short)" belongs on the quotation, and a public
        # entry does not cite a working note. The script cannot know which quotation is meant, or
        # read the source a note names: it leaves the line and says what to do.
        quoted = 'Cicero as Lewis &amp; Short quotes him.'
        note = ('<a href="https://github.com/jhwheeler/lexicon-latinitatis-cotidianae/blob/main/notes/smoothie-vocabulary-audit.md">'
                'Smoothie vocabulary: source audit and coverage</a>')
        record = self.record([LS, quoted, note])
        self.assertEqual(standing.cleaned(written(record)), (written(record), []))
        (first, advice), (second, other) = standing.by_hand(record)
        self.assertEqual((first, second), (quoted, note))
        self.assertIn('the mark belongs on the quotation: put “(Lewis &amp; Short)” at the end of that example’s source', advice)
        self.assertIn('a public entry does not cite a working note of ours', other)
        self.assertEqual(standing.by_hand(self.record([LS, 'Lewis &amp; Short has no entry for <span lang="la">chemicum</span>.'])), [])
        # A record left for the editor is not listed again and again.
        left = dict(self.record([quoted]), id=sorted(standing.builder.LEFT_FOR_THE_EDITOR)[0])
        self.assertEqual(standing.by_hand(left), [])

    def test_the_records_carry_none(self):
        left = set()
        for path in sorted((ROOT / 'data/concepts').glob('*.json')):
            record = json.loads(path.read_text(encoding='utf-8'))
            for source in record['sources']:
                self.assertEqual(standing.builder.without_standing_notes(source), source, path.name)
            self.assertEqual(standing.by_hand(record), [], path.name)
            if any(standing.builder.AS_LEWIS_AND_SHORT_QUOTES.search(source) for source in record['sources']):
                left.add(path.stem)
        # The records left for the editor still carry their line; take one out of the list when its line goes.
        self.assertEqual(left, set(standing.builder.LEFT_FOR_THE_EDITOR))


if __name__ == '__main__':
    unittest.main()
