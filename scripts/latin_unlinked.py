#!/usr/bin/env python3
"""List the Latin words of the lexicon's own texts that are not linked to a word's page.

The builder links every word of a term's head and of an example to the page of the word it is a
form of (see "Every Latin word linked" in scripts/build.py). This reads the same texts with the
same index (the heads of terms of several words, the examples, the Latin quoted in evidence) and
writes what the index could not resolve to notes/coverage/unlinked.md:

- the words without an entry, grouped by their likely lemma, most frequent first: the list for
  whoever adds records;
- the forms the index does not reach although the lexicon has the word (a principal part the
  dictionary form does not give, an irregular form): material for IRREGULAR_FORMS in the builder;
- the words found only when their macrons are ignored: a macron is probably missing or wrong,
  in the text or in the entry;
- the proper names without an entry;
- the forms that may belong to several words and were left unlinked.

The likely lemma is a guess: an ending is taken off the form and the dictionary form it would
have is looked for among the headwords of Lewis & Short (refs/lewis-short-headwords.tsv). Where
none is found the form stands under itself.

    python3 scripts/latin_unlinked.py            # writes notes/coverage/unlinked.md
    python3 scripts/latin_unlinked.py --top 60   # also prints the commonest words without an entry
"""
import argparse
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build', ROOT / 'scripts/build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

# The dictionary forms a stem may have, by the class of the ending taken off it.
_NOMINATIVES = {
    'n1': ('a',), 'n2': ('us', 'er', ''), 'n2n': ('um',), 'n3': ('', 's', 'is', 'es'), 'n3n': ('', 'e', 'us'),
    'n4': ('us',), 'n4n': ('u',), 'n5': ('es',), 'a12': ('us', 'er'), 'a3': ('is', '', 's'),
    'v1': ('o', 'or'), 'v2': ('eo', 'eor'), 'v3': ('o', 'or'), 'v3i': ('io', 'ior'), 'v4': ('io', 'ior'),
}
# The stems of the third declension that the nominative changes: (the stem's end, the nominative's)
_THIRD = (('in', 'o'), ('on', 'o'), ('it', 'es'), ('or', 'us'), ('er', 'us'), ('tr', 'ter'), ('tat', 'tas'), ('tut', 'tus'),
          ('d', 's'), ('t', 's'), ('nt', 'ns'), ('c', 'x'), ('g', 'x'), ('ic', 'ex'), ('ud', 'us'), ('r', 's'), ('l', 'l'))


def headwords(root):
    """Lewis & Short's headwords, folded as the linker folds a word, each with its marked form."""
    path, found = root / 'refs/lewis-short-headwords.tsv', {}
    if path.exists():
        for line in path.read_text(encoding='utf-8').splitlines():
            if line and not line.startswith('#') and '\t' in line:
                word = build.unicodedata.normalize('NFD', line.split('\t')[1]).replace('\u0306', '')
                found.setdefault(build.bare_key(word), build.unicodedata.normalize('NFC', word))
    return found


def likely_lemma(form, known):
    """The headword of Lewis & Short a form most likely belongs to, or nothing: the longest stem
    wins, since the shortest ending is the likeliest."""
    bare = build.bare_key(form)
    if bare in known:
        return known[bare]
    for cut in range(len(bare) - 1, 1, -1):
        stem, ending = bare[:cut], bare[cut:]
        for cls, nominatives in _NOMINATIVES.items():
            if ending not in build.ENDINGS[cls]:
                continue
            tries = [stem + n for n in nominatives]
            if cls in ('n3', 'n3n', 'a3'):
                tries += [stem[:-len(a)] + b for a, b in _THIRD if stem.endswith(a)]
            for attempt in tries:
                if attempt in known:
                    return known[attempt]
    return ''


