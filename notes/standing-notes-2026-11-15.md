# The standing notes under Sources, said once (15 November 2026)

Jack, 15 November 2026: "The standing notes under sources, yeah, that is a bit annoying. We can just say it once, for sure." This follows his ruling of 13 November that a line under Sources is a citation as a book prints one. This file records what was taken out of the records, what answers it on the site, and what was left in the records on purpose. The choices of scope below are Claude's, for Jack to judge. Jack ruled on what was left on 16 November 2026: the last section says what was done then, and where it differs, the earlier sections describe the state of 15 November.

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
| *Authors or passages* checked against the Perseus Latin texts / the Latin Library texts (CLTK mirror) (9, 11, or 12 November 2026). | 871 | about 850 | 715 (the names differ) | 335 that name authors only ("Cicero’s letters checked against …") deleted; 536 that name a work or a place keep it (`Cicero, <em>De officiis</em> 1.124.`); "Quotations with an author’s reference", "Editions and numbering" |
| Morgan–Owens, *Adumbratio*, geographical section, with the authorities it cites (cited as M-O s.v.). | 144 | 144 | 1 | `Morgan–Owens, <em>Adumbratio</em>, geographical section.`; "The reference works" |
| *Authors or passages* from (as in) the Latinitas loci collection (loci-…)[, checked against the edition named there]. | 139 | 139 | 99 | 120 that name authors only deleted; 19 keep their citation; "Quotations with an author’s reference" |
| J. G. Th. Graesse, *Orbis Latinus* (Dresden, 1861), German–Latin index, read in the scan at archive.org (the 1909 edition at columbia.edu could not be reached page by page); its forms are post-classical unless Lewis & Short has them. | 79 | 79 | 2 (14 end "; cited only where it differs from the 1909 edition") | `J. G. Th. Graesse, <em>Orbis Latinus</em> (Dresden, 1861).`; "Graesse’s *Orbis Latinus*" |
| J. G. Th. Graesse, *Orbis Latinus*, edition of F. Benedict (1909), Latin–German, read in the digitization at columbia.edu (cited as Graesse, *Orbis Latinus* s.v.); its forms are post-classical unless Lewis & Short has them. | 76 | 76 | 1 | `J. G. Th. Graesse, <em>Orbis Latinus</em>, ed. F. Benedict (1909).`; the same |
| Descriptions and prompts labelled as ours are composed for family conversation. | 67 | 67 | 1 | deleted; "“Composed”" |
| Recorded vocabulary does not imply universal technical standardization. | 67 | 67 | 1 | deleted; "Links to a dictionary" |
| Quintilian checked against the Perseus Latin texts, and cited by its numbering. | 58 | 58 | 2 | deleted; "Editions and numbering" |
| Quotations of classical authors checked against the Perseus Latin texts (11 November 2026) and given in the house spelling (macrons, consonantal j). / Classical quotations checked against the Perseus and Latin Library texts. | 33 | 33 | 2 | deleted; "Quotations with an author’s reference" |
| Plautus, Terence, and Cicero’s letters checked against the Perseus Latin texts (Plautus ed. Leo, with its line numbers; Terence ed. Parry, whose line numbers can run one off the OCT’s; lines taken from the loci collections are cited by the OCT’s; Cicero’s letters ed. Purser). | 31 | 31 | 1 | deleted; "Editions and numbering" |
| Quotations of Plautus (Leo, 1896; cited by his lines), Terence (Parry, 1857; …), … that are not in the loci collections were checked against the Perseus Latin texts (9 November 2026). | 30 | 30 | 24 (the editions named: Leo, Parry, Purser, Wilkins, Pohlenz, Miller, Plasberg, Clark, Rice Holmes, Greenough, Fairclough) | deleted; "Editions and numbering" names each |
| Examples are composed for conversation with Theo (the child); dictionary links document the component words, not these exact sentences or standardized modern climbing terminology. | 30 | 30 | 3 | deleted; "“Composed”", "Links to a dictionary" |
| Lines marked as in the Latinitas loci collections (loci-plautus, …, and others) are quoted from them. | 28 | 28 | 1 | deleted; "Quotations with an author’s reference" |
| Publilius is cited as the loci collection numbers him, by position under each initial letter in the Latin Library text; from N onwards that numbering differs from Meyer’s. (3 add: “Ps.-Publil.” marks lines from the later collections printed with him.) | 28 | 25 | 3 | deleted; "Publilius Syrus" |
| Dictionary links support the component words; the modern technical expressions are labelled separately. | 25 | 25 | 1 | deleted (the links before it stay); "Links to a dictionary" |
| Vulgate verses checked against the Clementine Vulgate (CrossWire *VulgClementine*, via the scrollmapper *bible_databases* repository) and Hetzenauer’s edition, in Clementine spelling. And three shorter sentences on the same text. | 43 | 43 | 5 | deleted; "The Vulgate" |
| The Latin Library texts (thelatinlibrary.com), read in a local copy, for ancient passages not quoted in Lewis & Short; cited by book and section. | 14 | 14 | 1 | deleted; "Editions and numbering", last sentence |
| Prayers from the Latinitas *Precēs* collection (preces.md), checked against the sources named there. | 10 | 10 | 1 | deleted; "Quotations with an author’s reference" |
| Pliny, *Naturalis Historia*, ed. Mayhoff (Teubner, 1906), read in the Perseus Digital Library. | 8 | 8 | 1 | `Pliny, <em>Naturalis Historia</em>, ed. Mayhoff (Teubner, 1906).`; "Editions and numbering" |
| Quotations not in Lewis & Short or the loci collections were checked against the Perseus Digital Library’s Latin texts (canonical-latinLit). | 5 | 5 | 1 | deleted; "Quotations with an author’s reference" |
| The Vulgate, read in the Latin Library text (thelatinlibrary.com), cited by book, chapter, and verse. | 2 | 2 | 1 | `The Vulgate.`; "The Vulgate" |

