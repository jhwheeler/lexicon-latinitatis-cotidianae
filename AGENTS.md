# Lexicon editing instructions

## Source of truth

The authoritative lexicon is the structured data in `data/` on the `main` branch of this repository:
https://github.com/jhwheeler/lexicon-latinitatis-cotidianae

Published site:
https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

For any request to read, extend, correct, or edit the lexicon, fetch the current repository version first. Edit topic JSON in `data/entries/` and category metadata in `data/catalog.json`. Page layout, styles and search live in `src/`. Run `python3 scripts/build.py` and commit the source changes together with the regenerated `index.html`; never edit the generated page directly. Run `python3 scripts/build.py --check` and `python3 -m unittest discover -s tests -v` before committing. GitHub Pages still publishes the generated root page. See `docs/data-format.md` for the data format.

## Exported copies

Library and downloaded HTML files are snapshots. They may be stale and are not automatically synchronized with this repository. Never make a requested lexicon change only in an exported copy, and never overwrite newer repository content with an older export.

If an updated export or synchronization is requested, commit the repository changes first, then regenerate the export from that committed version. Keep a visible snapshot notice with links to the live site and repository. Compare any independently edited export with the current repository before importing changes.

## Content and verification

Preserve macrons, genitives, genders, source citations, and distinctions between attested vocabulary and working formations. Verify search and affected content after functional changes. Check deployment after publishing site changes.
