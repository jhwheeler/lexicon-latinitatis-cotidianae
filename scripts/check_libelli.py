#!/usr/bin/env python3
"""Check examples quoted from the Theodōrus et pater readers against their texts.

Every example cited as "(Libellus N, Title)" must still occur in that libellus,
whose @title must be Title, and every example cited as "(Culīna Theodōrī)" must
occur in the cookbook. The readers live
in the private latinitas repository, so this check is not part of the test suite;
run it whenever the readers change:

    python3 scripts/check_libelli.py --latinitas ../latinitas

The quoted Latin is the last <strong lang="la"> element before each citation.
Guillemets, the asterisks that mark italics, and dashes between speakers are
ignored; "…" in a quotation stands for omitted words. A quotation found only in
a margin gloss or the back matter is reported, so that its label can say so.
Looser mentions ("the verb of Libellus VII", "the Libellus I gloss") often name
a headword the text declines; they are listed for a look but never fail.
Exit status 1 if a formal citation is not found or names the wrong title.
"""
import argparse
import glob
import html
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7}
CITE = re.compile(r'\(([^()]*?)Libellus ([IVX]+)\b([^()]*)\)')
FORMAL = re.compile(r'Libellus ([IVX]+), <span lang="la">([^<]*)</span>\)$')
COOK = re.compile(r'\([^()]*Culīna Theodōrī[^()]*\)')
LATIN = re.compile(r'<(strong|em|span) lang="la">(.*?)</\1>')


def norm(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s))
    s = unicodedata.normalize('NFC', s).replace('*', '')
    s = re.sub(r'[«»“”"‘’~—–]', ' ', s).replace("'", '’')
    return re.sub(r'\s+', ' ', s).strip()


def load_reader(path):
    body, gloss = [], []
    for line in path.read_text(encoding='utf8').splitlines():
        if line.startswith('@'):
            continue
        if line.startswith('> '):
            gloss.append(line[2:])
            continue
        for prefix in ('!!', '~ = ', '~ ', '## '):
            if line.startswith(prefix):
                line = line[len(prefix):]
        body.append(line)
    return norm(' '.join(body)), norm(' '.join(gloss))


def found(quote, text):
    pos = 0
    for piece in re.split(r'…', quote):
        piece = piece.strip(' .,;:!?')
        if not piece:
            continue
        i = text.find(piece, pos)
        if i < 0 and pos == 0:
            i = text.find(piece[0].swapcase() + piece[1:])
        if i < 0:
            return False
        pos = i + len(piece)
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--latinitas', required=True, help='path to a checkout of the latinitas repository')
    args = ap.parse_args()
    src = Path(args.latinitas) / 'src'
    readers = {}
    for path in sorted(src.glob('fabula-0[1-7]-*.txt')):
        n = int(path.name[8])
        body, gloss = load_reader(path)
        back = src / f'back-0{n}.html'
        back_text = norm(re.sub(r'<(script|style)[^>]*>.*?</\1>', '', back.read_text(encoding='utf8'), flags=re.S)) if back.exists() else ''
        title = re.search(r'^@title (.*)$', path.read_text(encoding='utf8'), re.M)
        readers[n] = (body, gloss, back_text, title.group(1).strip() if title else '')
    if len(readers) != 7:
        sys.exit(f'expected seven readers in {src}, found {sorted(readers)}')
    cookbook = norm((src / 'coquina-theodori.txt').read_text(encoding='utf8'))

    missing, elsewhere, loose, total = [], [], [], 0
    for path in sorted(glob.glob(str(ROOT / 'data' / 'entries' / '*.json'))):
        for entry in json.load(open(path, encoding='utf8')):
            for block in entry['blocks']:
                texts = [item['html'] for item in block.get('items', [])]
                if 'html' in block:
                    texts.append(block['html'])
                for text in texts:
                    for m in list(CITE.finditer(text)) + list(COOK.finditer(text)):
                        segment = text[:m.start()]
                        quotes = [norm(x.group(2)) for x in LATIN.finditer(segment)]
                        if not quotes:
                            continue
                        quote = quotes[-1]
                        total += 1
                        if m.re is COOK:
                            if not found(quote, cookbook):
                                missing.append(f'NOT FOUND in Culīna Theodōrī: {entry["id"]}: {quote[:100]}')
                            continue
                        n = ROMAN[m.group(2)]
                        body, gloss, back, title = readers[n]
                        formal = FORMAL.search(m.group(0))
                        label = f'Libellus {m.group(2)}'
                        if formal and formal.group(2) != title:
                            missing.append(f'WRONG TITLE for {label}: {entry["id"]}: “{formal.group(2)}” should be “{title}”')
                        if found(quote, body):
                            continue
                        where = 'gloss' if found(quote, gloss) else 'back matter' if found(quote, back) else None
                        if where:
                            elsewhere.append((entry['id'], f'{label} ({where})', quote))
                        elif formal:
                            missing.append(f'NOT FOUND in {label}: {entry["id"]}: {quote[:100]}')
                        else:
                            loose.append((entry['id'], label, quote))
    print(f'{total} quotations checked')
    for eid, where, quote in elsewhere:
        print(f'  in {where}: {eid}: {quote[:100]}')
    for eid, where, quote in loose:
        print(f'  mentioned, not quoted verbatim (check the form): {where}: {eid}: {quote[:100]}')
    for line in missing:
        print('  ' + line)
    print(f'{len(missing)} problem(s)' if missing else 'All formal citations match.')
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
