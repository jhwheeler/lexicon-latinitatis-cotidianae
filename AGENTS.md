# Lexicon editing instructions

## Source of truth

The authoritative lexicon is the structured data in `data/` on the `main` branch of this repository:
https://github.com/jhwheeler/lexicon-latinitatis-cotidianae

Published site:
https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

For any request to read, extend, correct, or edit the lexicon, fetch the current repository version first. New words go in as concept records in `data/concepts/` (one record per sense, with notes for every departure from Lewis & Short or a source, and rulings in `data/rulings.json`; see `docs/records.md`). Grouped topic cards in `data/entries/` are being converted to records; edit them only for corrections. Category metadata is in `data/catalog.json`. Page layout, styles and search live in `src/`. Run `python3 scripts/build.py` and commit the source changes together with the regenerated files (`index.html`, `c/`, `l/`, `how-we-decide.html`, `rulings.html`, `sitemap.xml`, `assets/`); never edit generated files directly. Run `python3 scripts/build.py --check`, `python3 -m unittest discover -s tests -v` and the browser search tests (`npm test`; setup in README.md) before committing; CI runs all three. GitHub Pages still publishes the generated root page. See `docs/data-format.md` for the data format. To port content from a branch or export that edited `index.html` directly, extract it with `python3 scripts/html_to_data.py <page> --out <dir>` and merge the resulting JSON into `data/`; never resolve such a branch by copying its page over the generated one.

## Latin orthography: consonantal i is j

Jack's decision (29 October 2026): the lexicon follows the orthography of the Theodōrus et pater readers and writes consonantal i as j in all Latin: headwords, phrases, examples and quotations (quotations are normalised to it).

- *jam, ejus, cujus, major, Troja, Jēsus, Joannēs* (short, unmarked o).
- No macron on the vowel before intervocalic j (*major, ejus, pejus*: the vowel is short, the syllable heavy). Long prefixes keep theirs (*dējectus, prōjēcit, ējēcī*).
- Compounds: *abjicit, objice, dējiciō, subjēcit, conjungō, conjūnx, adjuvō*.
- i stays a vowel in the interjection *iō*, in forms of *eō* (*iērunt, adiērunt*), in *superior, interior, Plēiades*, in *Iūlus* where it scans as three syllables, after *qu/gu* (*quiēs, reliquiae*), and wherever it is a vowel (*diēs, cliēns, audiō, gaudium*).
- Only Latin changes. English, text in other languages and link targets keep their spelling; citation labels give the dictionary's own headword (Lewis & Short prints *janua, jus* but *deicio*).

After adding or editing Latin, run `python3 scripts/consonantal_j.py --list` and review both the proposed changes and the kept candidates, then `--write` and rebuild. `--check`, also run by the tests, fails while any Latin still needs j; record a genuine exception in the script's `KEEP` list with its reason. Content ported from older branches (written with i) needs this pass. Search treats i and j alike, so *iam* finds *jam*.

## Languages: English and Latin

Jack's decision (8 November 2026): the lexicon is English–Latin. Don't add glosses, labels, headings or search terms in Bulgarian or any other language by default. Cite another language only where it helps to explain a Latin word's meaning or form, as a cf. (for example, Lithuanian *ūdra* and Russian *vydra* in the ruling on *lutra*). Describe local things in English (white brined cheese, not *sirene*).

## Design

Jack's choice (9 November 2026): the "Minium" design. The rule is "say the black, do the red": Latin and its English are ink, and the rubrics (section heads, periods, note numbers, the control in use) are red. The text face is Gentium Book Plus, subset and renamed Lexicon Serif as its licence requires, with its own small capitals. Alegreya Sans is used only for controls. The layout uses rules, not boxes or pills, and rules that run one above the other end at the same edges: the search has a single rule, under the field and Clear alike. Latin quoted in English prose (notes, rulings, comments) is italic.

Light, black and red on white, is the default. Jack found red on black hard to read (9 November 2026), so the dark theme is warm grey with cream ink: its headings and labels are cream, and red is kept to the small marks (note numbers, underlines, the control in use), as a soft rose. In the stylesheet, `--rubric` colours headings and labels and `--accent` the marks; in light both are red.

The index opens on a front page, the search and the contents (Jack, 9 November 2026), not on the first category. A category's address (`index.html#culina`) opens that category, with the categories beside it. Record cards on the index use the format of the record's page, without the margin. On a concept page the reasons (period, evidence, notes) stand in the margin beside the line they explain, and on a phone they fold under it. The site must work well on a phone: nothing scrolls sideways, every control is at least 44px tall, and the search field's text is at least 16px. The browser tests check all three. The fonts and their licences are in `src/fonts/` (see its README).

## Exported copies

Library and downloaded HTML files are snapshots. They may be stale and are not automatically synchronized with this repository. Never make a requested lexicon change only in an exported copy, and never overwrite newer repository content with an older export.

If an updated export or synchronization is requested, commit the repository changes first, then regenerate the export from that committed version. Keep a visible snapshot notice with links to the live site and repository. Compare any independently edited export with the current repository before importing changes.

## Content and verification

Preserve macrons, genitives, genders, source citations, and distinctions between attested vocabulary and working formations. Verify search and affected content after functional changes. Check deployment after publishing site changes.
