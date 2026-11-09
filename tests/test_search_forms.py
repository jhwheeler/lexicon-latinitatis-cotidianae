"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def forms(latin):
    """Every form the search can reach a term by: each stem with each ending of its class."""
    return {stem + ending for cls, stem in builder.search_stems({'latin': latin}) for ending in builder.ENDINGS[cls]}


class SearchFormTests(unittest.TestCase):
    def assertForms(self, latin, present, absent=()):
        reached = forms(latin)
        for form in present:
            self.assertIn(form, reached, f'{form} from {latin}')
        for form in absent:
            self.assertNotIn(form, reached, f'{form} from {latin}')

    def test_nouns_of_each_declension(self):
        self.assertForms('piscīna, piscīnae f.', ['piscinam', 'piscinae', 'piscinarum', 'piscinis', 'piscinas'], ['piscinum'])
        self.assertForms('lupus, lupī m.', ['lupum', 'lupi', 'lupo', 'luporum', 'lupos'], ['lupa'])
        self.assertForms('ōvum, ōvī n.', ['ova', 'ovorum', 'ovis'])
        self.assertForms('rēx, rēgis m.', ['regem', 'regi', 'rege', 'reges', 'regum', 'regibus'])
        self.assertForms('corpus, corporis n.', ['corpora', 'corporis', 'corporibus'], ['corporem'])
        self.assertForms('manus, manūs f.', ['manum', 'manu', 'manuum', 'manibus'])
        self.assertForms('diēs, diēī m.', ['diem', 'die', 'dierum', 'diebus'])
        self.assertForms('malleus, malleī m.', ['malleum', 'malleo'])   # -eī here is the second declension
        self.assertForms('canis, canis m./f.', ['canem', 'canes', 'canibus'])
        self.assertForms('castra, castrōrum n. pl.', ['castris', 'castrorum'])

    def test_verbs_from_their_principal_parts(self):
        self.assertForms('currō, currere, cucurrī, cursum', ['currit', 'currebat', 'curram', 'curreret', 'currens', 'cucurrit',
                                                          'cucurrerunt', 'cucurrisset', 'cursurus'])
        self.assertForms('capiō, capere, cēpī, captum', ['capit', 'capiunt', 'capiebat', 'capiam', 'caperet', 'capiens', 'cepit', 'captus'])
        self.assertForms('moneō, monēre, monuī, monitum', ['monet', 'monebat', 'moneat', 'monuit', 'monitus', 'monendum'])
        self.assertForms('loquor, loquī, locūtus sum', ['loquitur', 'loquuntur', 'loquebatur', 'loqui', 'locutus'])
        self.assertForms('patior, patī, passus sum', ['patitur', 'patiuntur', 'passus'])
        # Only the first two parts: the first and fourth conjugations have a regular perfect.
        self.assertForms('dormiō, dormīre', ['dormit', 'dormiunt', 'dormiebat', 'dormivit', 'dormiit', 'dormitum'])
        self.assertForms('ambulō, ambulāre', ['ambulat', 'ambulabat', 'ambulet', 'ambulavimus', 'ambulatum'])
        # Consonantal i is folded to i, as search folds it.
        self.assertForms('adjuvō, adjuvāre, adjūvī, adjūtum', ['adiuvat', 'adiuvit', 'adiutus'])

    def test_irregular_verbs(self):
        self.assertForms('sum, esse, fuī, futūrus', ['est', 'sunt', 'erat', 'erit', 'sit', 'esset', 'fuit', 'fuerat', 'futurus'])
        self.assertForms('absum, abesse, āfuī', ['abest', 'aberat', 'afuit'])
        self.assertForms('prōsum, prōdesse, prōfuī', ['prodest', 'prosunt', 'profuit'])
        self.assertForms('possum, posse, potuī', ['potest', 'possunt', 'poterat', 'possit', 'potuit'])
        self.assertForms('volō, velle, voluī', ['vult', 'vis', 'velim', 'vellem', 'voluit'])
        self.assertForms('eō, īre, iī, itum', ['it', 'eunt', 'ibat', 'ibit', 'eamus', 'iit'])
        self.assertForms('redeō, redīre, rediī, reditum', ['redit', 'redeunt', 'redibat', 'redierunt'])
        self.assertForms('afferō, afferre, attulī, allātum', ['affert', 'afferunt', 'afferebat', 'attulit', 'allatus'])
        self.assertForms('fīō, fierī, factus sum', ['fit', 'fiunt', 'fiebat', 'fieri', 'factus'])

    def test_adjectives_and_their_degrees(self):
        self.assertForms('tepidus, tepida, tepidum', ['tepidam', 'tepidi', 'tepidior', 'tepidissimus'])
        self.assertForms('pulcher, pulchra, pulchrum', ['pulchram', 'pulchrae', 'pulchrior', 'pulcherrima'])
        self.assertForms('fūmōsus, -a, -um', ['fumosa', 'fumosum'])
        self.assertForms('grandis, grande', ['grandem', 'grandia', 'grandior', 'grandissimus'])
        self.assertForms('edāx, edācis', ['edacem', 'edaces', 'edaciter'])

    def test_phrases_and_unknown_shapes_have_no_stems(self):
        for latin in ['manūbrium jānuae', 'Quota hōra est?', 'lentē', 'malleus, serra, ascia', 'Aestuō, tata!']:
            self.assertEqual(builder.search_stems({'latin': latin}), [], latin)


if __name__ == '__main__':
    unittest.main()
