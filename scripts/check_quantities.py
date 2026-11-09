#!/usr/bin/env python3
"""Compare the vowel lengths of the records' Latin with Lewis & Short, wherever it marks them.

Lewis & Short marks some vowels long (ā) and some short (ă) in its headwords and leaves the rest
unmarked. For every word that heads a term in data/concepts, this finds the headword in
refs/lewis-short-headwords.tsv and compares each vowel it marks with ours (a vowel without a
macron is short). A disagreement is reported unless it is explained:

- a note of the record gives that form (a note on a form: "fortasse: short final e …"), or
- a ruling in data/rulings.json lists the form, or
- data/quantity-exceptions.json lists the form with the reason (for a departure that rests on
  Bennett or de Vaan rather than a note, or a word where Lewis & Short has a different word).

A word Lewis & Short spells differently (cacabus for caccabus) is not compared, nor is the vowel
before intervocalic j, which the house leaves unmarked (major, ejus). Exit status 1
if any disagreement is unexplained.

    python3 scripts/check_quantities.py          # report
    python3 scripts/check_quantities.py --all    # also list the explained ones
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TERM_HEAD = re.compile(r'^(.+?)(?=\s*(?:,|\(|$))')
LONG, SHORT = '̄', '̆'


def letters(word):
    """[(base letter, mark)] with mark 'L' (macron), 'S' (breve) or '' (none)."""
    out = []
    for ch in unicodedata.normalize('NFD', word):
        if unicodedata.combining(ch):
            if out and ch == LONG:
                out[-1] = (out[-1][0], 'L')
            elif out and ch == SHORT:
                out[-1] = (out[-1][0], 'S')
            continue
        out.append((ch.lower(), ''))
    return out


def base(word):
    return ''.join(c for c, _ in letters(word)).replace('j', 'i')


def load_headwords(root):
    table = {}
    for line in (root / 'refs/lewis-short-headwords.tsv').read_text(encoding='utf-8').splitlines():
        if line and not line.startswith('#'):
            key, head = line.split('\t')
            table.setdefault(key.replace('j', 'i'), []).append(head)
    return table


def compare(ours, theirs):
    """Disagreements between our word and a Lewis & Short headword spelled the same way, or None
    if the spellings differ. Ours: macron = long, none = short. Theirs: unmarked = unknown."""
    a, b = letters(ours), letters(theirs.replace('-', ''))
    if base(ours) != base(theirs.replace('-', '')) or len(a) != len(b):
        return None
    clashes = []
    for i, ((ca, ma), (_, mb)) in enumerate(zip(a, b)):
        if ca not in 'aeiouy' or not mb:
            continue
        # House rule: no macron on the vowel before intervocalic j (major, ejus, majus): the vowel is
        # short and the syllable heavy, where Lewis & Short often marks the syllable (mājor).
        if i + 2 < len(a) and a[i + 1][0] == 'j' and a[i + 2][0] in 'aeiouy':
            continue
        mine = 'L' if ma == 'L' else 'S'
        if mine != mb:
            clashes.append(f'{ca} at {i + 1}: ours {"long" if mine == "L" else "short"}, L&S {"long" if mb == "L" else "short"}')
    return clashes


def explained_forms(root, records):
    forms = {}
    for record in records:
        for note in record.get('notes', {}).values():
            if 'form' in note:
                for word in re.findall(r'[^\W\d_]+', re.sub(r'<[^>]+>', ' ', note['form'])):
                    forms.setdefault(unicodedata.normalize('NFC', word), f'note in {record["id"]}')
    for ruling in json.loads((root / 'data/rulings.json').read_text(encoding='utf-8')):
        for form in ruling.get('forms', []):
            for word in form.split():
                forms.setdefault(unicodedata.normalize('NFC', word), f'ruling {ruling["id"]}')
    path = root / 'data/quantity-exceptions.json'
    if path.exists():
        for word, reason in json.loads(path.read_text(encoding='utf-8')).items():
            forms[unicodedata.normalize('NFC', word)] = reason
    return forms


def check(root=ROOT):
    table = load_headwords(root)
    records = [json.loads(p.read_text(encoding='utf-8')) for p in sorted((root / 'data/concepts').glob('*.json'))]
    explained = explained_forms(root, records)
    found = []
    for record in records:
        for term in record['terms']:
            head = TERM_HEAD.match(term['latin']).group(1)
            for word in re.findall(r'[^\W\d_]+', unicodedata.normalize('NFC', head)):
                candidates = table.get(base(word), [])
                results = [(h, compare(word, h)) for h in candidates]
                comparable = [(h, c) for h, c in results if c is not None]
                if not comparable or any(not c for _, c in comparable):
                    continue
                found.append((record['id'], word, comparable, explained.get(word)))
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--all', action='store_true', help='also list the disagreements that are explained')
    args = parser.parse_args()
    found = check()
    unexplained = [f for f in found if not f[3]]
    for key, word, comparable, why in found:
        if why and not args.all:
            continue
        detail = '; '.join(f'L&S {h}: {", ".join(c)}' for h, c in comparable)
        print(f'{"  explained" if why else "DISAGREES"}: c/{key}: {word} ({detail})' + (f' [{why}]' if why else ''))
    print(f'{len(found)} disagreement(s) with Lewis & Short, {len(unexplained)} unexplained.')
    return 1 if unexplained else 0


if __name__ == '__main__':
    sys.exit(main())
