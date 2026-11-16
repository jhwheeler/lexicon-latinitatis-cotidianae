#!/usr/bin/env python3
"""Build the editor's review page, or turn its saved verdicts into a report.

    python3 scripts/editor_review.py                  # write the page's files to .editor-review/
    python3 scripts/editor_review.py --out DIR        # … or to another folder
    python3 scripts/editor_review.py --mine FILE      # … with the editor's own list ahead inside each band of the queue
    python3 scripts/editor_review.py --report FILE    # verdict documents (one JSON object per line,
                                                      # or - for standard input) → a review report

Only the editor reviews (Jack, 15 November 2026), so his tools are not on the public site. They are
a page of his own, published privately as a claude.ai artifact that only his account can open: the
entries as the site draws them, one after another, with Rēctē (looks right) and Notā (flag) under
the thumb. Each verdict is saved at once in the artifact's own database, as the document
verdicts/<record id>, in the shape of a verdict in a review report. An agent reads those documents,
turns them into a report with --report, and gives it to scripts/apply_review.py, which alone marks
a record reviewed. See docs/review.md.

The page cannot read the site (an artifact loads nothing from other hosts), so this script gives it
the lexicon as it stands: the stylesheet and fonts, an index of every record with its revision, and
one file of entries per category, loaded when wanted. After the records change, build and publish
it again; a verdict is tied to the revision it was given on, so one given on an older text is never
applied to a newer one.

The queue is in order of priority (Jack, 16 November 2026: "i can review whatever i can review.
would be good to have more high prio items first"). How likely a record is to be wrong puts it in
a band, and the bands are read from the highest; how much it is used orders it inside its band.
The weights and the bands are below. --mine FILE names a text file of record ids, one per line:
the words the editor says himself. They stand ahead inside their band, not ahead of everything
(the first order did that, and led with attested words like mālum). That list is private: it is kept outside the repository, never committed, and
written nowhere but into the page's own data.
"""
import argparse
import datetime
import importlib.util
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).resolve().parent / f'{name}.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = _load('build')
coverage = _load('latin_coverage')
answer_kinds = _load('answer_kinds')

# The weights of the queue. A record's priority is the sum of those that apply to it: how much it
# is used, plus how likely it is to be wrong. The page reads the highest first, and names up to
# three of a record's reasons under the strip at the top. The signals and the numbers are the
# coordinating session's choice (16 November 2026), for Jack to judge; change a number here and
# build the page again. Each constant's code, in REASONS below, is what the page's data carries.
#
# Risk decides the order, in bands; use only orders the entries inside a band (Jack, 16 November
# 2026, on finding the queue led by his own list and the commonest words: "it just again seems
# like...everything … it is giving me words like mālum, really? come on"). An attested word whose
# forms the scripts check against Lewis & Short does not need him first because he says it often.
#
# Use: the order inside a band.
MINE = 25          # on the editor's own list (--mine): about as much as a very frequent word
FREQUENT = ((1000, 30), (2000, 20), (5000, 10))    # the answer's rank in refs/latin-frequency.tsv: up to this rank, this weight
DAILY = 5          # in one of the categories nearest the person: the first DAILY_CATEGORIES of the catalog's filters
DAILY_CATEGORIES = 8
# Risk. "The answer" is the record's first recommended term, the one the page shows first.
OURS = 30          # the answer is a term of ours: no author stands behind it
RECENT = 15        # the answer is modern, or its evidence is Levi–Bini or Andresian alone
QUANTITY = 15      # a note departs from an authority on a form (`against`), or applies a ruling
KIND = 20          # scripts/answer_kinds.py lists it: the answer may not be the kind of word the headword is
UNSOURCED = 20     # no line of sources
COMPOSED = 5       # it has an example or phrase composed by us
PHRASE = 5         # the headword is one word and the answer is several
# The bands, the highest read first: 3, where a judgement of ours stands in place of a source;
# 2, modern words and answers that may be the wrong kind of word; 1, attested words that carry a
# sentence of ours; 0, the rest, attested words with nothing of ours.
BANDS = {'ours': 3, 'unsourced': 3, 'quantity': 3, 'recent': 2, 'kind': 2, 'composed': 1, 'phrase': 1}
REASONS = {'mine': MINE, 'frequent': FREQUENT, 'daily': DAILY, 'ours': OURS, 'recent': RECENT, 'quantity': QUANTITY,
           'kind': KIND, 'unsourced': UNSOURCED, 'composed': COMPOSED, 'phrase': PHRASE}
CAUTIOUS = re.compile(r'Levi[–-]Bini|Andresian')    # the reference works the house rules treat with caution

