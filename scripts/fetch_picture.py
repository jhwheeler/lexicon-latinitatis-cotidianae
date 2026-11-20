#!/usr/bin/env python3
"""Fetch a picture for a picture card (chartae.html) from Wikimedia Commons.

    python3 scripts/fetch_picture.py <card-id> "<File name on Wikimedia Commons>" [--focus x,y] [--box left,top,right,bottom]

It asks the Commons API for the file, reads the licence from the file's own metadata, and refuses
any licence that the builder does not take (PICTURE_LICENCES in scripts/build.py, imported from
there so that the two cannot drift). It downloads a scaled rendition (1920 pixels wide, a width
Wikimedia serves, not the original), crops it to the cards' ratio of 720:511, resizes it to exactly 720 by 511, writes
src/chartae/<card-id>.jpg (a progressive JPEG at the quality of the existing pictures), and prints
the card's "image" block for data/chartae.json, ready to paste.

The crop is the largest piece of the picture in the cards' ratio, centred on the focus as nearly as
the edges allow: by default the centre; --focus 0.4,0.6 puts it at 40% of the width from the left
and 60% of the height from the top. --box 0.1,0.2,0.9,0.8 crops to that box first (fractions of the
picture's width and height), and then to the ratio around the box's centre, so a box drawn roughly
in the ratio is kept almost whole. Look at the result (it is small) and run again with another
focus or box if the subject is cut off or small.

Every request sends a User-Agent that names the lexicon and its repository, waits at least a second
after the one before, and backs off and tries again on HTTP 429 (for up to --wait minutes, default
1) or a server error. Commons limits requests by address, and this machine's address is shared: when
the API still answers 429 after that, the script reads the same data from the file's own page (its
machine-readable licence, licensetpl_short and licensetpl_link, and its Author field) and takes the
picture through Special:FilePath, which were answering when the API was not (20 November 2026). The proxy of the
environment is used as it is configured; TLS is always verified.
"""
import argparse
import html
import importlib.util
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = 'https://commons.wikimedia.org/w/api.php'
REPOSITORY = 'https://github.com/jhwheeler/lexicon-latinitatis-cotidianae'
USER_AGENT = f'LexiconLatinitatisCotidianae-PictureFetcher/1.0 ({REPOSITORY}) Python-urllib'
WIDTH, HEIGHT = 720, 511
RENDITION = 1920   # the width asked of the API: one of the thumbnail widths Wikimedia serves (1600 is refused
                   # with HTTP 400, "Use thumbnail sizes listed on https://w.wiki/GHai"); far less than an original
QUALITY = 80       # the quality of the existing pictures (their quantisation tables are libjpeg's at 80)
PAUSE = 1.0        # seconds between requests, at least
TRIES = 6        # failures other than 429 before giving up


