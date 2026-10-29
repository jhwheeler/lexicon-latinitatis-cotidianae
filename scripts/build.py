#!/usr/bin/env python3
"""Build the offline lexicon from topic JSON and a page template (stdlib only)."""
import argparse
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fields(value, required, optional=()):
    require(isinstance(value, dict), 'Expected an object')
    require(set(required) <= value.keys(), f'Missing fields: {set(required) - value.keys()}')
    require(value.keys() <= set(required) | set(optional), f'Unknown fields: {value.keys() - set(required) - set(optional)}')


def string(value):
    require(isinstance(value, str) and bool(value.strip()), 'Expected nonempty text')
    return value


class Fragment(HTMLParser):
    """Validate trusted editorial rich text; keep its spelling and markup intact."""
    tags = {'strong', 'span', 'em', 'code', 'a', 'p', 'details', 'summary', 'ul', 'li', 'br'}
    attrs = {'lang', 'class', 'href', 'target', 'rel'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        require(tag in self.tags, f'Unsupported rich-text tag: {tag}')
        require(all(k in self.attrs for k, _ in attrs), f'Unsupported attributes on {tag}')
        for key, value in attrs:
            require(value is not None, f'Missing value for {key}')
            if key == 'href':
                require(value.startswith(('https://', 'http://', '#')), f'Unsupported link: {value}')
                self.links.append(value)
        if tag != 'br':
            self.stack.append(tag)

    def handle_endtag(self, tag):
        require(self.stack and self.stack.pop() == tag, f'Unbalanced rich text: {tag}')

    def handle_startendtag(self, tag, attrs):
        require(tag == 'br', 'Only br may be self-closing')
        self.handle_starttag(tag, attrs)

    def handle_comment(self, data):
        raise ValueError('Comments are not supported in entry rich text')


def rich(value):
    parser = Fragment()
    parser.feed(string(value))
    parser.close()
    require(not parser.stack, 'Unclosed rich-text tag')
    return value


def render_block(block):
    require(isinstance(block, dict), 'Expected a block object')
    kind = block.get('type')
    if kind == 'list':
        fields(block, ('type', 'items'))
        require(isinstance(block['items'], list) and block['items'], 'Empty list')
        items = []
        for item in block['items']:
            fields(item, ('html',), ('class',))
            require(item.get('class', 'note') == 'note', 'Unsupported list-item class')
            attr = ' class="note"' if 'class' in item else ''
            items.append(f'<li{attr}>{rich(item["html"])}</li>')
        return '<ul>\n' + '\n'.join(items) + '\n</ul>'
    if kind == 'paragraph':
        fields(block, ('type', 'html'), ('class',))
        require(block.get('class', 'source-note') == 'source-note', 'Unsupported paragraph class')
        attr = ' class="source-note"' if 'class' in block else ''
        return f'<p{attr}>{rich(block["html"])}</p>'
    if kind == 'sources':
        fields(block, ('type', 'summary', 'paragraphs'))
        require(isinstance(block['paragraphs'], list) and block['paragraphs'], 'Empty sources')
        paragraphs = ''.join(f'<p>{rich(p)}</p>' for p in block['paragraphs'])
        return f'<details class="entry-sources"><summary>{escape(string(block["summary"]))}</summary>{paragraphs}</details>'
    raise ValueError(f'Unknown block type: {kind}')


def render_entry(entry, category):
    fields(entry, ('id', 'english', 'latin', 'tags', 'blocks'), ('anchor', 'keywords'))
    require(re.fullmatch(r'entry-[1-9][0-9]*', string(entry['id'])), 'Invalid entry ID')
    anchor = entry.get('anchor')
    require(anchor is None or re.fullmatch(r'[a-z][a-z0-9-]*', string(anchor)), 'Invalid anchor')
    require(isinstance(entry['tags'], list), 'Tags must be a list')
    tags = ''.join(f'<span class="tag">{escape(string(t))}</span>' for t in entry['tags'])
    require(isinstance(entry['blocks'], list) and entry['blocks'], 'Entry must have content')
    body = '\n'.join(render_block(b) for b in entry['blocks'])
    require(isinstance(entry.get('keywords', ''), str), 'Keywords must be text')
    attrs = f' id="{escape(anchor)}"' if anchor else ''
    return (f'<article class="entry"{attrs} data-entry data-entry-id="{entry["id"]}" '
            f'data-category="{category}" data-search="{escape(entry.get("keywords", ""), quote=True)}">\n'
            f'<header class="entry-head"><div><p class="eyebrow">{escape(string(entry["english"]))}</p>'
            f'<h3 lang="la">{escape(string(entry["latin"]))}</h3></div><div class="tags">{tags}</div></header>\n'
            f'<div class="entry-body">{body}</div>\n</article>')


class Document(HTMLParser):
    """Check duplicate anchors and local fragment links in the assembled page."""
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            require(attrs['id'] not in self.ids, f'Duplicate HTML ID: {attrs["id"]}')
            self.ids.add(attrs['id'])
        if attrs.get('href', '').startswith('#'):
            self.links.append(attrs['href'][1:])


def build(root=ROOT):
    catalog = json.loads((root / 'data/catalog.json').read_text(encoding='utf-8'))
    fields(catalog, ('version', 'categories', 'filters'))
    require(catalog['version'] == 1, 'Unsupported catalog version')
    require(isinstance(catalog['categories'], list) and catalog['categories'], 'No categories')
    categories = catalog['categories']
    ids, entry_ids, anchors = set(), set(), set()
    sections = []
    for category in categories:
        fields(category, ('id', 'english', 'latin'))
        key = string(category['id'])
        require(re.fullmatch(r'[a-z][a-z0-9-]*', key), 'Invalid category ID')
        require(key not in ids and key != 'all', f'Duplicate/reserved category: {key}')
        ids.add(key)
        entries = json.loads((root / f'data/entries/{key}.json').read_text(encoding='utf-8'))
        require(isinstance(entries, list) and entries, f'Empty category: {key}')
        cards = []
        for entry in entries:
            card = render_entry(entry, key)
            require(entry['id'] not in entry_ids, f'Duplicate entry: {entry["id"]}')
            entry_ids.add(entry['id'])
            if entry.get('anchor'):
                require(entry['anchor'] not in anchors, 'Duplicate entry anchor')
                anchors.add(entry['anchor'])
            cards.append(card)
        sections.append(f'<section class="category" data-category-section="{key}" id="{key}">'
                        '<div class="category-heading"><div>'
                        f'<p class="eyebrow">{escape(string(category["english"]))}</p>'
                        f'<h2 lang="la">{escape(string(category["latin"]))}</h2></div>'
                        f'<span class="category-count">{len(entries)} entries</span></div>'
                        '<div class="entries">' + '\n'.join(cards) + '</div></section>')
    files = {p.stem for p in (root / 'data/entries').glob('*.json')}
    require(files == ids, f'Unlisted or missing category files: {files ^ ids}')
    filters = catalog['filters']
    require(isinstance(filters, list) and all(isinstance(f, str) for f in filters), 'Invalid filters')
    require(len(filters) == len(set(filters)) and set(filters) == ids | {'all'}, 'Filters must cover every category once')
    labels = {c['id']: c['latin'] for c in categories} | {'all': 'Omnia'}
    chips = ''.join(f'<button class="chip" type="button" data-filter="{key}" '
                    f'aria-pressed="{str(key == "all").lower()}"'
                    + ('' if key == 'all' else ' lang="la"')
                    + f'>{escape(string(labels[key]))}</button>' for key in filters)
    replacements = {'styles': (root / 'src/styles.css').read_text(encoding='utf-8'),
                    'search': (root / 'src/search.js').read_text(encoding='utf-8'),
                    'filters': chips, 'entries': '\n'.join(sections), 'entry_count': str(len(entry_ids))}
    page = (root / 'src/page.html').read_text(encoding='utf-8')
    for name, value in replacements.items():
        token = '{{' + name + '}}'
        require(token in page, f'Missing template token: {token}')
        page = page.replace(token, value)
    require(not re.search(r'\{\{\w+\}\}', page), 'Unknown template token')
    doc = Document()
    doc.feed(page)
    require(all(link in doc.ids for link in doc.links), f'Broken fragment links: {set(doc.links) - doc.ids}')
    return page


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if index.html needs rebuilding')
    args = parser.parse_args()
    try:
        page = build()
        target = ROOT / 'index.html'
        if args.check:
            require(target.exists() and target.read_text(encoding='utf-8') == page,
                    'index.html is stale; run python3 scripts/build.py and commit the result')
            print('Generated index.html is up to date.')
        else:
            target.write_text(page, encoding='utf-8')
            print('Built index.html.')
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f'Build failed: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
