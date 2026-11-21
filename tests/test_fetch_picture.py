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

    def test_a_file_exactly_a_standard_width_takes_the_next_smaller_one(self):
        """Asked for its own width, Wikimedia sends the unscaled original, which it refuses to this
        machine (21 November 2026): a file 1920 pixels wide is asked for at 1280, one 1280 wide at
        960. The narrowest standard width stays the least a file may have."""
        self.assertEqual(fetch.rendition_width('File:Plate.jpg', (1920, 1280)), 1280)
        self.assertEqual(fetch.rendition_width('File:Plate.jpg', (1921, 1280)), 1920)
        self.assertEqual(fetch.rendition_width('File:Plate.jpg', (1280, 960)), 960)
        self.assertEqual(fetch.rendition_width('File:Plate.jpg', (960, 640)), 960)
        self.assertIsNone(fetch.rendition_width('File:Plate.jpg', (959, 640)))
        self.assertEqual(fetch.rendition_width('File:Plate.svg', (1920, 1280)), fetch.RENDITION)

    def test_the_previews_are_written_from_the_pictures_and_kept_up_to_date(self):
        """Every picture has a preview, data/chartae-previews/<id>.jpg (21 November 2026), written with the
        picture and by --previews for the rest: 144 by 102, naming the picture it was made from, so that
        the builder can tell a preview older than its picture. Needs Pillow, as fetching a picture does."""
        try:
            from PIL import Image
        except ImportError:
            self.skipTest('Pillow is not installed')
        import io, shutil, tempfile
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'src/chartae').mkdir(parents=True)
            for name in ('una.jpg', 'altera.jpg'):
                Image.new('RGB', (720, 511), (200, 120, 40) if name == 'una.jpg' else (40, 90, 160)).save(root / 'src/chartae' / name, 'JPEG', quality=80)
            (root / builder.PREVIEWS).mkdir(parents=True)
            (root / builder.PREVIEWS / 'gone.jpg').write_bytes(b'x')
            self.assertEqual(fetch.write_previews(root), (['altera.jpg', 'una.jpg'], ['gone.jpg']))
            preview = (root / builder.PREVIEWS / 'una.jpg').read_bytes()
            self.assertEqual(Image.open(io.BytesIO(preview)).size, builder.PREVIEW_SIZE)
            self.assertEqual(builder.jpeg_comment(preview), builder.preview_mark((root / 'src/chartae/una.jpg').read_bytes()))
            self.assertLessEqual(len(preview), builder.PREVIEW_MOST)
            # Nothing to do the second time; a picture replaced gets a new preview, and only it.
            self.assertEqual(fetch.write_previews(root), ([], []))
            shutil.copy(root / 'src/chartae/altera.jpg', root / 'src/chartae/una.jpg')
            self.assertFalse(fetch.preview_is_current(root / 'src/chartae/una.jpg', root))
            self.assertEqual(fetch.write_previews(root), (['una.jpg'], []))
            self.assertTrue(fetch.preview_is_current(root / 'src/chartae/una.jpg', root))

    def test_the_renditions_own_address_is_worked_out_from_the_files_name(self):
        """upload_address (21 November 2026): the folders are the first one and two hex digits of the
        MD5 of the name with underscores, and the name is encoded as MediaWiki encodes it there. The
        Dürer and Eiffel addresses are those the files' own pages link to (read 22 November 2026)."""
        self.assertEqual(fetch.upload_address('File:A small cup of coffee.JPG', 330),
                         'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/330px-A_small_cup_of_coffee.JPG')
        self.assertEqual(fetch.upload_address('A small cup of coffee.JPG', 330), fetch.upload_address('File:A small cup of coffee.JPG', 330))
        # A comma and a letter outside ASCII are percent-encoded, the letter as UTF-8.
        name = 'Albrecht_D%C3%BCrer_-_Hare%2C_1502_-_Google_Art_Project.jpg'
        self.assertEqual(fetch.upload_address('File:Albrecht Dürer - Hare, 1502 - Google Art Project.jpg', 1280),
                         f'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/{name}/1280px-{name}')
        # So are brackets.
        name = 'Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg'
        self.assertEqual(fetch.upload_address('File:Tour Eiffel Wikimedia Commons (cropped).jpg', 960),
                         f'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/{name}/960px-{name}')
        # An SVG's rendition is a PNG: ".png" is added to the name of the rendition, not of the file.
        import hashlib
        digest = hashlib.md5('Brain_human_lateral_view.svg'.encode()).hexdigest()
        self.assertEqual(fetch.upload_address('File:Brain human lateral view.svg', 1920),
                         f'https://upload.wikimedia.org/wikipedia/commons/thumb/{digest[0]}/{digest[:2]}/'
                         'Brain_human_lateral_view.svg/1920px-Brain_human_lateral_view.svg.png')

    def test_a_429_whose_wait_runs_past_the_patience_gives_up_at_once(self):
        """get (21 November 2026): a 429 asking for a wait longer than the patience left raises Busy at
        once, without sleeping; one asking for a wait within it is waited out and the request made again."""
        import email.message, io, urllib.error
        from unittest import mock

        def busy(after):
            headers = email.message.Message()
            headers['Retry-After'] = str(after)
            return urllib.error.HTTPError('https://example.org/x', 429, 'Too Many Requests', headers, None)

        url = 'https://upload.wikimedia.org/x.jpg'
        with mock.patch.object(fetch.urllib.request, 'urlopen', side_effect=[busy(3600)]) as opened, \
             mock.patch.object(fetch.time, 'sleep') as slept:
            with self.assertRaises(fetch.Busy):
                fetch.get(url, patience=60)
        self.assertEqual(opened.call_count, 1)
        self.assertFalse([call for call in slept.call_args_list if call.args[0] > fetch.PAUSE])
        # Within the patience: the wait is slept (the clock does not move, since sleep is a stand-in) and the answer read.
        with mock.patch.object(fetch.urllib.request, 'urlopen', side_effect=[busy(15), io.BytesIO(b'picture')]) as opened, \
             mock.patch.object(fetch.time, 'sleep') as slept:
            self.assertEqual(fetch.get(url, patience=60), b'picture')
        self.assertEqual(opened.call_count, 2)
        self.assertIn(15.0, [call.args[0] for call in slept.call_args_list])
        # With no patience left even the shortest wait is too long; another error is not Busy.
        with mock.patch.object(fetch.urllib.request, 'urlopen', side_effect=[busy(0)]), mock.patch.object(fetch.time, 'sleep'):
            with self.assertRaises(fetch.Busy):
                fetch.get(url, patience=0)
        missing = urllib.error.HTTPError(url, 404, 'Not Found', email.message.Message(), None)
        with mock.patch.object(fetch.urllib.request, 'urlopen', side_effect=[missing]), mock.patch.object(fetch.time, 'sleep'):
            with self.assertRaisesRegex(SystemExit, '404'):
                fetch.get(url, patience=60)

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