The to-do list gave about 1,360 records for the first and about 990 for the third; with their variants they were 1,397 and 1,008.

## What a reader was told before and is told less exactly now

- **Which text each quotation was checked against.** A record said "Cicero’s letters checked against the Perseus Latin texts" or "Quotations from the Latinitas loci collections (loci-cicero-epistulae)". The section says that an unmarked quotation was checked against one of these: our collections, the Perseus texts, the Latin Library texts. Which of the three it was for a given quotation is no longer on the page. It is in the history of each record (`git log -p data/concepts/<id>.json`).
- **The day of each check.** Records gave 9 November 2026 (518 times), 11 November (205), and 12 November (27). The section gives the three days together.
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
| Remarks on the record itself ("No source has a word for a podcast.", "Traupman, Morgan–Owens, and Levi–Bini have no word for a playpen (searched under …)", "No ancient name for this game is known; the calls are our own", "These are names and conversational prompts, not instructions for fitting a harness, tying a knot, or operating a belay.") | 78 | Each says something of one record. They are not citations and belong in the term's comment; moving them is a pass of its own. |
| "The grouped card gave no source for this word." (18), "The phrase is composed; the grouped card gave no source." (17), "Passages as cited on the grouped card." (10), and three more | 48 | Each says that its record has no source, which is true of that record. "Grouped card" means nothing to a reader: recommended, find the source or reword. |
| "…, as cited." after the Vatican lexicon (28) and Braun and Hogenberg (1) | 29 | Two words on a citation; harmless. |

## The patterns

`scripts/build.py`: `STANDING_NOTES` (whole sentences), `CITED_WITH_A_NOTE` (a citation with a note on how it was read), `READ_IN` ("… checked against the Perseus Latin texts", "… from the Latinitas loci collection"), `STANDING_PHRASE` (the three commonest sentences in any wording). A sentence is split off at a full stop that does not follow an abbreviation (`ABBREVIATIONS`: Cic., Att., s.v., p.); parts joined by a semicolon are taken out only when every part is a standing note. A line of links that was followed by such a sentence loses the full stop that divided them.

## Also changed

`docs/drafting.md` and `docs/converting.md` told drafters to add "The example sentences marked “composed” are ours." to a record with composed examples. They now say not to. A branch drafted from the older text will carry the sentence and be refused by the builder after merging: `python3 scripts/standing_notes.py --write` takes it out.

## 16 November 2026: the editor's rulings

Jack answered the four questions this file left "for the editor" (16 November 2026). What follows is what was done for each, with counts and the lists he will want. The method and the choices of scope are Claude's, for him to judge. 304 record files changed; in each only lines of `sources`, of a term's `evidence`, or of an example's `source` differ. `review` was not touched: none of the 304 was a reviewed record. As on 15 November, every one of the 7,464 records was first read and written back in the repository's format and came back byte for byte; each changed record was then written afresh from its changed data, and a comparison of the two texts line by line found no changed line of any other kind.