OUT = '.editor-review'
# A document's id in the artifact's database is the record's id; this is what a path segment allows.
SEGMENT = r'[A-Za-z0-9_\-.~:@+]+'


def entry_html(record, site):
    """The entry as its page on the site draws it, without what only works there: the links (the
    page has nowhere to follow them; the words stay), the line that opens a GitHub issue and the
    line that leads to "How to read the sources"."""
    key = record['id']
    html = builder.resolve_anchors(builder.render_concept(record, site), site, '../', f'c/{key}.html')
    html = re.sub(r'<p class="(?:suggest|how-sources)">.*?</p>', '', html, flags=re.S)
    return re.sub(r'</?a\b[^>]*>', '', html)


def answer(record):
    """The record's first recommended term: what the page shows first and the cards ask for."""
    return builder.ordered_terms(record)[0]


def answer_words(term):
    """How many words the term's dictionary head has, a form in brackets not counted: one in
    "caccabus (cacabus), caccabī m." and in "ā, ab (+ ablative)", two in "epitonium vertere"."""
    return len(re.split(r'[,;]', re.sub(r'\([^)]*\)', '', term['latin']))[0].split())


def frequency_ranks(site, root=ROOT):
    """{record id: the rank of its answer in refs/latin-frequency.tsv}, for the records whose
    answer is one word and a lemma of that list. The matching is scripts/latin_coverage.py's, which
    knows the list's spelling, its voices and plurals, and which homographs are other words."""
    path = root / 'refs/latin-frequency.tsv'
    if not path.exists():
        return {}
    answers = {key: answer(record)['latin'] for key, record in site['records'].items() if answer_words(answer(record)) == 1}
    ranks = {}
    for row, found in coverage.measure(coverage.load_list(path), coverage.Lexicon(root, list(site['records'].values()))):
        if found.covered:
            for head in found.heads:
                if answers.get(head.record) == head.latin:
                    ranks[head.record] = min(row['rank'], ranks.get(head.record, row['rank']))
    return ranks


def priorities(site, root=ROOT, mine=()):
    """{record id: (priority, reasons)}: the sum of the weights that apply to the record, and their
    codes with the weightiest first (those of equal weight in the order of REASONS). Ids of `mine`
    that are not records are passed over."""
    mine = set(mine)
    ranks = frequency_ranks(site, root)
    daily = [key for key in site['catalog']['filters'] if key != 'all'][:DAILY_CATEGORIES]
    suspects = {record['id'] for record, _, _ in answer_kinds.suspects(root)}
    out = {}
    for key, record in site['records'].items():
        term = answer(record)
        evidence = term.get('evidence', [])
        notes = record.get('notes', {}).values()
        phrases = record.get('phrases', [])
        rank = ranks.get(key)
        weights = {
            'mine': MINE if key in mine else 0,
            'frequent': next((weight for limit, weight in FREQUENT if rank <= limit), 0) if rank else 0,
            'daily': DAILY if record['domain'] in daily else 0,
            'ours': OURS if term['period'] == 'ours' else 0,
            'recent': RECENT if term['period'] == 'modern' or evidence and all(CAUTIOUS.search(line) for line in evidence) else 0,
            'quantity': QUANTITY if any('against' in note or 'ruling' in note for note in notes) else 0,
            'kind': KIND if key in suspects else 0,
            'unsourced': UNSOURCED if not record.get('sources') else 0,
            'composed': COMPOSED if any(phrase['source'] == 'composed' for phrase in phrases) else 0,
            'phrase': PHRASE if len(record['english'].split()) == 1 and answer_words(term) > 1 else 0,
        }
        reasons = sorted((code for code in REASONS if weights[code]), key=lambda code: -weights[code])
        out[key] = (sum(weights.values()), reasons)
    return out


def band(reasons):
    """The band of a record with these reasons: the highest any of them gives, 0 with none."""
    return max((BANDS.get(code, 0) for code in reasons), default=0)


def read_mine(path):
    """The record ids of the editor's own list: one per line, blank lines and lines that begin
    with # passed over. The list is private, so a file inside the repository is refused: there it
    would be committed with the next change."""
    path = Path(path).resolve()
    builder.require(ROOT not in path.parents, f'{path.name} is inside the repository: the list is private, keep it outside')
    lines = (line.strip() for line in path.read_text(encoding='utf-8').splitlines())
    return list(dict.fromkeys(line for line in lines if line and not line.startswith('#')))


