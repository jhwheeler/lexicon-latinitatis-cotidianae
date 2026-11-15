# The standing notes under Sources, said once (15 November 2026)

Jack, 15 November 2026: "The standing notes under sources, yeah, that is a bit annoying. We can just say it once, for sure." This follows his ruling of 13 November that a line under Sources is a citation as a book prints one. This file records what was taken out of the records, what answers it on the site, and what was left in the records on purpose. The choices of scope below are Claude's, for Jack to judge.

## What was done

- 7,391 records were read; their `sources` held 21,431 lines, 13,190 of them distinct.
- 5,228 lines changed in 3,637 records by rule: 4,296 lines were deleted and 932 kept their citation and lost a note. 12 more records were edited by hand (below). 3,643 record files changed in all. In every one of them only `sources` differs; `review` was not touched (all are drafts).
- Before any file was written, every record was read and written back in the repository's format (`json.dumps(record, ensure_ascii=False, indent=2) + '\n'`): all 7,391 came back byte for byte. The files were then edited by line, and each result was compared with the record written afresh.
- The sentences now stand once, in the section **How to read the sources** of `src/how-we-decide.html` (anchor `how-we-decide.html#sources`). Every entry that shows sources has one link to it under them (`<p class="how-sources">`); 7,303 entries have it and 88 do not (64 whose only source line names the readers, which the site does not show, and the 24 below with no source).
- The builder refuses a record that carries one of the sentences and says what the line should be (`without_standing_notes` in `scripts/build.py`). `python3 scripts/standing_notes.py --write` does the same edit to every record; run on the data as it stood before, it reproduces this commit's records exactly, the 12 hand edits apart.

## The sentences, with counts

A count is of sentences; one line could hold several. "Variants" are wordings that differ by more than the names of the collections or the date.

