"""Run with python3 -m unittest discover -s tests -v."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(name, root):
    spec = importlib.util.spec_from_file_location(name, root / f'scripts/{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


LS = ('<a href="https://logeion.uchicago.edu/{0}" rel="noopener noreferrer" target="_blank">'
      'Lewis &amp; Short: {0}</a>')


def card(key, latin, html, link='cesso'):
    return {'id': key, 'english': 'Test', 'latin': latin, 'tags': [], 'blocks': [
        {'type': 'list', 'items': [{'html': html}]},
        {'type': 'sources', 'summary': 'Sources & evidence', 'paragraphs': [LS.format(link)]}]}


class ConvertTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        for path in ('data', 'src', 'scripts'):
            shutil.copytree(ROOT / path, self.root / path)
        self.cc = load('convert_cards', self.root)
        entries = [card('entry-90001', 'cessō', '<strong lang="la">cessō, cessāre</strong> — be idle; '
                        '<strong lang="la">Nōlī cessāre.</strong> — Don’t dawdle.'),
                   card('entry-90002', 'ōtium', '<strong lang="la">ōtium, ōtiī n.</strong> — leisure.', 'otium')]
        path = self.root / 'data/entries/labor.json'
        path.write_text(self.cc.dump(json.loads(path.read_text(encoding='utf-8')) + entries), encoding='utf-8')
        record = json.loads((self.root / 'data/concepts/trousers.json').read_text(encoding='utf-8'))
        record['related'] = ['entry-90001']
        (self.root / 'data/concepts/trousers.json').write_text(self.cc.dump(record), encoding='utf-8')
        self.spec = {'batch': 'test', 'cards': ['entry-90001'], 'records': [{
            'id': 'be-idle', 'english': 'be idle', 'pos': 'verb', 'domain': 'labor',
            'terms': [{'latin': 'cessō, cessāre', 'status': 'recommended', 'period': 'classical'}],
            'phrases': [{'latin': 'Nōlī cessāre.', 'english': 'Don’t dawdle.', 'source': 'composed'}],
            'sources': [LS.format('cesso')], 'replaces': ['entry-90001']}]}

    def problems(self, spec):
        return self.cc.check(spec, self.root)[0]

    def test_a_faithful_batch_is_written_and_rewires_related_links(self):
        problems, plan = self.cc.check(self.spec, self.root)
        self.assertEqual(problems, [])
        for path, text in self.cc.apply(self.spec, plan, self.root, today='2026-11-09').items():
            path.write_text(text, encoding='utf-8')
        self.cc.build_checks(self.root)
        record = json.loads((self.root / 'data/concepts/be-idle.json').read_text(encoding='utf-8'))
        self.assertEqual(record['review'], {'status': 'draft', 'date': '2026-11-09', 'by': 'Claude'})
        entries = json.loads((self.root / 'data/entries/labor.json').read_text(encoding='utf-8'))
        self.assertNotIn('entry-90001', [e['id'] for e in entries])
        trousers = json.loads((self.root / 'data/concepts/trousers.json').read_text(encoding='utf-8'))
        self.assertEqual(trousers['related'], ['be-idle'])

    def test_a_changed_macron_shows_as_added_and_dropped(self):
        spec = json.loads(json.dumps(self.spec))
        spec['records'][0]['terms'][0]['latin'] = 'cēssō, cessāre'
        problems = '\n'.join(self.problems(spec))
        self.assertIn('“cēssō” in the term', problems)
        self.assertIn('the Latin “cessō”', problems)

    def test_dropped_latin_altered_examples_and_lost_links_are_caught(self):
        spec = json.loads(json.dumps(self.spec))
        spec['records'][0]['phrases'][0]['latin'] = 'Nōlī cessāre, puer.'
        spec['records'][0]['sources'] = ['Our test.']
        problems = '\n'.join(self.problems(spec))
        self.assertIn('does not occur word for word', problems)
        self.assertIn('the link https://logeion.uchicago.edu/cesso is in no record', problems)
        spec['added'] = {'Nōlī cessāre, puer.': 'test'}
        spec['dropped'] = {'https://logeion.uchicago.edu/cesso': 'test'}
        self.assertNotIn('word for word', '\n'.join(self.problems(spec)))

    def test_every_card_is_replaced_once_and_ids_are_new(self):
        spec = json.loads(json.dumps(self.spec))
        spec['records'][0]['replaces'] = []
        spec['records'][0]['id'] = 'trousers'
        problems = '\n'.join(self.problems(spec))
        self.assertIn('entry-90001 must be in exactly one record', problems)
        self.assertIn('Record trousers exists already: extend it instead', problems)

    def test_an_existing_record_can_be_extended(self):
        spec = {'batch': 'test', 'cards': ['entry-90002'], 'extend': [{
            'id': 'trousers', 'terms': [{'latin': 'ōtium, ōtiī n.', 'status': 'alternative', 'period': 'classical'}],
            'sources': [LS.format('otium')], 'replaces': ['entry-90002']}]}
        problems, plan = self.cc.check(spec, self.root)
        self.assertEqual(problems, [])
        files = self.cc.apply(spec, plan, self.root)
        trousers = json.loads(files[self.root / 'data/concepts/trousers.json'])
        self.assertEqual(trousers['terms'][-1]['latin'], 'ōtium, ōtiī n.')
        self.assertEqual(trousers['review']['status'], 'draft')

    def test_rewire_follows_replaced_cards(self):
        record = json.loads((self.root / 'data/concepts/socks.json').read_text(encoding='utf-8'))
        record['related'] = ['entry-58']   # converted in batch 1 to records; get-dressed replaces it
        (self.root / 'data/concepts/socks.json').write_text(self.cc.dump(record), encoding='utf-8')
        self.assertIn('socks', self.cc.rewire(self.root))
        self.assertEqual(json.loads((self.root / 'data/concepts/socks.json').read_text(encoding='utf-8'))['related'], ['get-dressed'])


if __name__ == '__main__':
    unittest.main()
