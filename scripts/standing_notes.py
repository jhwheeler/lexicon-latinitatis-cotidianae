#!/usr/bin/env python3
"""Take the standing notes out of the records' sources.

A line under an entry's Sources is a citation. The sentences that are true of every entry (that
quotations marked "Lewis & Short" are given as the dictionary cites them, that the examples marked
"composed" are ours, which text an author was checked against) are said once, in "How to read the
sources" on src/how-we-decide.html, and the builder refuses a record that carries one (Jack,
15 November 2026; see "Sources are citations" in docs/records.md). This script does to every
record what the builder's message asks for one: a line that is nothing but such a note is deleted,
and a citation joined to one keeps the citation. The sentences are the builder's own patterns
(without_standing_notes in scripts/build.py).

    python3 scripts/standing_notes.py           # list what would change
    python3 scripts/standing_notes.py --write   # change the records

Only the lines of "sources" change: every other byte of a record stays as it was. It is wanted
again whenever records written before the rule come in (a branch drafted from the older
docs/drafting.md, a batch converted from cards).
"""
import argparse
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('build', Path(__file__).resolve().parent / 'build.py')
builder = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(builder)


def cleaned(text):
    """A record's file without its standing notes, and the lines that changed as (old, new) pairs,
    new being '' for a line that went. The text is edited by line, so that nothing else moves."""
    record = json.loads(text)
    kept, changed = [], []
    for source in record['sources']:
        left = builder.without_standing_notes(source)
        if left != source:
            changed.append((source, left))
        if left and left not in kept:
            kept.append(left)
    if not changed:
        return text, []
    lines = text.split('\n')
    start = lines.index('  "sources": [')
    end = next(number for number in range(start, len(lines)) if lines[number] in ('  ],', '  ]'))
    if [json.loads(line.rstrip(',')) for line in lines[start + 1:end]] != record['sources']:
        raise ValueError('the sources are not written one to a line')
    if kept:
        lines[start + 1:end] = ['    ' + json.dumps(source, ensure_ascii=False) + (',' if number < len(kept) - 1 else '')
                                for number, source in enumerate(kept)]
    else:
        lines[start:end + 1] = ['  "sources": []' + lines[end][3:]]
    out = '\n'.join(lines)
    if json.loads(out) != {**record, 'sources': kept}:
        raise ValueError('the edit changed more than the sources')
    return out, changed


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--write', action='store_true', help='change the records')
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    files = lines = 0
    for path in sorted((args.root / 'data/concepts').glob('*.json')):
        text = path.read_text(encoding='utf-8')
        try:
            out, changed = cleaned(text)
        except ValueError as error:
            raise SystemExit(f'{path.name}: {error}; edit it by hand')
        if not changed:
            continue
        files, lines = files + 1, lines + len(changed)
        for old, new in changed:
            print(f'{path.stem}\n  - {old}' + (f'\n  + {new}' if new else ''))
        if args.write:
            path.write_text(out, encoding='utf-8')
    print(f'{lines} line(s) in {files} record(s) ' + ('changed.' if args.write else 'would change.') if lines
          else 'No record carries a standing note.')


if __name__ == '__main__':
    main()
