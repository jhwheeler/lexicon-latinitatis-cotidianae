# Lexicon Latīnitātis Cotīdiānae

Everyday English–Latin vocabulary, with macrons, examples, usage notes and sources.

Site: https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

## Editing

**This repository is the authoritative source.** Fetch current `main` before editing.

- `data/catalog.json`: ordered categories, their headings, and filter order.
- `data/concepts/<concept>.json`: one record per concept, with notes (footnotes) on every departure from a dictionary or source; each gets its own page in `c/`. See [docs/records.md](docs/records.md).
- `data/rulings.json`: editorial rulings, listed on `rulings.html`; `src/how-we-decide.html` holds the editorial policy.
- `data/entries/<category>.json`: the grouped topic cards of the first edition. Every card was converted to records by 9 November 2026, so the files are empty; the builder still reads the format.
- `src/page.html`: the front page and its editorial review notes; `src/how-we-decide.html`: the policy page.
- `src/styles.css`: styling; `src/page.js`: the theme and display options and the example filters, on every page.
- `src/search.js`: the search, on the front page and the category pages.
- `scripts/build.py`: validates the data and generates the site: the front page, a page per category, the English and Latin words from A to Z, a page per record and per Latin word, the rulings, the search data and the redirects from the old single page.
- `scripts/consonantal_j.py`: writes consonantal i as j in the Latin (the lexicon's orthography; see AGENTS.md) and checks that none is left.
- `scripts/convert_cards.py`, `scripts/check_quantities.py`, `scripts/check_libelli.py`, `scripts/coverage.py`, `scripts/lookup.py`: converting cards, checking vowel lengths against Lewis & Short and quotations against the readers, measuring coverage of core word lists, and looking words up in the reference works (see AGENTS.md and `docs/`).

Edit the topic JSON, then run these commands from the repository root (Python 3.10 or newer; no packages to install):

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests -v
```

Commit the source changes **and the regenerated files** (`index.html`, `k/`, `c/`, `l/`, `words.html`, `latin.html`, `how-we-decide.html`, `rulings.html`, `sitemap.xml`, and `assets/` with the stylesheet, the scripts, the search data and the fonts) together. Do not edit generated files directly. The PR check rejects invalid data, a broken link between pages, or a stale generated file. The counts, the lists and the contents are generated.

See [the data format and architecture decision](docs/data-format.md) for an entry example, field definitions, and why generation happens before publication rather than in the browser.

## Pages and search

The site is plain pages, linkable and readable without JavaScript (Jack, 9 November 2026):

- `index.html`, the front page: the search, a line on what the lexicon is, and the contents, the categories with their entry counts.
- `k/<category>.html`: a category's entries from A to Z, each with its Latin, linked to its page; the categories stand beside the list (on a phone, in a menu above it). A record can be listed under more categories than its own (`also_under`).
- `words.html` and `latin.html`: every English and every Latin headword from A to Z, by letter.
- `c/<concept>.html`: a record's page, and `l/<word>.html`: a Latin word's page, which lists every entry that uses it (see [docs/records.md](docs/records.md)). On a concept page the reasons stand in the margin beside the line they explain and fold under it on a phone; a filter shows all examples, only the quotations or only the composed sentences.

The search runs on the front page, over every category, and on each category's page, over that category. Its data (`assets/search-data.js`) loads on first use, as a script, so it also works from pages opened on disk. The address keeps the query (`index.html?q=pyjama`, or `&cat=vestitus` for one category), so a search can be bookmarked or sent. Definitions rank before examples and notes, and matches are highlighted with the same macron-insensitive and i/j-insensitive folding the search uses; each result links to its entry's page. Matches found only in other search terms are identified. Without scripts the search bar is hidden and the contents, the category lists and the A–Z pages stand in for it.

Links to the old single page still work: `index.html#culina` leads to `k/culina.html`, `#entry-528` to the record that replaced that card, `#c-socks` to `c/socks.html`. The table is `assets/legacy.js`, which the front page loads only when an address carries such a fragment.

On a phone the header's links, the display options and the theme are in one menu. Light mode is the default; the header toggle switches to dark mode and saves the choice locally. A Display menu beside it hides the macrons or writes consonantal i as i, for readers of other traditions; it changes only what is shown, on every page, and the choice is kept the same way. Saved preferences are applied before the page is drawn, and the toggle still works when browser storage is unavailable. The design ("Minium") and its phone requirements are in AGENTS.md; the fonts and their licences are in `src/fonts/`.

Browser regression checks use Node.js and Playwright (development only; the published page has no runtime dependencies):

```sh
npm ci
npx playwright install chromium
npm test
```

The checks cover the front page and its contents, the category pages and the A–Z pages, the pyjama lookup, highlighting and Unicode normalization, the search within a category and linkable searches, alias and source matches, literal input, the old single page's links, every page without scripts, the theme and display options, and the phone layout of every kind of page. They serve the pages over HTTP with Python's `http.server`, as the published site is served. CI also runs them in Chromium. For an existing browser installation, set `LEXICON_CHROMIUM_EXECUTABLE`; `LEXICON_CHROMIUM_ARGS` optionally supplies a JSON array of launch arguments.

## Publishing and exports

GitHub Pages continues to publish `main`, folder `/(root)`. No deployment-setting change is needed. The site is static files with relative links: a downloaded copy of the repository can be opened from disk, and searched there.

The ChatGPT Library file `Lexicon_Latinitatis_Cotidianae.html` is a snapshot/export and may be out of date. Never edit only that copy or import it over newer repository content. There is no automatic GitHub–Library synchronization. Since 9 November 2026 the lexicon is many pages, so a single-file export can no longer be refreshed from `index.html`; link to the site instead. See [AGENTS.md](AGENTS.md).
