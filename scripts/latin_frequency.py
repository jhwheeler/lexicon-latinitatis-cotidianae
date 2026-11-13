#!/usr/bin/env python3
"""Count the lemmas of a lemmatised corpus of classical Latin, most frequent first.

The corpus is LASLA's (Laboratoire d'Analyse Statistique des Langues Anciennes, Université de
Liège): about 1.7 million words of Plautus, Cato, Caesar, Cicero's speeches, Sallust, Lucretius,
Catullus, Vergil, Horace, Livy (one book), Ovid, Seneca, Petronius, the two Plinys, Tacitus and
others, every word lemmatised by hand, a file per book. It is published by the LiLa project
(CIRCSE, Università Cattolica del Sacro Cuore, Milan) at https://github.com/CIRCSE/LASLA under
CC BY-NC-SA 4.0. Clone it outside this repository and never commit it:

    git clone --depth 1 https://github.com/CIRCSE/LASLA ../corpora/lasla

    python3 scripts/latin_frequency.py                       # writes refs/latin-frequency.tsv
    python3 scripts/latin_frequency.py --top 10000 --out /tmp/list.tsv
    python3 scripts/latin_frequency.py --works               # writes notes/coverage/works.md
    python3 scripts/latin_frequency.py --work "Vergilius, Eclogae"            # its words the lexicon has
    python3 scripts/latin_frequency.py --work eclogae --tsv refs/works/vergilius-eclogae.tsv

--corpus names the clone (default ../corpora/lasla beside this repository, or $LASLA).

What is counted. One line of the list is one lemma as the corpus gives it: lower case, u for
both u and v, i for both i and j (uideo, iam), verbs under the first person (deponents in -or),
adjectives under the masculine. Left out: proper names and the adjectives made from them (the
corpus marks both), Greek and other foreign words, numerals written as figures (xiii), and
anything that is not a word. The corpus has no punctuation.

Homographs. LASLA numbers lemmas that are spelt alike (dico 1 = dicāre, dico 2 = dīcere), but
it also numbers the uses of one word (ne 1, 2, 3; sum 1 as a verb, sum 2 as an auxiliary). The
LiLa lemma each token is linked to tells the two apart: numbers that lead to the same LiLa lemma
are one line here, numbers that lead to different ones are separate lines, each with its part of
speech, its declension or conjugation and its commonest forms, so that ōs (ore) and os (ossa)
can be recognised. A token with no number and no link (Livy's book is not linked) goes to the
line of its part of speech, or to the most frequent.

Two repairs. (1) Where a word made of two is printed as one (nonne, etsi, quidnam,
jūsjūrandum), the published files give its second half twice and omit the first; such a word is
counted once, under its own lemma. (2) Other repeated lines are counted once. A compound printed
as two words (ante … quam) is counted under its parts, as the corpus lemmatises it.
"""
import argparse
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CREDIT = ('Derived from the LASLA corpus (Laboratoire d\'Analyse Statistique des Langues Anciennes, Université de '
          'Liège) as linked to the LiLa Lemma Bank and published by the LiLa project (CIRCSE, Università Cattolica del '
          'Sacro Cuore), https://github.com/CIRCSE/LASLA. Licence: CC BY-NC-SA 4.0.')

PARTS = {'NOUN': 'noun', 'VERB': 'verb', 'AUX': 'verb', 'ADJ': 'adjective', 'ADV': 'adverb', 'PRON': 'pronoun',
         'DET': 'determiner', 'ADP': 'preposition', 'CCONJ': 'conjunction', 'SCONJ': 'conjunction', 'PART': 'particle',
         'INTJ': 'interjection', 'NUM': 'numeral'}
NO_CLASS = {'adverb', 'preposition', 'conjunction', 'particle', 'interjection'}
FIGURE = re.compile(r'^[ivxlcdm.]+$')
WORD = re.compile(r'^[a-z]+$')

# Words made of two that the published files give by their second half alone, twice (see above):
# the printed form, or the lemma of the repeated half, names the lemma.
FUSED = {'nonne': ('nonne', 'PART'), 'anne': ('anne', 'PART'), 'etsi': ('etsi', 'SCONJ'), 'etiamsi': ('etiamsi', 'SCONJ'),
         'numquid': ('numquid', 'ADV'), 'quidni': ('quidni', 'ADV'), 'quandoquidem': ('quandoquidem', 'SCONJ'),
         'siquidem': ('siquidem', 'SCONJ')}
FUSED_BY_HALF = {'nam': (re.compile(r'^(?:qu|cu)\w*nam$'), ('quisnam', 'PRON', '')),
                 'iuro': (re.compile(r'^iu\w*iurand\w+$'), ('iusiurandum', 'NOUN', 'A3'))}


