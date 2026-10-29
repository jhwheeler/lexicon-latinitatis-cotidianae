#!/usr/bin/env python3
"""Write consonantal i as j in the lexicon's Latin text (stdlib only).

House orthography (shared with the Theodōrus et pater readers): jam, ejus,
cujus, major, Troja, Jēsus, Joannēs. The vowel before intervocalic j takes no
macron (major, ejus, pejus: the vowel is short, the syllable heavy), but long
prefixes keep theirs (dējectus, prōjēcit, ējēcī). Compounds: abjicit, objice,
subjēcit, conjūnx. i stays a vowel in the interjection iō, in forms of eō
(iērunt), in superior, Plēiades and Iūlus scanned as three syllables, and
wherever it is a vowel (diēs, cliēns, quiēs, audiō, gaudium).

Only Latin is changed: entry headings, text inside lang="la", and Latin words
in unmarked prose (a narrower rule set, since that prose is mostly English).
English headings, tags, Bulgarian text and link targets are never touched.
Search keywords get the same word changes as the visible text, except that
compounds given an extra j (abice → abjice) keep the classical spelling
there, so a search for either spelling finds them (search also folds j to i).

    python3 scripts/consonantal_j.py --list    # every change and every kept candidate
    python3 scripts/consonantal_j.py --write   # apply to data/
    python3 scripts/consonantal_j.py --check   # fail if any Latin still needs j
"""
import argparse
import collections
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
VOWELS = set('aeiouyāēīōūȳ')
NEXT_VOWELS = set('aeouāēōū')          # a vowel after the i (not i itself: Pompeiī, praeiit need review)
STRIP = str.maketrans('āēīōūĀĒĪŌŪ', 'aeiouAEIOU')
LONG_PREFIXES = ('dē', 'prō', 'ē', 'trā', 'sē')
CONSONANT_PREFIXES = ('ab', 'ad', 'con', 'dis', 'in', 'ob', 'per', 'sub', 'trāns', 'circum')
ICIO = re.compile(r'(ab|ad|con|dē|dis|ē|in|inter|ob|prō|re|sub|trā|circum)(ic[iīeē])')
WORD = re.compile(r'&#?\w+;|[A-Za-zĀ-ſ̀-ͯ]+')
ROMAN = re.compile(r'[IVXLCDM]+')

# Reviewed exceptions: i stays although it stands initially before a vowel or
# between vowels (lowercase, with macrons). Add to this list rather than
# working around the rules.
KEEP = {
    # vocalic i in Latin
    'iō': 'interjection, two syllables',
    'iērunt': 'form of eō', 'iēre': 'form of eō', 'ierat': 'form of eō', 'ierant': 'form of eō',
    'ierit': 'form of eō', 'ierint': 'form of eō', 'ierim': 'form of eō', 'iēns': 'form of eō',
    'superior': 'comparative, vocalic i', 'superius': 'comparative, vocalic i',
    'interior': 'comparative (also English), vocalic i', 'interius': 'comparative, vocalic i',
    'plēiades': 'Greek Πλειάδες', 'gāius': 'trisyllabic Gāĭus', 'cāius': 'trisyllabic Cāĭus',
    'iambus': 'Greek ἴαμβος', 'iōnia': 'Greek Ἰωνία', 'iōnēs': 'Greek Ἴωνες', 'iōta': 'Greek ἰῶτα',
    'iūlus': 'decide per passage: three syllables in Vergil keeps i',
    # not Latin: English prose and names
    'apuleius': 'English form of the author’s name in English prose',
    'logeion': 'name of the dictionary site',
    'yields': 'English verb in unmarked prose (y counts as a vowel)',
    # citation labels keep the dictionary's own headword (L&S prints janua, jus, but deicio)
    'deicio': 'Lewis & Short headword in a citation label (L&S: dē-ĭcĭo, also dejicio)',
    'aio': 'Lewis & Short headword in a citation label (L&S: aio)',
    'io': 'Lewis & Short headword in a citation label (the interjection iō)',
}


def strip_macron(ch):
    return ch.translate(STRIP)


