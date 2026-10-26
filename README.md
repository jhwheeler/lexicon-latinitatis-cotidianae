# Lexicon Latīnitātis Cotīdiānae

Everyday English–Latin vocabulary, with macrons, examples, usage notes and sources.

Site: https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

## Editing

**This repository is the authoritative source.** Fetch current `main` before editing.

- `data/catalog.json`: ordered categories, their headings, and filter order.
- `data/entries/<category>.json`: dictionary entries, grouped by topic.
- `src/page.html`: page shell and editorial review notes.
- `src/styles.css`: styling.
- `src/search.js`: browser search and filters.
- `scripts/build.py`: validates the data and generates the self-contained `index.html`.

Edit the topic JSON, then run these commands from the repository root (Python 3.10 or newer; no packages to install):

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests -v
```

Commit the source changes **and regenerated `index.html`** together. Do not edit `index.html` directly: it is generated. The PR check rejects invalid data or a stale generated page. The hero total, category totals, filter labels and category markup are generated automatically.

See [the data format and architecture decision](docs/data-format.md) for an entry example, field definitions, and why generation happens before publication rather than in the browser.

## Publishing and exports

GitHub Pages continues to publish `main`, folder `/(root)`. No deployment-setting change is needed. The generated page includes its CSS, search code and vocabulary: it can still be downloaded, opened directly and searched offline. Entries remain readable when JavaScript is disabled.

The ChatGPT Library file `Lexicon_Latinitatis_Cotidianae.html` is a snapshot/export and may be out of date. Never edit only that copy or import it over newer repository content. There is no automatic GitHub–Library synchronization. To refresh an export, use the **committed, generated** `index.html`, retaining its snapshot notice and the Library item's identity. See [AGENTS.md](AGENTS.md).
