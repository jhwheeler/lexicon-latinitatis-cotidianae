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

    def test_a_file_under_several_licences_is_taken_under_the_first_the_builder_takes(self):
        """The Getty's files state "No restrictions" first and CC0 second (21 November 2026): the page's
        licences are read in order, each with its own address, and the first acceptable one is taken."""
        table = builder.PICTURE_LICENCES
        page = ('<td><span class="licensetpl_short">No restrictions</span><span class="licensetpl_long">No known copyright restrictions</span>'
                '<span class="licensetpl_link">http://www.getty.edu/about/opencontent.html</span></td>'
                '<td><span class="licensetpl_short">Public domain</span></td>'
                '<td><span class="licensetpl_short">CC0</span><span class="licensetpl_link">http://creativecommons.org/publicdomain/zero/1.0/deed.en</span></td>')
        found = fetch.page_licences(page)
        self.assertEqual(found, [('No restrictions', 'https://www.getty.edu/about/opencontent.html/'), ('Public domain', ''),
                                 ('CC0', 'https://creativecommons.org/publicdomain/zero/1.0/')])
        info = {'licence': found[0][0], 'licence_url': found[0][1], 'licences': found, 'title': 'File:X.jpg', 'page': 'https://commons.wikimedia.org/wiki/File:X.jpg'}
        self.assertEqual(fetch.check_licence(info, table), 'Public domain')
        info['licences'] = [found[0], found[2]]
        self.assertEqual(fetch.check_licence(info, table), 'CC0')
        info['licences'] = [found[0], ('CC BY-NC 4.0', 'https://creativecommons.org/licenses/by-nc/4.0/')]
        with self.assertRaisesRegex(SystemExit, 'No restrictions'):
            fetch.check_licence(info, table)

    def test_an_svg_is_rendered_at_the_full_width_and_a_photograph_at_the_widest_it_has(self):
        self.assertEqual(fetch.rendition_width('File:Brain human lateral view.svg', (512, 600)), fetch.RENDITION)
        self.assertEqual(fetch.rendition_width('File:Heart.jpg', (4000, 3000)), 1920)
        self.assertEqual(fetch.rendition_width('File:Heart.png', (1000, 800)), 960)
        self.assertIsNone(fetch.rendition_width('File:Small.jpg', (800, 600)))

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
