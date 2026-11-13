# Lexicon editing instructions

## Source of truth

The authoritative lexicon is the structured data in `data/` on the `main` branch of this repository:
https://github.com/jhwheeler/lexicon-latinitatis-cotidianae

Published site:
https://jhwheeler.github.io/lexicon-latinitatis-cotidianae/

For any request to read, extend, correct, or edit the lexicon, fetch the current repository version first. New words go in as concept records in `data/concepts/` (one record per sense, with notes for every departure from Lewis & Short or a source, and rulings in `data/rulings.json`; see `docs/records.md`). Every grouped topic card in `data/entries/` was converted to records by 9 November 2026 (`scripts/convert_cards.py`, rules in `docs/converting.md`); the converted records are drafts until reviewed. Category metadata is in `data/catalog.json`. Page layout, styles and search live in `src/`. Run `python3 scripts/build.py` and commit the source changes together with the regenerated files (`index.html`, `k/`, `c/`, `l/`, `words.html`, `latin.html`, `how-we-decide.html`, `rulings.html`, `sitemap.xml`, `manifest.webmanifest`, `sw.js`, `assets/`); never edit generated files directly. Run `python3 scripts/build.py --check`, `python3 -m unittest discover -s tests -v`, `python3 scripts/check_quantities.py` (vowel lengths against Lewis & Short; a deliberate departure needs a note, a ruling or an entry in `data/quantity-exceptions.json`) and the browser search tests (`npm test`; setup in README.md) before committing; CI runs all four. GitHub Pages publishes the generated pages. See `docs/data-format.md` for the catalog and `docs/records.md` for records. Never resolve a branch that edited generated pages by copying them over the generated ones: move its intended changes into `data/` and rebuild.

## Latin orthography: consonantal i is j

Jack's decision (29 October 2026): the lexicon follows the orthography of the Theodōrus et pater readers and writes consonantal i as j in all Latin: headwords, phrases, examples and quotations (quotations are normalised to it).

- *jam, ejus, cujus, major, Troja, Jēsus, Jōannēs* (with long *ō* since 9 November 2026, after Lewis & Short's *Jōannes*; Jack).
- No macron on the vowel before intervocalic j (*major, ejus, pejus*: the vowel is short, the syllable heavy). Long prefixes keep theirs (*dējectus, prōjēcit, ējēcī*).
- Compounds: *abjicit, objice, dējiciō, subjēcit, conjungō, conjūnx, adjuvō*.
- i stays a vowel in the interjection *iō*, in forms of *eō* (*iērunt, adiērunt*), in *superior, interior, Plēiades*, in *Iūlus* where it scans as three syllables, after *qu/gu* (*quiēs, reliquiae*), and wherever it is a vowel (*diēs, cliēns, audiō, gaudium*).
- Only Latin changes. English, text in other languages and link targets keep their spelling; citation labels give the dictionary's own headword (Lewis & Short prints *janua, jus* but *deicio*).

After adding or editing Latin, run `python3 scripts/consonantal_j.py --list` and review both the proposed changes and the kept candidates, then `--write` and rebuild. `--check`, also run by the tests, fails while any Latin still needs j; record a genuine exception in the script's `KEEP` list with its reason. Content ported from older branches (written with i) needs this pass. Search treats i and j alike, so *iam* finds *jam*, and u and v alike, so *uideō* finds *videō*. Consonantal u is written v in the data; the display options can show it as u (lower case only: *uideō*, but *Venus*) as they can show j as i (Jack, 11 November 2026).

## Examples from the Theodōrus et pater readers

The readers (the libellī, and the cookbook that goes with them) are Jack's own and unpublished; whether they will be published is undecided. A reader of the lexicon cannot be expected to know them as he knows Cicero, so the site never cites them (Jack, 13 November 2026):

- In the data an example taken from them keeps its place as its `source`: `Libellus III, <span lang="la">Apud avum et aviam</span>`, or `<span lang="la">Culīna Theodōrī</span>` for the cookbook. The site shows it as "composed", like our other sentences, and the search does the same. A record's source line that names the readers (it begins *Theodōrus et pater*) stays in the data and is not shown.
- Prose never leans on them: no "the word of the libellī", "as in Libellus VII", "the series spelling". Say what is true without them: "our household word", "the house spelling", "a description of ours". Do not give a libellus as a term's `evidence`.
- In the readers *fābula* means only the tales told inside them, so it is not used for the readers themselves (Jack, 30 October 2026).

Examples kept this way quote the text word for word, and the readers are still being revised, so quotations drift. Whenever the readers change, run `python3 scripts/check_libelli.py --latinitas <path to a latinitas checkout>`: it checks every such example against the current texts and each title against the reader's `@title`, and lists looser mentions to look over. Re-quote what it reports from the current text and correct the English to match. Household words follow the series bible in the latinitas repository (pyjamas are *vestis nocturna*, not Traupman's *synthesis dormītōria*).

## Languages: English and Latin