def licences():
    """The builder's table of licences: {short name: address}."""
    spec = importlib.util.spec_from_file_location('lexicon_build', ROOT / 'scripts/build.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.PICTURE_LICENCES


_last = [0.0]
PATIENCE = [60]   # seconds to keep trying the API while it answers 429 (--wait), before the file's page is read instead


class Busy(Exception):
    """The API kept answering 429 for longer than --wait allows."""


def get(url, patience=None):
    """The body of a GET request, politely: a pause before it, and patience with 429 and 5xx.

    Commons limits requests by address, and the address may be shared: on 20 November 2026 it
    answered 429 to every request for a quarter of an hour at a time, to curl and Python alike,
    and then let a few through. So a 429 is waited out (Retry-After, or a wait that doubles up to
    three minutes) for as long as --wait allows; other failures are tried a few times."""
    delay, deadline, failures = 10.0, time.monotonic() + (PATIENCE[0] if patience is None else patience), 0
    while True:
        wait = _last[0] + PAUSE - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.monotonic()
        request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            busy = error.code == 429 or error.code >= 500
            if error.code >= 500:
                failures += 1
            if error.code == 429 and time.monotonic() > deadline:
                raise Busy(url)
            if not busy or failures >= TRIES or time.monotonic() > deadline:
                raise SystemExit(f'Commons answered {error.code} {error.reason} for {url}'
                                 + (' (still busy after the time --wait allows)' if busy else ''))
            after = error.headers.get('Retry-After', '')
            pause = max(float(after) if after.isdigit() else 0, delay)
            print(f'Commons answered {error.code}; trying again in {pause:.0f} s', file=sys.stderr)
            time.sleep(pause)
            delay = min(delay * 2, 180)
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            failures += 1
            if failures >= TRIES:
                raise SystemExit(f'Commons could not be reached ({error}) for {url}')
            print(f'No answer ({error}); trying again in {delay:.0f} s', file=sys.stderr)
            time.sleep(delay)
            delay = min(delay * 2, 180)


def plain(value):
    """Text from the HTML of a metadata field: tags dropped, entities read, spaces made single."""
    text = html.unescape(re.sub(r'<[^>]+>', ' ', value or ''))
    return re.sub(r'\s+', ' ', text).strip()


def licence_address(url):
    """A licence's address as the builder writes it: https, no deed or language, a final slash."""
    url = (url or '').strip().replace('http://', 'https://', 1)
    url = re.sub(r'(?:deed\.[a-zA-Z-]+|legalcode(?:\.[a-zA-Z-]+)?)$', '', url)
    return url if not url or url.endswith('/') else url + '/'


def file_info(name):
    """The file's page, its scaled rendition, and its licence, author, and name, from the API."""
    title = 'File:' + re.sub(r'^(?:File|Image):', '', name.strip()).replace('_', ' ')
    query = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'formatversion': 2, 'titles': title, 'prop': 'imageinfo',
                                    'iiprop': 'url|size|extmetadata', 'iiurlwidth': RENDITION})
    pages = json.loads(get(f'{API}?{query}'))['query']['pages']
    page = pages[0]
    if page.get('missing') or not page.get('imageinfo'):
        raise SystemExit(f'There is no file {title} on Wikimedia Commons')
    info = page['imageinfo'][0]
    meta = {key: value.get('value', '') for key, value in info.get('extmetadata', {}).items()}
    return {'title': page['title'], 'page': info['descriptionurl'], 'url': info.get('thumburl') or info['url'],
            'licence': plain(meta.get('LicenseShortName')), 'licence_url': licence_address(plain(meta.get('LicenseUrl'))),
            'author': plain(meta.get('Artist')), 'size': (info['width'], info['height'])}


def span(page, name):
    """The text of the first element of a class on a file's page (Commons's machine-readable licence data)."""
    found = re.search(r'<[a-z]+[^>]*class="[^"]*\b%s\b[^"]*"[^>]*>(.*?)</[a-z]+>' % re.escape(name), page, re.S)
    return plain(found[1]) if found else ''


def page_info(name):
    """The same as file_info, read from the file's own page on Commons when the API is refused to us,
    with the picture through Special:FilePath. The licence is the page's machine-readable one
    (licensetpl_short and licensetpl_link, the data the API's own metadata is made from), and the
    author the page's Author field (fileinfotpl_aut)."""
    bare = re.sub(r'^(?:File|Image):', '', name.strip()).replace(' ', '_')
    quoted = urllib.parse.quote(bare, safe="(),'!*-._~:;@$")
    address = f'https://commons.wikimedia.org/wiki/File:{quoted}'
    page = get(address, patience=PATIENCE[0]).decode('utf-8', 'replace')
    title = re.search(r'<title>(.*?) - Wikimedia Commons</title>', page, re.S)
    author = re.search(r'id="fileinfotpl_aut"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', page, re.S)
    size = re.search(r'class="fullMedia".*?\(([\d,]+) × ([\d,]+) pixels', page, re.S)
    return {'title': html.unescape(title[1]).strip() if title else 'File:' + bare.replace('_', ' '), 'page': address,
            'url': f'https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}?width={RENDITION}',
            'licence': span(page, 'licensetpl_short'), 'licence_url': licence_address(span(page, 'licensetpl_link')),
            'author': plain(author[1]) if author else '',
            'size': tuple(int(n.replace(',', '')) for n in size.groups()) if size else None}


def check_licence(info, table):
    """The licence as the builder names it, or an exit that says why the picture cannot be taken."""
    name = info['licence']
    if name.lower() in ('public domain', 'pd'):
        name = 'Public domain'
    if name not in table:
        raise SystemExit(f'Refused: the licence of {info["title"]} is "{info["licence"] or "not stated"}", '
                         f'and the cards take only {", ".join(table)}. Read the file’s page: {info["page"]}')
    if table[name] and info['licence_url'] and info['licence_url'] != table[name]:
        raise SystemExit(f'Refused: the file names the licence {name} with the address {info["licence_url"]}, '
                         f'not {table[name]}. Read the file’s page: {info["page"]}')
    return name


