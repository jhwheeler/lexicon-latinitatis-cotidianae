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

## Choosing the Latin

The order is the site's own (How we decide):

1. **Classical first.** A classical word in its classical sense is recommended wherever one exists. Find it through the English–Latin works, then confirm it in Lewis & Short: the sense, the authors who use it, the quantities. Give one or two classical citations as `evidence` (`Cic. Off. 1.129`, `Plin. NH 19.32`), taken from Lewis & Short.
2. **Post-classical** only where it fills a real gap, and well attested; Christian Latin for church life.
3. **Modern** words for modern things: Traupman first, then Morgan–Owens, then Levi & Bini (check every Levi & Bini word in Lewis & Short: it gives no sources and marks quantities only in part), then the Vatican lexicon and the rest. A plain classical description beats a coinage where one will do.
4. **Ours** last, labelled as our formation, and only when nothing above serves.

Give the other forms the sources offer as `alternative` terms, with their period and evidence. Mark as `avoid` a modern form that means something else classically (a false friend), with the reason. Register labels follow latinitas `AGENTS.md` §6 (`vōx cōmica: Plaut., Ter.`).

## Spelling the Latin

- **Macrons are spelling.** Copy Lewis & Short's marks. Where it leaves a vowel unmarked that is hidden-long, follow Bennett; where de Vaan discusses the vowel, he decides. Vowels before *ns* and *nf* are long; before *gn* short unless the stem is long; before *nct* and *nx* long. If you cannot establish a vowel, leave it unmarked and flag it.
- **Consonantal i is j** (*jam, ejus, major*), with no macron on the vowel before intervocalic j.
- Nouns with genitive and gender (`subligāculum, subligāculī n.`), verbs with principal parts as Lewis & Short gives them (`cessō, cessāre, cessāvī, cessātum`).
- `python3 scripts/check_quantities.py` must pass: where you depart from Lewis & Short, write a note in the fixed shape (`form`, `claim`, `against`, `html`), or don't depart.

## Examples

- Prefer a quotation from the loci collections or from Lewis & Short's citations: quote it exactly, in the house orthography, with the citation as the source (`Cic. Off. 1.129`). Only in the sense it has in its source.
- A composed example (`"source": "composed"`) must be short and plain, everyday speech (a parent to a child, a host to a guest), and pass latinitas `AGENTS.md` §4: back-translate it word for word, and if the English is already natural English, ask what Cicero or Terence would say instead. No more than two composed examples per record; none is better than a doubtful one.
- No personal names except in examples.

## The record

As in `records.md`, written directly as `data/concepts/<id>.json`, with `"review": {"status": "draft", "date": "<today>", "by": "Claude"}`. One record per English sense; look for an existing record first (`grep -l '"english": "towel"' data/concepts/*.json`), and add to it rather than duplicating. `sources`: a Lewis & Short link for every Latin word you recommend or list (`<a href="https://logeion.uchicago.edu/subligaculum" rel="noopener noreferrer" target="_blank">Lewis &amp; Short: subligaculum</a>`), and a line for each other work you used, with pages. Add “The example sentences marked “composed” are ours.” when there are composed examples.

## Checks

`python3 scripts/build.py`, `python3 scripts/consonantal_j.py --check`, `python3 scripts/check_quantities.py`, `python3 -m unittest discover -s tests`. Commit only `data/`.

## Your report

Under 250 words: the words you were given; the records you wrote (IDs); the ones you could not settle and why; every choice you are unsure of, as a flag.
