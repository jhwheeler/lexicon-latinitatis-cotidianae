#!/usr/bin/env python3
"""List the records whose answer is not the kind of word their headword is.

    python3 scripts/answer_kinds.py            # every suspect record, by kind of mismatch
    python3 scripts/answer_kinds.py --count    # the counts only

A record's answer is its first recommended term: the page shows it first and the practice cards
ask for it. "mountain range" (noun) was answered by perpetuīs jugīs tendere, "stretch in an
unbroken range", and looked broken (Jack, 14 November 2026). This script guesses the kind of each
answer from its `grammar` or its dictionary form and reports a noun headword answered by a verb
or a verb phrase, a verb answered by a noun, an adjective answered by a noun or a verb, and so on.

It is a list to read, not a check: Latin often says with a verb what English says with a noun,
and such a record is right when its gloss and comment say so (see "The answer answers the
headword" in docs/records.md). A record of more than one part of speech passes if any of them
fits, and a record whose `pos` includes `phrase` is not examined. The guess is rough: a noun with
a neuter adjective in -āre (conclāve scholāre) reads as a verb phrase, and an answer that is a
bare word or a noun with an adjective cannot be told at all and is passed over.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
W = r'[^\s,()]+'
NOUN = re.compile(rf'^{W}(?: {W})*?(?: \([^)]*\))?[,;] (?:-?{W} )*-?{W} (?:[mfnc]|comm)\.?(?:/[mfn]\.?)?(?: ?pl\.?)?(?:$|[ ,;(])')
VERB = re.compile(rf'^{W}(?: \([^)]*\))?, {W}(?:re|rī|ī|sse|lle)(?:,|$| )')
ADJECTIVE = re.compile(rf'^{W}, {W}(?:a|ae|aec), {W}(?:um|ud|od|id|oc|em|a)(?:$| )|^{W}(?:er|is), {W}is, {W}e(?:$| )'
                       rf'|^{W}(?:is|er), {W}e(?:$| )|^{W}or, {W}us(?:$| )|^{W}(?:[ārx]|ns|ēs), {W}is(?:$| )')
# An infinitive at the end of a phrase. A bare -ī is nearly always a genitive (appetentia cibī), so
# of the deponent and passive infinitives of the third conjugation only the commonest are listed.
INFINITIVE = re.compile(r'(?:[āēeī]re|[āēī]rī|esse|isse|ferre|velle|nōlle|mālle|fierī|posse'
                        r'|(?:quī|ūtī|fruī|fungī|gredī|lābī|patī|morī|scī|vehī|nītī|querī|plectī|vertī|ferrī|dūcī|mittī|agī))$')
ABBREVIATION = re.compile(r'(?:acc|gen|dat|abl|subj|pl|indecl|inf|[mfn])\.$')   # "secundum + acc." is not a sentence
GRAMMAR = re.compile(r'(noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection|numeral|phrase|participle)')


def kind(term):
    """noun, verb, adjective, …, 'verb phrase', 'sentence' or '' (cannot tell)."""
    latin = re.sub(r' \(\+[^)]*\)$', '', term['latin'].strip())
    named = GRAMMAR.match(term.get('grammar', ''))
    if named and named[1] != 'phrase':
        return 'adjective' if named[1] == 'participle' else named[1]
    if NOUN.match(latin):
        return 'noun'
    if ADJECTIVE.match(latin):   # before the verbs: "illūstris, illūstre" ends like an infinitive
        return 'adjective'
    if VERB.match(latin):
        return 'verb'
    words = re.sub(r'\([^)]*\)', '', latin).split()
    if not words:
        return ''
    if latin[-1] in '!?' or latin[-1] == '.' and not ABBREVIATION.search(latin):
        return 'sentence'
    last = words[-1].strip(',;')
    if INFINITIVE.search(last):
        return 'verb' if len(words) == 1 else 'verb phrase'
    return ''


# An interjection is said as a sentence (Heu!); an ordinal or a hundred is an adjective in form.
FITS = {'noun': {'noun'}, 'verb': {'verb', 'verb phrase'}, 'adjective': {'adjective'}, 'adverb': {'adverb'},
        'interjection': {'interjection', 'sentence'}, 'numeral': {'numeral', 'adjective'}}


def suspects(root=ROOT):
    for path in sorted((root / 'data/concepts').glob('*.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        pos = record.get('pos')
        pos = [pos] if isinstance(pos, str) else (pos or [])
        if not pos or 'phrase' in pos:
            continue
        answer = next(t for t in record['terms'] if t['status'] == 'recommended')
        found = kind(answer)
        if not found:
            continue
        wanted = set().union(*(FITS.get(p, {p}) for p in pos))
        if found not in wanted:
            yield record, answer, found


def main():
    groups = {}
    for record, answer, found in suspects():
        pos = record['pos'] if isinstance(record['pos'], str) else ' and '.join(record['pos'])
        groups.setdefault(f'{pos} answered by a {found}', []).append((record, answer))
    for name in sorted(groups, key=lambda n: -len(groups[n])):
        print(f'## {name}: {len(groups[name])}')
        if '--count' not in sys.argv:
            for record, answer in groups[name]:
                sense = f' ({record["sense"]})' if 'sense' in record else ''
                gloss = f' = {answer["gloss"]}' if 'gloss' in answer else ''
                print(f'  {record["id"]}: {record["english"]}{sense} → {answer["latin"]}{gloss}')
    print(f'{sum(len(g) for g in groups.values())} suspect records')
    return 0


if __name__ == '__main__':
    sys.exit(main())
