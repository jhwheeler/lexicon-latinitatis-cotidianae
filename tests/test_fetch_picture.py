"""scripts/fetch_picture.py without the network: the crop, the licence, and the table it shares with the builder."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


fetch = load('fetch_picture', 'scripts/fetch_picture.py')
builder = load('lexicon_build_for_fetch', 'scripts/build.py')


class FetchPictureTest(unittest.TestCase):
    def test_the_licences_are_the_builders(self):
        self.assertEqual(fetch.licences(), builder.PICTURE_LICENCES)

    def test_a_licence_is_read_as_the_builder_names_it_or_refused(self):
        table = builder.PICTURE_LICENCES
        info = lambda name, url: {'licence': name, 'licence_url': fetch.licence_address(url), 'title': 'File:X.jpg', 'page': 'https://commons.wikimedia.org/wiki/File:X.jpg'}
        self.assertEqual(fetch.check_licence(info('CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0'), table), 'CC BY-SA 4.0')
        self.assertEqual(fetch.check_licence(info('CC0', 'http://creativecommons.org/publicdomain/zero/1.0/deed.en'), table), 'CC0')
        self.assertEqual(fetch.check_licence(info('Public domain', ''), table), 'Public domain')
        for name, url in (('CC BY-NC-SA 4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/'), ('GFDL', ''), ('', ''),
                          ('CC BY 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/')):
            with self.subTest(name=name), self.assertRaises(SystemExit):
                fetch.check_licence(info(name, url), table)

    def test_the_crop_is_the_largest_piece_in_the_ratio_about_the_focus(self):
        ratio = fetch.WIDTH / fetch.HEIGHT
        for size in ((1920, 1280), (1920, 2880), (1920, 900)):
            for focus in ((.5, .5), (0, 0), (1, 1), (.3, .7)):
                with self.subTest(size=size, focus=focus):
                    left, top, right, bottom = fetch.crop_box(size, focus)
                    self.assertTrue(0 <= left < right <= size[0] and 0 <= top < bottom <= size[1])
                    self.assertAlmostEqual((right - left) / (bottom - top), ratio, delta=0.01)
                    self.assertTrue(right - left == size[0] or bottom - top == size[1] or abs(bottom - top - size[1]) <= 1)
        # The centre by default; a focus near an edge moves the crop to that edge.
        self.assertEqual(fetch.crop_box((1920, 2880)), (0, 759, 1920, 2121))
        self.assertEqual(fetch.crop_box((1920, 2880), (.5, 0))[1], 0)
        # A box is kept in the ratio, about its centre.
        left, top, right, bottom = fetch.crop_box((1000, 1000), box=(.1, .1, .9, .5))
        self.assertAlmostEqual((right - left) / (bottom - top), ratio, delta=0.01)
        self.assertTrue(100 <= left and right <= 900 and 100 <= top and bottom <= 500)


if __name__ == '__main__':
    unittest.main()
