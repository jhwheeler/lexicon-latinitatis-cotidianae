#!/usr/bin/env python3
"""Apply a review report to the records.

    python3 scripts/apply_review.py report.txt      # a report saved to a file
    python3 scripts/apply_review.py -               # a report pasted on standard input
    python3 scripts/apply_review.py - --by "Name"   # another reviewer than Jack

The editor gives his verdicts on his phone, on the entries' pages and on the backs of the practice
cards, and review.html gathers them into one report: a few lines to read and, below them, a block
of JSON (see docs/review.md). This script finds that block in whatever surrounds it (a chat
message, a GitHub issue) and applies each verdict:

  ok    The record is marked reviewed, with the verdict's date, if it still reads as it did when
        the verdict was given (its revision is the verdict's). If it has changed since, the
        verdict is NOT applied and the record is listed: it wants reading again.
  flag  An item is added to notes/review-flags.md, newest first, for an agent to act on. A
        flagged record that was reviewed goes back to draft.

It prints what it did and exits non-zero on a malformed report. A record's revision is
record_revision in scripts/build.py, the same function that puts it on the page. Marking a record
reviewed is this script's work alone: an agent never sets review.status to "reviewed" by hand.
Rebuild the site afterwards (python3 scripts/build.py).
"""
import argparse
import datetime
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location('build', Path(__file__).resolve().parent / 'build.py')
builder = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(builder)

REASONS = {'word': 'wrong word', 'quantity': 'vowel length', 'meaning': 'meaning', 'example': 'example',
           'source': 'source', 'other': 'other'}
FLAGS = 'notes/review-flags.md'
FLAGS_HEAD = """# Flagged entries

Entries a reader flagged as looking wrong, newest first, written here by `scripts/apply_review.py`
from a review report (see `docs/review.md`). Each line gives the record, the revision it was
flagged on, the reasons and the reader's words. An agent acts on a flag (reads the entry against
its sources and corrects it, or answers why it stands), then deletes its line. A corrected entry
has a new revision, so it comes back into the editor's queue by itself.

<!-- flags -->
"""
MARK = '<!-- flags -->\n'


class Malformed(ValueError):
    """The report is not one this script can read."""


def read_report(text):
    """The verdicts of a pasted report: the JSON object that opens with "lexicon-review", found in
    whatever text surrounds it."""
    decoder = json.JSONDecoder()
    found = None
    for match in re.finditer(r'\{\s*"lexicon-review"', text):
        try:
            found, _ = decoder.raw_decode(text, match.start())
            break
        except json.JSONDecodeError as error:
            raise Malformed(f'The report’s JSON cannot be read: {error}') from error
    if found is None:
        raise Malformed('No review report found: it holds a JSON object that begins {"lexicon-review": 1, …')
    if found.get('lexicon-review') != 1:
        raise Malformed(f'Unknown report version: {found.get("lexicon-review")!r}')
    verdicts = found.get('verdicts')
    if not isinstance(verdicts, list):
        raise Malformed('The report has no list of verdicts')
    for n, verdict in enumerate(verdicts, 1):
        where = f'Verdict {n}'
        if not isinstance(verdict, dict):
            raise Malformed(f'{where} is not an object')
        if not isinstance(verdict.get('id'), str) or not re.fullmatch(builder.SLUG, verdict['id']):
            raise Malformed(f'{where} has no record id')
        where = f'The verdict on {verdict["id"]}'
        if not isinstance(verdict.get('rev'), str) or not re.fullmatch(r'[0-9a-f]{8}', verdict['rev']):
            raise Malformed(f'{where} has no revision')
        if verdict.get('verdict') not in ('ok', 'flag'):
            raise Malformed(f'{where} is neither "ok" nor "flag"')
        if not isinstance(verdict.get('t'), (int, float)) or isinstance(verdict['t'], bool) or verdict['t'] <= 0:
            raise Malformed(f'{where} has no time')
        reasons = verdict.get('reasons', [])
        if not isinstance(reasons, list) or any(reason not in REASONS for reason in reasons):
            raise Malformed(f'{where} has unknown reasons: {reasons!r}')
        if not isinstance(verdict.get('note', ''), str):
            raise Malformed(f'{where} has a note that is not text')
        if 'date' in verdict and not (isinstance(verdict['date'], str) and re.fullmatch(r'20\d\d-\d\d-\d\d', verdict['date'])):
            raise Malformed(f'{where} has a date that is not YYYY-MM-DD')
    return verdicts


def verdict_date(verdict):
    """The day the verdict was given: the device's own date if the report has it, else the day of
    its time in UTC."""
    if 'date' in verdict:
        return verdict['date']
    return datetime.datetime.fromtimestamp(verdict['t'] / 1000, datetime.timezone.utc).strftime('%Y-%m-%d')


