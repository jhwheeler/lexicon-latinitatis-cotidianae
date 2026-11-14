"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('answer_kinds', ROOT / 'scripts/answer_kinds.py')
answers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(answers)


class AnswerKindTests(unittest.TestCase):
    def test_the_kind_of_an_answer_is_read_from_its_form(self):
        for latin, kind in (
                ('jugum, jugī n.', 'noun'), ('cūnae, cūnārum f. pl.', 'noun'), ('auctor, auctōris m./f.', 'noun'),
                ('cōnfīdō, cōnfīdere, cōnfīsus sum', 'verb'), ('prōgredior, prōgredī, prōgressus sum', 'verb'),
                ('laetus, laeta, laetum', 'adjective'), ('illūstris, illūstre', 'adjective'), ('pār, paris', 'adjective'),
                ('perpetuīs jugīs tendere', 'verb phrase'), ('ratiōnem reddere', 'verb phrase'), ('apud sē esse', 'verb phrase'),
                ('Calidum est.', 'sentence'), ('Heus!', 'sentence'),
                ('appetentia cibī', ''), ('montēs perpetuī', ''), ('secundum + acc.', ''), ('statim', '')):
            with self.subTest(latin=latin):
                self.assertEqual(answers.kind({'latin': latin}), kind)
        # A term's own grammar line decides where it has one.
        self.assertEqual(answers.kind({'latin': 'interest', 'grammar': 'verb: impersonal, from intersum'}), 'verb')
        self.assertEqual(answers.kind({'latin': 'statim', 'grammar': 'adverb, with the verb'}), 'adverb')

    def test_a_noun_answered_by_a_verb_is_reported_and_one_that_fits_is_not(self):
        suspects = {record['id']: found for record, _, found in answers.suspects()}
        self.assertNotIn('mountain-range', suspects)   # montēs perpetuī, since 14 November 2026
        self.assertNotIn('confidence', suspects)       # fīdūcia leads; cōnfīdō is the alternative
        self.assertEqual(suspects.get('accountability'), 'verb phrase')   # ratiōnem reddere: Latin has the verb


if __name__ == '__main__':
    unittest.main()
