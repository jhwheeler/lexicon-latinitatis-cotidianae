#!/usr/bin/env python3
"""Fetch a picture for a picture card (chartae.html) from Wikimedia Commons.

    python3 scripts/fetch_picture.py <card-id> "<File name on Wikimedia Commons>" [--focus x,y] [--box left,top,right,bottom]

It asks the Commons API for the file, reads the licence from the file's own metadata, and refuses
any licence that the builder does not take (PICTURE_LICENCES in scripts/build.py, imported from
there so that the two cannot drift). It downloads a scaled rendition (1920 pixels wide, a width
Wikimedia serves, not the original), crops it to the cards' ratio of 720:511, resizes it to exactly 720 by 511, writes
src/chartae/<card-id>.jpg (a progressive JPEG at the quality of the existing pictures) and its
preview, data/chartae-previews/<card-id>.jpg (144 by 102, which the card data carries so that the
page has a cue before the picture has come; 21 November 2026), and prints the card's "image" block
for data/chartae.json, ready to paste.

    python3 scripts/fetch_picture.py --previews

fetches nothing: it writes every preview that is missing or was made from an earlier picture (each
names the picture it was made from, by a hash, in its JPEG comment, which the builder checks), and
removes those whose picture is gone.

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
picture through Special:FilePath, which were answering when the API was not (20 November 2026). A file
under several licences (the Getty's carry "No restrictions" and CC0) is taken under the first its page
states that the builder takes; the API names only one, so a refusal there is checked against the page.
A drawing in SVG is taken as Wikimedia's PNG rendering of it, 1920 pixels wide, whatever its nominal size;
a transparent ground becomes white (21 November 2026). The proxy of the
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
STANDARD_WIDTHS = (1920, 1280, 960)   # widths Wikimedia serves (https://w.wiki/GHai), widest first; a card is 720 wide
QUALITY = 80       # the quality of the existing pictures (their quantisation tables are libjpeg's at 80)
PAUSE = 1.0        # seconds between requests, at least
TRIES = 6        # failures other than 429 before giving up


_builder = []


def builder():
    """scripts/build.py as a module, loaded once: the licences and the previews' rules are its own."""
    if not _builder:
        spec = importlib.util.spec_from_file_location('lexicon_build', ROOT / 'scripts/build.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        _builder.append(module)
    return _builder[0]


def licences():
    """The builder's table of licences: {short name: address}."""
    return builder().PICTURE_LICENCES


def write_preview(picture_path, root=ROOT):
    """Write the card's preview (data/chartae-previews/<id>.jpg) from its picture: the small copy that
    the card data carries, so that the page has a cue before the picture's own file has come (Jack,
    21 November 2026). Its JPEG comment names the picture it was made from (a hash of its bytes), which
    the builder checks. Returns the preview's path."""
    from PIL import Image
    build = builder()
    data = Path(picture_path).read_bytes()
    with Image.open(io.BytesIO(data)) as picture:
        small = picture.convert('RGB').resize(build.PREVIEW_SIZE, Image.LANCZOS)
    out = root / build.PREVIEWS / Path(picture_path).name
    out.parent.mkdir(parents=True, exist_ok=True)
    small.save(out, 'JPEG', quality=build.PREVIEW_QUALITY, optimize=True, comment=build.preview_mark(data).encode('ascii'))
    return out


def preview_is_current(picture_path, root=ROOT):
    """Whether the picture's preview exists and was made from the picture as it is now."""
    build = builder()
    out = root / build.PREVIEWS / Path(picture_path).name
    return out.exists() and build.jpeg_comment(out.read_bytes()) == build.preview_mark(Path(picture_path).read_bytes())


def write_previews(root=ROOT):
    """Bring every preview up to date with its picture, without the network: write those that are
    missing or were made from an earlier picture, and remove those whose picture is gone. Returns
    (written, removed), the names."""
    build = builder()
    pictures = sorted((root / 'src/chartae').glob('*.jpg'))
    written = [write_preview(path, root).name for path in pictures if not preview_is_current(path, root)]
    names = {path.name for path in pictures}
    removed = []
    for path in sorted((root / build.PREVIEWS).glob('*')) if (root / build.PREVIEWS).exists() else []:
        if path.name not in names:
            path.unlink()
            removed.append(path.name)
    return written, removed


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
    value = re.sub(r'<(style|script)\b.*?</\1>', ' ', value or '', flags=re.S)   # a creator template brings its stylesheet with it
    text = html.unescape(re.sub(r'<[^>]+>', ' ', value))
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


def spans(page, name):
    """The text of every element of a class on a file's page (Commons's machine-readable licence data), in order."""
    return [plain(found) for found in re.findall(r'<[a-z]+[^>]*class="[^"]*\b%s\b[^"]*"[^>]*>(.*?)</[a-z]+>' % re.escape(name), page, re.S)]


def span(page, name):
    """The text of the first element of a class on a file's page."""
    found = spans(page, name)
    return found[0] if found else ''


def page_licences(page):
    """Every licence a file's page states, as (short name, address), in the page's order. A file
    may be under several (the Getty's files carry "No restrictions" and CC0, 21 November 2026);
    each licence template writes its short name and, if it has one, its address."""
    # A template without an address (public domain) writes no link: each short name is paired with
    # the link that follows it before the next short name.
    element = r'<[a-z]+[^>]*class="[^"]*\b%s\b[^"]*"[^>]*>(.*?)</[a-z]+>'
    marks = sorted([(m.start(), 'short', plain(m[1])) for m in re.finditer(element % 'licensetpl_short', page, re.S)]
                   + [(m.start(), 'link', plain(m[1])) for m in re.finditer(element % 'licensetpl_link', page, re.S)])
    found = []
    for _, kind, text in marks:
        if kind == 'short':
            found.append([text, ''])
        elif found and not found[-1][1]:
            found[-1][1] = licence_address(text)
    return [tuple(pair) for pair in found]


def page_info(name):
    """The same as file_info, read from the file's own page on Commons when the API is refused to us,
    with the picture through Special:FilePath. The licence is the page's machine-readable one
    (licensetpl_short and licensetpl_link, the data the API's own metadata is made from), and the
    author the page's Author field (fileinfotpl_aut)."""
    bare = re.sub(r'^(?:File|Image):', '', name.strip()).replace(' ', '_')
    quoted = urllib.parse.quote(bare, safe="(),'!*-._~:;@$")
    address = f'https://commons.wikimedia.org/wiki/File:{quoted}'
    page = get(address, patience=max(PATIENCE[0], 300)).decode('utf-8', 'replace').replace('&#95;', '_')   # Commons writes the underscore of these class names and ids as an entity
    title = re.search(r'<title>(.*?) - Wikimedia Commons</title>', page, re.S)
    author = re.search(r'id="fileinfotpl_aut"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', page, re.S)
    size = re.search(r'class="fullMedia".*?\((?:SVG file, nominally )?([\d,]+) × ([\d,]+) pixels', page, re.S)
    licences_found = page_licences(page)
    return {'title': html.unescape(title[1]).strip() if title else 'File:' + bare.replace('_', ' '), 'page': address,
            'url': f'https://commons.wikimedia.org/wiki/Special:FilePath/{quoted}?width={RENDITION}',
            'licence': licences_found[0][0] if licences_found else '', 'licence_url': licences_found[0][1] if licences_found else '',
            'licences': licences_found,
            'author': plain(author[1]) if author else '',
            'size': tuple(int(n.replace(',', '')) for n in size.groups()) if size else None}


def check_licence(info, table):
    """The licence as the builder names it, or an exit that says why the picture cannot be taken.
    A file under several licences (info["licences"], read from its page) is taken under the first
    of them that the builder takes."""
    offered = info.get('licences') or [(info['licence'], info['licence_url'])]
    reasons = []
    for given, url in offered:
        name = 'Public domain' if given.lower() in ('public domain', 'pd') else given
        if name not in table:
            reasons.append(f'Refused: the licence of {info["title"]} is "{given or "not stated"}", '
                           f'and the cards take only {", ".join(table)}. Read the file’s page: {info["page"]}')
        elif table[name] and url and url != table[name]:
            reasons.append(f'Refused: the file names the licence {name} with the address {url}, '
                           f'not {table[name]}. Read the file’s page: {info["page"]}')
        else:
            return name
    raise SystemExit('\n'.join(reasons) or f'Refused: {info["title"]} states no licence. Read the file’s page: {info["page"]}')


def rendition_width(title, size):
    """The width of the rendition to ask for: the widest standard width narrower than the file, or
    the full width for an SVG, which Wikimedia renders at any width; None if the file is too narrow.
    A file exactly as wide as a standard width takes the next smaller one: asked for its own width,
    Wikimedia answers with the unscaled original, which it refuses to this machine (21 November
    2026: a file 1920 pixels wide). The narrowest standard width is still the least a file may have:
    one exactly that wide is asked for at that width, as before, there being no smaller one."""
    if title.lower().endswith('.svg'):
        return RENDITION
    if not size:
        return STANDARD_WIDTHS[0]
    narrower = next((w for w in STANDARD_WIDTHS if size[0] > w), None)
    return narrower or (STANDARD_WIDTHS[-1] if size[0] == STANDARD_WIDTHS[-1] else None)


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
    parser.add_argument('card', nargs='?', help='the card’s id: the picture is written to src/chartae/<id>.jpg')
    parser.add_argument('file', nargs='?', help='the file’s name on Wikimedia Commons, with or without "File:"')
    parser.add_argument('--previews', action='store_true',
                        help='fetch nothing: write every preview that is missing or older than its picture, and remove those whose picture is gone')
    parser.add_argument('--focus', metavar='X,Y', help='the point to centre the crop on, as fractions of the width and height (default 0.5,0.5)')
    parser.add_argument('--box', metavar='L,T,R,B', help='crop to this box first, as fractions of the width and height')
    parser.add_argument('--wait', type=float, default=1, metavar='MINUTES',
                        help='how long to keep trying the API while it answers 429 before reading the file’s page instead (default 1); the page and the download wait as long')
    args = parser.parse_args()
    PATIENCE[0] = args.wait * 60
    if args.previews:
        if args.card or args.file or args.focus or args.box:
            raise SystemExit('--previews takes no card, file, focus, or box')
        try:
            import PIL   # noqa: F401
        except ImportError:
            raise SystemExit('Pillow is needed: pip install --break-system-packages pillow')
        written, removed = write_previews()
        print(f'Previews written: {len(written)}; removed: {len(removed)}' + (f' ({", ".join(removed)})' if removed else ''), file=sys.stderr)
        return
    if not args.card or not args.file:
        parser.error('give the card’s id and the file’s name (or --previews)')
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
    try:
        licence = check_licence(info, table)
    except SystemExit:
        if 'licences' in info:
            raise
        # The API names one licence only, and a file may have several: its page lists them all.
        print('The licence the API names is refused: reading the file’s own page for any other', file=sys.stderr)
        info = page_info(args.file)
        licence = check_licence(info, table)
    if not info['author']:
        raise SystemExit(f'The file’s metadata names no author: read its page and add the author by hand. {info["page"]}')
    # Wikimedia serves renditions only in its standard widths, and refuses the original itself to a
    # shared address (HTTP 429, "use thumbnail images in sizes listed"): a file narrower than the
    # width asked for comes back from the API as its original, so the widest standard width that
    # the file has is asked for instead, through Special:FilePath, which is also the way round a
    # download that is still refused (20 November 2026).
    # A drawing in SVG has no width of its own: Wikimedia renders it, as a PNG, at any width asked
    # for, so it is asked for at the full width whatever its nominal size (21 November 2026).
    width = rendition_width(info['title'], info['size'])
    if width is None:
        raise SystemExit(f'{info["title"]} is only {info["size"][0]} pixels wide: too small for a card (the narrowest rendition taken is {STANDARD_WIDTHS[-1]})')
    by_path = ('https://commons.wikimedia.org/wiki/Special:FilePath/'
               + urllib.parse.quote(info['title'].removeprefix('File:').replace(' ', '_'), safe="(),'!*-._~:;@$") + f'?width={width}')
    try:
        data = get(by_path if width != RENDITION else info['url'])
    except Busy:
        print('The download is refused (429): taking the picture through Special:FilePath, patiently', file=sys.stderr)
        data = get(by_path, patience=max(PATIENCE[0], 600))
    picture = Image.open(io.BytesIO(data))
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
    preview = write_preview(out)
    share = (crop[2] - crop[0]) * (crop[3] - crop[1]) / (picture.size[0] * picture.size[1])
    print(f'Wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB) from a rendition of {picture.size[0]} by {picture.size[1]}, '
          f'cropped to {crop} ({share:.0%} of it), and its preview {preview.relative_to(ROOT)}. Look at it before using it.', file=sys.stderr)
    image = {'file': info['title'].removeprefix('File:'), 'author': info['author'], 'licence': licence,
             'licence_url': table[licence], 'page': info['page']}
    lines = json.dumps(image, indent=1, ensure_ascii=False).splitlines()
    print('   "image": ' + lines[0] + '\n' + '\n'.join('   ' + line for line in lines[1:]))


if __name__ == '__main__':
    main()
