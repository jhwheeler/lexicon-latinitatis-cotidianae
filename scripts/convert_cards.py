#!/usr/bin/env python3
"""Convert grouped cards (data/entries) into concept records (data/concepts), with checks.

A batch is described by a spec file, usually notes/conversions/<batch>.json:

    {
      "batch": "culina-1",
      "cards": ["entry-12", "entry-13"],
      "records": [ {a record as in docs/records.md; "review" may be left out} ],
      "extend": [ {"id": "an-existing-record", "terms": [...], "phrases": [...], "also": [...],
                   "related": [...], "sources": [...], "notes": {...}, "replaces": [...]} ],
      "added": {"a Latin word or phrase": "why it is not in the cards"},
      "dropped": {"a Latin word, phrase or link from the cards": "why no record carries it"},
      "flags": ["anything the reviewer should look at: a suspected error, a judgement call"]
    }

Checks, before anything is written:
- every card exists, and each card's ID (and anchor) is in exactly one record's "replaces";
- provenance: every word of every term and example in the new material occurs in the cards'
  text, exactly, macrons included, and every example occurs there word for word; anything
  else must be listed in "added" with a reason;
- coverage: every Latin word the cards mark as Latin appears somewhere in the records of the
  batch, and every link in the cards appears in their text; anything else must be listed in
  "dropped" with a reason. A changed macron shows up twice, as an added word and a dropped one;
- record IDs are new slugs (an existing concept is extended, not duplicated).

An extension's term whose Latin is already in the record merges into that term: its evidence and
notes are added, and its other fields fill only what the record leaves empty (a differing status,
period or comment is reported, and the record's stands). An example already in the record is not
added again.

Batches converted in parallel often make the same record twice. --extend-existing rewrites a spec
so that each of its records that now exists (by ID, or by English headword and sense) becomes an
extension of it; a record from another category is flagged "Also under <category>".

With --write it then adds the records, removes the cards, points any "related" link that named
a removed card at the record that replaces it, and builds the site to validate the result; if
the build fails, every file is put back as it was.

    python3 scripts/convert_cards.py notes/conversions/culina-1.json           # check only
    python3 scripts/convert_cards.py notes/conversions/culina-1.json --write   # apply
    python3 scripts/convert_cards.py notes/conversions/culina-2.json --extend-existing
"""
import argparse
import copy
import datetime
import html
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORD = re.compile(r"[^\W\d_](?:[^\W\d_]|['’̄̆-])*", re.U)
LATIN = re.compile(r'<(strong|span|em)\b[^>]*\blang="la"[^>]*>(.*?)</\1>', re.S)
HREF = re.compile(r'href="([^"#][^"]*)"')
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*')
EXTEND_FIELDS = ('terms', 'phrases', 'also', 'related', 'sources', 'notes', 'replaces')


def plain(text):
    """Text without markup or entities, in NFC, with single spaces."""
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text)).strip()


def words(text):
    return WORD.findall(plain(text))


