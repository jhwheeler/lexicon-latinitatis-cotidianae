#!/usr/bin/env python3
"""Look a word up in the reference works kept in the latinitas repository's refs/ folder.

    python3 scripts/lookup.py ls subligaculum      # Lewis & Short entries for a Latin headword (macrons optional)
    python3 scripts/lookup.py en underpants        # English → Latin: Morgan–Owens, Traupman, Lewis & Short glosses
    python3 scripts/lookup.py it mutande           # Italian → Latin: Levi & Bini (1937)
    python3 scripts/lookup.py devaan fors          # de Vaan's etymological dictionary (OCR text)

--refs names the folder (default ../latinitas/refs beside this repository, or /home/claude/latinitas/refs).
Page numbers: Traupman's are printed in its text as page headers; cite Traupman by page,
Morgan–Owens by s.v. headword, Levi & Bini by its printed page. Every word found here must still be
checked in Lewis & Short before it goes into a record (docs/drafting.md).
"""
import argparse
import gzip
import html
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = (ROOT.parent / 'latinitas/refs', Path('/home/claude/latinitas/refs'))


def fold(text):
    text = unicodedata.normalize('NFD', text.lower())
    return ''.join(c for c in text if not unicodedata.combining(c)).replace('j', 'i')


def plain(xml):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', xml))).strip()


def ls_entries(refs):
    cache = refs / '.lewis-short-entries.txt'
    if not cache.exists():
        with gzip.open(refs / 'lewis-short.xml.gz', 'rt', encoding='utf-8') as f:
            xml = f.read()
        with open(cache, 'w', encoding='utf-8') as out:
            for m in re.finditer(r'<entryFree[^>]*\bkey="([^"]+)"[^>]*>(.*?)</entryFree>', xml, re.S):
                out.write(re.sub(r'\d+$', '', m.group(1)) + '\t' + plain(m.group(2)) + '\n')
    for line in cache.read_text(encoding='utf-8').splitlines():
        key, _, text = line.partition('\t')
        yield key, text


# Traupman's text layer spells long vowels with stand-in glyphs, marks the stress with a dot and
# the ending with a bar: br§c·ae |§rum = brācae, -ārum.
TRAUPMAN = str.maketrans({'§': 'ā', '¡': 'ē', '¿': 'ī', '«': 'ō', '»': 'ū', '£': 'ȳ', '·': '', '|': '-'})


def grep(path, pattern, limit, context=0):
    lines = path.read_text(encoding='utf-8', errors='replace').splitlines()
    if path.name.startswith('traupman'):
        lines = [line.translate(TRAUPMAN) for line in lines]
    shown = 0
    for i, line in enumerate(lines):
        if pattern.search(line):
            block = lines[max(0, i - context):i + context + 1]
            print(f'  {path.name}:{i + 1}: ' + ' / '.join(l.strip() for l in block)[:400])
            shown += 1
            if shown >= limit:
                print('  …')
                return


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('source', choices=('ls', 'en', 'it', 'devaan'))
    parser.add_argument('word')
    parser.add_argument('--refs', type=Path)
    parser.add_argument('--limit', type=int, default=12)
    args = parser.parse_args()
    refs = args.refs or next((p for p in CANDIDATES if p.exists()), None)
    if not refs or not refs.exists():
        sys.exit('No refs folder: pass --refs <latinitas>/refs')
    word = args.word.strip()
    if args.source == 'ls':
        key = fold(word)
        hits = [(k, t) for k, t in ls_entries(refs) if fold(k) == key]
        for k, text in hits[:args.limit]:
            print(f'L&S {k}: {text[:1500]}\n')
        if not hits:
            print(f'No Lewis & Short entry for {word}.')
    elif args.source == 'en':
        pattern = re.compile(r'\b' + re.escape(word.lower()) + r'\b', re.I)
        print('Morgan–Owens (Adumbratio), entries with the word in their headword:')
        grep(refs / 'morgan-owens-adumbratio.txt', re.compile(r'^(?:\d+:\d+\s+)?[^►]{0,60}\b' + re.escape(word.lower()), re.I), args.limit)
        print('Traupman (Conversational Latin), lines with the word (its text runs words together, so look closely):')
        grep(refs / 'traupman-conversational-latin.txt', re.compile(r'\b' + re.escape(word.lower()), re.I), args.limit)
        print('Lewis & Short, entries that gloss the word early in their definition:')
        shown = 0
        for k, text in ls_entries(refs):
            if pattern.search(text[:220]):
                print(f'  L&S {k}: {text[:220]}')
                shown += 1
                if shown >= args.limit:
                    print('  …')
                    break
    elif args.source == 'it':
        grep(refs / 'levi-bini-1937-latino-come-lingua-viva.txt',
             re.compile(r'\b' + re.escape(word.lower()) + r'\b', re.I), args.limit, context=1)
    else:
        grep(refs / 'devaan-2008-etymological-dictionary-of-latin.txt',
             re.compile(r'\b' + re.escape(word) + r'\b'), args.limit, context=1)
    return 0


if __name__ == '__main__':
    sys.exit(main())