### 1. The entries with no source ("add the seven lines")

Of the 24 records of 15 November, 11 had been given sources by other work since (`hop`, `lemon-juice`, `loader`, `my-turn`, `play-together`, `playhouse`, `pump`, `roll-ball`, `scoop-up`, `spring-rider`, `stuffed-animal`). Thirteen were still empty. Seven lines were added, each after the article or the page was read on 16 November 2026:

| Record | Word | Line added | What was read |
| --- | --- | --- | --- |
| `bottom-part` | *īmus* | Lewis & Short: imus · Lewis & Short: inferus | *imus* is a headword that sends to *inferus*, where the superlative is treated ("Form imus, a, um, the lowest, deepest, last") |
| `moat` | *fossa* | Lewis & Short: fossa | "a ditch, trench, fosse" |
| `slower` | *lentius* | Lewis & Short: lentus | the adverb is at the end of *lentus*: "lentē, slowly … Comp.: … lentius subsequitur, Caes. B. C. 2, 40" |
| `together` | *ūnā* | Lewis & Short: una · Lewis & Short: unus | *una* is a headword that sends to the end of *unus*: "in one and the same place, at the same time, in company, together" |
| `uncover` | *aperiō* | Lewis & Short: aperio | "to uncover, make or lay bare" |
| `top-part` | *summus* | Traupman, p. 396 | "top adj summus -a -um" |
| `turn-rotate` | *vertō* | Traupman, pp. 219, 399 | p. 219 "turn intr vertor"; p. 399 "turn tr (con)vertō" |

The links are in the form of the other records (`https://logeion.uchicago.edu/<headword>`, "Lewis &amp; Short: <headword>"). Where the record's word is a headword that only sends to another article, both are linked; that is Claude's choice (`total-complete` does the same for *summus* and *superus*).

Not done, because the ruling was for seven lines: `top-part` and `turn-rotate` still have no Lewis & Short line for *summus*, *vertō*, and *circumagō*. Recommended: add them.

**Records without a source line now: 8.** All are words or descriptions of ours (`period` "ours"), with nothing to cite: `dump-truck`, `i-did-it`, `marbles`, `ride-on-car`, `toy-car`, `toy-kitchen` (of the 24), and `core`, `pepper-relish`, whose only line was a link to a working note (number 4).

### 2. "How to read the sources" ("cut it to the essentials")

The section of `src/how-we-decide.html` had nine points and 752 words. It has four points and 137 words: what "Lewis & Short" after a quotation means; what "composed" means; how the reference works are cited; where the other quotations were checked. The anchor (`#sources`), the heading, and the link from every entry are unchanged. The fuller account (which texts and editions the quotations were checked against, the days, the Vulgate, Publilius, Morgan–Owens's saved copy and geographical section, Graesse's two digitisations, what a link to a dictionary supports) is in `docs/records.md`, "How the sources were read", under "Sources are citations". Nothing of the old section was dropped: `test_the_standing_notes_under_sources_are_said_once` now holds the section to four points and under 150 words, and looks for the words of the fuller account in the document.

The last point keeps one sentence of the old section, "Where it was not, the entry says so" (of a quotation not checked against a text), because lines of that kind remain in the records (see "Left in the records on purpose" above).

### 3. "… as Lewis & Short quotes him" ("do the pass: mark the quotation, delete the line")

The family was found by its wording, not by the author: "… as Lewis & Short quotes him / them / it", "… quoted as Lewis & Short quotes them", "… as cited by L&S", "… as quoted in L&S", "the other passages as Lewis & Short quotes them", "the other citations from Lewis & Short", "Lewis & Short’s citations are marked". It had 134 lines in 134 records (15 November counted 130).

What was done to them:

| | Lines |
| --- | ---: |
| deleted | 116 |
| shortened to what else the line said (below) | 14 |
| kept for the editor (below) | 4 |

