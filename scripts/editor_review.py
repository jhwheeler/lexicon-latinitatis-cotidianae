#!/usr/bin/env python3
"""Build the editor's review page, or turn its saved verdicts into a report.

    python3 scripts/editor_review.py                  # write the page's files to .editor-review/
    python3 scripts/editor_review.py --out DIR        # … or to another folder
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
_spec = importlib.util.spec_from_file_location('build', Path(__file__).resolve().parent / 'build.py')
builder = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(builder)

OUT = '.editor-review'
# A document's id in the artifact's database is the record's id; this is what a path segment allows.
SEGMENT = r'[A-Za-z0-9_\-.~:@+]+'


def entry_html(record, site):
    """The entry as its page on the site draws it, without what only works there: the links (the
    page has nowhere to follow them; the words stay) and the line that opens a GitHub issue."""
    key = record['id']
    html = builder.resolve_anchors(builder.render_concept(record, site), site, '../', f'c/{key}.html')
    html = re.sub(r'<p class="suggest">.*?</p>', '', html, flags=re.S)
    return re.sub(r'</?a\b[^>]*>', '', html)


def page_files(root=ROOT, today=None):
    """Every file of the page as {path: text or bytes}."""
    site = builder.load_site(root)
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
            head = builder.term_head(builder.ordered_terms(record)[0]['latin'])
            english = record['english'] + (f' ({record["sense"]})' if 'sense' in record else '')
            index.append([record['id'], builder.record_revision(record), english, head, number,
                          1 if builder.reviewed(record) else 0])
            entries[record['id']] = entry_html(record, site)
        files[f'd/{key}.js'] = f'editorChunk({json.dumps(key)},{json.dumps(entries, ensure_ascii=False, separators=(",", ":"))});\n'
    data = {'built': (today or datetime.date.today()).isoformat(), 'site': builder.SITE_URL,
            'categories': [{'id': key, 'english': site['categories'][key]['english'], 'latin': site['categories'][key]['latin']}
                           for key in categories],
            'records': index}
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
    args = parser.parse_args()
    try:
        if args.report:
            source = sys.stdin if args.report == '-' else open(args.report, encoding='utf-8')
            with source:
                sys.stdout.write(report(source))
            return 0
        files, out = page_files(), Path(args.out)
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
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f'Failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
