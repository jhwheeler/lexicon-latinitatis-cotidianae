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

The page opens on a front page: the search, a line on what the lexicon is, and the contents, a list of the categories with their entry counts. Choosing a category shows its entries; the address says which (`index.html#culina`), so the back button returns to the contents and a category or an entry can be linked to. A search from the front page covers every category; a search inside a category stays within it, and the line under the search says so. Clear empties the search and returns to the view it came from.

A search shows matching passages with their Latin expression, with short definition rows ranked before examples. Matches are highlighted using the same macron-insensitive and i/j-insensitive normalization as filtering. Each result can expand to show its complete entry and source notes. Matches found only in search aliases are identified explicitly. Macron guidance and editorial review notes are in the footer, linked by “About this lexicon”.

The search stays at the top of the screen. In a category, the categories appear in a sticky sidebar on desktop, headed by a link back to the contents, and in a collapsible panel below the search on smaller screens. Selecting a category on mobile closes the panel, shows the selected category in its summary and returns keyboard focus to that summary. Resizing preserves the active category and query. Light mode is the default; the header toggle switches to dark mode and saves the choice locally. A Display menu beside it hides the macrons or writes consonantal i as i, for readers of other traditions; it changes only what is shown, on every page, and the choice is kept the same way. Saved preferences are applied before rendering the page, and the toggle still works when browser storage is unavailable.

Words in the record format have their own pages (`c/<concept>.html`), and so does every Latin word that heads a term (`l/<word>.html`); see [docs/records.md](docs/records.md). On a concept page the reasons stand in the margin beside the line they explain and fold under it on a phone. A filter shows all examples, only the quotations or only the composed sentences. The design ("Minium") and its phone requirements are in AGENTS.md; the fonts and their licences are in `src/fonts/`.

Browser regression checks use Node.js and Playwright (development only; the published page has no runtime dependencies):

```sh
npm ci
npx playwright install chromium
npm test
```

The checks cover the front page and its contents, the pyjama lookup, highlighting and Unicode normalization, category views and the search within them, complete context, cross-references, alias/source matches, literal input, the footer and phone layout. CI also runs them in Chromium. For an existing browser installation, set `LEXICON_CHROMIUM_EXECUTABLE`; `LEXICON_CHROMIUM_ARGS` optionally supplies a JSON array of launch arguments.

## Publishing and exports

GitHub Pages continues to publish `main`, folder `/(root)`. No deployment-setting change is needed. The generated page includes its CSS, search code and vocabulary: it can still be downloaded, opened directly and searched offline. Entries remain readable when JavaScript is disabled.

The ChatGPT Library file `Lexicon_Latinitatis_Cotidianae.html` is a snapshot/export and may be out of date. Never edit only that copy or import it over newer repository content. There is no automatic GitHub–Library synchronization. To refresh an export, use the **committed, generated** `index.html`, retaining its snapshot notice and the Library item's identity. See [AGENTS.md](AGENTS.md).
