# Concept records, notes and rulings

The lexicon has **one record per concept**: one sense of an English word, with every Latin form for it. The first 23 records (8 November 2026) were a pilot converted from four grouped entries; by 9 November every grouped topic card (`data/entries/`, see `data-format.md`) had been converted, batch by batch, into records that stay drafts until a person has read them. New words go in as records.

The builder renders each record as a page of its own at `c/<id>.html`; lists it, with its leading Latin, on its category's page (`k/<domain>.html`, and on the pages of any categories in `also_under`) and in `words.html`; indexes it for the search (`assets/search-data.js`); shows it on `rulings.html` under each ruling its notes cite; and lists it on the page of each Latin word it uses (`l/<word>.html`, below), which `latin.html` lists in turn. `how-we-decide.html` states the general rules and links to the rulings page, and back. `sitemap.xml` lists every page.

## A record: `data/concepts/<id>.json`

```json
{
  "id": "perhaps",
  "english": "perhaps",
  "pos": "adverb",
  "also": ["maybe", "perchance"],
  "domain": "sermo",
  "terms": [
    {"latin": "fortasse", "status": "recommended", "period": "classical", "gloss": "maybe, perhaps",
     "evidence": ["Cic. Div. Caec. 40: <span lang=\"la\">fortasse dīcēs</span>"],
     "comment": "The everyday word of Cicero’s prose, with the indicative.", "notes": ["short-e"]},
    {"latin": "forsan", "status": "alternative", "period": "classical", "register": "vōx plērumque poētica: Verg., Hor."}
  ],
  "phrases": [{"latin": "Fortasse pluet; paenulam indue.", "english": "Maybe it’ll rain; put your coat on.", "source": "composed"}],
  "notes": {"short-e": {"form": "fortasse", "claim": "short final e",
                         "against": "Lewis &amp; Short <span lang=\"la\">fortassē</span>, without evidence",
                         "html": "Catull. 85.1, … the fifth foot, <span lang=\"la\">-tasse re-</span>, is a dactyl. …",
                         "ruling": "fortasse"}},
  "related": ["entry-300"],
  "sources": ["<a href=\"https://logeion.org/fortasse\" rel=\"noopener noreferrer\" target=\"_blank\">Lewis &amp; Short: fortasse</a>"],
  "review": {"status": "draft", "date": "2026-11-08", "by": "Claude"},
  "replaces": ["entry-550"]
}
```

| Field | Required | Holds |
| --- | --- | --- |
| `id` | yes | a slug (`a-z`, digits, hyphens), the same as the file name; the page is `c/<id>.html` (old links to `index.html#c-<id>` lead there) |
| `english` | yes | the English headword, one sense |
| `sense` | no | a short disambiguation, shown after the headword (“the activity”) |
| `pos` | no | the headword’s part of speech, shown after it: `noun`, `verb`, `adjective`, `adverb`, `pronoun`, `preposition`, `conjunction`, `interjection`, `numeral`, `phrase`, or a list of them (`["verb", "noun"]`) |
| `also` | no | other English words that should find this concept in search |
| `domain` | yes | a category ID from `data/catalog.json`: the record's own category |
| `also_under` | no | other categories whose pages list the record too (soap is a kitchen record listed under the household); the search counts it in each |
| `wikidata` | no | the Wikidata item (`Q…`) for the sense |
| `audience` | no | `child` (default) or `adult` |
| `terms` | yes | the Latin forms; at least one `recommended` |
| `phrases` | no | examples: `latin`, `english`, and `source` (`composed`, or a citation in rich text) |
| `notes` | no | footnotes, by key: `html` (rich text); for a note on a form, `form`, `claim` and optionally `against` (below); optionally `ruling` (an ID in `data/rulings.json`) |
| `related` | no | other concept IDs (or the ID of a grouped card, should one remain) |
| `sources` | yes | the lines of “Sources & evidence”, in rich text |
| `review` | yes | `status` (`draft` or `reviewed`), `date` (YYYY-MM-DD), `by` |
| `replaces` | no | IDs and anchors of grouped entries this record absorbs; they stay valid links |

A **term** has `latin` (lemma with genitive and gender, or principal parts), `status` (`recommended`, `alternative`, `avoid`), `period` (`classical`, `post-classical`, `late`, `medieval`, `renaissance`, `modern`, `ours`), and optionally `gloss` (English, if narrower than the headword), `grammar` (see below), `register` (rich text, in the house’s Latin labels), `evidence` (a list of citations in rich text: “Traupman 50”, “M-O s.v. swimming”, “Plin. NH 7.78”, with a quotation where it helps), `comment` (rich text) and `notes` (footnote keys).

`gloss`, `grammar` and an example's `latin` and `english` are plain text: no tags and no entities (the builder refuses them, since they would be printed as written). Rich text follows the rules of `data-format.md`: `<strong lang="la">`, `<span lang="la">`, `<em>`, external `<a>` links; macrons and j as everywhere else.

### How a page shows a record

