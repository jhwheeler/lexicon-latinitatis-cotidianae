#!/usr/bin/env python3
"""Measure how much of a core English word list the lexicon covers.

A word counts as covered only when it is itself, whole, the headword of a record, one of its "also"
words or the English gloss of one of its terms. Nothing is inflected on the lexicon's side: until
9 November 2026 "see" passed because the lexicon has a saw, "flow" because it has a flower and
"child" because it has children, which hid fifty words of the list. A list may give a plural
(carrots) where the lexicon has the singular, and may spell American where the lexicon spells
British; those two are allowed for. A word that appears only inside a longer heading, as go does
in "go to school", has no entry of its own and is not covered; the report marks such words with
an asterisk. Function words (the, of, which…) count like any other word since 11 November 2026:
Jack wants them in, for the examples and connecting words their records bring.

A list may give a part of speech after a tab (walk<TAB>verb). A word the lexicon has, but only as
another part of speech (walk as a noun), is then reported in a section of its own.

    python3 scripts/coverage.py                          # the New General Service List, refs/ngsl-1.01.tsv
    python3 scripts/coverage.py --list words.txt         # any list, one word per line
    python3 scripts/coverage.py --list refs/swadesh-207.tsv --out notes/coverage/swadesh.md
    python3 scripts/coverage.py --out notes/coverage/ngsl.md

The plan's other list, the MacArthur-Bates CDI, is a sold, copyrighted form: keep it outside this
repository and pass it with --list; don't commit its words or a report that reproduces them.
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORD = re.compile(r"[a-z]+(?:'[a-z]+)?")


SINGULARS = {'children': 'child', 'men': 'man', 'women': 'woman', 'feet': 'foot', 'teeth': 'tooth', 'mice': 'mouse',
             'people': 'person', 'leaves': 'leaf', 'knives': 'knife', 'wives': 'wife', 'lives': 'life', 'shelves': 'shelf'}
BRITISH = {'gray': 'grey', 'program': 'programme', 'mom': 'mum', 'mommy': 'mummy', 'math': 'maths',
           'jewelry': 'jewellery', 'pajamas': 'pyjamas', 'cozy': 'cosy', 'plow': 'plough', 'mold': 'mould',
           'airplane': 'aeroplane'}


def spellings(word):
    """The word as the lexicon may spell it: the lists spell American, the lexicon British
    (color/colour, center/centre, organize/organise)."""
    forms = {word}
    if word in BRITISH:
        forms.add(BRITISH[word])
    for us, uk in (('or', 'our'), ('er', 're'), ('ize', 'ise'), ('yze', 'yse'), ('og', 'ogue'), ('ense', 'ence'),
                   ('ization', 'isation')):
        if word.endswith(us) and len(word) > len(us) + 2:
            forms.add(word[:-len(us)] + uk)
    return forms


def variants(word):
    """A list word and, if the list gives a plural, its singular. Nothing is derived from the word:
    no -ing, -ed or -er form, and no plural of a singular."""
    forms = set(spellings(word))
    if word in SINGULARS:
        forms |= spellings(SINGULARS[word])
    if word.endswith('ies') and len(word) > 4:
        forms |= spellings(word[:-3] + 'y')
    if word.endswith('es') and len(word) > 3:
        forms |= spellings(word[:-2])
    if word.endswith('s') and not word.endswith('ss') and len(word) > 3:
        forms |= spellings(word[:-1])
    return forms


def plain(text):
    return html.unescape(re.sub(r'<[^>]+>', ' ', text)).lower()


def names_in(text):
    """The whole names in a headword, "also" word or gloss: each part between commas or semicolons,
    without a sense in brackets, and also without a leading article or "to" (so "the sun" and
    "to go" name sun and go)."""
    names = set()
    for part in re.split(r'[,;/]', plain(text)):
        words = WORD.findall(re.sub(r'\([^)]*\)', ' ', part))
        if words:
            names.add(' '.join(words))
            if len(words) > 1 and words[0] in ('the', 'a', 'an', 'to'):
                names.add(' '.join(words[1:]))
    return names


def covered_words(root=ROOT):
    """The names the lexicon has an entry for: its headwords, "also" words and glosses, whole. A word
    that appears only inside a longer heading ("go" in "go to school") has no entry of its own."""
    names = set()
    for path in (root / 'data/concepts').glob('*.json'):
        record = json.loads(path.read_text(encoding='utf-8'))
        names |= names_in(record['english'])
        for also in record.get('also', []):
            names |= names_in(also)
        for term in record['terms']:
            names |= names_in(term.get('gloss', ''))
    for path in (root / 'data/entries').glob('*.json'):
        for entry in json.loads(path.read_text(encoding='utf-8')):
            names |= names_in(entry['english'])
            for block in entry['blocks']:
                for item in block.get('items', []):
                    # The gloss after a Latin form: "<strong lang="la">X</strong> — gloss; …"
                    for gloss in re.findall(r'</strong>\s*—\s*([^<;(.]+)', item['html']):
                        names |= names_in(gloss)
    return names


def inside_words(root=ROOT):
    """Every word that appears in a headword or an "also" word, whole or inside a longer one."""
    words = set()
    for path in (root / 'data/concepts').glob('*.json'):
        record = json.loads(path.read_text(encoding='utf-8'))
        for text in [record['english'], *record.get('also', [])]:
            words.update(WORD.findall(plain(text)))
    return words


# Items of a word list that are not words: the CDI's placeholders for a name, and the contractions
# and auxiliaries a toddler's list records (gonna, wanna), which need no entry.
NOT_WORDS = {'child own name', 'pet name', 'babysitter name', 'gonna', 'gotta', 'hafta', 'lemme', 'wanna', 'dont',
             'can.auxiliary', 'need/need to', 'try/try to'}


def forms_of(item):
    """The names a list item may have in the lexicon: the item itself, the singular of its last word
    if the list gives a plural (carrots), and the British spelling. A sense after a dot
    (chicken.food) is dropped, and a call said twice (baa baa) may be written once."""
    item = item.split('.')[0].strip()
    item = {'firetruck': 'fire engine', 'teddybear': 'teddy bear'}.get(item, item)
    words = item.split()
    names = set()
    for words in [words] + ([words[:1]] if len(words) > 1 and len(set(words)) == 1 else []):
        names |= {' '.join(words[:-1] + [form]) for form in variants(words[-1])}
    return names


def covered(item, have):
    """Whether a list item has an entry of its own: a headword, "also" word or gloss that is the item
    whole, written as one word or two (high chair, highchair)."""
    names, joined = have
    forms = forms_of(item)
    return bool(forms & names) or any(form.replace(' ', '') in joined for form in forms)


def lexicon_names(root=ROOT):
    names = covered_words(root)
    return names, {name.replace(' ', '') for name in names}


def load_list(path):
    words = []
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.strip() and not line.startswith('#'):
            words.append(line.split('\t')[0].strip().lower())
    return words


PARTS = {'noun': {'noun'}, 'verb': {'verb'}, 'adjective': {'adjective'}, 'adverb': {'adverb'}, 'pronoun': {'pronoun'},
         'numeral': {'numeral', 'adjective'}, 'preposition': {'preposition'}, 'conjunction': {'conjunction'},
         'determiner': {'adjective', 'pronoun', 'numeral'}}


def load_parts(path):
    """{word: part of speech} for a list that names one after a tab (walk<TAB>verb)."""
    parts = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        cells = [c.strip().lower() for c in line.split('\t')]
        if line.strip() and not line.startswith('#') and len(cells) > 1 and cells[1] in PARTS:
            parts[cells[0]] = cells[1]
    return parts


def wrong_part(word, part, root=ROOT):
    """The parts of speech of the records that have the word, if none of them is the part wanted."""
    forms, found = forms_of(word), set()
    for path in (root / 'data/concepts').glob('*.json'):
        record = json.loads(path.read_text(encoding='utf-8'))
        names = set().union(*(names_in(text) for text in [record['english'], *record.get('also', []),
                                                           *(term.get('gloss', '') for term in record['terms'])]))
        if forms & names:
            pos = record.get('pos', [])
            found |= set(pos if isinstance(pos, list) else [pos])
    return sorted(found) if found and not found & PARTS[part] else []


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--list', type=Path, default=ROOT / 'refs/ngsl-1.01.tsv')
    parser.add_argument('--out', type=Path, help='write a Markdown report of the gaps here')
    args = parser.parse_args()
    have = lexicon_names()
    inside = inside_words()
    parts = load_parts(args.list)
    targets = [w for w in load_list(args.list) if w not in NOT_WORDS]
    gaps = [w for w in targets if not covered(w, have)]
    wrong = [(w, parts[w], found) for w in targets if w in parts and w not in gaps for found in [wrong_part(w, parts[w])] if found]
    share = 100 * (len(targets) - len(gaps)) / len(targets)
    print(f'{args.list.name}: {len(targets)} words, {len(targets) - len(gaps)} covered ({share:.0f}%), {len(gaps)} gaps.'
          + (f' {len(wrong)} covered only as another part of speech.' if wrong else ''))
    if args.out:
        bands = [(1, 500), (501, 1000), (1001, 2000), (2001, 10 ** 6)]
        rank = {w: i + 1 for i, w in enumerate(load_list(args.list))}
        lines = [f'# Coverage of {args.list.name}', '',
                 f'{len(targets)} words, {len(targets) - len(gaps)} covered ({share:.0f}%), {len(gaps)} without an entry. '
                 'Generated by `scripts/coverage.py`; a word counts as covered only when a record has that very word, '
                 'whole, as a headword, an "also" word or a gloss: "see" is not covered by a saw, nor "child" by children. '
                 'A word marked * appears inside a longer heading (go in "go to school") but has no entry of its own.', '']
        star = lambda w: w + ('*' if set(w.split('.')[0].split()) <= inside else '')
        if parts and gaps:
            lines += [f'## Without an entry: {len(gaps)}', '', ', '.join(f'{star(w)} ({parts.get(w, "")})' for w in gaps), '']
        for low, high in ([] if parts else bands):
            band = [star(w) for w in gaps if low <= rank[w] <= high]
            if band:
                lines += [f'## Ranks {low}–{high if high < 10 ** 6 else len(rank)}: {len(band)} gaps', '', ', '.join(band), '']
        if wrong:
            lines += [f'## In the lexicon, but not as this part of speech: {len(wrong)}', '',
                      ', '.join(f'{w} ({part}; the lexicon has it as {" and ".join(found)})' for w, part, found in wrong), '']
        if args.list.name.startswith('swadesh'):
            lines += ['The list: Morris Swadesh\'s 207 basic meanings (1952, 1971), in the order and wording of the usual English version.', '']
        if args.list.name.startswith('ngsl'):
            lines += ['The list: the New General Service List 1.01 (Browne, Culligan and Phillips, 2013), CC BY-SA 4.0.', '']
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text('\n'.join(lines), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
