# Lexicon Latīnitātis Cotīdiānae

Everyday English–Latin vocabulary, with macrons, examples, usage notes and sources.

Site: https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

## Editing

**This repository is the authoritative source.** Fetch current `main` before editing.

- `data/catalog.json`: ordered categories, their headings, and filter order.
- `data/concepts/<concept>.json`: one record per concept, with notes (footnotes) on every departure from a dictionary or source; each gets its own page in `c/`. See [docs/records.md](docs/records.md).
- `data/rulings.json`: editorial rulings, listed on `rulings.html`; `src/how-we-decide.html` holds the editorial policy.
- `data/entries/<category>.json`: older dictionary entries, grouped by topic, being converted to records.
- `src/page.html`: page shell and editorial review notes; `src/how-we-decide.html`: the policy page.
- `src/styles.css`: styling.
- `src/search.js`: browser search and filters.
- `scripts/build.py`: validates the data and generates the self-contained `index.html`.
- `scripts/consonantal_j.py`: writes consonantal i as j in the Latin (the lexicon's orthography; see AGENTS.md) and checks that none is left.
- `scripts/html_to_data.py`: the reverse; extracts data from a lexicon page, for porting content that was edited directly in an old `index.html`.

Edit the topic JSON, then run these commands from the repository root (Python 3.10 or newer; no packages to install):

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests -v
```

Commit the source changes **and the regenerated files** (`index.html`, `c/`, `l/`, `how-we-decide.html`, `rulings.html`, `sitemap.xml`, and `assets/` with the stylesheet, the page script and the fonts) together. Do not edit generated files directly. The PR check rejects invalid data, a broken link between pages, or a stale generated file. The hero total, category totals, filter labels and category markup are generated automatically.

See [the data format and architecture decision](docs/data-format.md) for an entry example, field definitions, and why generation happens before publication rather than in the browser.

## Search

A search shows matching passages with their Latin expression, with short definition rows ranked before examples. Matches are highlighted using the same macron-insensitive and i/j-insensitive normalization as filtering. Each result can expand to show its complete entry and source notes; clearing the query returns to the original grouped cards. Matches found only in search aliases are identified explicitly. Macron guidance and editorial review notes are in the footer, linked by “About this lexicon”.

Search stays above the results. Category filters appear in a sticky sidebar on desktop and in a collapsible panel below search on smaller screens. Selecting a category on mobile closes the panel, shows the selected category in its summary and returns keyboard focus to that summary. Resizing preserves the active category and query. The compact header uses a single-line title on desktop; entry counts and review history stay in the footer. Dark mode is the default; the header toggle switches to light mode and saves the choice locally. Saved preferences are applied before rendering the page, and the toggle still works when browser storage is unavailable.

Words in the record format have their own pages (`c/<concept>.html`), and so does every Latin word that heads a term (`l/<word>.html`); see [docs/records.md](docs/records.md). On a concept page the reasons stand in the margin beside the line they explain and fold under it on a phone. A filter shows all examples, only the quotations or only the composed sentences. The design ("Minium") and its phone requirements are in AGENTS.md; the fonts and their licences are in `src/fonts/`.

Browser regression checks use Node.js and Playwright (development only; the published page has no runtime dependencies):

```sh
npm ci
npx playwright install chromium
npm test
```

The checks cover the pyjama lookup, highlighting and Unicode normalization, category filters, complete context, cross-references, alias/source matches, literal input, the footer and phone layout. CI also runs them in Chromium. For an existing browser installation, set `LEXICON_CHROMIUM_EXECUTABLE`; `LEXICON_CHROMIUM_ARGS` optionally supplies a JSON array of launch arguments.

## Publishing and exports

GitHub Pages continues to publish `main`, folder `/(root)`. No deployment-setting change is needed. The generated page includes its CSS, search code and vocabulary: it can still be downloaded, opened directly and searched offline. Entries remain readable when JavaScript is disabled.

The ChatGPT Library file `Lexicon_Latinitatis_Cotidianae.html` is a snapshot/export and may be out of date. Never edit only that copy or import it over newer repository content. There is no automatic GitHub–Library synchronization. To refresh an export, use the **committed, generated** `index.html`, retaining its snapshot notice and the Library item's identity. See [AGENTS.md](AGENTS.md).