- A term whose period is `ours` is printed with an asterisk before it, on the record's page and in the word lists (Jack, 11 November 2026): the linguist's sign for an unattested form, chosen because it needs no colour and no icon to learn.
- The headword line is the English word in bold with its part of speech (`perhaps` *adverb*), then `sense` and `also`.
- The first recommended term is the answer: its headword is bold and links to the word's page, and its grammar line follows. The builder reads the grammar from the dictionary form: `caccabī m.` gives "noun, second declension" and `tītillāre` gives "verb, first conjugation". A term's own `grammar` overrides it, as in "verb, first conjugation, transitive". The term's `gloss` is shown only when it differs from the headword.
- The lexicon prints no declensions or conjugations; it links to them (Jack, 13 November 2026). After the grammar of a one-word term that inflects stands "Declension on Wiktionary" or "Conjugation on Wiktionary", on the record's page and on the word's. The link goes to the word's Latin section on English Wiktionary, under the spelling Wiktionary uses: no macrons, and i for consonantal j (*jūs* is at `ius#Latin`). The builder decides from the dictionary form (`caccabī m.`, `bonus, bona, bonum`, `tītillāre`), or from a bare word's own `grammar` when it begins with the kind ("verb, third conjugation"); adverbs, particles, sayings and forms of other words (*animī*) get no such link. Every word's page also links to Wiktionary beside Logeion, under Dictionaries. The links are made from the spelling and are not checked against Wiktionary, so a coinage it lacks leads to its "no entry" page.
- The period and the evidence of the answer stand in the margin. So do the notes, each beside the line that cites it. On a phone they fold under that line.
- The other terms come next, under "Other words", each with its gloss, grammar, status, period and evidence. They stand before the examples because the examples illustrate every term of the record, not only the first (Jack, 11 November 2026).
- Examples come last, each with its source. When a record has both quotations and composed sentences, a filter offers All, From authors and Composed.

## Latin word pages: `l/<word>.html`

Every Latin word that heads a one-word term (`caccabus` in `caccabus (cacabus), caccabī m.`) gets a page. It lists every record that uses the word, and the longer terms it appears in (`ōlla` in `ōlla ānsāta`, once `ōlla` has a term of its own). It also gives the notes on the word, the rulings whose `forms` include it, and the examples from the entries where it is the recommended word or that contain it. Wherever a term is shown, each of its words that has a page links to it. The page name drops macrons (`l/tyrocnestis.html`). Two words that differ only in macrons get `-2` and so on, in sorted order.

## Notes (footnotes)

Wherever a record departs from Lewis & Short or from one of its sources, a note says so, with the evidence. Terms and phrases cite notes by key; the builder numbers them in reading order and prints them beside the line that cites them (on a card, under it). Every note must be cited, and every cited key must exist. A note that applies a ruling names it, and the note links to the ruling.

A note on a form (a vowel length, a spelling) has a fixed shape, so that hundreds of them read alike and none opens with “Why *abc*, not *ābc*?” (Jack, 9 November 2026). The builder prints

> **fortasse**: short final e (Lewis & Short *fortassē*, without evidence). Catull. 85.1, … the fifth foot, *-tasse re-*, is a dactyl. Also Hor. S. 1.3.20, 1.6.98. De Vaan 236, s.v. *fors*: “short final vowel”.

from four fields:

- `form`: the form as we write it (rich text).
- `claim`: what we write, in a few words: `short final e`, `long o`, `short a, double c`, `long a before ns`. No full stop.
- `against` (optional): the authority we depart from and its form, with a word on why it fails if that is short: `Lewis &amp; Short <span lang="la">fortassē</span>, without evidence`; `Lewis &amp; Short leaves it unmarked`.
- `html`: the evidence only, in citation style: the passage and what it proves, the etymology, the dictionary and page. It doesn't repeat the claim. Latin in it is marked `<span lang="la">` and prints in italic.

A note on anything else (usage, a sense, a source's error) is plain `html`, written the same way: the point first, then the evidence. A ruling keeps the full argument; the note gives the reader what they need on the spot.

The notes answer the reader who asks why we differ from a dictionary, and they let us trace a mistake to the decision that caused it.

## Rulings: `data/rulings.json`

A ruling is a recorded decision: a rule for many words (consonantal j, which authority settles a vowel), or a choice on one word where we depart from a dictionary or a source (*lutra*, *fortasse*). Each has `id`, `kind` (`orthography`, `quantity`, `usage`, `word`), `title`, `decision` and `html` (the reasons, with citations), `date` (YYYY-MM or YYYY-MM-DD), `by`, `status` (`current`, `provisional` until confirmed, `withdrawn`), and optionally `forms` and `history` (dated changes). `rulings.html` lists them by kind, with the records that cite each one; `how-we-decide.html` links to it.

Change a ruling by editing it and adding a `history` line; withdraw it rather than deleting it, so that its trace remains.

## Checks

`python3 scripts/build.py` validates records and rulings (fields, slugs, statuses, periods, notes cited and defined, rulings and related targets that exist, replaced entries that are really gone) and checks every link between the generated pages. A renamed category keeps its old ID in `aliases` in `data/catalog.json`, so old links still land on it. `--check` also fails on a stale or leftover page in `c/` or `l/`, or a leftover font in `assets/fonts/`. `scripts/consonantal_j.py` covers records and rulings. The tests include records, notes, pages and the rulings page.

## Converting a grouped entry

Batches of cards are converted with `scripts/convert_cards.py` from a spec in `notes/conversions/`; `docs/converting.md` gives the rules for splitting a card and filling the fields, and the checks the script makes. The converted records are drafts until a person has read them against the old card.