def respell(word, latin):
    """Return (new word, reasons). latin=False applies only the unambiguous rules."""
    low = word.lower()
    if ROMAN.fullmatch(word) or low in KEEP or 'j' in low:
        return word, []
    chars, reasons = list(word), []
    for k, ch in enumerate(word):
        if ch not in 'iI' or k + 1 >= len(word) or low[k + 1] not in NEXT_VOWELS:
            continue
        before = low[:k]
        if k == 0:
            reason = 'initial'
        elif low[k - 1] in VOWELS:
            if before.endswith(('qu', 'gu')):
                continue                                   # quiēs, reliquiae: u belongs to qu
            reason = 'intervocalic'
            if chars[k - 1] != strip_macron(chars[k - 1]) and before not in LONG_PREFIXES:
                chars[k - 1] = strip_macron(chars[k - 1])  # māior → major, Trōia → Troja
                reason += ', macron dropped'
        elif latin and before in CONSONANT_PREFIXES and (
                low[k + 1] in 'uūaā' or (low[k + 1] in 'eē' and low[k + 2:k + 3] == 'c')):
            reason = 'prefix'                              # coniungō, adiuvō, obiectum; not adiērunt
        else:
            continue
        chars[k] = 'J' if ch == 'I' else 'j'
        reasons.append(reason)
    word = ''.join(chars)
    if latin:
        m = ICIO.match(word.lower())
        if m and not reasons:
            cut = len(m.group(1))
            word = word[:cut] + 'j' + word[cut:]           # abice → abjice, dēiciō → dējiciō
            reasons.append('compound of iaciō')
    return word, reasons


class Changes:
    def __init__(self):
        self.made = collections.defaultdict(lambda: {'new': None, 'n': 0, 'reasons': set(), 'where': set()})
        self.kept = collections.defaultdict(lambda: {'n': 0, 'why': None, 'where': set()})
        self.words = {}

    def word(self, w, latin, where):
        new, reasons = respell(w, latin)
        if new != w:
            rec = self.made[w]
            rec['new'] = new
            rec['n'] += 1
            rec['reasons'].update(reasons)
            rec['where'].add(where)
            if len(new) == len(w):      # abjice, dējiciō keep abice, dēiciō in keywords as search aliases
                self.words[w] = new
        elif candidate(w):
            self.keep(w, why_kept(w, latin), where)
        return new

    def keep(self, w, why, where):
        rec = self.kept[w]
        rec['n'] += 1
        rec['why'] = why
        rec['where'].add(where)

    def skipped(self, text, what, where):
        """Record candidates in text that is not Latin and is never changed."""
        for m in WORD.finditer(text):
            if candidate(m.group(0)) and 'j' not in m.group(0).lower():
                self.keep(m.group(0), f'not Latin ({what})', where)


def candidate(w):
    """Could i be consonantal here? (initially or between vowels before a vowel, or after a prefix)."""
    low = w.lower()
    return bool(re.match(r'i[aeouāēōū]', low) or re.search(r'[aeiouyāēīōū]i[aeouāēōū]', low)
                or re.match(r'(%s|inter|super|ex)i[aeouāēōū]' % '|'.join(CONSONANT_PREFIXES), low)
                or re.match(r'(ab|ad|con|d[eē]|dis|[eē]|in|inter|ob|pr[oō]|re|sub|tr[aā]|circum)ic[iīeē]', low))


def why_kept(w, latin):
    low = w.lower()
    if 'j' in low:
        return 'already has j'
    if ROMAN.fullmatch(w):
        return 'Roman numeral'
    if low in KEEP:
        return KEEP[low]
    if re.search(r'[qg]ui[aeouāēōū]', low):
        return 'u belongs to qu/gu; i is a vowel'
    if not latin:
        return 'unmarked prose: compound and prefix rules apply only to Latin text'
    return 'i is a vowel here (e.g. a form of eō after a prefix)'


def respell_text(text, latin, changes, where):
    return WORD.sub(lambda m: m.group(0) if m.group(0).startswith('&')
                    else changes.word(m.group(0), latin, where), text)


