"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('consonantal_j', ROOT / 'scripts/consonantal_j.py')
cj = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cj)


def respell(word, latin=True):
    return cj.respell(word, latin)[0]


class ConsonantalJTests(unittest.TestCase):
    def test_data_already_uses_j(self):
        _, changes = cj.process()
        self.assertEqual({w: r['new'] for w, r in changes.made.items()}, {},
                         'Run python3 scripts/consonantal_j.py --write (see AGENTS.md)')

    def test_house_examples(self):
        for old, new in (('iam', 'jam'), ('Iam', 'Jam'), ('eius', 'ejus'), ('cuius', 'cujus'),
                         ('māior', 'major'), ('pēius', 'pejus'), ('Trōia', 'Troja'), ('Iēsus', 'Jēsus'),
                         ('Ioannēs', 'Joannēs'), ('iūs', 'jūs'), ('iuvenis', 'juvenis'), ('Iūniō', 'Jūniō'),
                         ('dēiectus', 'dējectus'), ('prōiēcit', 'prōjēcit'), ('ēiēcī', 'ējēcī'),
                         ('abicit', 'abjicit'), ('obice', 'objice'), ('dēiciō', 'dējiciō'),
                         ('subiēcit', 'subjēcit'), ('coniūnx', 'conjūnx'), ('adiuvō', 'adjuvō'),
                         ('iniūria', 'injūria'), ('obiectum', 'objectum'), ('aiō', 'ajō')):
            with self.subTest(old=old):
                self.assertEqual(respell(old), new)

    def test_vocalic_i_kept(self):
        for word in ('iō', 'iērunt', 'adiērunt', 'abiēs', 'superior', 'interior', 'Plēiades', 'Gāius',
                     'diēs', 'cliēns', 'quiēs', 'reliquiae', 'audiō', 'gaudium', 'medius', 'XVIII', 'jam'):
            with self.subTest(word=word):
                self.assertEqual(respell(word), word)

    def test_unmarked_prose_uses_only_unambiguous_rules(self):
        self.assertEqual(respell('iace', latin=False), 'jace')
        self.assertEqual(respell('conice', latin=False), 'conice')
        self.assertEqual(respell('coniungō', latin=False), 'coniungō')
        self.assertEqual(respell('Logeion', latin=False), 'Logeion')

    def test_html_respells_text_not_attributes_or_other_languages(self):
        changes = cj.Changes()
        html = ('<strong lang="la">Iam iānua</strong> — <a href="https://logeion.uchicago.edu/iam">iam</a> '
                '<span lang="bg">iam</span> &amp; coniungō')
        self.assertEqual(cj.respell_html(html, changes, 'test'),
                         '<strong lang="la">Jam jānua</strong> — <a href="https://logeion.uchicago.edu/iam">jam</a> '
                         '<span lang="bg">iam</span> &amp; coniungō')


if __name__ == '__main__':
    unittest.main()