| Sentence (commonest wording) | Sentences | Records | Variants | Now |
| --- | ---: | ---: | ---: | --- |
| Quotations marked “Lewis & Short” are given as Lewis & Short cites them, in the house spelling; they have not been checked against a modern edition. | 1,420 | 1,397 | 9, and "… are copied from its citations"; 11 times joined to the loci sentence | deleted; section, "“Lewis & Short” after a quotation" |
| Quotations from the Latinitas loci collections (loci-…), checked against the editions named there. | 1,178 | 1,154 | 23 (with or without the list; "as checked there against the editions they name"; "and the note on quantity words / suppletive verbs"; "and the Precēs"; "Latīnitās") | deleted; "Quotations with an author’s reference" |
| The example sentence(s) marked “composed” is/are ours. | 1,028 | 1,008 | 2 | deleted; "“Composed”" |
| *Authors or passages* checked against the Perseus Latin texts / the Latin Library texts (CLTK mirror) (9, 11 or 12 November 2026). | 871 | about 850 | 715 (the names differ) | 335 that name authors only ("Cicero’s letters checked against …") deleted; 536 that name a work or a place keep it (`Cicero, <em>De officiis</em> 1.124.`); "Quotations with an author’s reference", "Editions and numbering" |
| Morgan–Owens, *Adumbratio*, geographical section, with the authorities it cites (cited as M-O s.v.). | 144 | 144 | 1 | `Morgan–Owens, <em>Adumbratio</em>, geographical section.`; "The reference works" |
| *Authors or passages* from (as in) the Latinitas loci collection (loci-…)[, checked against the edition named there]. | 139 | 139 | 99 | 120 that name authors only deleted; 19 keep their citation; "Quotations with an author’s reference" |
| J. G. Th. Graesse, *Orbis Latinus* (Dresden, 1861), German–Latin index, read in the scan at archive.org (the 1909 edition at columbia.edu could not be reached page by page); its forms are post-classical unless Lewis & Short has them. | 79 | 79 | 2 (14 end "; cited only where it differs from the 1909 edition") | `J. G. Th. Graesse, <em>Orbis Latinus</em> (Dresden, 1861).`; "Graesse’s *Orbis Latinus*" |
| J. G. Th. Graesse, *Orbis Latinus*, edition of F. Benedict (1909), Latin–German, read in the digitization at columbia.edu (cited as Graesse, *Orbis Latinus* s.v.); its forms are post-classical unless Lewis & Short has them. | 76 | 76 | 1 | `J. G. Th. Graesse, <em>Orbis Latinus</em>, ed. F. Benedict (1909).`; the same |
| Descriptions and prompts labelled as ours are composed for family conversation. | 67 | 67 | 1 | deleted; "“Composed”" |
| Recorded vocabulary does not imply universal technical standardization. | 67 | 67 | 1 | deleted; "Links to a dictionary" |
| Quintilian checked against the Perseus Latin texts, and cited by its numbering. | 58 | 58 | 2 | deleted; "Editions and numbering" |
| Quotations of classical authors checked against the Perseus Latin texts (11 November 2026) and given in the house spelling (macrons, consonantal j). / Classical quotations checked against the Perseus and Latin Library texts. | 33 | 33 | 2 | deleted; "Quotations with an author’s reference" |
| Plautus, Terence and Cicero’s letters checked against the Perseus Latin texts (Plautus ed. Leo, with its line numbers; Terence ed. Parry, whose line numbers can run one off the OCT’s; lines taken from the loci collections are cited by the OCT’s; Cicero’s letters ed. Purser). | 31 | 31 | 1 | deleted; "Editions and numbering" |
| Quotations of Plautus (Leo, 1896; cited by his lines), Terence (Parry, 1857; …), … that are not in the loci collections were checked against the Perseus Latin texts (9 November 2026). | 30 | 30 | 24 (the editions named: Leo, Parry, Purser, Wilkins, Pohlenz, Miller, Plasberg, Clark, Rice Holmes, Greenough, Fairclough) | deleted; "Editions and numbering" names each |
| Examples are composed for conversation with Theo (the child); dictionary links document the component words, not these exact sentences or standardized modern climbing terminology. | 30 | 30 | 3 | deleted; "“Composed”", "Links to a dictionary" |
| Lines marked as in the Latinitas loci collections (loci-plautus, … and others) are quoted from them. | 28 | 28 | 1 | deleted; "Quotations with an author’s reference" |
| Publilius is cited as the loci collection numbers him, by position under each initial letter in the Latin Library text; from N onwards that numbering differs from Meyer’s. (3 add: “Ps.-Publil.” marks lines from the later collections printed with him.) | 28 | 25 | 3 | deleted; "Publilius Syrus" |
| Dictionary links support the component words; the modern technical expressions are labelled separately. | 25 | 25 | 1 | deleted (the links before it stay); "Links to a dictionary" |
| Vulgate verses checked against the Clementine Vulgate (CrossWire *VulgClementine*, via the scrollmapper *bible_databases* repository) and Hetzenauer’s edition, in Clementine spelling. And three shorter sentences on the same text. | 43 | 43 | 5 | deleted; "The Vulgate" |
| The Latin Library texts (thelatinlibrary.com), read in a local copy, for ancient passages not quoted in Lewis & Short; cited by book and section. | 14 | 14 | 1 | deleted; "Editions and numbering", last sentence |
| Prayers from the Latinitas *Precēs* collection (preces.md), checked against the sources named there. | 10 | 10 | 1 | deleted; "Quotations with an author’s reference" |
| Pliny, *Naturalis Historia*, ed. Mayhoff (Teubner, 1906), read in the Perseus Digital Library. | 8 | 8 | 1 | `Pliny, <em>Naturalis Historia</em>, ed. Mayhoff (Teubner, 1906).`; "Editions and numbering" |
| Quotations not in Lewis & Short or the loci collections were checked against the Perseus Digital Library’s Latin texts (canonical-latinLit). | 5 | 5 | 1 | deleted; "Quotations with an author’s reference" |
| The Vulgate, read in the Latin Library text (thelatinlibrary.com), cited by book, chapter and verse. | 2 | 2 | 1 | `The Vulgate.`; "The Vulgate" |

