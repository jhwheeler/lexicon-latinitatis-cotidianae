#!/usr/bin/env python3
"""Draw a sample of the word families the builder proposes, with what Lewis & Short says of each
word's derivation, so that every pair can be checked by reading.

    python3 scripts/family_sample.py --seed 2 --count 100                # a sample, to read
    python3 scripts/family_sample.py --seed 2 --count 100 --exclude notes/coverage/families-sample-1.txt
    python3 scripts/family_sample.py --list                              # every family, one per line
    python3 scripts/family_sample.py --ambiguous                         # the words left out as ambiguous
    python3 scripts/family_sample.py --word petaurista                   # one word's family and how it was joined

The sample is seeded, so the same command gives the same families while the data and the method
stand. For each family it prints the words, each derivation the method used (the derived word, its
base and how), and for each word the etymology Lewis & Short gives in brackets at the head of its
article ("id." is resolved to the etymology it repeats). A line is marked `ok` when that etymology,
or the article's hyphenated headword, names another word of the family, and `?` when it does not:
those are the ones to look up (`python3 scripts/lookup.py ls <word>`, then `devaan <word>`). The
mark is a help to the reader, not a verdict: Lewis & Short is silent on many plain derivations,
and a family is right or wrong by what the article says.

--exclude names a file of families (one per line, words separated by commas, as --list and the
sample's own heading lines print them); families with a word in it are not drawn again.
--refs names the folder with lewis-short.xml.gz (default as scripts/lookup.py).
"""
import argparse
import gzip
import html
import random
import re
import sys
import tempfile
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402

ROOT = build.ROOT
CANDIDATES = (ROOT.parent / 'latinitas/refs', Path('/home/claude/latinitas/refs'))


def fold(text):
    text = unicodedata.normalize('NFD', text.lower())
    return ''.join(c for c in text if not unicodedata.combining(c)).replace('j', 'i').replace('v', 'u')


def plain(xml):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', xml))).strip()


def etymologies(refs):
    """{folded key: [(headword as printed, etymology)]} from Lewis & Short's <etym> elements; an
    etymology that is only "id." is given as the one it repeats."""
    cache = Path(tempfile.gettempdir()) / 'lexicon-lewis-short-etyma.tsv'
    source = refs / 'lewis-short.xml.gz'
    if not cache.exists() or cache.stat().st_mtime < source.stat().st_mtime:
        with gzip.open(source, 'rt', encoding='utf-8') as f:
            xml = f.read()
        last, lines = '', []
        for m in re.finditer(r'<entryFree[^>]*\bkey="([^"]+)"[^>]*>(.*?)</entryFree>', xml, re.S):
            orth = re.search(r'<orth[^>]*>(.*?)</orth>', m.group(2), re.S)
            etym = re.search(r'<etym[^>]*>(.*?)</etym>', m.group(2), re.S)
            etym = plain(etym.group(1)) if etym else ''
            if re.fullmatch(r'id\.?,?', etym):
                etym = f'id., that is: {last}'
            elif etym:
                last = etym
            lines.append('\t'.join((fold(re.sub(r'\d+$', '', m.group(1))), plain(orth.group(1)) if orth else '', etym)))
        cache.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    table = {}
    for line in cache.read_text(encoding='utf-8').splitlines():
        key, orth, etym = line.split('\t')
        table.setdefault(key, []).append((orth, etym))
    return table


def names(text, head):
    """Whether an etymology names a word (a deponent is often cited in the active)."""
    word = fold(head)
    words = {word, word[:-2] + 'o'} if word.endswith('or') and len(word) > 3 else {word}
    return any(re.search(rf'(?<![a-z]){re.escape(w)}(?![a-z])', fold(text)) for w in words)


def verdict(lexeme, family, table):
    """('ok' or '?', what Lewis & Short gives for the word)."""
    others = [other for other in family if other.head != lexeme.head]
    found = table.get(fold(lexeme.head), [])
    if not found:
        return '?', 'not in Lewis & Short'
    said = '; '.join(f'{orth} [{etym}]' if etym else f'{orth} (no etymology)' for orth, etym in found[:3])
    for orth, etym in found:
        if any(names(etym, other.head) for other in others):
            return 'ok', said
        if '-' in orth and any(fold(orth.split(',')[0].split('-')[-1]) == fold(other.head) for other in others):
            return 'ok', said
    for other in others:
        if any(names(etym, lexeme.head) for _, etym in table.get(fold(other.head), [])):
            return 'ok', said + f' (named under {other.head})'
    return '?', said


def heading(family):
    return ', '.join(lexeme.head for lexeme in family)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--seed', type=int, default=1)
    parser.add_argument('--count', type=int, default=150)
    parser.add_argument('--exclude', type=Path, action='append', default=[])
    parser.add_argument('--list', action='store_true', help='every family, one per line')
    parser.add_argument('--ambiguous', action='store_true', help='the words left out because their bases are in several families')
    parser.add_argument('--word', help='one word: its family and how it was joined')
    parser.add_argument('--refs', type=Path)
    args = parser.parse_args()
    site = build.load_site(ROOT)
    families = site['families']
    groups = {id(group): sorted(group, key=lambda l: (fold(l.head), l.head, l.form)) for group in families.family.values()}
    groups = sorted(groups.values(), key=heading)
    why = {}
    for derived, base, how in families.used:
        why.setdefault(derived, []).append((base, how))
    if args.list:
        print('\n'.join(heading(group) for group in groups))
        return 0
    if args.ambiguous:
        for derived, bases in sorted(families.ambiguous.items(), key=lambda item: fold(item[0].head)):
            print(f'{derived.head} ({", ".join(derived.concepts()[:2])}): '
                  + '; '.join(f'{base.head} ({", ".join(base.concepts()[:2])}), {how}' for base, how in bases))
        return 0
    refs = args.refs or next((path for path in CANDIDATES if (path / 'lewis-short.xml.gz').exists()), None)
    table = etymologies(refs) if refs else {}
    if not table:
        print('Lewis & Short not found (see --refs): the etymologies are left out.', file=sys.stderr)
    if args.word:
        chosen = [group for group in groups if any(lexeme.head == args.word for lexeme in group)]
        if not chosen:
            print(f'{args.word} has no family.')
            for lexeme in families.by_head.get(args.word, []):
                for base, how in families.ambiguous.get(lexeme, []):
                    print(f'  left out as ambiguous: {how} ({base.head})')
            return 0
    else:
        taken = set()
        for path in args.exclude:
            for line in path.read_text(encoding='utf-8').splitlines():
                if line.strip() and not line.startswith(('#', ' ')):
                    taken.update(word.strip() for word in re.sub(r'^\d+\.\s*', '', line).split(','))
        pool = [group for group in groups if not any(lexeme.head in taken for lexeme in group)]
        chosen = random.Random(args.seed).sample(pool, min(args.count, len(pool)))
        print(f'# {len(chosen)} of {len(pool)} families (seed {args.seed}; {len(groups)} families in all, '
              f'{families.totals()[1]} words in them)')
    for n, group in enumerate(chosen, 1):
        print(f'{n}. {heading(group)}')
        for lexeme in group:
            mark, said = verdict(lexeme, group, table) if table else ('', '')
            how = '; '.join(f'{text} ({base.head})' if base.head not in text else text for base, text in why.get(lexeme, [])) or 'a base'
            print(f'    {mark:2} {lexeme.head} ({", ".join(lexeme.concepts()[:2])}): {how}' + (f' | L&S {said[:230]}' if said else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main())
