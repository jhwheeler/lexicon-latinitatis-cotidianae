# Concept records, notes and rulings

The lexicon is moving from grouped topic cards (`data/entries/`, see `data-format.md`) to **one record per concept**: one sense of an English word, with every Latin form for it. The first 23 records (8 November 2026) are a pilot converted from four grouped entries; new words go in as records, and the grouped entries are converted batch by batch, each split checked by a person.

The builder renders each record three ways: as a card in its topic on `index.html` (so search and filters work as before), as a page of its own at `c/<id>.html`, and in the lists of `how-we-decide.html` wherever its notes cite a ruling. `sitemap.xml` lists every page.

## A record: `data/concepts/<id>.json`

```json
{
  "id": "perhaps",
  "english": "perhaps",
  "also": ["maybe", "perchance"],
  "domain": "theodorus",
  "terms": [
    {"latin": "fortasse", "status": "recommended", "period": "classical", "gloss": "maybe, perhaps",
     "evidence": ["Cic. Div. Caec. 40: <span lang=\"la\">fortasse dīcēs</span>"],
     "comment": "The everyday word of Cicero’s prose, with the indicative.", "notes": ["short-e"]},
    {"latin": "forsan", "status": "alternative", "period": "classical", "register": "vōx plērumque poētica: Verg., Hor."}
  ],
  "phrases": [{"latin": "Fortasse pluet; paenulam indue.", "english": "Maybe it’ll rain; put your coat on.", "source": "composed"}],
  "notes": {"short-e": {"html": "Why <span lang=\"la\">fortasse</span>, not …", "ruling": "fortasse"}},
  "related": ["entry-300"],
  "sources": ["<a href=\"https://logeion.org/fortasse\" rel=\"noopener noreferrer\" target=\"_blank\">Lewis &amp; Short: fortasse</a>"],
  "review": {"status": "draft", "date": "2026-11-08", "by": "Claude"},
  "replaces": ["entry-550"]
}
```

| Field | Required | Holds |
| --- | --- | --- |
| `id` | yes | a slug (`a-z`, digits, hyphens), the same as the file name; the page is `c/<id>.html`, the card `#c-<id>` |
| `english` | yes | the English headword, one sense |
| `sense` | no | a short disambiguation, shown after the headword (“the activity”) |
| `also` | no | other English words that should find this concept in search |
| `domain` | yes | a category ID from `data/catalog.json` |
| `wikidata` | no | the Wikidata item (`Q…`) for the sense |
| `audience` | no | `child` (default) or `adult` |
| `terms` | yes | the Latin forms; at least one `recommended` |
| `phrases` | no | examples: `latin`, `english`, and `source` (`composed`, or a citation in rich text) |
| `notes` | no | footnotes, by key: `html` (rich text) and optionally `ruling` (an ID in `data/rulings.json`) |
| `related` | no | other concept IDs, or grouped-entry IDs (`entry-291`) not yet converted |
| `sources` | yes | the lines of “Sources & evidence”, in rich text |
| `review` | yes | `status` (`draft` or `reviewed`), `date` (YYYY-MM-DD), `by` |
| `replaces` | no | IDs and anchors of grouped entries this record absorbs; they stay valid links |

A **term** has `latin` (lemma with genitive and gender, or principal parts), `status` (`recommended`, `alternative`, `avoid`), `period` (`classical`, `post-classical`, `late`, `medieval`, `renaissance`, `modern`, `ours`), and optionally `gloss` (English, if narrower than the headword), `register` (rich text, in the house’s Latin labels), `evidence` (a list of citations in rich text: “Traupman 50”, “M-O s.v. swimming”, “Plin. NH 7.78”, with a quotation where it helps), `comment` (rich text) and `notes` (footnote keys).

Rich text follows the rules of `data-format.md`: `<strong lang="la">`, `<span lang="la">`, `<em>`, external `<a>` links; macrons and j as everywhere else.

## Notes (footnotes)

Wherever a record departs from Lewis & Short or from one of its sources, a note says why, with the evidence: “Why *lutra*, not *lūtra*: …”. Terms and phrases cite notes by key; the builder numbers them in reading order and prints them under the entry. Every note must be cited, and every cited key must exist. A note that applies a ruling names it, and the note links to the ruling.

The notes answer the reader who asks why we differ from a dictionary, and they let us trace a mistake to the decision that caused it.

## Rulings: `data/rulings.json`

A ruling is a recorded decision: a rule for many words (consonantal j, which authority settles a vowel), or a choice on one word where we depart from a dictionary or a source (*lutra*, *fortasse*). Each has `id`, `kind` (`orthography`, `quantity`, `usage`, `word`), `title`, `decision` and `html` (the reasons, with citations), `date` (YYYY-MM or YYYY-MM-DD), `by`, `status` (`current`, `provisional` until confirmed, `withdrawn`), and optionally `forms` and `history` (dated changes). `how-we-decide.html` lists them by kind, with the records that cite each one.

Change a ruling by editing it and adding a `history` line; withdraw it rather than deleting it, so that its trace remains.

## Checks

`python3 scripts/build.py` validates records and rulings (fields, slugs, statuses, periods, notes cited and defined, rulings and related targets that exist, replaced entries that are really gone) and checks every link between the generated pages. `--check` also fails on a stale or leftover page in `c/`. `scripts/consonantal_j.py` covers records and rulings. The tests include records, notes, pages and the rulings page.

## Converting a grouped entry

1. Split the card into concepts: one per English sense. Keep every Latin form, citation, quotation and note; nothing is dropped.
2. Write one record per concept; put the card’s ID (and anchor, if it has one) in `replaces` on one of them.
3. Move explanations of a departure from a dictionary into notes; link a note to a ruling where one applies, or add the ruling.
4. Delete the card from `data/entries/`, rebuild, and run the checks.
5. Mark the records `draft` until a person has read them against the old card.