def survey(site, root=ROOT):
    """What the index makes of every word of the lexicon's texts: the totals by state, and for each
    state the forms with their counts and the records they occur in."""
    forms, known = site['forms'], headwords(root)
    totals = {kind: {'linked': 0, 'ambiguous': 0, 'none': 0, 'name': 0} for kind in ('head', 'example', 'quotation', 'prose')}
    found = {state: {} for state in ('none', 'name', 'ambiguous')}
    common = set()      # words without an entry that some text writes in lower case
    for key, kind, text in build.latin_texts(site):
        for word, state, _ in build.latin_words(text, forms):
            if not state:
                continue
            totals[kind][state] += 1
            if kind != 'prose' and state in found:
                form = word if state == 'name' else build.unicodedata.normalize('NFC', word).lower()
                if state == 'none' and word[:1].islower():
                    common.add(form)
                entry = found[state].setdefault(form, [0, []])
                entry[0] += 1
                if key not in entry[1]:
                    entry[1].append(key)

    def move(source, form, target, to):
        count, places = found[source].pop(form)
        entry = found[target].setdefault(to, [0, []])
        entry[0] += count
        entry[1] += [p for p in places if p not in entry[1]]
    # The builder calls a capitalised word inside a sentence a name, and cannot tell what a
    # capitalised word that opens a sentence is. Here a word some text writes in lower case is a
    # common word wherever it stands (Ō, Vae); a word never so written that is a name somewhere
    # is a name everywhere.
    for name in [name for name in found['name'] if name.lower() in common]:
        move('name', name, 'none', name.lower())
    names = {name.lower(): name for name in found['name']}
    for form in [form for form in found['none'] if form in names and form not in common]:
        move('none', form, 'name', names[form])
    groups = {'missing': {}, 'unreached': {}, 'unmarked': {}}
    for form, (count, places) in found['none'].items():
        loose = forms.candidates(form, marked=False)
        lemma = likely_lemma(form, known)
        # the entry the guessed lemma is, if the lexicon has it written alike (Lewis & Short does not mark a final ō)
        heads = [head for marked, head in forms.exact.get(build.bare_key(lemma), ()) if marked[:-1] == build.form_key(lemma)[:-1]] if lemma else []
        if loose:
            group, label = 'unmarked', ', '.join(sorted(loose))
        elif heads:
            group, label = 'unreached', heads[0]
        else:
            group, label = 'missing', (lemma if lemma and build.bare_key(lemma) != build.bare_key(form) else form)
        entry = groups[group].setdefault(label, [0, {}, []])
        entry[0] += count
        entry[1][form] = count
        entry[2] += [p for p in places if p not in entry[2]]
    return totals, found, groups


def _places(places):
    return ', '.join(places[:3]) + (' …' if len(places) > 3 else '')


def _rows(group, label):
    lines = [f'| {label} | Times | Forms | In |', '| --- | ---: | --- | --- |']
    for lemma, (count, forms, places) in sorted(group.items(), key=lambda item: (-item[1][0], build.bare_key(item[0]))):
        shown = ', '.join(f'{form}' + (f' ({n})' if n > 1 else '') for form, n in sorted(forms.items(), key=lambda f: (-f[1], f[0])))
        lines.append(f'| *{lemma}* | {count} | {shown} | {_places(places)} |')
    return lines