def corpus_folder(given=None):
    for folder in (given, os.environ.get('LASLA'), ROOT.parent / 'corpora/lasla', Path('/home/claude/corpora/lasla')):
        if folder and Path(folder).exists():
            folder = Path(folder)
            return folder / 'conllup' if (folder / 'conllup').exists() else folder
    sys.exit('No corpus: clone https://github.com/CIRCSE/LASLA and pass --corpus <folder>')


def work_of(path):
    """("Vergilius", "Eclogae") from Vergilius_Eclogae_VergEclo.conllup: the author, and the title
    with its words set apart and without the author's name the corpus repeats before some titles
    (PliniusEpistulae, TacAnnales)."""
    author, title = path.name.split('_')[:2]
    words = re.findall(r'[A-Z][a-z]*|\d+|[a-z]+', title.replace('0', 'O'))
    if len(words) > 1 and len(words[0]) >= 3 and author.startswith(words[0]):
        words = words[1:]
    author = {'PseudoCaesar1': 'Pseudo-Caesar', 'PseudoCaesar2': 'Pseudo-Caesar', 'PseudoCaesar3': 'Pseudo-Caesar'}.get(author, author)
    return author, ' '.join(words).replace('Bellum 8 Gallicum', 'Bellum Gallicum VIII')


def sentences(path):
    """The token lines of each sentence of a file, as lists of columns; a line such as
    "8-9<TAB>iusiurandum", which gives a printed word that the next lines divide, is kept."""
    block = []
    with open(path, encoding='utf-8') as lines:
        for line in lines:
            if line.startswith('#') or not line.strip():
                if block and not line.strip():
                    yield block
                    block = []
                continue
            block.append(line.rstrip('\n').split('\t'))
    if block:
        yield block


def variant_of(misc):
    for item in misc.split('|'):
        if item.startswith('LASLAVariant='):
            return item[13:]
    return ''


def link_of(cells):
    """"lemma/115327" or "hypolemma/110471" from the LiLa column, or nothing."""
    link = cells[13] if len(cells) > 13 else ''
    if link.startswith('lilaLemma:'):
        return 'lemma/' + link[10:]
    if link.startswith('lilaIpoLemma:'):
        return 'hypolemma/' + link[13:]
    return ''


def tokens(block):
    """(form, lemma, number, part of speech, class, LiLa link) for each word of a sentence
    that is counted, with the two repairs made."""
    printed, seen, out = None, set(), []
    for i, cells in enumerate(block):
        if '-' in cells[0]:
            printed = (cells[0].split('-'), cells[1].lower())
            continue
        if len(cells) < 10:
            continue
        number, form, lemma, upos, xpos = cells[0], cells[1], cells[2], cells[3], cells[4]
        if number in seen:           # the same line again
            continue
        seen.add(number)
        token = (form.lower(), lemma, variant_of(cells[9]), upos, xpos, link_of(cells))
        again = i + 1 < len(block) and block[i + 1][0] == number
        if again and printed and printed[0][-1] == number and printed[0][0] not in seen:
            whole = fused(printed[1], lemma)
            if whole:
                token = (printed[1], whole[0], '', whole[1], whole[2] if len(whole) > 2 else '', '')
        if counted(token):
            out.append(token)
    return out


def fused(printed, half):
    if printed in FUSED:
        return FUSED[printed]
    pattern, whole = FUSED_BY_HALF.get(half, (None, None))
    return whole if pattern and pattern.match(printed) else None


def counted(token):
    form, lemma, variant, upos, xpos, link = token
    if upos not in PARTS or variant in ('N', 'A', 'O'):      # names, the adjectives made from them
        return False
    if not WORD.match(lemma):
        return False
    return not (upos == 'NUM' and FIGURE.match(lemma))


