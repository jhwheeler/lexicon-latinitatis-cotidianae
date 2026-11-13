# Drafting new records

Phase 2 fills the gaps in the core word lists (`notes/coverage/`) with new concept records. Unlike a conversion, which only moves Latin that was already checked, a new record makes new choices: which Latin to recommend, how its vowels are measured, where it is attested. So each record carries its evidence, and it goes in as a draft for Jack to review on the site.

Read first: `AGENTS.md`, `records.md`, `how-we-decide.html` (the editorial rules, as the site states them), and these records as models: `data/concepts/underpants.json`, `perhaps.json`, `heel.json`, `cooking-pot.json`. The house standards for Latin are in the latinitas repository's `AGENTS.md`, sections 2 (orthography), 4 (idiom) and 5 (lexical rules): read them before writing a record.

## The tools

- `python3 scripts/lookup.py en <english word>`: Morgan–Owens, Traupman and Lewis & Short glosses for an English word. Try synonyms: Morgan–Owens has *undershorts*, not *underpants*.
- `python3 scripts/lookup.py ls <latin headword>`: the Lewis & Short entry, with its quantities and citations.
- `python3 scripts/lookup.py it <italian word>`: Levi & Bini (1937), for classical periphrases of modern things.
- `python3 scripts/lookup.py devaan <word>`: de Vaan's etymological dictionary, where a vowel's length is in doubt.
- The loci collections, `/home/claude/latinitas/src/loci-*.md`: verified classical quotations by situation (`grep` them for a word).

Morgan–Owens marks long vowels with a circumflex (*camîsia* = *camīsia*). Traupman's text is decoded by the lookup tool; cite Traupman by the printed page (`Traupman 117`; the page headers are in the text), Morgan–Owens by headword (`M-O s.v. undershorts`), Levi & Bini by printed page (`Levi–Bini p. 23`).

## Starting from a Latin word

The sweep of the authors (README, "To do") starts from Latin: `notes/coverage/latin-frequency.md` lists, in rank order, the frequent classical lemmas no term is headed by. The lexicon is still English → Latin, so a missing Latin word goes in under its English meaning:

- Look the word up in Lewis & Short first and settle its main sense; then look for the record of that sense (`grep` the English headwords and their `also` words).
- If the record exists and the word belongs there, add it as a term: `recommended` only if it is the plain classical word for the sense, otherwise `alternative` with a gloss that tells it apart from the terms already there (*aspiciō* beside *spectō*, a single look; *tellūs* beside *terra*, with its register).
- If no record has the sense, write one, headed by the English word a person would look up (*casa* → hut, with *tugurium*). Where the lexicon has the word only inside a longer term (*necesse est*, *tribūnus plēbis*, *utrum … an*), add the bare word as a term of the same record, so that it gets a page.
- A word with several unrelated senses (*committō*: entrust, join battle, commit a wrong) gets the record of its commonest sense and a comment naming the others; the others can have records later.
- After a batch, make the report again (`python3 scripts/latin_coverage.py --out notes/coverage/latin-frequency.md`).

Lewis & Short's citations of Plautus and Terence count by act, scene and line (`Ter. Heaut. 4.3.41`); the records otherwise cite them by the line of the play. Where only Lewis & Short's number is to hand, give it with the mark "(Lewis & Short)" and prefer a citation from prose.

## Choosing the Latin

The order is the site's own (How we decide):

1. **Classical first.** A classical word in its classical sense is recommended wherever one exists. Find it through the English–Latin works, then confirm it in Lewis & Short: the sense, the authors who use it, the quantities. Give one or two classical citations as `evidence` (`Cic. Off. 1.129`, `Plin. NH 19.32`), taken from Lewis & Short.
2. **Post-classical** only where it fills a real gap, and well attested; Christian Latin for church life.
3. **Modern** words for modern things: Traupman first, then Morgan–Owens, then Levi & Bini (check every Levi & Bini word in Lewis & Short: it gives no sources and marks quantities only in part), then the Vatican lexicon and the rest. Andresian's *Vocabula Picta* (2014; in the latinitas repository's `refs/`, cite `Andresian p. 24` by the printed page) is a checklist and a second opinion: it names no source for a word, so check each in Lewis & Short, and it is in copyright, so cite single words and never copy its lists. A plain classical description beats a coinage where one will do.
4. **Ours** last, labelled as our formation, and only when nothing above serves.

Give the other forms the sources offer as `alternative` terms, with their period and evidence. Mark as `avoid` a modern form that means something else classically (a false friend), with the reason. Register labels follow latinitas `AGENTS.md` §6 (`vōx cōmica: Plaut., Ter.`).

### When a source's Latin is wrong for its English

A phrase book's Latin is checked in Lewis & Short like any other, and what the check finds is used, not thrown away. Where the Latin does not mean what the book says:

