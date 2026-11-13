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
- `src/practice.html`, `src/practice.js`: the vocabulary practice; `src/hora.html`: the clock game (see Practice below).
- `scripts/build.py`: validates the data and generates the site: the front page, a page per category, the English and Latin words from A to Z, a page per record and per Latin word, the rulings, the search data, the practice pages with their cards, and the redirects from the old single page.
- `scripts/consonantal_j.py`: writes consonantal i as j in the Latin (the lexicon's orthography; see AGENTS.md) and checks that none is left.
- `scripts/convert_cards.py`, `scripts/check_quantities.py`, `scripts/check_libelli.py`, `scripts/coverage.py`, `scripts/lookup.py`: converting cards, checking vowel lengths against Lewis & Short and quotations against the readers, measuring coverage of core word lists, and looking words up in the reference works (see AGENTS.md and `docs/`).
- `scripts/latin_frequency.py`, `scripts/latin_coverage.py`: the frequency list of classical Latin lemmas (`refs/latin-frequency.tsv`, from the LASLA corpus, which is kept outside the repository), the lexicon's coverage of it (`notes/coverage/latin-frequency.md`) and word lists work by work (`notes/coverage/works.md`). See `refs/README.md` for the source and its licence.

Edit the topic JSON, then run these commands from the repository root (Python 3.10 or newer; no packages to install):

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 -m unittest discover -s tests -v
```

Commit the source changes **and the regenerated files** (`index.html`, `k/`, `c/`, `l/`, `words.html`, `latin.html`, `how-we-decide.html`, `rulings.html`, `practice.html`, `hora.html`, `sitemap.xml`, `manifest.webmanifest`, `sw.js`, and `assets/` with the stylesheet, the scripts, the search data, the fonts and the icons) together. Do not edit generated files directly. The PR check rejects invalid data, a broken link between pages, or a stale generated file. The counts, the lists and the contents are generated.

See [the data format and architecture decision](docs/data-format.md) for an entry example, field definitions, and why generation happens before publication rather than in the browser.

## Pages and search

The site is plain pages, linkable and readable without JavaScript (Jack, 9 November 2026):

- `index.html`, the front page: the search, a line on what the lexicon is, and the contents, the categories with their entry counts.
- `k/<category>.html`: a category's entries from A to Z, each with its Latin, linked to its page; the categories stand beside the list (on a phone, in a menu above it). A record can be listed under more categories than its own (`also_under`).
- `words.html` and `latin.html`: every English and every Latin headword from A to Z, by letter.
- `c/<concept>.html`: a record's page, and `l/<word>.html`: a Latin word's page, which lists every entry that uses it (see [docs/records.md](docs/records.md)). On a concept page the reasons stand in the margin beside the line they explain and fold under it on a phone; a filter shows all examples, only the quotations or only the composed sentences.

The search runs on the front page, over every category, and on each category's page, over that category. Its data (`assets/search-data.js`) is fetched once the page has loaded and is idle, as a script, so it is ready before the first letter is typed and also works from pages opened on disk; while it is on its way the status line says so and the rule under the field moves. The results are drawn 30 at a time, with a button for more: a single letter matches thousands of entries, and drawing them all made typing slow. The address keeps the query (`index.html?q=pyjama`, or `&cat=vestitus` for one category), so a search can be bookmarked or sent. Definitions rank before examples and notes, and matches are highlighted with the same macron-insensitive, i/j- and u/v-insensitive folding the search uses; each result links to its entry's page. Matches found only in other search terms are identified. A Latin word is found from any of its forms: the build gives each term the stems its forms are built on (from the genitive, or the principal parts), with the endings each takes, and the search takes an ending off what was typed, so *piscīnam* finds *piscīna* and *cucurrit* finds *currō*. When nothing matches, the entries one letter off (two in a long word) are offered as close spellings. Without scripts the search bar is hidden and the contents, the category lists and the A–Z pages stand in for it.

The category lists and both A–Z indexes have a filter, All / Words / Phrases (a record whose part of speech is `phrase` is a phrase); the choice is kept on the device. The Latin index lists each Latin word, with its page, and the Latin of each phrase, leading to its entry; both indexes are ordered by letters alone, so *-ne* stands under N. The front page links to the two indexes above the categories. Examples taken from the editor's own unpublished readers are shown as "composed" (see AGENTS.md).

Links to the old single page still work: `index.html#culina` leads to `k/culina.html`, `#entry-528` to the record that replaced that card, `#c-socks` to `c/socks.html`. The table is `assets/legacy.js`, which the front page loads only when an address carries such a fragment.

Practice is linked from the front page, above the contents, and from every page's footer (see Practice below).

Every page's header has the name, a search field and one settings control ("Aa"). The field opens the front page with the query (`index.html?q=…`), as a plain form; the front page and the category pages show only their own search, which runs in place. On a phone the field has its own line under the name. `/` focuses the search. How we decide, Rulings and About are linked from every page's footer. The settings hold the theme and the display options: light mode is the default, dark mode can be chosen and is saved locally; the display options hide the macrons, write consonantal i as i, or write consonantal u as u (lower case only, so *Venus* keeps its V), for readers of other traditions; it changes only what is shown, on every page, and the choice is kept the same way. Saved preferences are applied before the page is drawn, and the toggle still works when browser storage is unavailable. The design ("Minium") and its phone requirements are in AGENTS.md; the fonts and their licences are in `src/fonts/`.

Browser regression checks use Node.js and Playwright (development only; the published page has no runtime dependencies):

```sh
npm ci
npx playwright install chromium
npm test
```

The checks cover the front page and its contents, the category pages and the A–Z pages, the pyjama lookup, highlighting and Unicode normalization, inflected forms and close spellings, the search within a category and linkable searches, alias and source matches, literal input, the old single page's links, every page without scripts, the header's search and the `/` key, the footer's links, the theme and display options, the phone layout of every kind of page, and practice: a round, the deck's choices, the words looked up, a pasted list, export and import, and the clock game. They serve the pages over HTTP with Python's `http.server`, as the published site is served. CI also runs them in Chromium. For an existing browser installation, set `LEXICON_CHROMIUM_EXECUTABLE`; `LEXICON_CHROMIUM_ARGS` optionally supplies a JSON array of launch arguments.

## Practice

Two pages for practising, linked from the front page and from every footer (Jack, 13 November 2026). The header gains no link.

**Vocabulary** (`practice.html`, from `src/practice.html` and `src/practice.js`). An English cue; say the Latin aloud; show it; mark "Got it" or "Again". Spaced repetition in seven boxes, with waits of 10 minutes, 1 hour, 1, 3, 7, 16 and 35 days, as in the drill of the editor's own hub: "Got it" moves a card up a box (a new card that is right first time starts in the third), "Again" sends it back to the first. A round has 12 cards, the due ones first, then new ones in no order, one card for each Latin headword. The back of a card gives the Latin, its gloss, one example and a link to the entry. Keys: Space or Enter shows, then 1 is Again and 2 is Got it.

Vocabulary is the primary thing and phrases are secondary, so the deck starts as the words. The reader narrows it under "Deck", by groups of choices:

- **Kind**: words, everyday phrases, sayings and quotations. A record is a word unless its part of speech is `phrase`. A phrase is a saying when its main term is in Traupman's list of proverbs and sayings (pp. 254–259), or is a line of Publilius Syrus, or is cited only from authors and is a whole statement (a sentence of three words or more ending in a full stop or a question mark, whose English headword is not a turn of conversation: three words or more, no "I", "me" or "you", no contraction, no exclamation mark). Every other phrase is an everyday phrase. The rule is `practice_kind` in the builder.
- **Part of speech**: nouns, verbs, adjectives, adverbs, other. A choice among the words; a record that is two things counts under each.
- **Category**: the lexicon's categories, in the order of `filters` in `data/catalog.json`.
- **Source**: the author or handbook that a citation opens with (`Cic. Att. 5.2.1`, `Traupman 73`), read from the main term's evidence and from the examples' sources, and under an author the work where it can be told apart (`Verg. G.`). "(Lewis & Short)" at the end of a citation says where it was taken from, not who wrote it. The table of abbreviations is `PRACTICE_SOURCES` in the builder; a source is offered once it has 15 cards.
- **Mine**: "Words I looked up" (every entry page opened on this device) and the reader's own lists. A list is a name and pasted items, one per line or separated by commas; an item finds a record by its id (`brush-teeth`), its English headword (with or without the sense in brackets) or the Latin headword of its main term (macrons optional).

Within a group the choices add up (Cicero or Vergil); between groups they narrow (Cicero, within the kitchen); a group with nothing chosen does not narrow. The deck's line always gives the count: cards, due now, new.

The cards are `assets/practice-data.js` (`window.lexiconPractice`, a script so that the page works from disk), built from the records: one card per record, with short keys documented at `practice_data` in the builder. Examples taken from the editor's unpublished readers are sentences of ours there too, with no label.

Everything the reader does stays on the device, in the browser's storage, and nothing is sent anywhere:

| Key | What it holds |
| --- | --- |
| `lexicon-practice` | progress: for each card its box, when it is due and when it was marked |
| `lexicon-practice-deck` | the choices under "Deck" |
| `lexicon-seen` | the entries opened, with the time (the 500 most recent); written by `src/page.js` on every entry page |
| `lexicon-lists` | the reader's own lists, as they were pasted |
| `hcu-…` | the clock game's language, drill, options and score |

"Backup" exports the progress and the lists as text and imports them again; where both copies have a card, the later answer wins. Import also takes the record of the hub's drill, whose word cards are `v:<record id>`.

No list is shipped with the site. A word set that is private to the editor, such as the vocabulary of his unpublished readers, is practised by pasting it as a list on his own device; do not add a list tied to the readers to the data or the pages.

**The clock** (`hora.html`, from `src/hora.html`): *Hōra cum ūnciā*, the editor's game for the twelfths of the Roman *as* and for telling the time with them, with a Latin and an English interface. It keeps its own look. It asks nothing of other sites: the serif is the lexicon's own, from `assets/fonts/`, and the monospace is the system's. A theme chosen in the lexicon holds there too; without one it follows the system.

Both pages are saved by the service worker with the rest, so they work offline.

## On a phone: the app and offline use

The lexicon installs from the browser, with no app store. In Safari on an iPhone: Share, then Add to Home Screen. It then opens from its icon in a window of its own, not in a browser tab (`manifest.webmanifest`, the icons in `src/icons/`, and the tags `app_head` adds to every page).

A service worker (`src/sw.js`, built to `sw.js`) keeps the lexicon on the device: the front page, the category pages, the practice pages and their cards, the stylesheet, the scripts, the search data and the fonts when it installs, and each entry or word page as it is read (the 600 most recent). So the lexicon opens at once, and the search works offline, showing each entry's words and examples; an entry page never opened on that device needs a connection. The worker's version is a hash of the files it keeps, so a published change replaces them: a reader sees it at the second opening after it is published. `node scripts/make_icons.mjs` redraws the icons.

Opened from the home screen of an iPhone, a link to another site (Wiktionary, Logeion) opens in a sheet inside the app, closed with one tap to come back where one was. Sending such links to Safari instead (through its `x-safari-https://` address) was tried on 13 November 2026 and taken out: the link opened in Safari and in the sheet both.

## Publishing and exports

GitHub Pages continues to publish `main`, folder `/(root)`. No deployment-setting change is needed. The site is static files with relative links: a downloaded copy of the repository can be opened from disk, and searched there.

The ChatGPT Library file `Lexicon_Latinitatis_Cotidianae.html` is a snapshot/export and may be out of date. Never edit only that copy or import it over newer repository content. There is no automatic GitHub–Library synchronization. Since 9 November 2026 the lexicon is many pages, so a single-file export can no longer be refreshed from `index.html`; link to the site instead. See [AGENTS.md](AGENTS.md).

## To do

What we mean to improve, roughly in order (Jack, 13 November 2026). Sources still to find and checks still owed are in [docs/todo.md](docs/todo.md). Delete a line when it is done.


1. **Coinages only where needed.** A word or phrase we composed belongs here only when no author of any period has one for the concept, or a circumlocution has a real reason; the closer the author to Cicero, the more weight (the rule is in [docs/records.md](docs/records.md)). *Done, 13 November 2026:* of the 416 terms then marked "ours", the 153 that stood beside an attested term (in 127 records) were gone through one by one: 32 deleted as redundant, 56 moved to the examples as ordinary combinations of attested words, 7 found to have a source after all and relabelled (*bēta rubra*, *mōrum rubī*, *minūtātim concīdere*, *lac acidum*, *pede pulsāre*, *ferrum trānsversum*, *canālis*), 22 kept as needed with the reason stated, 7 left as household words, and 29 left untouched as doubtful. Each is listed with its reason in [notes/coinages-2026-11-13.md](notes/coinages-2026-11-13.md). The builder now refuses a record that recommends a term of ours beside an attested recommended term. *To do:* (a) the editor's verdict on the 29 doubtful terms (the list is in the notes file); (b) the 263 terms of ours in records with no attested term at all: search the reference works for each, then delete, replace with an attested word, move to the examples, or keep with its reason; (c) then the rule in the builder that every term of period `ours` states why it is needed and what was searched (40 of the 263 have no comment at all); 321 terms are marked "ours" today.
2. **Standing notes under Sources.** After the Traupman lines (done 13 November 2026), the same holds for the other sentences repeated from record to record: "Quotations marked “Lewis & Short” are given as Lewis & Short cites them…" (about 1,360 records), "The example sentences marked “composed” are ours" (about 990), and Graesse's "read in the digitization at…". Say each once on How we decide and take it out of the records.
3. **Every Latin word linked, and every one with an entry.** In *Potest ex casā vir magnus exīre*, only *ex*, *vir* and *magnus* are links. Two causes. The linker matches dictionary forms only, so *potest* and *exīre* are not linked although *possum* and *exeō* have pages: it should recognise inflected forms, with the stems the search already computes. And *casa* and *tugurium* had no entry at all (they have had one since 13 November 2026: hut). To do: link the forms, then list every Latin word used anywhere in the lexicon (terms, phrases, examples, quotations) that has no entry, and write those entries. Until that list is empty the build should report its length.
4. **A review process.** Every one of the 6,842 records is still a draft. This needs a process, not a line on a list: an order (the words looked up most, then the core lists in `notes/coverage/`); what a review checks (the Latin and its quantities, the status and period, each citation read in its source, the examples); who does what (an agent prepares each record with what it found, the editor gives the verdict); a way to give that verdict from the phone in one tap; and how the result is recorded (`review.status`, date, by) and counted on the site.
5. **Flag an entry in one tap.** Each page ends with "Suggest a correction or a better word", which opens a GitHub issue to fill in and needs an account. From the phone it should be one tap and a few words ("this looks wrong: …"), collected where the review process reads them.
6. **Missed lookups.** Record the searches that find nothing, as the list of gaps to fill. There is no server, so either keep them on the device with a page that sends them as one report, or use a small form service.
7. **Recents and favourites** on the front page, kept on the device. The entries looked up are now recorded (key `lexicon-seen`, the 500 most recent; the practice page offers them as "Words I looked up"). What remains: a list of them on the front page, and favourites.
8. **Related words, properly.** The page for *acrobat* gives *petaurista* and does not lead to *petaurum*, which the lexicon has (under *trampoline*). Two different links are wanted. *Word families* (the same root: *petaurum, petaurista, petauristārius*) can be found without any model, from the stems the search already computes, Lewis & Short's etymologies and de Vaan, and shown on the word and concept pages. *Nearby concepts* (acrobat, juggler, circus) are what "See also" lists by hand today; embeddings could propose them, computed at build time into a static file of nearest neighbours and then reviewed. At this size no vector database or server is needed, and embeddings are weak at Latin derivation, so the families come first.
9. **Sweep the authors.** Take every word of the classical authors (Cicero, Caesar, Vergil, Ovid and the rest first; then late, medieval, Renaissance and modern writers) and enter the ones we lack, most frequent first, each with its period and a citation. What exists (13 November 2026): a frequency list of the 5,000 commonest lemmas of classical Latin (`refs/latin-frequency.tsv`, made by `scripts/latin_frequency.py` from the LASLA corpus, 1.75 million words lemmatised by hand; licence and credit in `refs/README.md`); a coverage report, `notes/coverage/latin-frequency.md`, made by `scripts/latin_coverage.py`, which lists the missing lemmas in rank order; and a first batch of drafts, 64 Latin words in 55 records, which closes the first 1,000 but for *resistō*. What remains: 1,503 of the 5,000 (198 of the first 2,000), to be drafted in rank order as in `docs/drafting.md`; the homographs the report lists to check by hand; *resistō*, which the Perseus text of Lewis & Short lacks; the corpus's lemmas beyond rank 5,000 (17,900 in all); and after the classical authors the later ones, for which no lemmatised corpus has been chosen. The corpus keeps its 134 works apart, so the same script lists the words of one work with the records that have them (`--work "Vergilius, Eclogae"`; the works are in `notes/coverage/works.md`): the material for practising the vocabulary of one book, not yet wired into the site. The drafts still need the review process above, since no one can read thousands of them.
10. **A lighter repository.** About 120 MB of generated pages are committed, so every change touches thousands of files. Build them at deploy time with GitHub Actions instead: smaller pull requests, fewer conflicts, a smaller clone. The site itself would be no faster.
11. **All entries offline.** The service worker keeps the entries that have been read. An option to save every entry (about 60 MB of pages, or far less as data) would make the whole lexicon available without a connection.
12. **Wiktionary forms at a glance.** A preview of the declension or conjugation on hover or long press, instead of leaving the page.
