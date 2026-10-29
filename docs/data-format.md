# Structured lexicon data

## Architecture decision

The repository previously combined dictionary content, layout, CSS and search in one manually maintained page. The source of truth is now topic JSON plus a page template; a small Python script produces the same kind of self-contained HTML as before.

Options considered:

- **Fetch JSON in the browser:** a small initial HTML file and no generation step, but the dictionary depends on JavaScript and successful loading of the data. Opening a downloaded HTML file directly also encounters browser restrictions on fetching local files. Search, empty states and failure handling would need asynchronous initialization.
- **Generate HTML before publication (chosen):** separates content and presentation, keeps the full dictionary readable without JavaScript, preserves direct-file/offline use, and works with the existing branch-based GitHub Pages configuration. The tradeoff is committing a generated page alongside its source; CI checks that they agree.
- **Introduce a site framework or database:** potentially useful for a much larger application, but adds dependencies, configuration and migration work without an immediate benefit for this lexicon.

JSON uses standard parsers, requires no third-party Python library, preserves Unicode, and can be consumed by other tools. YAML or TOML would require an additional parser for this builder; a custom compact format would require custom escaping and tooling. Pretty-printed JSON and one file per topic favor reviewable edits over minimal source-file bytes. The browser still receives a single generated page: this refactor improves authoring and data reuse, not page download size.

The existing rich explanatory prose is preserved in block-level HTML fragments. Entry identity, headings, evidence tags, category membership and block structure are separate fields; entries are not stored as opaque whole HTML cards. Individual lemmas, grammatical information, definitions and citations within the prose are not yet separate database records. Doing that reliably would require an editorial migration, especially because a grouped entry often covers several related words and qualifications.

References:

- [MDN: local-file restrictions on fetch](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSRequestNotHttp)
- [GitHub: publishing a Pages site from a branch](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## Catalog

`data/catalog.json` has three fields:

- `version`: currently `1`.
- `categories`: ordered objects with `id`, `english`, and `latin`. IDs are lowercase letters, digits and hyphens, beginning with a letter. Each category has a matching `data/entries/<id>.json` file containing an array of entries.
- `filters`: the category IDs plus `all`, each exactly once, in the desired toolbar order.

Category headings, filter labels, per-category counts and the hero entry total are generated. Dates and review notes are editorial text in `src/page.html`; rebuilding does not invent a new review date.

## Entry example

This abbreviated example illustrates the shape; it is not an additional vocabulary entry:

```json
{
  "id": "entry-999",
  "english": "Doll",
  "latin": "pūpa, pūpae f.",
  "tags": ["Ancient Latin"],
  "keywords": "doll dolls",
  "blocks": [
    {
      "type": "list",
      "items": [
        {"html": "<strong lang=\"la\">pūpa, pūpae f.</strong> — doll."}
      ]
    },
    {
      "type": "sources",
      "summary": "Sources & evidence",
      "paragraphs": [
        "<a href=\"https://logeion.org/pupa\">Lewis &amp; Short: pupa</a>"
      ]
    }
  ]
}
```

Fields:

- `id`: globally unique, stable `entry-N` identifier. Choose an unused number; do not renumber existing entries when moving them between topics.
- `anchor` (optional): existing public HTML anchor, such as `daily-159` or `play-176`. Keep these when moving or editing entries so links continue working. `id` preserves the original `data-entry-id`; it does not silently introduce a new HTML anchor.
- `english`, `latin`: plain-text headings. The generator escapes these; retain macrons, genitives and genders as appropriate.
- `tags`: evidence-label strings. The migration retains empty tag lists where the original card had none; this is not an attestation claim.
- `keywords` (optional): extra searchable text. The migration preserves the original search attributes, including historical full-text indexes, to avoid changing existing matches. New entries normally need only aliases absent from their displayed text: the browser searches entry text too. Cleaning up old redundant keywords can be a separate change.
- `blocks`: ordered content blocks. Source notes and examples keep their current placement and wording.

Block types:

- `list`: `items`, each with `html` and an optional `class: "note"`.
- `paragraph`: `html` and an optional `class: "source-note"`.
- `sources`: plain-text `summary` and a list of rich-text `paragraphs`.

Rich-text fragments retain existing inline emphasis, Latin language markers and citation links. The builder checks balanced tags and supported markup, rejects script/event-handler markup and unsupported URL schemes, and validates local fragment targets after assembly. These are repository-authored fragments, not an interface for untrusted public submissions.

Unknown fields, unsupported block types, duplicate entry IDs or HTML anchors, unlisted topic files, invalid category paths, incomplete filters and broken internal links fail the build. The generator has no runtime package dependencies and does not fetch sources from the internet.

## Workflow

1. Fetch current `main` and read `AGENTS.md`.
2. Edit the relevant topic JSON. Add a catalog category and filter only when necessary.
3. Keep attested words, later technical uses and our working formations clearly distinguished; preserve citations and macrons.
4. Run `python3 scripts/build.py`.
5. Run `python3 scripts/build.py --check` and `python3 -m unittest discover -s tests -v`.
6. Open generated `index.html` in a browser and check affected searches and filters.
7. Commit both sources and generated output. Open a PR; merging still publishes through the existing Pages configuration.

## Converting a hand-edited page

`scripts/html_to_data.py` is the reverse of the builder. It reads a lexicon page (a hand-edited one from before this migration, or a generated one) and writes `data/catalog.json` and `data/entries/*.json`; `--template` also writes `src/page.html`, `src/styles.css` and `src/search.js`. Rich text is serialized as the data files store it: entities decoded and re-escaped, attributes in alphabetical order. Markup outside the schema (an unknown block element or class, stray text, an entry outside a category) stops the conversion instead of being dropped. Category counts in the old page are ignored, since the builder regenerates them.

Use it to port a branch that still edits `index.html` directly:

```sh
git show some-branch:index.html > /tmp/old.html
python3 scripts/html_to_data.py /tmp/old.html --out /tmp/converted
diff -r data /tmp/converted/data   # review, then copy the intended changes into data/
```

Entry numbers that collide with entries already in `data/` need fresh IDs before rebuilding. The tests check that converting the generated page reproduces `data/` and `src/` exactly.

Run on `index.html` from main commit `da9364b`, the converter reproduces this PR's original 189-entry data and `src/` byte for byte. Main's entries 190–193 (commit `56a2108`) were brought into the data with it; the page generated from the result matches that commit's hand-edited page in a browser DOM comparison of every entry, heading, tag, link, text node, category count, filter and the total, and in 418 search queries.

## Migration verification

Against main commit `da9364bcb61a476709c96f44249bd1147c7039c5`:

- All 189 original cards have equivalent parsed DOM, including headings, evidence labels, body prose, source links, search attributes, category attributes and existing anchors. Comparison ignores only insignificant inter-element whitespace and HTML entity serialization.
- All 13 categories and 14 filter buttons retain their order and labels.
- CSS and search JavaScript are unchanged byte-for-byte.
- 231 search queries (including every original English heading), all 14 filters, Clear, Escape and the empty state match the original page in a DOM harness executing the actual search script.
- All 12 builder tests pass, and `--check` confirms the committed output matches its sources.
- A real-browser layout check could not be run: the Chromium download returned an invalid archive. CSS is byte-identical, but DOM checks do not substitute for visual QA.
- No vocabulary corrections or additions are bundled with this structural migration.

The larger open vocabulary PR (#1) still edits the old page directly. When integrating that branch, migrate its intended content changes into the appropriate JSON files and regenerate; do not resolve it by replacing the generated page with the old HTML. Existing overlapping entry numbers will need fresh unique IDs. This PR does not alter or close #1.