- the English expression gets the Latin that is right as its recommended term, with a classical citation, and the book's phrase beside it marked `avoid` with the reason in a sentence ("commit to memory": *memoriae mandāre*, Cicero's phrase, with Traupman's *memoriae committere* marked `avoid`);
- the book's Latin is entered under what it really means, in the record for that sense (*grātiam facere* under forgive, not under "do a favour");
- a usage for which we have found no classical instance but which is current in modern Latin stays, with a plain sentence saying so (we have found no classical instance of bare *Grātiās!* without *agere*, but it is used so in modern Latin).

Traupman is cited as `Traupman 103` (the printed page) in a term's evidence and an example's source. In the record's `sources` he has one line with every page, `John C. Traupman, <em>Conversational Latin for Oral Proficiency</em>, pp. 103, 211.`, and nothing about how the book was read (see "Sources are citations" in [records.md](records.md)).

### Saying that something is not attested

Say what the search found, not what the language lacks: "we have found no classical instance", "not found in Lewis & Short or the loci collections". Write "unattested", "does not occur" or "is not classical" only when a reliable authority says so in terms (Lewis & Short, de Vaan, Allen & Greenough), and name it: "the nominative does not occur (Lewis & Short)". Our not finding a phrase is a fact about our search.

## Spelling the Latin

- **Macrons are spelling.** Copy Lewis & Short's marks. Where it leaves a vowel unmarked that is hidden-long, follow Bennett; where de Vaan discusses the vowel, he decides. Vowels before *ns* and *nf* are long; before *gn* short unless the stem is long; before *nct* and *nx* long. If you cannot establish a vowel, leave it unmarked and flag it. Where Lewis & Short and de Vaan agree on a vowel, write what they write: depart from the two together only for a really good reason, such as newer scholarship or the metre of a quoted line, and say what it is in a note (Jack, 11 November 2026).
- **Consonantal i is j** (*jam, ejus, major*), with no macron on the vowel before intervocalic j.
- Nouns with genitive and gender (`subligāculum, subligāculī n.`), verbs with principal parts as Lewis & Short gives them (`cessō, cessāre, cessāvī, cessātum`).
- `python3 scripts/check_quantities.py` must pass: where you depart from Lewis & Short, write a note in the fixed shape (`form`, `claim`, `against`, `html`), or don't depart.

## Function words and interjections

The lexicon has them too (Jack, 9 November 2026): pronouns, pointing and question words, quantifiers, conjunctions, prepositions, auxiliaries, interjections. An English function word rarely answers to one Latin word: *of* is a case, *would* a mood, *the* nothing at all. So the terms of such a record are the Latin means of saying it, each with its condition of use in the grammar line and the comment (the case, the mood, its place in the clause); where the means is a construction, the term names it or gives the pattern (`secundum + acc.`), as `seem.json`, `however.json` and `due-to.json` do. The examples carry the weight: four to eight short ones, most of them real, one for each use the record names. Keep the comments short: this is a lexicon, not a grammar. An interjection record is headed by what a person would say in English (*phew!*), with who says the Latin word and in what feeling, from Lewis & Short, and a register label.

## Examples

- An example's Latin and English, and a term's `gloss` and `grammar`, are plain text: write `with tēlephōnō`, not `with <span lang="la">tēlephōnō</span>`. Markup belongs in `comment`, `register`, `evidence`, notes and sources.

- Prefer a quotation from the loci collections or from Lewis & Short's citations: quote it exactly, in the house orthography, with the citation as the source (`Cic. Off. 1.129`). Only in the sense it has in its source.
- A composed example (`"source": "composed"`) must be short and plain, everyday speech (a parent to a child, a host to a guest), and pass latinitas `AGENTS.md` §4: back-translate it word for word, and if the English is already natural English, ask what Cicero or Terence would say instead. No more than two composed examples per record; none is better than a doubtful one.
- No personal names except in examples. Names of characters and of the family's own places stay out too: Jack dropped the Totoro, Osoitsa and Antanhol records (9 November 2026). A section of whimsical words for children's stories may come later, as may the batches of specialised jargon; until then, leave such words out.

## The record

No names or dates in an entry's text (Jack, 11 November 2026): a comment or note says what the word is and why, not who decided it or when. "Our formation", "a house ruling" and the like are enough; the history is in the repository and in `data/rulings.json`, whose page shows each ruling's date but not its author.

As in `records.md`, written directly as `data/concepts/<id>.json`, with `"review": {"status": "draft", "date": "<today>", "by": "Claude"}`. One record per English sense; look for an existing record first (`grep -l '"english": "towel"' data/concepts/*.json`), and add to it rather than duplicating. `sources`: a Lewis & Short link for every Latin word you recommend or list (`<a href="https://logeion.uchicago.edu/subligaculum" rel="noopener noreferrer" target="_blank">Lewis &amp; Short: subligaculum</a>`), and a line for each other work you used, with pages. Add “The example sentences marked “composed” are ours.” when there are composed examples.

## Checks

`python3 scripts/build.py`, `python3 scripts/consonantal_j.py --check`, `python3 scripts/check_quantities.py`, `python3 -m unittest discover -s tests`. Commit only `data/`.

## Your report

Under 250 words: the words you were given; the records you wrote (IDs); the ones you could not settle and why; every choice you are unsure of, as a flag.
