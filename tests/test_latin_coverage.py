"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('latin_coverage', ROOT / 'scripts/latin_coverage.py')
lc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lc)


def record(id, pos, *terms):
    return {'id': id, 'pos': pos, 'terms': [{'latin': latin, 'status': status} for latin, status in terms]}


RECORDS = [
    record('say', 'verb', ('dīcō, dīcere, dīxī, dictum', 'recommended')),
    record('see', 'verb', ('videō, vidēre, vīdī, vīsum', 'recommended')),
    record('and', 'conjunction', ('atque (ac)', 'recommended'), ('-que', 'alternative')),
    record('from', 'preposition', ('ā, ab (+ ablative)', 'recommended')),
    record('throw-to', 'verb', ('adjiciō, adjicere, adjēcī, adjectum', 'recommended')),
    record('bring-to', 'verb', ('afferō, afferre, attulī, allātum', 'recommended')),
    record('deserve', 'verb', ('mereō, merēre, meruī, meritum', 'recommended')),
    record('few', 'adjective', ('paucī, paucae, pauca', 'recommended')),
    record('resources', 'noun', ('opēs, opum f. pl.', 'recommended')),
    record('honourable', 'adjective', ('honestus, honesta, honestum', 'recommended')),
    record('quickly', 'adverb', ('cito', 'recommended')),
    record('breathe', 'verb', ('spīrāre', 'recommended')),
    record('state', 'noun', ('rēs pūblica, reī pūblicae f.', 'recommended')),
    record('attend', 'verb', ('attendō, attendere, attendī, attentum', 'avoid'), ('adsum, adesse, adfuī', 'recommended')),
    record('pot', 'noun', ('caccabus (cacabus), caccabī m.', 'recommended')),
    record('god', 'noun', ('deus, deī m.', 'recommended')),
]


class CoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lexicon = lc.Lexicon(ROOT, RECORDS)

    def status(self, lemma, cls='', part=''):
        return lc.find(lemma, cls, self.lexicon, part).status

    def test_the_comparison_folds_as_the_search_does(self):
        self.assertEqual(lc.fold('Vīdī'), 'uidi')
        self.assertEqual(lc.fold('jūs'), 'ius')
        self.assertEqual(lc.fold('-que'), 'que')

    def test_a_head_is_found_whatever_the_corpus_writes_for_v_and_j(self):
        self.assertEqual(self.status('uideo', 'B2', 'verb'), 'covered')
        self.assertEqual(self.status('que', '', 'conjunction'), 'covered')
        self.assertEqual(self.status('cacabus', 'A2', 'noun'), 'covered')
        self.assertEqual(self.status('deus', 'A2', 'noun'), 'covered')

    def test_other_spellings_voices_and_numbers(self):
        self.assertEqual(self.status('ac'), 'spelling')
        self.assertEqual(self.status('ab'), 'spelling')
        self.assertEqual(self.status('adicio', 'B5', 'verb'), 'spelling')
        self.assertEqual(self.status('adfero', 'B6', 'verb'), 'spelling')
        self.assertEqual(self.status('mereor', 'B2', 'verb'), 'voice')
        self.assertEqual(self.status('paucus', 'C1', 'adjective'), 'number')
        self.assertEqual(self.status('ops', 'A3', 'noun'), 'number')
        self.assertEqual(self.status('spiro', 'B1', 'verb'), 'covered')

    def test_a_noun_the_corpus_makes_of_an_adjective_is_covered_by_the_adjective(self):
        self.assertEqual(self.status('honestum', 'A2', 'noun'), 'substantive')

    def test_another_word_spelt_alike_is_not_covered(self):
        self.assertEqual(self.status('dico', 'B3', 'verb'), 'covered')
        self.assertEqual(self.status('dico', 'B1', 'verb'), 'homograph')
        self.assertEqual(self.status('cito', 'B1', 'verb'), 'homograph')
        self.assertEqual(self.status('cito', '', 'adverb'), 'covered')

    def test_a_term_to_avoid_or_a_word_inside_a_longer_term_is_not_an_entry(self):
        self.assertEqual(self.status('attendo', 'B3', 'verb'), 'avoid')
        found = lc.find('publicus', 'C1', self.lexicon, 'adjective')
        self.assertEqual((found.status, found.how), ('missing', '*'))
        self.assertEqual(self.status('casa', 'A1', 'noun'), 'missing')

    def test_the_class_is_read_from_the_dictionary_form(self):
        self.assertEqual(lc.term_class('videō, vidēre, vīdī, vīsum'), 'B2')
        self.assertEqual(lc.term_class('capiō, capere, cēpī, captum'), 'B5')
        self.assertEqual(lc.term_class('volō, velle, voluī'), 'B6')
        self.assertEqual(lc.term_class('eō, īre, iī (īvī), itum'), 'B6')
        self.assertEqual(lc.term_class('audiō, audīre, audīvī, audītum'), 'B4')
        self.assertEqual(lc.term_class('loquor, loquī, locūtus sum'), 'B3')
        self.assertEqual(lc.term_class('Deus, Deī m.'), 'A2')
        self.assertEqual(lc.term_class('rēs, reī f.'), 'A5')
        self.assertEqual(lc.term_class('opēs, opum f. pl.'), 'A3')
        self.assertEqual(lc.term_class('bonus, bona, bonum'), '')
        self.assertEqual(lc.term_class('fortasse'), '')

    def test_the_report_counts_and_lists(self):
        rows = [{'rank': 1, 'lemma': 'uideo', 'count': 9, 'part': 'verb', 'class': 'B2', 'works': '1', 'link': '', 'forms': 'uidet'},
                {'rank': 2, 'lemma': 'casa', 'count': 5, 'part': 'noun', 'class': 'A1', 'works': '1', 'link': '', 'forms': 'casa'},
                {'rank': 3, 'lemma': 'dico', 'count': 3, 'part': 'verb', 'class': 'B1', 'works': '1', 'link': '', 'forms': 'dicat'}]
        text = lc.report(lc.measure(rows, self.lexicon), 'a list')
        self.assertIn('| 3 | 1 (33%)', text)
        self.assertIn('2. casa (5)', text)
        self.assertIn('## Another word spelt alike: 1', text)


if __name__ == '__main__':
    unittest.main()