and to the quotations: **66 marks added** in 40 records (53 on a quotation, 13 on a bare reference of the same line's authors) and **11 marks reworded** in 10 records into the lexicon's form ("Cic. Phil. 2.15, as cited in L&S" is now `Cic. Phil. 2.15 (Lewis &amp; Short)`). 48 records had a mark added or reworded (47 of the 130 whose line went or was shortened, and `twelfth`); in the other 83, every quotation the line spoke of carried its mark already, was found in a text, or was not in the record (below). The form is that of the other records: ` (Lewis &amp; Short)` at the end of the example's `source` or of the line of `evidence`; where the line named an article that is not the record's own word, the mark names it (`(Lewis &amp; Short s.v. <span lang="la">reclīnō</span>)`: `moose`, `picture`, `telling-the-time`).

**How a quotation was matched.** The line names authors ("Cicero and Caesar as …"), or says "the other passages" after naming those that come from the loci collections. Every quotation of those authors among the record's examples and evidence was looked at, and the mark was added only where the words were found in Lewis & Short that night:

- a quotation of three words or more: its words in a row in an article of the dictionary (the Perseus text in `refs/`, macrons, j, and v folded; a bracketed gloss of the dictionary's inside the quotation is skipped, as in *ad eas (arbores) se applicant*);
- a quotation of one or two words (*in scrībendō*, *homō*): only in the article of one of the record's own words, with the reference's numbers directly after it;
- a bare reference (`Cic. Clu. 72`): the work and the numbers in the article of one of the record's own words ("Clu. 26, 72"), or the same reference as a quotation of the record that is marked.

A quotation was left **unmarked**, and did not hold the line back, where it was found word for word in a text of its author, since the mark says that a quotation was not checked against one: in the loci tables (49 quotations), or in the texts kept on this machine (16: Perseus's Plautus, Terence, Horace, and Pliny; LASLA's Plautus and Horace). A line of Plautus cited by the line of the play, not by Lewis & Short's act and scene, counts as read in a text when it is found there, even if the dictionary quotes it too (`docs/drafting.md`): `invent` (Asin. 102), `mop` (Men. 77–78), `stupid` (Pers. 169, Bacch. 1088). The others found in a text and not in the dictionary: `greet` (Cas. 1, Most. 568), `knock` (Bacch. 581), `lover` (Cas. 590, Truc. 658), `cheer-up-verb` (Ter. Ad. 839, also in the loci), `revise` (Hor. A. P. 441, which carries Morgan–Owens's mark), `telling-the-time` (Plin. NH 6.214). So `mop`, which this file named on 15 November as wanting the mark, has none: its line is in the Perseus text of the *Menaechmi*.

**Decided by reading, not by rule** (each read in the article that night):

- `age`: the whole line was the sentence on the loci collections in another wording, with "Lewis & Short’s citations are marked"; they are. Deleted.
- `too-excessively`: "Ter. And. 61 as cited there and in Lewis & Short, s.v. nimis (And. 1.1.34)". The quotation is cited by the line of the play and stands in the Perseus text of the *Andria*; it stays unmarked. Deleted.
- `frown`: the line spoke of the bare reference `Cic. Clu. 72`; the article *frons* has "frontem contrahere, to contract or knit the brows, id. Clu. 26, 72". Marked.
- `hold-ones-breath`: `Cic. de Or. 1.261` is in the article *contineo* ("animam in dicendo, Cic. de Or. 1, 61, 261"), which the record does not link. Marked.
- `relevant`: `Cic. Fam. 13.13: sī quid hoc ad rem pertinet` is in *pertineo*, where the dictionary prints *siquid* as one word. Marked.
- `twelfth`: `Plin. NH 18.324: dēxtāns hōrae` is how *dextans* cites it ("horae, Plin. 18, 32, 75, § 324"). Marked.
- `picture`: "A. 1.464 as Lewis & Short quotes it (s.v. pāscō)" names no author; the example `Verg. A. 1.464` is in *pasco*. Marked, with the article.
- `firstly`, `tone-voice`, `urban`: the line itself excludes one quotation ("Cicero (Att. 3.7.1) as in the record secondly"; "Gellius 13.20", not 1.26.8; "Varro’s *Res rusticae* III", not II praef.). Those were not touched.
- `clean-the-house`: the line also said "(edition spelling ecferte kept)". It is now "The quotation of Plautus keeps the spelling *ecferte*." (Claude's wording); the dictionary prints *ecferte* (s.v. *munditia*).

**Shortened lines** (what the line said besides, as the builder's rule of 15 November leaves it):

- `clean-the-house`: The quotation of Plautus keeps the spelling *ecferte*.
- `exhaust-tire`: Terence (*And.* 669).
- `exhaust-use-up`: Cicero (*Sen.* 17) and Schottennius from the Latinitas loci collections (loci-cicero-philosophica, loci-schottenius); Schottennius is sixteenth-century school Latin.
- `firstly`: Quintilian and Seneca from the Latinitas loci collections (loci-quintilianus, loci-seneca-epistulae); Cicero (*Att.* 3.7.1) as in the record secondly.
- `greet`: Cato and Cicero (*Sen.* 63).
- `hesitate`: Cicero (*Sen.* 25, *Amic.* 44) and Livy.
- `mop`: Traupman, Morgan–Owens, and Levi–Bini have no word for a mop.
- `mount`: Comenius is post-classical (*stapēs*, stirrup, is a modern word).
- `picture`: Vergil, A. 8.730.
- `recover`: Corderius’s colloquies are post-classical school Latin; the line is checked against one transcription only.
- `romantic`: Seneca (*Ep.* 9.6).
- `servant`: Virgil and the *Moretum*.
- `tall`: Erasmus’s Latin is post-classical.
- `telling-the-time`: Pliny, *Natural History* 2.58, 6.213–218, 18.219, 18.324: 6.214 checked against LacusCurtius (a link).

**Lines kept: 4.** The builder's refusal passes these four by name (`LEFT_FOR_THE_EDITOR` in `scripts/build.py`); a test fails when one of them no longer carries its line, so that the name is taken out.

| Record | Line | Why it was kept | Recommended |
| --- | --- | --- | --- |
| `detergent` | Cicero from the Latinitas loci collection; Laberius and Martial as cited by L&S. | The record quotes neither Laberius nor Martial (its comment refers to Mart. 3.42.1 without quoting). The line came with the card it was split from. | Delete the line. |
| `fold` | the same | The record's one quotation is Cicero's (Att. 12.1.2), which is in the loci. No Laberius, no Martial. | Delete the line. |
| `rubbish` | Cato, Livy, and Petronius from the Latinitas loci collections; Plautus as cited by L&S (edition spelling ecferte kept). | The record quotes no Plautus; the line belongs to `clean-the-house`, split from the same card. | Delete the line. |
| `twelfth` | Horace and Gellius from the Latinitas loci collections; the other citations from Lewis & Short. | Eight marks were added, but two quotations could not be settled. `Plin. NH 18.219: dōdrāns hōrae`: the dictionary gives the reference without words ("As a measure of time, three quarters of an hour"), and Pliny's text (Perseus, Mayhoff) has *dodrantes horarum*. `Liv. 2.33.11: … sextantibus conlātīs in capita`: the dictionary prints *collatis* and cites "2, 33 fin."; the record's spelling and section are an edition's, and no text of Livy 2 was to hand. | Quote Pliny's words (*dōdrantēs hōrārum*), check the Livy against a text, then delete the line. |

**Lines that named an author the record does not quote** (the line went, since its other authors were matched; nothing was there to mark for these): `dialogue` (Varro), `iron` (Laberius), `laundry` (Martial), `mop` (Festus), `overseas` (Quintilian), `stomach` (Cicero).

**Bare references of the lines' authors left without a mark** (not found in the article of the record's own words; a bare reference without a mark claims nothing): `bright-colour` Plin. NH 35.97; `cheer-up-verb` Ter. Ad. 839; `entry-going-in` Cic. Off. 1.131 (gait); `fan` Ter. Eun. 595; `mop` Plaut. Men. 77–78; `stupid` Plaut. Bacch. 1088. In `twelfth`, `Col. 5.1.11` and `Liv. 23.19.16` end in a bracketed gloss and were left for the same pass as its line.

**Not in the family, and left:** "…, as Morgan–Owens quotes it" (`card-game`, `dealer`) says the same of Morgan–Owens; its mark is "(M-O s.v. …)". The same pass would suit it.

**Refused from now on.** `scripts/build.py` refuses a source line of the family (`AS_LEWIS_AND_SHORT_QUOTES`), and the message says where the mark belongs: at the end of the example's source or of the line of the term's evidence. `python3 scripts/standing_notes.py` lists such a line with the same advice and ends with an error; it does not rewrite it, since no script can know which quotation is meant. Tests: `test_a_line_that_belongs_on_the_quotation_is_refused` (`tests/test_build.py`), `test_a_line_only_a_person_can_put_right_is_listed_not_rewritten`, and `test_the_records_carry_none` (`tests/test_standing_notes.py`).

### 4. Links to our working notes ("a public entry should not cite a working note: remove them")

165 source lines linked to a file of this repository, in 165 records: 152 to `notes/smoothie-vocabulary-audit.md` ("Smoothie vocabulary: source audit and coverage") and 13 to `notes/food-vocabulary-bulgaria-and-fabulae.md` ("Food vocabulary: source notes"). None linked to the latinitas repository. One more line cited a file of that repository by name without a link, and was treated the same (Claude's reading of the ruling): `and`, "Caesar and Cicero (Att. 4.2.4) as quoted in the Latinitas house standards (AGENTS.md §4.1)". 166 lines in 166 records in all.

Both notes were read for what they were cited for. Each is a general account of one batch of entries (what was consulted, which entries cover which words), cited in the same words from every record of the batch; no record cited it for a fact of its own. 160 of the 165 records had other source lines for their words (a Lewis & Short link, a Traupman or Morgan–Owens line, or both), and their line was deleted. In five the link was the only source line:

| Record | Was the note the only statement of a published source? | Now |
| --- | --- | --- |
| `calcium` | Yes: the note names Morgan–Owens, section 445. Read: "445 calcium (symbol Ca) calcium, i* n." | Morgan–Owens, Adumbratio: s.v. calcium. |
| `flaxseed` | Yes: the note names Morgan–Owens's preliminary botanical vocabulary. Read: "linseed lini semen (PLIN. 20, 249 et passim …)" | Morgan–Owens, Adumbratio: s.v. linseed. |
| `refrigerate` | Yes: the note names Traupman p. 124 and Morgan–Owens, section 932, for the refrigerator, on which the record's two phrases are built. Read: Traupman 124 "refrigerator frīgidārium -ī n"; Morgan–Owens "932 refrigerator armarium frigidarium … | frigidarium, i n." | Traupman, p. 124; Morgan–Owens, Adumbratio: s.v. refrigerator. |
| `core` | No: a description of ours. | no source line |
| `pepper-relish` | No: a description of ours; its comment says what was searched. | no source line |

`and`: the Caesar is an example of the record with its reference (B.G. 7.88) and was checked that night against LASLA's text of the *Bellum Gallicum* (7.88.3, *hostes terga vertunt fugientibus equites occurrunt*); Cicero, Att. 4.2.4, is a reference in the term's comment, not a quotation. The line was deleted.

**Records whose line carried a fact that could not be turned into a citation:** none beyond `core` and `pepper-relish`, where there is nothing to cite. What the notes say of single words (that Morgan–Owens questions the quantities of *spinacia*, that *incīsōrium* is a medieval trencher, that the metric units come from a reproduced prescription appendix) is in those records' comments or in their own source lines already; the notes themselves stay in `notes/`.

**Refused from now on.** The builder refuses a source line that links to this repository or to the latinitas repository, or names a file of either (`notes/….md`, `docs/….md`, `AGENTS.md`): `OUR_WORKING_NOTES`. `scripts/standing_notes.py` lists such a line and fails. Test: `test_a_source_that_cites_a_working_note_is_refused`.

### Found on the way, not changed

- **172 records cite Traupman beside a word and have no Traupman line under Sources** (`top-part` and `turn-rotate` were two of 174). Eight of them lost a note link in number 4 (`cloth-wiping`, `flavour`, `heat`, `remove`, `smell`, `sponge`, `thick`, `toast-verb`); the note did not name their pages, so no line was made for them. Recommended: a pass that reads each page and adds the one Traupman line; the test is short: a term's evidence or an example's source that begins "Traupman" and a number, and no source line with Traupman's title.
- **Lines of the kinds left on 15 November are unchanged** ("checked against … " with a remark, the loci collections with a remark, remarks on the record, "the grouped card gave no source"). The 14 shortened lines above are of those kinds, or bare citations.
- The builder splits a sentence at "; " without regard to `&amp;` (`without_standing_notes`), so "Lewis &amp; Short" divides a sentence in two there. It did no harm in this pass, because a divided sentence is rewritten only when every part is a standing note; it is noted for whoever next touches the patterns.