The to-do list gave about 1,360 records for the first and about 990 for the third; with their variants they were 1,397 and 1,008.

## What a reader was told before and is told less exactly now

- **Which text each quotation was checked against.** A record said "Cicero’s letters checked against the Perseus Latin texts" or "Quotations from the Latinitas loci collections (loci-cicero-epistulae)". The section says that an unmarked quotation was checked against one of these: our collections, the Perseus texts, the Latin Library texts. Which of the three it was for a given quotation is no longer on the page. It is in the history of each record (`git log -p data/concepts/<id>.json`).
- **The day of each check.** Records gave 9 November 2026 (518 times), 11 November (205) and 12 November (27). The section gives the three days together.
- **The names of the loci files** (loci-plautus and the rest). The section speaks of "our own collections of quotations by author (the Latinitas loci collections)".

Nothing else was dropped: each deleted sentence has a sentence in the section, and a test (`test_the_standing_notes_under_sources_are_said_once`) checks for the words of each.

## Twelve records edited by hand

These lines joined a standing sentence to a remark true of their own record. The remark was kept as a sentence of its own; the wording of the new line is Claude's.

| Record | The line was | It is now |
| --- | --- | --- |
| `any-news` | Loci collections (loci-franmorarius, loci-erasmus), checked against the transcriptions named there; these authors are not classical. | Franmōrārius and Erasmus are not classical authors. |
| `be-located` | …, pp. 120, 341. Quotations marked “Lewis & Short” are copied from its citations (s.v. *sinō*). | …, pp. 120, 341. The quotations marked “Lewis & Short” are from its article *sinō*. |
| `emotion` | Quotations from the Latinitas loci collections (…), checked against the editions named there; Quintilian keeps his edition’s spelling *adfectūs*. | Quintilian keeps his edition’s spelling *adfectūs*. |
| `fan` | The example sentence marked “composed” is ours, after Terence. | The composed example is after Terence. |
| `feel-well-or-ill` | Quotations from the Latinitas loci collections (loci-seneca-epistulae, loci-cicero-epistulae (Pīlia spelt as there)), as checked there against the editions they name. | *Pīlia* is spelt as in the loci collection of Cicero’s letters. |
| `good` | Quotations from … (loci-cato, loci-cicero-epistulae, loci-corderius), checked against the editions named there; Corderius is a modern schoolbook. | Corderius is a modern schoolbook. |
| `human` | Quotations from … checked against the editions named there; Terence (Heaut. 77) checked against the Perseus Latin texts, where Parry prints *nihil* (the Oxford text *nīl*). | Terence (Heaut. 77) checked against the Perseus Latin texts, where Parry prints *nihil* (the Oxford text *nīl*). |
| `impossible` | Quotations from … (loci-cato, loci-pontanus; the Pontanus line is from a single transcription), checked against the editions named there. | The Pontanus line is from a single transcription. |
| `martyr` | The *Tē Deum* from the Latinitas *Precēs*, checked against the editions named there. | deleted (the section says it of the prayers) |
| `rent-hire` | Quotations from … (loci-cicero-philosophica, loci-corderius), checked against the editions named there; the Corderius against a single transcription. | The Corderius line was checked against a single transcription. |
| `responsible-to-blame` | Quotations from … (loci-publilius; the Latin Library numbering, S 45), checked against the editions named there. | deleted (the section gives the numbering of Publilius) |
| `square-tool` | The example sentence marked “composed” is ours, after Pliny, NH 7.198. | The composed example is after Pliny, NH 7.198. |

## Records left without a source line: 24

Their only lines were standing notes. The builder required at least one source; it now accepts an empty list (`"sources": []`), and the page then has no "Sources" and no link, only the review state. No line was invented for them.

