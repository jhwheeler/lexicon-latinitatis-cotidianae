# Converting grouped cards into concept records

The grouped cards in `data/entries/` are being converted into concept records (`data/concepts/`, see `records.md`), one batch of cards at a time. A batch is a spec file, `notes/conversions/<batch>.json`, which `scripts/convert_cards.py` checks and applies. The checks are mechanical: they prove that nothing Latin was invented, altered or lost. The judgement (how to split a card, which form leads, what period a word belongs to) is yours, and the reviewer reads it record by record. Records go in as drafts; Jack reviews them on the site (decided 9 November 2026).

Read first: `AGENTS.md`, `records.md` (the record format and the note shape), and these records as models: `data/concepts/socks.json`, `take-off.json`, `pyjamas.json`, `heel.json`, `underpants.json`, `cooking-pot.json`, `perhaps.json`, `slippers.json`.

## The loop

1. Read your cards in `data/entries/<category>.json`, whole, with their sources.
2. Write the spec (format below) in `notes/conversions/<batch>.json`.
3. `python3 scripts/convert_cards.py notes/conversions/<batch>.json` and fix what it reports. Repeat until it passes.
4. `python3 scripts/convert_cards.py notes/conversions/<batch>.json --write`, then `python3 scripts/build.py`, `python3 scripts/consonantal_j.py --check` and `python3 -m unittest discover -s tests`. If your records cite the readers, also `python3 scripts/check_libelli.py --latinitas /home/claude/latinitas`.
5. Commit `data/` and the spec only (`git add data notes/conversions/<batch>.json`), not the generated pages; the reviewer rebuilds them when merging.

## The spec

```json
{
  "batch": "culina-1",
  "cards": ["entry-12", "entry-13"],
  "records": [ … records as in records.md; leave out "review" (the tool marks them drafts) … ],
  "extend": [ {"id": "towel", "terms": […], "phrases": […], "also": […], "related": […], "sources": […], "replaces": ["entry-13"]} ],
  "added": {"a Latin word or example not in the cards": "why"},
  "dropped": {"Latin or a link from the cards that no record carries": "why"},
  "flags": ["what the reviewer should look at"]
}
```

## Splitting a card

- **One record per English sense.** "Socks / stockings" is two records; "Get dressed / get undressed" is several (clothes, put on, take off, get dressed…). Latin synonyms for one sense are terms of one record, not separate records.
- **Before creating a record, look for an existing one** with the same English headword: `grep -l '"english": "towel"' data/concepts/*.json`. If there is one, extend it (`"extend"`), adding your forms as alternatives. If your card recommends a different form, keep the existing recommendation and say so in a flag.
- **ID**: the English headword as a slug (`cooking-pot`). Two senses of one headword get a `sense` each and IDs that say which (`glass-drinking`, `glass-material`); the build refuses two records with the same headword and sense.
- **Every Latin form, example, citation and comment of the card goes somewhere.** An example goes to the record whose word it illustrates; one that illustrates several goes to the main one, not to all. Prose about a form goes in that term's `comment`; an etymological aside goes in the comment of the word it is about.
- **The card's ID**, and its anchor if it has one, go in `replaces` on its main record, exactly once. Old links then still land there.

## Fields

- `english`: lower case unless a name; `pos` always (`noun`, `verb`, … or a list, as in `records.md`); `also`: the English synonyms and search words of the card that belong to this sense, in English only.
- `domain`: the card's category. If a concept plainly belongs elsewhere, keep the card's category and flag it.
- `terms`:
  - `latin` exactly as the card prints it, with its genitive and gender or principal parts as given. Don't complete a form the card gives in part; if a form must be normalized, list it in `"added"` with the reason.
  - `status`: the form the card leads with or prefers is `recommended`, others `alternative`; `avoid` only where the card says not to use a form, with the reason in `comment`.
  - `period`, for the word in this sense: `classical` (Plautus to the early second century: Cicero, Caesar, Livy, Vergil, Ovid, Seneca, Pliny, Martial, Juvenal, Suetonius), `post-classical` (Gellius, Apuleius, the Digest and other non-Christian Latin to about 500), `late` (the Vulgate, the Fathers, Isidore), `medieval`, `renaissance` (Vives, Erasmus, Comenius), `modern` (Traupman, Morgan–Owens, the Vatican lexicon, Helfer, other modern coinages, and an old word in a modern sense: Traupman's `fulmentum` for a shoe's heel), `ours` (what the card calls our formation, working formation or description). Use the card's tags and citations; where the card is silent, Lewis & Short's citations decide. If you can't tell, choose the later period and flag it.
  - `gloss`: the English of this form when it is narrower or different from the headword; leave it out when it is the headword.
  - `evidence`: the card's citations for this form (`Traupman 124`, `M-O s.v. sieve`, `Plin. NH 19.32`), in rich text.
  - `comment`: the card's prose about the form, kept as written; turn a "see the X entry" into `related` where you can.
  - `register`: the card's register label, if any (`vōx cōmica: Plaut., Ter.`).
  - `notes`: only where the card explains a departure from Lewis & Short or a source (a vowel length, a spelling), in the shape of `records.md`: `form`, `claim`, `against`, `html` with the evidence, and `ruling` if one in `data/rulings.json` applies. Don't invent departures.
- `phrases`: `latin` word for word from the card; `english` as the card gives it; `source`: `composed` for the card's own sentences, or the citation as the card gives it: `Libellus III, <span lang="la">Apud avum et aviam</span>`, `Comen. OP 54`, `Plin. NH 11.198`.
- `related`: other records (in your batch or existing), or cards not yet converted (`entry-301`) that the card refers to.
- `sources`: give each record the card's source lines that support it: each Lewis & Short link to the record of its word, and the Traupman, Morgan–Owens, Bennett and libellī lines to the records that use them. Add “The example sentences marked “composed” are ours.” to a record with composed examples. Every link in the card must reach some record.

## What you must not do

- Change any Latin: spelling, macrons, j, word order, punctuation inside a quotation. If you believe the card is wrong, copy it as it is and add a flag with your evidence (the Lewis & Short entry, the passage); the reviewer decides.
- Add Latin: no new forms, no new examples. `"added"` is for an unavoidable normalization, with the reason.
- Drop Latin quietly. `"dropped"` is for a duplicate of what an existing record already has, a remnant of another language, or a remark that only made sense on the card; say which.
- Use other languages: the lexicon is English–Latin. Personal names belong only in example sentences, never in headwords, categories or `also`.
- Touch anything outside `data/` and your spec.

## Merging batches converted in parallel

Agents working at the same time make some records twice (*storeroom* in the building cards and in the kitchen ones). Whoever merges the batches re-applies each spec on the current main; before that, `python3 scripts/convert_cards.py <spec> --extend-existing` turns the spec's records that now exist (same ID, or same English headword and sense) into extensions of them. A term already in the record merges into it (its evidence and notes are added; the record's own status, period and comment stand, and the converter reports where they differed), and an example already there is not added twice. A record that came from another category is flagged “Also under …”, so it can be listed there too.

## Your report

Under 250 words: the batch; cards → new records and extended records; the new record IDs, comma-separated; your flags; anything you could not settle.