class Corpus:
    """The counts of a corpus: every token under its line (see "Homographs" above), in all and
    work by work."""

    def __init__(self, folder=None, files=None):
        self.raw = Counter()                       # (lemma, number, upos, class, link) → tokens
        self.forms = defaultdict(Counter)          # the same key → its printed forms
        self.by_work = defaultdict(Counter)        # (author, title) → the same keys
        for path in files if files is not None else sorted(Path(folder).glob('*.conllup')):
            work = work_of(path)
            for block in sentences(path):
                for form, *key in tokens(block):
                    key = tuple(key)
                    self.raw[key] += 1
                    self.by_work[work][key] += 1
                    self.forms[key][form] += 1
        self.line_of = self._group()

    def _group(self):
        """{raw key: line}, a line being (lemma, n): the n-th homograph of the lemma."""
        by_lemma = defaultdict(list)
        for key in self.raw:
            by_lemma[key[0]].append(key)
        line_of = {}
        for lemma, keys in by_lemma.items():
            numbers = sorted({k[1] for k in keys if k[1]})
            links = {}                              # number → the LiLa lemma most of its tokens lead to
            for number in numbers:
                tally = Counter()
                for k in keys:
                    if k[1] == number and k[4]:
                        tally[k[4]] += self.raw[k]
                links[number] = tally.most_common(1)[0][0] if tally else None
            group, groups = {}, []                  # number → index of its group; groups: the links of each
            for number in numbers:
                link = links[number]
                found = next((g for g, have in enumerate(groups) if link and link in have), None)
                if found is None:
                    groups.append({link} if link else set())
                    found = len(groups) - 1
                group[number] = found
            if not groups:
                groups.append(set())
            size, part = Counter(), defaultdict(Counter)
            for k in keys:
                if k[1]:
                    size[group[k[1]]] += self.raw[k]
                    part[group[k[1]]][PARTS[k[2]]] += self.raw[k]
            biggest = size.most_common(1)[0][0] if size else 0
            for k in keys:
                if k[1]:
                    g = group[k[1]]
                else:
                    g = next((i for i, have in enumerate(groups) if k[4] and k[4] in have), None)
                    if g is None:
                        same = [i for i in part if part[i].most_common(1)[0][0] == PARTS[k[2]]]
                        g = max(same, key=lambda i: size[i]) if same else biggest
                line_of[k] = (lemma, g)
        return line_of

    def lines(self, counts=None):
        """The lemmas, most frequent first: dicts with lemma, count, part, class, link, works, forms.
        counts: a work's counter instead of the whole corpus."""
        counts = self.raw if counts is None else counts
        total, part, cls, link, forms = Counter(), defaultdict(Counter), defaultdict(Counter), defaultdict(Counter), defaultdict(Counter)
        for key, n in counts.items():
            line = self.line_of[key]
            total[line] += n
        for key, n in self.raw.items():             # what describes a line comes from the whole corpus
            line = self.line_of[key]
            if line not in total:
                continue
            part[line][PARTS[key[2]]] += n
            if re.match(r'^[ABCYZ]\d$', key[3]):
                cls[line][('B' if key[3][0] in 'YZ' else key[3][0]) + key[3][1]] += n
            if key[4]:
                link[line][key[4]] += n
            forms[line].update(self.forms[key])
        works = Counter()
        for work, tally in self.by_work.items():
            for line in {self.line_of[key] for key in tally}:
                works[line] += 1
        out = []
        for line, n in total.items():
            top = lambda tally: tally[line].most_common(1)[0][0] if tally[line] else ''
            kind = top(part)
            letter = {'noun': 'A', 'verb': 'B'}.get(kind, 'C')     # the class that goes with the part of speech
            mine = Counter({c: k for c, k in cls[line].items() if c[0] == letter and kind not in NO_CLASS})
            out.append({'lemma': line[0], 'count': n, 'part': kind,
                        'class': mine.most_common(1)[0][0] if mine else '',
                        'link': top(link), 'works': works[line],
                        'forms': ' '.join([form for form, _ in forms[line].most_common(6) if WORD.match(form)][:3])})
        out.sort(key=lambda row: (-row['count'], row['lemma'], row['class'], row['link']))
        return out

    def work(self, name):
        """The (author, title) a name means: "Vergilius, Eclogae", "vergilius eclogae" or a part of
        it that only one work has ("eclogae")."""
        plain = lambda text: re.sub(r'[^a-z0-9]+', ' ', text.lower()).strip()
        wanted = plain(name).replace('bucolica', 'eclogae')     # the corpus's title for Vergil's Bucolics
        exact = [w for w in self.by_work if plain(' '.join(w)) == wanted]
        found = exact or [w for w in self.by_work if wanted in plain(' '.join(w))]
        if len(found) != 1:
            sys.exit(f'{name!r}: ' + ('no such work' if not found else 'more than one work: ' + '; '.join(', '.join(w) for w in sorted(found)))
                     + '. See notes/coverage/works.md or --works.')
        return found[0]