def page_files(root=ROOT, today=None, mine=(), site=None):
    """Every file of the page as {path: text or bytes}. d/index.js has a row for each record:
    [id, revision, English, the answer's head, the number of its category, 1 if reviewed, priority,
    reasons]. The row stays an array and new fields go at its end, so that a page and an index of
    different days still read each other. `mine` is the record ids of the editor's own list (see
    read_mine); `site` is the loaded site, if the caller has it."""
    site = site or builder.load_site(root)
    ranked = priorities(site, root, mine)
    categories = list(site['categories'])
    by_category = {key: [] for key in categories}
    for record in site['records'].values():
        by_category[record['domain']].append(record)
    index, files = [], {}
    for number, key in enumerate(categories):
        records = sorted(by_category[key], key=lambda record: (record['english'].casefold(), record['id']))
        entries = {}
        for record in records:
            builder.require(re.fullmatch(SEGMENT, record['id']), f'{record["id"]} cannot name a verdict document')
            head = builder.term_head(answer(record)['latin'])
            english = record['english'] + (f' ({record["sense"]})' if 'sense' in record else '')
            index.append([record['id'], builder.record_revision(record), english, head, number,
                          1 if builder.reviewed(record) else 0, *ranked[record['id']]])
            entries[record['id']] = entry_html(record, site)
        files[f'd/{key}.js'] = f'editorChunk({json.dumps(key)},{json.dumps(entries, ensure_ascii=False, separators=(",", ":"))});\n'
    data = {'built': (today or datetime.date.today()).isoformat(), 'site': builder.SITE_URL,
            'categories': [{'id': key, 'english': site['categories'][key]['english'], 'latin': site['categories'][key]['latin']}
                           for key in categories],
            'bands': BANDS, 'records': index}
    files['d/index.js'] = f'window.editorIndex={json.dumps(data, ensure_ascii=False, separators=(",", ":"))};\n'
    files['index.html'] = (root / 'src/editor/review.html').read_text(encoding='utf-8')
    files['review.js'] = (root / 'src/editor/review.js').read_text(encoding='utf-8')
    files['editor.css'] = (root / 'src/editor/editor.css').read_text(encoding='utf-8')
    files['lexicon.css'] = (root / 'src/styles.css').read_text(encoding='utf-8')
    for font in sorted((root / 'src/fonts').glob('*.woff2')):
        files[f'fonts/{font.name}'] = font.read_bytes()
    return files


def report(lines):
    """A review report (see docs/review.md) from the verdict documents of the page's database: one
    JSON object per line, either the document as the database tools give it ({"id", "data", …}) or
    its data alone. The record's id is the document's."""
    verdicts = []
    for line in lines:
        line = line.strip()
        if not line.startswith('{'):
            continue
        document = json.loads(line)
        verdict = dict(document.get('data', document))
        if 'data' in document:
            verdict.setdefault('id', str(document.get('id', '')).rsplit('/', 1)[-1])
        verdicts.append({key: verdict[key] for key in ('id', 'rev', 'verdict', 'reasons', 'note', 't', 'date') if key in verdict})
    return json.dumps({'lexicon-review': 1, 'verdicts': sorted(verdicts, key=lambda v: (v.get('t', 0), v.get('id', '')))},
                      ensure_ascii=False, indent=1) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--out', default=str(ROOT / OUT), help='Where to write the page (default: .editor-review/)')
    parser.add_argument('--report', metavar='FILE', help='Turn verdict documents into a review report, printed')
    parser.add_argument('--mine', metavar='FILE', help="The editor's own list, read first: record ids, one per line. Private: "
                        'a file outside the repository, never committed')
    args = parser.parse_args()
    try:
        if args.report:
            source = sys.stdin if args.report == '-' else open(args.report, encoding='utf-8')
            with source:
                sys.stdout.write(report(source))
            return 0
        site = builder.load_site(ROOT)
        mine = read_mine(args.mine) if args.mine else []
        files, out = page_files(mine=mine, site=site), Path(args.out)
        if out.exists():
            shutil.rmtree(out)
        for path, text in files.items():
            (out / path).parent.mkdir(parents=True, exist_ok=True)
            if isinstance(text, bytes):
                (out / path).write_bytes(text)
            else:
                (out / path).write_text(text, encoding='utf-8')
        size = sum((out / path).stat().st_size for path in files)
        print(f'Wrote {len(files)} files ({size / 1048576:.1f} MiB) to {out}.')
        if args.mine:
            known = sum(1 for key in mine if key in site['records'])
            print(f'The editor\'s own list: {known} records, ahead inside each band. Ids that are not records, ignored: {len(mine) - known}.')
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f'Failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