def flag_line(verdict, record, changed):
    reasons = ', '.join(REASONS[reason] for reason in verdict.get('reasons', [])) or 'no reason given'
    note = re.sub(r'\s+', ' ', verdict.get('note', '')).strip()
    headword = record['english'] + (f' ({record["sense"]})' if 'sense' in record else '')
    return (f'- {verdict_date(verdict)} · **{headword}** · [`{verdict["id"]}`]({builder.SITE_URL}c/{verdict["id"]}.html) · '
            f'rev `{verdict["rev"]}`' + (' (the entry has changed since)' if changed else '') + f' · {reasons}'
            + (f' · “{note}”' if note else '') + f' <!-- {verdict["id"]} {int(verdict["t"])} -->\n')


def apply(verdicts, root=ROOT, by='Jack'):
    """Apply the verdicts to the records under root. Returns what was done, as lists of record ids:
    reviewed, already (reviewed before), changed (ok refused: the record has changed), flagged,
    reopened (flagged and sent back to draft), repeated (a flag already written), unknown."""
    done = {key: [] for key in ('reviewed', 'already', 'changed', 'flagged', 'reopened', 'repeated', 'unknown')}
    flags_path = root / FLAGS
    flags = flags_path.read_text(encoding='utf-8') if flags_path.exists() else FLAGS_HEAD
    if MARK not in flags:
        flags = flags.rstrip('\n') + '\n\n' + MARK
    new_flags = []
    # In the order the verdicts were given, so that a later verdict on a record has the last word.
    for verdict in sorted(verdicts, key=lambda v: v['t']):
        key = verdict['id']
        path = root / 'data/concepts' / f'{key}.json'
        if not path.exists():
            done['unknown'].append(key)
            continue
        record = json.loads(path.read_text(encoding='utf-8'))
        current = builder.record_revision(record)
        write = False
        if verdict['verdict'] == 'ok':
            if current != verdict['rev']:
                done['changed'].append(key)
            elif record['review']['status'] == 'reviewed':
                done['already'].append(key)
            else:
                record['review'] = {'status': 'reviewed', 'date': verdict_date(verdict), 'by': by}
                done['reviewed'].append(key)
                write = True
        else:
            if f'<!-- {key} {int(verdict["t"])} -->' in flags:
                done['repeated'].append(key)
                continue
            new_flags.append(flag_line(verdict, record, current != verdict['rev']))
            done['flagged'].append(key)
            if record['review']['status'] == 'reviewed':
                record['review'] = {'status': 'draft', 'date': verdict_date(verdict), 'by': record['review']['by']}
                done['reopened'].append(key)
                write = True
        if write:
            path.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if new_flags:
        head, _, rest = flags.partition(MARK)
        flags_path.parent.mkdir(parents=True, exist_ok=True)
        flags_path.write_text(head + MARK + ''.join(reversed(new_flags)) + rest, encoding='utf-8')
    return done


def summary(done):
    lines = []
    say = lambda key, one, many: lines.append(f'{len(done[key])} {one if len(done[key]) == 1 else many}'
                                              + (': ' + ', '.join(done[key]) if done[key] else ''))
    say('reviewed', 'record marked reviewed', 'records marked reviewed')
    if done['already']:
        say('already', 'was reviewed already', 'were reviewed already')
    if done['changed']:
        say('changed', 'has changed since you read it, and is NOT marked reviewed', 'have changed since you read them, and are NOT marked reviewed')
    say('flagged', f'flag written to {FLAGS}', f'flags written to {FLAGS}')
    if done['reopened']:
        say('reopened', 'flagged record was reviewed and is a draft again', 'flagged records were reviewed and are drafts again')
    if done['repeated']:
        say('repeated', 'flag was written before', 'flags were written before')
    if done['unknown']:
        say('unknown', 'record is not in the lexicon', 'records are not in the lexicon')
    if done['reviewed'] or done['reopened']:
        lines.append('Rebuild the site: python3 scripts/build.py')
    return '\n'.join(lines)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('report', help='the file holding the report, or - for standard input')
    parser.add_argument('--by', default='Jack', help='the reviewer’s name (default: Jack)')
    parser.add_argument('--root', type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    try:
        text = sys.stdin.read() if args.report == '-' else Path(args.report).read_text(encoding='utf-8')
        verdicts = read_report(text)
    except (Malformed, OSError) as error:
        print(f'Not applied: {error}', file=sys.stderr)
        return 1
    print(summary(apply(verdicts, args.root, args.by)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
