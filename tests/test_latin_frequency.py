"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('latin_frequency', ROOT / 'scripts/latin_frequency.py')
lf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lf)


def line(number, form, lemma, upos, xpos, variant='', link='', sentence='S-1'):
    """A token line of the corpus: fifteen columns, or thirteen where the file is not linked."""
    misc = 'CitationHierarchy=Liber_1' + (f'|LASLAVariant={variant}' if variant else '')
    cells = [number, form, lemma, upos, xpos, '_', '_', '_', '_', misc, 'x', sentence, '1']
    if link is not None:
        cells += [link, 'TokenURI=http://example.org/t']
    return '\t'.join(cells)


def write(folder, name, sentences):
    text = ''
    for i, tokens in enumerate(sentences, 1):
        text += f'# sent_id = S-{i}\n# text = …\n' + '\n'.join(tokens) + '\n\n'
    (folder / name).write_text(text, encoding='utf-8')


class CorpusTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        folder = Path(self.tmp.name)
        write(folder, 'Vergilius_Eclogae_VergEclo.conllup', [
            [line('1', 'Tityre', 'tityrus', 'PROPN', 'A2', 'N', 'lilaLemma:1'),
             line('2', 'dicit', 'dico', 'VERB', 'B3', '2', 'lilaLemma:20'),
             line('3', 'dicat', 'dico', 'VERB', 'B1', '1', 'lilaLemma:10'),
             line('4', 'Romana', 'romanus', 'ADJ', 'C1', 'A', 'lilaLemma:2'),
             line('5', 'xiii', 'xiii', 'NUM', 'D', '', 'lilaLemma:3'),
             line('6', 'καὶ', 'καὶ', 'X', '', '', ''),
             line('7', 'ne', 'ne', 'PART', 'O', '2', 'lilaLemma:30'),
             line('8', 'ne', 'ne', 'PART', 'P', '3', 'lilaLemma:30'),
             line('9', 'ne', 'ne', 'SCONJ', 'T', '4', 'lilaLemma:31')],
            ['9-10\tnonne\t' + '\t'.join(['_'] * 11),
             line('10', 'ne', 'ne', 'PART', 'O', '', 'lilaLemma:99'),
             line('10', 'ne', 'ne', 'PART', 'O', '', 'lilaLemma:99'),
             line('11', 'uidet', 'uideo', 'VERB', 'B2', '', 'lilaLemma:40'),
             line('11', 'uidet', 'uideo', 'VERB', 'B2', '', 'lilaLemma:40')]])
        write(folder, 'Tacitus_TacAnnales_TacAnn01.conllup', [
            [line('1', 'dixit', 'dico', 'VERB', 'B3', '2', None),          # a file without links
             line('2', 'uidet', 'uideo', 'VERB', 'B2', '', None)]])
        self.corpus = lf.Corpus(folder)

    def tearDown(self):
        self.tmp.cleanup()

    def rows(self, **kwargs):
        return {(row['lemma'], row['class']): row for row in self.corpus.lines(**kwargs)}

    def test_names_figures_and_greek_are_left_out(self):
        lemmas = {row['lemma'] for row in self.corpus.lines()}
        self.assertEqual(lemmas, {'dico', 'ne', 'nonne', 'uideo'})

    def test_homographs_are_told_apart_by_their_lila_lemma_and_uses_of_one_word_are_not(self):
        rows = self.rows()
        self.assertEqual(rows[('dico', 'B3')]['count'], 2)       # with the unlinked token, placed by its number
        self.assertEqual(rows[('dico', 'B1')]['count'], 1)
        ne = sorted(row['count'] for row in self.corpus.lines() if row['lemma'] == 'ne')
        self.assertEqual(ne, [1, 2])                             # ne 2 and ne 3 are one line, ne 4 another

    def test_a_fused_word_is_counted_once_under_its_own_lemma(self):
        rows = self.rows()
        self.assertEqual(rows[('nonne', '')]['count'], 1)
        self.assertEqual(rows[('nonne', '')]['part'], 'particle')
        self.assertEqual(rows[('uideo', 'B2')]['count'], 2)      # a repeated line once, and once in Tacitus
        self.assertEqual(rows[('uideo', 'B2')]['works'], 2)

    def test_works_are_named_and_counted_apart(self):
        self.assertEqual(lf.work_of(Path('Plinius_PliniusEpistulae_PliEp10.conllup')), ('Plinius', 'Epistulae'))
        self.assertEqual(lf.work_of(Path('Cicero_InVerremActioSecunda_Cic2Ver3.conllup')), ('Cicero', 'In Verrem Actio Secunda'))
        self.assertEqual(lf.work_of(Path('Cato_CatoAgricultura_CatAgr.conllup')), ('Cato', 'Agricultura'))
        work = self.corpus.work('eclogae')
        self.assertEqual(work, ('Vergilius', 'Eclogae'))
        self.assertEqual(self.corpus.work('Vergilius, Eclogae'), work)
        rows = {row['lemma']: row['count'] for row in self.corpus.lines(self.corpus.by_work[work]) if row['class'] != 'B1'}
        self.assertEqual(rows, {'dico': 1, 'ne': 2, 'nonne': 1, 'uideo': 1} | {'ne': rows['ne']})
        self.assertEqual(lf.slug(work), 'vergilius-eclogae')

    def test_the_list_is_written_with_its_credit(self):
        out = Path(self.tmp.name) / 'list.tsv'
        lf.write_list(self.corpus.lines(), out, 2, 'A list.')
        lines = out.read_text(encoding='utf-8').splitlines()
        self.assertIn('CC BY-NC-SA 4.0', lines[1])
        data = [l for l in lines if l[0].isdigit()]
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0].split('\t')[:5], ['1', 'dico', '2', 'verb', 'B3'])


if __name__ == '__main__':
    unittest.main()