def fractions(text, count, what):
    try:
        values = [float(part) for part in text.split(',')]
    except ValueError:
        values = []
    if len(values) != count or not all(0 <= v <= 1 for v in values):
        raise SystemExit(f'{what} takes {count} fractions between 0 and 1, separated by commas')
    return values


def crop_box(size, focus=(0.5, 0.5), box=None):
    """The crop, in pixels (left, top, right, bottom): the largest piece in the cards' ratio inside
    the box (the whole picture if none), centred on the focus (in a box, on the box's centre) as
    nearly as the edges allow."""
    width, height = size
    left, top, right, bottom = (0, 0, width, height) if box is None else (box[0] * width, box[1] * height, box[2] * width, box[3] * height)
    if box is not None:
        focus = (((left + right) / 2) / width, ((top + bottom) / 2) / height)
    room_w, room_h = right - left, bottom - top
    if room_w <= 0 or room_h <= 0:
        raise SystemExit('The box is empty: right must be greater than left, and bottom than top')
    crop_w = min(room_w, room_h * WIDTH / HEIGHT)
    crop_h = crop_w * HEIGHT / WIDTH
    x = min(max(focus[0] * width - crop_w / 2, left), right - crop_w)
    y = min(max(focus[1] * height - crop_h / 2, top), bottom - crop_h)
    return tuple(round(v) for v in (x, y, x + crop_w, y + crop_h))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('card', help='the card’s id: the picture is written to src/chartae/<id>.jpg')
    parser.add_argument('file', help='the file’s name on Wikimedia Commons, with or without "File:"')
    parser.add_argument('--focus', metavar='X,Y', help='the point to centre the crop on, as fractions of the width and height (default 0.5,0.5)')
    parser.add_argument('--box', metavar='L,T,R,B', help='crop to this box first, as fractions of the width and height')
    parser.add_argument('--wait', type=float, default=1, metavar='MINUTES',
                        help='how long to keep trying the API while it answers 429 before reading the file’s page instead (default 1); the page and the download wait as long')
    args = parser.parse_args()
    PATIENCE[0] = args.wait * 60
    if not re.fullmatch(r'[a-z][a-z0-9-]*', args.card):
        raise SystemExit('A card’s id is lower-case letters, digits, and hyphens, beginning with a letter')
    if args.focus and args.box:
        raise SystemExit('Give --focus or --box, not both')
    try:
        from PIL import Image, ImageOps
    except ImportError:
        raise SystemExit('Pillow is needed: pip install --break-system-packages pillow')

    table = licences()
    try:
        info = file_info(args.file)
    except Busy:
        print('The Commons API is still answering 429: reading the file’s own page instead', file=sys.stderr)
        info = page_info(args.file)
    licence = check_licence(info, table)
    if not info['author']:
        raise SystemExit(f'The file’s metadata names no author: read its page and add the author by hand. {info["page"]}')
    picture = Image.open(io.BytesIO(get(info['url'])))
    picture = ImageOps.exif_transpose(picture)
    if picture.mode != 'RGB':
        if picture.mode in ('RGBA', 'LA', 'P') and 'transparency' in picture.info or picture.mode in ('RGBA', 'LA'):
            ground = Image.new('RGB', picture.size, (255, 255, 255))
            ground.paste(picture.convert('RGBA'), mask=picture.convert('RGBA').split()[3])
            picture = ground
        else:
            picture = picture.convert('RGB')
    focus = tuple(fractions(args.focus, 2, '--focus')) if args.focus else (0.5, 0.5)
    box = fractions(args.box, 4, '--box') if args.box else None
    crop = crop_box(picture.size, focus, box)
    card = picture.crop(crop).resize((WIDTH, HEIGHT), Image.LANCZOS)
    out = ROOT / 'src/chartae' / f'{args.card}.jpg'
    card.save(out, 'JPEG', quality=QUALITY, progressive=True, optimize=True)
    share = (crop[2] - crop[0]) * (crop[3] - crop[1]) / (picture.size[0] * picture.size[1])
    print(f'Wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB) from a rendition of {picture.size[0]} by {picture.size[1]}, '
          f'cropped to {crop} ({share:.0%} of it). Look at it before using it.', file=sys.stderr)
    image = {'file': info['title'].removeprefix('File:'), 'author': info['author'], 'licence': licence,
             'licence_url': table[licence], 'page': info['page']}
    lines = json.dumps(image, indent=1, ensure_ascii=False).splitlines()
    print('   "image": ' + lines[0] + '\n' + '\n'.join('   ' + line for line in lines[1:]))


if __name__ == '__main__':
    main()