def dump(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'


def rich_strings(value):
    """Every string in a record or card, recursively."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from rich_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from rich_strings(item)


class Problems(list):
    def add(self, message):
        self.append(message)


def load_cards(root):
    catalog = json.loads((root / 'data/catalog.json').read_text(encoding='utf-8'))
    cards = {}
    for category in catalog['categories']:
        for entry in json.loads((root / f'data/entries/{category["id"]}.json').read_text(encoding='utf-8')):
            cards[entry['id']] = (category['id'], entry)
    return catalog, cards


def load_records(root):
    folder = root / 'data/concepts'
    return {p.stem: json.loads(p.read_text(encoding='utf-8')) for p in sorted(folder.glob('*.json'))}


def new_material(spec):
    """The records and extensions of a batch, as (where, record-like dict) pairs."""
    for record in spec.get('records', []):
        yield f'record {record.get("id")}', record
    for extension in spec.get('extend', []):
        yield f'extension of {extension.get("id")}', extension


def check(spec, root=ROOT):
    """Return (problems, plan); plan holds what --write needs."""
    problems = Problems()
    for key in spec:
        if key not in ('batch', 'cards', 'records', 'extend', 'added', 'dropped', 'flags'):
            problems.add(f'Unknown field in the spec: {key}')
    catalog, cards = load_cards(root)
    records = load_records(root)
    batch = spec.get('cards', [])
    if not batch or len(batch) != len(set(batch)):
        problems.add('The spec must list its cards, each once')
    missing = [c for c in batch if c not in cards]
    if missing:
        problems.add(f'No such cards: {missing}')
        return problems, None
    added, dropped = spec.get('added', {}), spec.get('dropped', {})
    for name, value in (('added', added), ('dropped', dropped)):
        if not isinstance(value, dict) or not all(isinstance(v, str) and v.strip() for v in value.values()):
            problems.add(f'"{name}" must map each item to its reason')

    # The new material: IDs, replaces.
    ids = [r.get('id') for r in spec.get('records', [])]
    for key in ids:
        if not isinstance(key, str) or not SLUG.fullmatch(key):
            problems.add(f'Invalid record ID: {key!r}')
        elif key in records:
            problems.add(f'Record {key} exists already: extend it instead')
    if len(ids) != len(set(ids)):
        problems.add('A record ID is used twice in the spec')
    for extension in spec.get('extend', []):
        if extension.get('id') not in records:
            problems.add(f'Cannot extend {extension.get("id")}: no such record')
        unknown = set(extension) - {'id', *EXTEND_FIELDS}
        if unknown:
            problems.add(f'Unknown fields in the extension of {extension.get("id")}: {sorted(unknown)}')
    notices = []
    for extension in spec.get('extend', []):
        record = records.get(extension.get('id'))
        for term in extension.get('terms', []) if record else []:
            same = next((t for t in record['terms'] if t['latin'] == term.get('latin')), None)
            if same:
                for field in ('status', 'period', 'gloss', 'grammar', 'register', 'comment'):
                    if field in term and field in same and term[field] != same[field]:
                        notices.append(f'{record["id"]}: {term["latin"]} keeps the record’s {field} '
                                       f'({plain(same[field])[:80]!r}, not {plain(term[field])[:80]!r})')
                continue
            head = words(term.get('latin', ''))[:1]
            like = [t['latin'] for t in record['terms'] if words(t['latin'])[:1] == head]
            if like:
                notices.append(f'{record["id"]}: {term.get("latin")} is added beside {like}; '
                               'write them alike to merge them')
    replaced = [old for _, item in new_material(spec) for old in item.get('replaces', [])]
    for card in batch:
        anchor = cards[card][1].get('anchor')
        for old in [card] + ([anchor] if anchor else []):
            n = replaced.count(old)
            if n != 1:
                problems.add(f'{old} must be in exactly one record’s "replaces" (found {n})')
    stray = [old for old in replaced if old not in batch and old not in
             {cards[c][1].get('anchor') for c in batch}]
    if stray:
        problems.add(f'"replaces" names cards outside the batch: {stray}')

    # Provenance: new Latin must come from the cards.
    source_text = ' '.join(plain(s) for c in batch for s in rich_strings(cards[c][1]))
    source_words = set(WORD.findall(source_text))
    added_words = {w for item in added for w in words(item)}
    for where, item in new_material(spec):
        for term in item.get('terms', []):
            for w in words(term.get('latin', '')):
                if w not in source_words and w not in added_words:
                    problems.add(f'{where}: “{w}” in the term “{term.get("latin")}” is not in the cards; '
                                 'copy the form exactly, or list it in "added" with the reason')
        for phrase in item.get('phrases', []):
            text = plain(phrase.get('latin', ''))
            if text not in source_text and phrase.get('latin') not in added:
                problems.add(f'{where}: the example “{text[:80]}” does not occur word for word in the cards; '
                             'quote it exactly, or list it in "added" with the reason')

    # Coverage: the cards' Latin and links must survive somewhere in the batch.
    target_raw = ' '.join(s for _, item in new_material(spec) for s in rich_strings(item))
    target_words = set(WORD.findall(plain(target_raw)))
    dropped_words = {w for item in dropped for w in words(item)}
    for card in batch:
        entry = cards[card][1]
        for text in rich_strings(entry.get('blocks', [])):
            for match in LATIN.finditer(text):
                for w in words(match.group(2)):
                    if w not in target_words and w not in dropped_words:
                        problems.add(f'{card}: the Latin “{w}” (in “{plain(match.group(2))[:60]}”) is in no record; '
                                     'carry it over, or list it in "dropped" with the reason')
            for href in HREF.findall(text):
                if href not in target_raw and href not in dropped:
                    problems.add(f'{card}: the link {href} is in no record; carry it into the sources, or list it in "dropped"')
    # Every problem once.
    unique = Problems(dict.fromkeys(problems))
    return unique, {'cards': cards, 'records': records, 'catalog': catalog, 'notices': notices}


def apply(spec, plan, root=ROOT, today=None):
    """Write the batch: add records, extend others, remove cards, rewire related links."""
    cards, records = plan['cards'], plan['records']
    today = today or datetime.date.today().isoformat()
    written = {}
    successor = {}
    for _, item in new_material(spec):
        for old in item.get('replaces', []):
            successor[old] = item['id']
    for record in spec.get('records', []):
        record = copy.deepcopy(record)
        record.setdefault('review', {'status': 'draft', 'date': today, 'by': 'Claude'})
        written[record['id']] = record
    for extension in spec.get('extend', []):
        record = copy.deepcopy(written.get(extension['id']) or records[extension['id']])
        for value in extension.get('terms', []):
            same = next((t for t in record['terms'] if t['latin'] == value['latin']), None)
            if same is None:
                record['terms'].append(copy.deepcopy(value))
                continue
            for field in ('evidence', 'notes'):
                for item in value.get(field, []):
                    if item not in same.get(field, []):
                        same.setdefault(field, []).append(item)
            for field, item in value.items():
                same.setdefault(field, copy.deepcopy(item))
        for value in extension.get('phrases', []):
            if all(plain(p['latin']) != plain(value['latin']) for p in record.get('phrases', [])):
                record.setdefault('phrases', []).append(value)
        for value in extension.get('sources', []):
            if value not in record.setdefault('sources', []):
                record['sources'].append(value)
        for field in ('also', 'related', 'replaces'):
            for value in extension.get(field, []):
                if value not in record.setdefault(field, []):
                    record[field].append(value)
        for name, note in extension.get('notes', {}).items():
            if name in record.setdefault('notes', {}) and record['notes'][name] != note:
                raise ValueError(f'Note {name} exists in {record["id"]} with other text')
            record['notes'][name] = note
        record['review'] = {'status': 'draft', 'date': today, 'by': 'Claude'}
        written[record['id']] = record
    # Related links that named a removed card now name the record that replaces it.
    for key, record in {**records, **written}.items():
        related = record.get('related')
        if not related:
            continue
        new = []
        for target in related:
            target = successor.get(target, target)
            if target != key and target not in new:
                new.append(target)
        if new != related:
            record = written.get(key) or copy.deepcopy(record)
            record['related'] = new
            written[key] = record
    for key in written:
        for field in ('related', 'replaces', 'also'):
            if field in written[key] and not written[key][field]:
                del written[key][field]
    files = {}
    for key, record in written.items():
        files[root / f'data/concepts/{key}.json'] = dump(record)
    by_category = {}
    for card in spec['cards']:
        by_category.setdefault(cards[card][0], set()).add(card)
    for category, gone in by_category.items():
        path = root / f'data/entries/{category}.json'
        entries = json.loads(path.read_text(encoding='utf-8'))
        files[path] = dump([e for e in entries if e['id'] not in gone])
    return files


def extend_existing(spec, root=ROOT):
    """Turn the spec's records that exist already into extensions of them. Returns what changed."""
    records = load_records(root)
    by_english = {(r['english'], r.get('sense')): key for key, r in records.items()}
    keep, moved, renamed, report = [], [], {}, []
    for record in spec.get('records', []):
        key = record['id'] if record['id'] in records else by_english.get((record['english'], record.get('sense')))
        if key is None:
            keep.append(record)
            continue
        base = records[key]
        if record['id'] == key and (record['english'], record.get('sense')) != (base['english'], base.get('sense')):
            report.append(f'{key}: the IDs match but the senses differ ({record["english"]!r} {record.get("sense")!r}, '
                          f'not {base["english"]!r} {base.get("sense")!r}); give the new record its own ID')
            keep.append(record)
            continue
        if record['id'] != key:
            renamed[record['id']] = key
        extension = {'id': key}
        notes = dict(record.get('notes', {}))
        rename = {}
        for name, note in list(notes.items()):
            if name in base.get('notes', {}) and base['notes'][name] != note:
                n = 2
                while f'{name}-{n}' in base['notes'] or f'{name}-{n}' in notes:
                    n += 1
                rename[name] = f'{name}-{n}'
                notes[f'{name}-{n}'] = notes.pop(name)
        for field in ('terms', 'phrases'):
            if record.get(field):
                extension[field] = copy.deepcopy(record[field])
                for item in extension[field]:
                    if item.get('notes'):
                        item['notes'] = [rename.get(n, n) for n in item['notes']]
        also = [a for a in record.get('also', []) if a != base['english'] and a not in base.get('also', [])]
        if record['english'] != base['english'] and record['english'] not in base.get('also', []):
            also.insert(0, record['english'])
        for field, value in (('also', also), ('related', record.get('related', [])),
                             ('sources', record.get('sources', [])), ('notes', notes),
                             ('replaces', record.get('replaces', []))):
            if value:
                extension[field] = value
        moved.append(extension)
        if record['domain'] != base['domain']:
            spec.setdefault('flags', []).append(f'Also under {record["domain"]}: {key} (merged into the {base["domain"]} record)')
        report.append(f'{record["id"]} → extension of {key}')
    for item in keep + moved:
        if item.get('related'):
            item['related'] = list(dict.fromkeys(renamed.get(r, r) for r in item['related'] if renamed.get(r, r) != item['id']))
    spec['records'] = keep
    if moved:
        spec['extend'] = spec.get('extend', []) + moved
    return report


def rewire(root=ROOT):
    """Point every "related" link that names a card no longer in data/entries at the record that
    replaces it (after merging batches converted in parallel). Returns the records changed."""
    _, cards = load_cards(root)
    records = load_records(root)
    successor = {old: key for key, r in records.items() for old in r.get('replaces', [])}
    changed = []
    for key, record in records.items():
        related = record.get('related', [])
        new = []
        for target in related:
            if target not in cards and target not in records:
                target = successor.get(target, target)
            if target != key and target not in new:
                new.append(target)
        if new != related:
            record['related'] = new
            if not new:
                del record['related']
            (root / f'data/concepts/{key}.json').write_text(dump(record), encoding='utf-8')
            changed.append(key)
    return changed


def build_checks(root):
    spec = importlib.util.spec_from_file_location('build', root / 'scripts/build.py')
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.build_site(root)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('spec', type=Path, nargs='?')
    parser.add_argument('--write', action='store_true', help='apply the batch if it passes the checks')
    parser.add_argument('--rewire', action='store_true',
                        help='only point related links at removed cards to the records that replace them')
    parser.add_argument('--extend-existing', action='store_true',
                        help='rewrite the spec so that records that exist already become extensions of them')
    args = parser.parse_args()
    if args.rewire:
        changed = rewire()
        print(f'Rewired {len(changed)} record(s): {", ".join(changed)}' if changed else 'Nothing to rewire.')
        return 0
    if not args.spec:
        parser.error('a spec file is required')
    spec = json.loads(args.spec.read_text(encoding='utf-8'))
    if args.extend_existing:
        report = extend_existing(spec)
        args.spec.write_text(dump(spec), encoding='utf-8')
        print('\n'.join(report) if report else 'No record of the spec exists already.')
        return 0
    problems, plan = check(spec)
    for flag in spec.get('flags', []):
        print(f'flag: {flag}')
    if problems:
        print(f'{len(problems)} problem(s):', file=sys.stderr)
        for problem in problems:
            print(f'  {problem}', file=sys.stderr)
        return 1
    for notice in plan['notices']:
        print(f'merge: {notice}')
    n_records, n_ext = len(spec.get('records', [])), len(spec.get('extend', []))
    print(f'Checks pass: {len(spec["cards"])} cards → {n_records} new records, {n_ext} extended.')
    if not args.write:
        return 0
    files = apply(spec, plan)
    backup = {path: path.read_bytes() if path.exists() else None for path in files}
    for path, text in files.items():
        path.write_text(text, encoding='utf-8')
    try:
        build_checks(ROOT)
    except (ValueError, KeyError, TypeError) as error:
        for path, data in backup.items():
            if data is None:
                path.unlink()
            else:
                path.write_bytes(data)
        print(f'The build rejects the result, so nothing was written: {error}', file=sys.stderr)
        return 1
    print(f'Written: {len(files)} files. Now run python3 scripts/build.py and the checks.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
