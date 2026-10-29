# Lexicon editing instructions

## Source of truth

The authoritative lexicon is the structured data in `data/` on the `main` branch of this repository:
https://github.com/jhwheeler/lexicon-latinitatis-cotidianae

Published site:
https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

For any request to read, extend, correct, or edit the lexicon, fetch the current repository version first. Edit topic JSON in `data/entries/` and category metadata in `data/catalog.json`. Page layout, styles and search live in `src/`. Run `python3 scripts/build.py` and commit the source changes together with the regenerated `index.html`; never edit the generated page directly. Run `python3 scripts/build.py --check` and `python3 -m unittest discover -s tests -v` before committing. GitHub Pages still publishes the generated root page. See `docs/data-format.md` for the data format. To port content from a branch or export that edited `index.html` directly, extract it with `python3 scripts/html_to_data.py <page> --out <dir>` and merge the resulting JSON into `data/`; never resolve such a branch by copying its page over the generated one.

## Latin orthography: consonantal i is j

Jack's decision (29 October 2026): the lexicon follows the orthography of the Theodōrus et pater readers and writes consonantal i as j in all Latin: headwords, phrases, examples and quotations (quotations are normalised to it).

- *jam, ejus, cujus, major, Troja, Jēsus, Joannēs* (short, unmarked o).
- No macron on the vowel before intervocalic j (*major, ejus, pejus*: the vowel is short, the syllable heavy). Long prefixes keep theirs (*dējectus, prōjēcit, ējēcī*).
- Compounds: *abjicit, objice, dējiciō, subjēcit, conjungō, conjūnx, adjuvō*.
- i stays a vowel in the interjection *iō*, in forms of *eō* (*iērunt, adiērunt*), in *superior, interior, Plēiades*, in *Iūlus* where it scans as three syllables, after *qu/gu* (*quiēs, reliquiae*), and wherever it is a vowel (*diēs, cliēns, audiō, gaudium*).
- Only Latin changes. English, Bulgarian and other text and link targets keep their spelling; citation labels give the dictionary's own headword (Lewis & Short prints *janua, jus* but *deicio*).

After adding or editing Latin, run `python3 scripts/consonantal_j.py --list` and review both the proposed changes and the kept candidates, then `--write` and rebuild. `--check`, also run by the tests, fails while any Latin still needs j; record a genuine exception in the script's `KEEP` list with its reason. Content ported from older branches (written with i) needs this pass. Search treats i and j alike, so *iam* finds *jam*.

## Exported copies

Library and downloaded HTML files are snapshots. They may be stale and are not automatically synchronized with this repository. Never make a requested lexicon change only in an exported copy, and never overwrite newer repository content with an older export.

If an updated export or synchronization is requested, commit the repository changes first, then regenerate the export from that committed version. Keep a visible snapshot notice with links to the live site and repository. Compare any independently edited export with the current repository before importing changes.

## Content and verification

Preserve macrons, genitives, genders, source citations, and distinctions between attested vocabulary and working formations. Verify search and affected content after functional changes. Check deployment after publishing site changes.
