#!/usr/bin/env python3
"""Measure how much of a core English word list the lexicon covers.

A word counts as covered when it is the headword of a record, one of its "also" words or the
English gloss of one of its terms, or a heading or gloss of a grouped card (with simple English
inflections: child/children, go/going). Function words (the, of, which…) need no entry and are
left out, as the plan says.

    python3 scripts/coverage.py                          # the New General Service List, refs/ngsl-1.01.tsv
    python3 scripts/coverage.py --list words.txt         # any list, one word per line
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
FUNCTION_WORDS = set("""
a an the this that these those such what which who whom whose whatever whichever whoever
i me my mine myself you your yours yourself yourselves he him his himself she her hers herself it its itself
we us our ours ourselves they them their theirs themselves one ones oneself
be am is are was were been being have has had having do does did done doing will would shall should
can could may might must ought need dare used
and or but nor so yet for because although though while whereas if unless whether than as since until till
of to in on at by with from into onto upon about above across after against along among around before behind
below beneath beside besides between beyond despite down during except inside like near off out outside over
past per through throughout toward towards under underneath unlike up via within without
not no yes there here where when why how
all any both each either every few many more most much neither none other another several some
""".split())
WORD = re.compile(r"[a-z]+(?:'[a-z]+)?")


def inflections(word):
    forms = {word, word + 's', word + 'es', word + 'ed', word + 'd', word + 'ing', word + 'er', word + 'ers'}
    if word.endswith('y'):
        forms |= {word[:-1] + 'ies', word[:-1] + 'ied'}
    if word.endswith('e'):
        forms |= {word[:-1] + 'ing'}
    if re.search(r'[^aeiou][aeiou][bdgklmnprt]$', word):
        forms |= {word + word[-1] + 'ing', word + word[-1] + 'ed'}
    irregular = {'child': 'children', 'man': 'men', 'woman': 'women', 'foot': 'feet', 'tooth': 'teeth',
                 'mouse': 'mice', 'person': 'people', 'go': 'went gone', 'get': 'got', 'take': 'took taken',
                 'eat': 'ate eaten', 'drink': 'drank drunk', 'sleep': 'slept', 'wake': 'woke woken',
                 'put': 'put', 'give': 'gave given', 'come': 'came', 'see': 'saw seen', 'fall': 'fell fallen',
                 'leaf': 'leaves', 'knife': 'knives', 'wife': 'wives', 'life': 'lives', 'shelf': 'shelves'}
    forms |= set(irregular.get(word, '').split())
    return forms


def plain(text):
    return html.unescape(re.sub(r'<[^>]+>', ' ', text)).lower()


def covered_words(root=ROOT):
    """The English words the lexicon has an entry for."""
    words = set()

    def add(text):
        words.update(WORD.findall(plain(text)))
    for path in (root / 'data/concepts').glob('*.json'):
        record = json.loads(path.read_text(encoding='utf-8'))
        add(record['english'])
        for also in record.get('also', []):
            add(also)
        for term in record['terms']:
            add(term.get('gloss', ''))
    for path in (root / 'data/entries').glob('*.json'):
        for entry in json.loads(path.read_text(encoding='utf-8')):
            add(entry['english'])
            for block in entry['blocks']:
                for item in block.get('items', []):
                    # The gloss after a Latin form: "<strong lang="la">X</strong> — gloss; …"
                    for gloss in re.findall(r'</strong>\s*—\s*([^<;(.]+)', item['html']):
                        add(gloss)
    return words


def load_list(path):
    words = []
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.strip() and not line.startswith('#'):
            words.append(line.split('\t')[0].strip().lower())
    return words


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--list', type=Path, default=ROOT / 'refs/ngsl-1.01.tsv')
    parser.add_argument('--out', type=Path, help='write a Markdown report of the gaps here')
    args = parser.parse_args()
    have = covered_words()
    targets = [w for w in load_list(args.list) if w not in FUNCTION_WORDS]
    gaps = [w for w in targets if not inflections(w) & have]
    share = 100 * (len(targets) - len(gaps)) / len(targets)
    print(f'{args.list.name}: {len(targets)} content words, {len(targets) - len(gaps)} covered ({share:.0f}%), {len(gaps)} gaps.')
    if args.out:
        bands = [(1, 500), (501, 1000), (1001, 2000), (2001, 10 ** 6)]
        rank = {w: i + 1 for i, w in enumerate(load_list(args.list))}
        lines = [f'# Coverage of {args.list.name}', '',
                 f'{len(targets)} content words (function words left out), {len(targets) - len(gaps)} covered '
                 f'({share:.0f}%), {len(gaps)} without an entry. Generated by `scripts/coverage.py`; '
                 'a word counts as covered when a record or card has it as a headword, an "also" word or a gloss.', '']
        for low, high in bands:
            band = [w for w in gaps if low <= rank[w] <= high]
            if band:
                lines += [f'## Ranks {low}–{high if high < 10 ** 6 else len(rank)}: {len(band)} gaps', '', ', '.join(band), '']
        if args.list.name.startswith('ngsl'):
            lines += ['The list: the New General Service List 1.01 (Browne, Culligan and Phillips, 2013), CC BY-SA 4.0.', '']
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text('\n'.join(lines), encoding='utf-8')
    return 0


if __name__ == '__main__':
    sys.exit(main())
