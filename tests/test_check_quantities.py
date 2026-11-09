"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('check_quantities', ROOT / 'scripts/check_quantities.py')
cq = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cq)


class QuantityTests(unittest.TestCase):
    def test_marked_vowels_are_compared_and_unmarked_ones_are_not(self):
        self.assertEqual(cq.compare('subligāculum', 'sublĭgācŭlum'), [])
        self.assertEqual(cq.compare('fortasse', 'fortassē'), ['e at 8: ours short, L&S long'])
        self.assertEqual(cq.compare('narrō', 'narro'), [])
        self.assertIsNone(cq.compare('caccabus', 'cācăbus'))

    def test_the_vowel_before_intervocalic_j_is_left_to_the_house_rule(self):
        self.assertEqual(cq.compare('majus', 'mājus'), [])
        self.assertEqual(cq.compare('jam', 'jam'), [])


if __name__ == '__main__':
    unittest.main()