Jack's decision (8 November 2026): the lexicon is English–Latin. Don't add glosses, labels, headings or search terms in Bulgarian or any other language by default. Cite another language only where it helps to explain a Latin word's meaning or form, as a cf. (for example, Lithuanian *ūdra* and Russian *vydra* in the ruling on *lutra*). Describe local things in English (white brined cheese, not *sirene*).

## Design

Jack's choice (9 November 2026): the "Minium" design. The rule is "say the black, do the red": Latin and its English are ink, and the rubrics (section heads, periods, note numbers, the control in use) are red. The text face is Gentium Book Plus, subset and renamed Lexicon Serif as its licence requires, with its own small capitals. Alegreya Sans is used only for controls. The layout uses rules, not boxes or pills, and rules that run one above the other end at the same edges: the search has a single rule, under the field and Clear alike. Latin quoted in English prose (notes, rulings, comments) is italic.

Light, black and red on white, is the default. Jack found red on black hard to read (9 November 2026), so the dark theme is warm grey with cream ink: its headings and labels are cream, and red is kept to the small marks (note numbers, underlines, the control in use), as a soft rose. In the stylesheet, `--rubric` colours headings and labels and `--accent` the marks; in light both are red.

The front page has the search and the contents (Jack, 9 November 2026). Every page is linkable and works without JavaScript (Jack, 9 November 2026): each category has its own page (`k/<id>.html`) listing its entries from A to Z, with the categories beside it (on a phone, in a menu above), and `words.html` and `latin.html` list every headword by letter. The search, on the front page and the category pages, is the one part that needs scripts; its address keeps the query (`?q=`), and without scripts the lists stand in for it. Links to the old single page (`index.html#culina`, `#entry-528`) are redirected by `assets/legacy.js`. On a concept page the reasons (period, evidence, notes) stand in the margin beside the line they explain, and on a phone they fold under it. The header of every page is the name on the left, a search field in the middle and one settings control, "Aa", on the right, which opens the display options (macrons shown or hidden, consonantal i as j or i, consonantal u as v or u) and the theme (Jack, 11 November 2026). The header's field is a plain form that opens the front page with `?q=`, so it sends without scripts; the front page and the category pages, which search in place, show only their own field. On a phone the field takes its own line under the name, always in view. Pressing `/` focuses the search. How we decide, Rulings and About are in the footer of every page, not the header; the settings need scripts and are hidden without them. The site must work well on a phone: nothing scrolls sideways, every control is at least 44px tall, and the search field's text is at least 16px. The browser tests check all three. The fonts and their licences are in `src/fonts/` (see its README).

## Speed, the app and offline use

Jack's requirements (13 November 2026): the search must feel instant, with no backend, and the lexicon must open from his phone's home screen like an app, without an app store.

- The search draws 30 results at a time, with "Show 30 more" under them; the count line gives the full number. Never draw every match: a single letter matches thousands of entries, and drawing them all took seconds on a phone. The search data is fetched when the page is idle after loading, so it is ready before the first letter; while it is on its way the status line says "Loading the lexicon…" and the rule under the field moves.
- `manifest.webmanifest`, the icons (`src/icons/`, drawn by `scripts/make_icons.mjs`) and the tags `app_head` puts in every page make "Add to Home Screen" open the lexicon in its own window, not a browser tab.
- The service worker (`src/sw.js`, built to `sw.js` at the root) keeps the front page, the category pages, the guidance pages, the stylesheet, the scripts, the search data, the fonts and the icons on the device when it installs, and the entry and word pages as they are read (the 600 most recent). The lexicon then opens at once and searches offline. Its version is a hash of the files it saves, so every build that changes them makes browsers fetch them afresh: a reader sees a change at the second opening after it is published, not the first. Do not give the saved files names that change, and do not add a second cache for them.
- The browser tests cover the batches, the loading state, the manifest and offline use.

## Words or phrases

Jack's request (13 November 2026): the category lists and the English A–Z have a filter, All / Words / Phrases, so the sayings can be browsed by themselves and the words are not buried under them. A record is a phrase when its `pos` is `phrase` (or includes it); give every saying or sentence that part of speech. The choice is kept on the device and carries from one list to the next.

## Sources are citations

Jack's decision (13 November 2026): a line under Sources is a citation as a book prints one, not an account of how we read the book, and a work is cited once per record with all its pages. See "Sources are citations" in `docs/records.md`; the builder enforces it.

## Exported copies

Library and downloaded HTML files are snapshots. They may be stale and are not automatically synchronized with this repository. Never make a requested lexicon change only in an exported copy, and never overwrite newer repository content with an older export.

If an updated export or synchronization is requested, commit the repository changes first, then regenerate the export from that committed version. Keep a visible snapshot notice with links to the live site and repository. Compare any independently edited export with the current repository before importing changes.

## Content and verification

Preserve macrons, genitives, genders, source citations, and distinctions between attested vocabulary and working formations. Verify search and affected content after functional changes. Check deployment after publishing site changes.