def respell_html(html, changes, where):
    """Respell text nodes by their lang context; tags and attributes are left alone."""
    out, stack = [], []
    for part in re.split(r'(<[^>]+>)', html):
        if part.startswith('<'):
            tag = re.match(r'</?([a-z]+)', part).group(1)
            if part.startswith('</'):
                stack.pop()
            elif tag != 'br':
                lang = re.search(r'\slang="([^"]+)"', part)
                stack.append(lang.group(1) if lang else None)
            out.append(part)
            continue
        lang = next((l for l in reversed(stack) if l), None)
        if lang in (None, 'la'):
            part = respell_text(part, lang == 'la', changes, where)
        else:
            changes.skipped(part, f'lang="{lang}"', where)
        out.append(part)
    return ''.join(out)


def process(root=ROOT):
    """Return ({path: new json text}, Changes) for the data under root."""
    changes = Changes()
    results = {}
    catalog_path = root / 'data/catalog.json'
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    for category in catalog['categories']:
        category['latin'] = respell_text(category['latin'], True, changes, 'catalog')
    results[catalog_path] = catalog
    files = sorted((root / 'data/entries').glob('*.json'))
    loaded = {p: json.loads(p.read_text(encoding='utf-8')) for p in files}
    for path, entries in loaded.items():
        for entry in entries:
            where = entry['id']
            entry['latin'] = respell_text(entry['latin'], True, changes, where)
            changes.skipped(entry['english'], 'English heading', where)
            for tag in entry['tags']:
                changes.skipped(tag, 'tag', where)
            for block in entry['blocks']:
                for item in block.get('items', []):
                    item['html'] = respell_html(item['html'], changes, where)
                if 'html' in block:
                    block['html'] = respell_html(block['html'], changes, where)
                if 'paragraphs' in block:
                    block['paragraphs'] = [respell_html(p, changes, where) for p in block['paragraphs']]
    # Search keywords repeat the visible text: give them the same word changes.
    for path, entries in loaded.items():
        for entry in entries:
            if 'keywords' in entry:
                entry['keywords'] = WORD.sub(lambda m: changes.words.get(m.group(0), m.group(0)), entry['keywords'])
        results[path] = entries
    return {p: json.dumps(v, ensure_ascii=False, indent=2) + '\n' for p, v in results.items()}, changes


def report(changes, out=sys.stdout):
    made = changes.made
    print(f'Changed {sum(r["n"] for r in made.values())} occurrences of {len(made)} distinct words:', file=out)
    for w in sorted(made, key=str.lower):
        r = made[w]
        print(f'  {w:24} → {r["new"]:24} {r["n"]:3}×  {", ".join(sorted(r["reasons"]))}'
              f'  [{", ".join(sorted(r["where"], key=lambda s: (len(s), s))[:4])}{" …" if len(r["where"]) > 4 else ""}]', file=out)
    kept = changes.kept
    print(f'\nKept {len(kept)} distinct candidate words (i initial or between vowels, or after a prefix):', file=out)
    for w in sorted(kept, key=str.lower):
        r = kept[w]
        print(f'  {w:24} {r["n"]:3}×  {r["why"]}  [{", ".join(sorted(r["where"])[:3])}]', file=out)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--list', action='store_true', help='print every change and every kept candidate')
    mode.add_argument('--write', action='store_true', help='apply the changes to data/')
    mode.add_argument('--check', action='store_true', help='exit 1 if any Latin still needs j')
    args = parser.parse_args()
    texts, changes = process()
    if args.list:
        report(changes)
    elif args.write:
        for path, text in texts.items():
            if path.read_text(encoding='utf-8') != text:
                path.write_text(text, encoding='utf-8')
        report(changes)
        print('\nWrote data/. Rebuild with python3 scripts/build.py.')
    elif changes.made:
        print('Consonantal i still written i (run python3 scripts/consonantal_j.py --write, '
              'or add a reviewed exception to KEEP):', file=sys.stderr)
        for w, r in sorted(changes.made.items()):
            print(f'  {w} → {r["new"]}  [{", ".join(sorted(r["where"]))}]', file=sys.stderr)
        return 1
    else:
        print('All Latin uses j for consonantal i.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