def write_list(rows, path, top, heading):
    lines = [f'# {heading}', f'# {CREDIT}',
             '# rank, lemma (as the corpus spells it: u for u and v, i for i and j), count, part of speech, class (LASLA: A noun,',
             '# B verb, C adjective, with the declension or conjugation; 5 is the capiō kind, 6 irregular, A7 a Greek noun), the works it',
             '# occurs in, the LiLa lemma (http://lila-erc.eu/data/id/<this>), its commonest forms.',
             'rank\tlemma\tcount\tpart of speech\tclass\tworks\tlila\tforms']
    for rank, row in enumerate(rows[:top] if top else rows, 1):
        lines.append('\t'.join([str(rank), row['lemma'], str(row['count']), row['part'], row['class'], str(row['works']), row['link'], row['forms']]))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def slug(work):
    text = unicodedata.normalize('NFD', ' '.join(work).lower())
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def coverage_module():
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import latin_coverage
    return latin_coverage


def covered_rows(rows, root=ROOT):
    """Each row with the records that have it: (row, [record ids])."""
    lc = coverage_module()
    lexicon = lc.Lexicon(root)
    out = []
    for row in rows:
        found = lc.find(row['lemma'], row['class'], lexicon, row['part'])
        out.append((row, sorted({head.record for head in found.heads}) if found.covered else []))
    return out


def works_report(corpus, path):
    table = []
    for work in sorted(corpus.by_work):
        rows = covered_rows(corpus.lines(corpus.by_work[work]))
        words = sum(row['count'] for row, _ in rows)
        have = [(row, ids) for row, ids in rows if ids]
        table.append((work, words, len(rows), len(have), sum(row['count'] for row, _ in have)))
    lines = ['# The works of the corpus', '',
             f'{len(table)} works, {sum(t[1] for t in table):,} words counted. For each work: its words (without names, figures and '
             'Greek), its lemmas, and how many of those lemmas the lexicon has as the head of a term, with the share of the '
             'work\'s words they make up. Generated by `scripts/latin_frequency.py --works`; the same script lists a work\'s '
             'words with the records that have them (`--work "Vergilius, Eclogae"`). Titles are the corpus\'s own.', '',
             '| Author | Work | Words | Lemmas | In the lexicon | Share of lemmas | Share of words |', '| --- | --- | ---: | ---: | ---: | ---: | ---: |']
    for (author, title), words, lemmas, have, have_words in table:
        lines.append(f'| {author} | {title} | {words:,} | {lemmas:,} | {have:,} | {100 * have / lemmas:.0f}% | {100 * have_words / words:.0f}% |')
    lines += ['', CREDIT, '']
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines), encoding='utf-8')
    return table


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--corpus', type=Path, help='the clone of CIRCSE/LASLA, or its conllup folder')
    parser.add_argument('--top', type=int, default=5000, help='how many lemmas the list keeps (0: all)')
    parser.add_argument('--out', type=Path, help='where to write (default refs/latin-frequency.tsv, or notes/coverage/works.md with --works)')
    parser.add_argument('--works', action='store_true', help='write the table of works')
    parser.add_argument('--work', help='list a work\'s lemmas that the lexicon has, with their records')
    parser.add_argument('--tsv', type=Path, help='with --work: also write all its lemmas and counts here')
    args = parser.parse_args()
    corpus = Corpus(corpus_folder(args.corpus))
    if args.works:
        out = args.out or ROOT / 'notes/coverage/works.md'
        table = works_report(corpus, out)
        print(f'{len(table)} works → {out}')
    elif args.work:
        work = corpus.work(args.work)
        rows = corpus.lines(corpus.by_work[work])
        if args.tsv:
            write_list(rows, args.tsv, 0, f'The lemmas of {", ".join(work)}, most frequent first.')
        found = covered_rows(rows)
        have = [(row, ids) for row, ids in found if ids]
        text = '\n'.join(f'{row["lemma"]}\t{row["count"]}\t{" ".join(ids)}' for row, ids in have) + '\n'
        if args.out:
            args.out.write_text(text, encoding='utf-8')
        else:
            sys.stdout.write(text)
        print(f'{", ".join(work)}: {sum(r["count"] for r in rows):,} words, {len(rows):,} lemmas, {len(have):,} in the lexicon '
              f'({100 * len(have) / len(rows):.0f}%).', file=sys.stderr)
    else:
        rows = corpus.lines()
        out = args.out or ROOT / 'refs/latin-frequency.tsv'
        write_list(rows, out, args.top, f'The {args.top or len(rows):,} most frequent lemmas of classical Latin in the LASLA corpus '
                   f'({sum(r["count"] for r in rows):,} words, {len(rows):,} lemmas), made by scripts/latin_frequency.py.')
        print(f'{sum(r["count"] for r in rows):,} words, {len(rows):,} lemmas; the first {min(args.top or len(rows), len(rows)):,} → {out}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