- Seventeen are words or descriptions of ours, with nothing to cite: `dump-truck`, `hop`, `i-did-it`, `lemon-juice`, `loader`, `marbles`, `my-turn`, `play-together`, `playhouse`, `pump`, `ride-on-car`, `roll-ball`, `scoop-up`, `spring-rider`, `stuffed-animal`, `toy-car`, `toy-kitchen`. Most are among the coinage-only records being gone through.
- Five give a classical word and want its Lewis & Short line: `bottom-part` (*īmus*), `moat` (*fossa*), `slower` (*lentius*), `together` (*ūnā*), `uncover` (*aperiō*).
- Two cite Traupman beside the word and have no Traupman line under Sources: `top-part` (Traupman 396; also wants Lewis & Short for *summus*) and `turn-rotate` (Traupman 219, 399; also *vertō*, *circumagō*).

## Left in the records on purpose

| What | Lines | Why |
| --- | ---: | --- |
| The lines that name the readers (*Theodōrus et pater* …, "Examples marked “Libellus” quote those texts word for word") | 535 | The site does not show them (`READER_SOURCE`), and `AGENTS.md` says they stay in the data. |
| Links to our own notes in the repository ("Smoothie vocabulary: source audit and coverage" and two more) | 165 | A citation, of a kind. Whether a public entry should cite a working note is a separate question for the editor. |
| A passage "as Lewis & Short quotes it", by author ("Cicero as Lewis & Short quotes him.", "Passages as Lewis & Short quotes them.", "Plautus as cited by L&S.") | 130 | It is true of its own record, and in some records it is the only place that says so: the quotation itself carries no "(Lewis & Short)" (`mop`, `detergent`). Recommended: a pass that puts the mark on each such quotation and then deletes the line. |
| "Checked against" a text, with a remark of the record's own (an edition's spelling kept, a misprint, a different numbering, two texts compared, a text other than Perseus or the Latin Library) | 90 | The remark is not a standing note, and most cannot be cut from the sentence without rewording. Examples: `conloquium` kept in Caesar; "the Perseus text misprints *quani*"; Egeria in one transcription only; Varro in the Loeb text. Recommended: move each remark to a note on the example. |
| The loci collections, with a remark of the record's own ("Vives from the Latinitas loci collection, checked against a single transcription", "the Virgil lines are also in the loci collection") | 24 | The same. |
| Remarks on the record itself ("No source has a word for a podcast.", "Traupman, Morgan–Owens and Levi–Bini have no word for a playpen (searched under …)", "No ancient name for this game is known; the calls are our own", "These are names and conversational prompts, not instructions for fitting a harness, tying a knot or operating a belay.") | 78 | Each says something of one record. They are not citations and belong in the term's comment; moving them is a pass of its own. |
| "The grouped card gave no source for this word." (18), "The phrase is composed; the grouped card gave no source." (17), "Passages as cited on the grouped card." (10), and three more | 48 | Each says that its record has no source, which is true of that record. "Grouped card" means nothing to a reader: recommended, find the source or reword. |
| "…, as cited." after the Vatican lexicon (28) and Braun and Hogenberg (1) | 29 | Two words on a citation; harmless. |

## The patterns

`scripts/build.py`: `STANDING_NOTES` (whole sentences), `CITED_WITH_A_NOTE` (a citation with a note on how it was read), `READ_IN` ("… checked against the Perseus Latin texts", "… from the Latinitas loci collection"), `STANDING_PHRASE` (the three commonest sentences in any wording). A sentence is split off at a full stop that does not follow an abbreviation (`ABBREVIATIONS`: Cic., Att., s.v., p.); parts joined by a semicolon are taken out only when every part is a standing note. A line of links that was followed by such a sentence loses the full stop that divided them.

## Also changed

`docs/drafting.md` and `docs/converting.md` told drafters to add "The example sentences marked “composed” are ours." to a record with composed examples. They now say not to. A branch drafted from the older text will carry the sentence and be refused by the builder after merging: `python3 scripts/standing_notes.py --write` takes it out.