def report(site, root=ROOT):
    totals, found, groups = survey(site, root)
    texts = {state: sum(totals[kind][state] for kind in ('head', 'example', 'quotation')) for state in ('linked', 'ambiguous', 'none', 'name')}
    words = sum(texts.values())
    number = lambda n: f'{n:,}'
    share = lambda n: f'{100 * n / words:.1f}%' if words else '0%'
    count = lambda group: (len(group), sum(entry[0] for entry in group.values()))
    lines = [
        '# Latin words without a link', '',
        'Generated by `python3 scripts/latin_unlinked.py`; do not edit by hand. The builder links every word of a term’s head and '
        'of an example to the page of the word it is a form of. This is what it could not link, in the heads of terms of '
        'several words, the examples and the Latin quoted as evidence. The likely lemma is a guess from the headwords of Lewis & Short.', '',
        '| | Words | Linked | Ambiguous | Without an entry | Names without an entry |', '| --- | ---: | ---: | ---: | ---: | ---: |']
    for kind, label in (('head', 'Heads of several words'), ('example', 'Examples'), ('quotation', 'Quotations in evidence')):
        row = totals[kind]
        lines.append(f'| {label} | {number(sum(row.values()))} | {number(row["linked"])} | {number(row["ambiguous"])} | {number(row["none"])} | {number(row["name"])} |')
    lines.append(f'| **All** | {number(words)} | {number(texts["linked"])} ({share(texts["linked"])}) | {number(texts["ambiguous"])} ({share(texts["ambiguous"])}) '
                 f'| {number(texts["none"])} ({share(texts["none"])}) | {number(texts["name"])} ({share(texts["name"])}) |')
    prose = totals['prose']
    lines += ['', f'Latin quoted inside comments, registers and notes is not linked: {number(sum(prose.values()))} words, of which '
              f'{number(prose["linked"])} would be linked, {number(prose["ambiguous"])} are ambiguous and {number(prose["none"] + prose["name"])} have no entry.', '',
              f'Of the {number(texts["none"])} words without an entry, {number(count(groups["missing"])[1])} have none at all '
              f'({number(count(groups["missing"])[0])} likely lemmas), {number(count(groups["unreached"])[1])} are forms the index does not '
              f'reach of a word that has one, and {number(count(groups["unmarked"])[1])} are found only when their macrons are ignored. '
              'A capitalised word that opens a sentence and is a name elsewhere is counted with the names below.', '',
              f'## Words without an entry ({number(count(groups["missing"])[0])} lemmas, {number(count(groups["missing"])[1])} words)', '',
              'The list for new records, most frequent first.', '']
    lines += _rows(groups['missing'], 'Likely lemma')
    lines += ['', f'## Forms not reached although the word has an entry ({number(count(groups["unreached"])[1])} words)', '',
              'The dictionary form does not show the stem (a perfect or supine not given, a deponent of mixed conjugation, a Greek '
              'declension), or the lemma guessed is not the word meant. The commonest belong in `IRREGULAR_FORMS` in the builder, '
              'or the entry’s principal parts want completing.', '']
    lines += _rows(groups['unreached'], 'Entry')
    lines += ['', f'## Found only when the macrons are ignored ({number(count(groups["unmarked"])[1])} words)', '',
              'The form would belong to the entry named if its macrons were other than they are: a macron is probably missing or wrong, '
              'in the text or in the entry; or the form is one the index does not know with that quantity.', '']
    lines += _rows(groups['unmarked'], 'Would be')
    names = found['name']
    lines += ['', f'## Proper names without an entry ({number(len(names))} forms, {number(sum(e[0] for e in names.values()))} words)', '',
              'Capitalised words inside a sentence.', '', '| Name | Times | In |', '| --- | ---: | --- |']
    lines += [f'| {name} | {n} | {_places(places)} |' for name, (n, places) in sorted(names.items(), key=lambda item: (-item[1][0], item[0]))]
    ambiguous = found['ambiguous']
    lines += ['', f'## Forms left unlinked because they may belong to several words ({number(len(ambiguous))} forms, {number(sum(e[0] for e in ambiguous.values()))} words)', '',
              'None of the candidates could be chosen safely (see `FormIndex.choose` in the builder).', '',
              '| Form | Times | Could be | In |', '| --- | ---: | --- | --- |']
    for form, (n, places) in sorted(ambiguous.items(), key=lambda item: (-item[1][0], item[0])):
        site['forms'].resolve(form)
        lines.append(f'| {form} | {n} | {", ".join(site["forms"].candidates(form) or ["(with an enclitic or in another spelling)"])} | {_places(places)} |')
    return '\n'.join(lines) + '\n', groups


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out', default=str(ROOT / 'notes/coverage/unlinked.md'), help='where to write the report')
    parser.add_argument('--top', type=int, default=0, help='print the commonest words without an entry')
    args = parser.parse_args()
    site = build.load_site(ROOT)
    text, groups = report(site)
    Path(args.out).write_text(text, encoding='utf-8')
    print(build.totals_line(build.link_totals(site)))
    if args.top:
        ranked = sorted(groups['missing'].items(), key=lambda item: (-item[1][0], build.bare_key(item[0])))[:args.top]
        print(', '.join(f'{lemma} ({count})' for lemma, (count, _, _) in ranked))
    return 0


if __name__ == '__main__':
    sys.exit(main())
